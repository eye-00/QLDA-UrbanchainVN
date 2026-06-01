import { AuthenticatedRequest } from "../../modules/auth/auth.middleware.js";
import {
  lookupRegistrationOnChain,
  mintRegistrationRecord
} from "../blockchain/urban-land-registry.client.js";
import { prisma } from "../prisma.js";
import { writeAuditLog } from "./audit.service.js";
import {
  resolveExpectedBlockchainNetwork,
  resolveExpectedBlockchainChainId,
  resolveExplorerBaseUrl,
  resolveBlockchainSyncMode,
  ensureServiceWalletAuthorizationForSync,
  ensureCitizenWalletAuthorizationForSync
} from "./wallet-auth.service.js";
import { badRequestError, conflictError } from "../errors.js";

export async function syncBlockchain(
  registration: {
    id: string;
    code: string;
    status: string;
    landCode: string | null;
    provinceCode: string;
    communeName: string;
    mapSheetNumber: string;
    parcelNumber: string;
    applicantId: string;
    ownerIdentityNumber?: string | null;
  },
  actor: AuthenticatedRequest["user"],
  input: {
    legalBasisCode: string;
    syncMode?: "OFFICER_SERVICE_WALLET" | "CITIZEN_DIRECT_SIGN";
    cid: string;
    metadataHash: string;
    walletAuthorizationId?: string;
    signerWalletAddress: string;
    signerChainId: number;
    signingMessage: string;
    signature: string;
  }
) {
  if (!["DA_CAP_NHAT_HO_SO_DIA_CHINH", "DA_CAP"].includes(registration.status)) {
    throw conflictError(
      "Chỉ có thể ghi blockchain ở trạng thái DA_CAP_NHAT_HO_SO_DIA_CHINH hoặc DA_CAP"
    );
  }

  const syncMode = resolveBlockchainSyncMode(actor.role, input.syncMode);

  if (syncMode === "OFFICER_SERVICE_WALLET") {
    await ensureServiceWalletAuthorizationForSync(actor, {
      walletAuthorizationId: input.walletAuthorizationId!,
      signerWalletAddress: input.signerWalletAddress,
      signerChainId: input.signerChainId
    });
  } else {
    await ensureCitizenWalletAuthorizationForSync(actor, registration.applicantId, {
      signerWalletAddress: input.signerWalletAddress,
      signerChainId: input.signerChainId
    });
  }

  const txLifecycle = await prisma.blockchainTxLifecycle.create({
    data: {
      registrationId: registration.id,
      status: "PENDING",
      initiatedById: actor.userId,
      signerWalletAddress: input.signerWalletAddress,
      signerChainId: input.signerChainId,
      signingMessage: input.signingMessage,
      signature: input.signature,
      syncMode
    }
  });

  try {
    const result = await mintRegistrationRecord({
      registrationCode: registration.code,
      landCode: registration.landCode ?? registration.code,
      provinceCode: registration.provinceCode,
      communeName: registration.communeName,
      mapSheetNumber: registration.mapSheetNumber,
      parcelNumber: registration.parcelNumber,
      applicantId: registration.applicantId,
      ownerIdentityNumber: registration.ownerIdentityNumber ?? null,
      documentCid: input.cid,
      metadataHash: input.metadataHash,
      tokenOwnerAddress: input.signerWalletAddress
    });

    await prisma.blockchainTxLifecycle.update({
      where: { id: txLifecycle.id },
      data: {
        status: "CONFIRMED",
        txHash: result.txHash,
        tokenId: result.tokenId,
        confirmedAt: new Date()
      }
    });

    await prisma.registration.update({
      where: { id: registration.id },
      data: {
        status: "DA_GHI_BLOCKCHAIN",
        txHash: result.txHash,
        tokenId: result.tokenId ? String(result.tokenId) : null
      }
    });

    await writeAuditLog({
      actorId: actor.userId,
      action: "REGISTRATION_BLOCKCHAIN_SYNCED",
      entityType: "REGISTRATION",
      entityId: registration.id,
      payload: { txHash: result.txHash, tokenId: result.tokenId, syncMode }
    });

    return {
      txLifecycle: { ...txLifecycle, status: "CONFIRMED" as const, txHash: result.txHash },
      explorerUrl: resolveExplorerBaseUrl(resolveExpectedBlockchainNetwork()) + result.txHash
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await prisma.blockchainTxLifecycle.update({
      where: { id: txLifecycle.id },
      data: { status: "FAILED", errorMessage, confirmedAt: new Date() }
    });
    throw badRequestError(`Blockchain sync failed: ${errorMessage}`);
  }
}

export async function lookupChainStatus(registrationCode: string, landCode: string) {
  try { return await lookupRegistrationOnChain(registrationCode, landCode); }
  catch { return null; }
}
}
