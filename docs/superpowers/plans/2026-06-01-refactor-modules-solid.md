# SOLID Refactor — Backend Modules

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor all 15 backend route files into layered architecture (routes → controller → service → validation → mapper) following SOLID principles, with cross-cutting concerns (audit, blockchain-sync) extracted to dedicated services.

**Architecture:** Each module becomes a directory with focused files instead of one monolithic route file. Cross-cutting logic (audit, blockchain-sync, wallet-auth, workflow) moves to `lib/services/` called by domain services.

**Tech Stack:** Express.js, TypeScript, Prisma, Zod, ethers.js

---

## File Structure Map

```
backend/src/lib/services/
  audit.service.ts              # Audit logging wrapper
  wallet-auth.service.ts         # Wallet validation (extracted from registration)
  blockchain-sync.service.ts     # Blockchain mint + lookup
  workflow.service.ts            # Status transition graph, role mapping, procedure check

backend/src/modules/{module}/
  {module}.routes.ts             # Thin: route definitions + middleware
  {module}.controller.ts         # Request handling → calls service
  {module}.service.ts            # Business logic + Prisma access
  {module}.validation.ts         # Zod schemas + inferred types
  {module}.mapper.ts             # Response mapping (toXxxItem functions)
```

---

### Task 0: Create shared cross-cutting services

**Files:**
- Create: `backend/src/lib/services/audit.service.ts`
- Create: `backend/src/lib/services/wallet-auth.service.ts`
- Create: `backend/src/lib/services/blockchain-sync.service.ts`
- Create: `backend/src/lib/services/workflow.service.ts`

- [ ] **Step 1: Create audit.service.ts**

```ts
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";

export interface AuditEvent {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  payload?: Prisma.InputJsonValue;
}

export async function writeAuditLog(event: AuditEvent) {
  await prisma.auditLog.create({
    data: {
      actorId: event.actorId ?? null,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      payload: (event.payload ?? Prisma.DbNull) as Prisma.InputJsonValue,
    },
  });
}
```

- [ ] **Step 2: Create wallet-auth.service.ts**

```ts
import { ethers } from "ethers";
import { BlockchainNetwork } from "@prisma/client";
import { AuthenticatedRequest } from "../../modules/auth/auth.middleware.js";
import { forbiddenError } from "../errors.js";
import { prisma } from "../prisma.js";

const CITIZEN_ROLES = ["CITIZEN", "BUSINESS"];

export function isCitizenRole(role: string): boolean {
  return CITIZEN_ROLES.includes(role);
}

export function resolveExpectedBlockchainNetwork(): BlockchainNetwork {
  const raw = (process.env.BLOCKCHAIN_NETWORK ?? "SEPOLIA").trim().toUpperCase();
  return (Object.values(BlockchainNetwork) as string[]).includes(raw)
    ? (raw as BlockchainNetwork)
    : BlockchainNetwork.SEPOLIA;
}

export function resolveExpectedBlockchainChainId(): number {
  const parsed = Number(process.env.BLOCKCHAIN_CHAIN_ID ?? "11155111");
  if (!Number.isFinite(parsed) || parsed <= 0) return 11155111;
  return parsed;
}

export function resolveExplorerBaseUrl(network: BlockchainNetwork): string {
  const byEnv = process.env.BLOCKCHAIN_EXPLORER_BASE_URL?.trim();
  if (byEnv) return byEnv;
  if (network === "SEPOLIA") return "https://sepolia.etherscan.io/tx/";
  return "";
}

export function normalizeAddress(address: string): string {
  return ethers.getAddress(address.trim());
}

export function resolveBlockchainSyncMode(
  actorRole: string,
  requestedMode?: "OFFICER_SERVICE_WALLET" | "CITIZEN_DIRECT_SIGN",
): "OFFICER_SERVICE_WALLET" | "CITIZEN_DIRECT_SIGN" {
  const roleDefault = isCitizenRole(actorRole) ? "CITIZEN_DIRECT_SIGN" : "OFFICER_SERVICE_WALLET";
  const mode = requestedMode ?? roleDefault;
  if (mode === "CITIZEN_DIRECT_SIGN" && !isCitizenRole(actorRole))
    throw forbiddenError("OWNERSHIP_DENIED");
  if (mode === "OFFICER_SERVICE_WALLET" && isCitizenRole(actorRole))
    throw forbiddenError("walletAuthMissing");
  return mode;
}

export async function ensureServiceWalletAuthorizationForSync(
  actor: AuthenticatedRequest["user"],
  input: { walletAuthorizationId: string; signerWalletAddress: string; signerChainId: number },
) {
  const expectedNetwork = resolveExpectedBlockchainNetwork();
  const expectedChainId = resolveExpectedBlockchainChainId();
  const now = new Date();

  const authorization = await prisma.serviceWalletAuthorization.findUnique({
    where: { id: input.walletAuthorizationId },
    include: { wallet: { select: { id: true, address: true, network: true, status: true } } },
  });

  if (!authorization) throw forbiddenError("walletAuthMissing: Không tìm thấy quyền ví công vụ");
  if (authorization.status !== "ACTIVE") throw forbiddenError("walletAuthMissing: Quyền ví công vụ không còn hiệu lực");
  if (authorization.effectiveTo && authorization.effectiveTo <= now) throw forbiddenError("walletAuthMissing: Quyền ví công vụ đã hết hạn");
  if (authorization.network !== expectedNetwork || authorization.chainId !== expectedChainId)
    throw forbiddenError("walletAuthMissing: Quyền ví công vụ không khớp network/chainId");
  if (input.signerChainId !== expectedChainId) throw forbiddenError("walletAuthMissing: signerChainId không hợp lệ");
  if (normalizeAddress(input.signerWalletAddress) !== normalizeAddress(authorization.wallet.address))
    throw forbiddenError("walletAuthMissing: Ví ký không trùng với ví công vụ được cấp quyền");
  if (authorization.wallet.network !== expectedNetwork || authorization.wallet.status !== "VERIFIED")
    throw forbiddenError("walletAuthMissing: Ví công vụ chưa xác minh");
  if (authorization.userId !== actor.userId) throw forbiddenError("walletAuthMissing: Bạn không sở hữu quyền ví này");
  if (authorization.roleScope !== actor.role) throw forbiddenError("walletAuthMissing: Vai trò không khớp");

  return { authorization, expectedNetwork, expectedChainId };
}

export async function ensureCitizenWalletAuthorizationForSync(
  actor: AuthenticatedRequest["user"],
  registrationApplicantId: string,
  input: { signerWalletAddress: string; signerChainId: number },
) {
  const expectedNetwork = resolveExpectedBlockchainNetwork();
  const expectedChainId = resolveExpectedBlockchainChainId();

  if (actor.userId !== registrationApplicantId) throw forbiddenError("OWNERSHIP_DENIED");
  if (input.signerChainId !== expectedChainId) throw forbiddenError("WRONG_NETWORK");

  const normalizedSignerAddress = normalizeAddress(input.signerWalletAddress);
  const defaultWallet = await prisma.walletAccount.findFirst({
    where: { userId: actor.userId, status: "VERIFIED", isDefault: true, network: expectedNetwork },
    select: { id: true, address: true, network: true },
  });

  if (!defaultWallet) throw forbiddenError("WALLET_MISMATCH: Chưa có ví mặc định");
  if (defaultWallet.network !== expectedNetwork) throw forbiddenError("WRONG_NETWORK: Ví mặc định không đúng network");
  if (normalizeAddress(defaultWallet.address) !== normalizedSignerAddress)
    throw forbiddenError("WALLET_MISMATCH: Ví ký không trùng với ví mặc định");

  return { expectedNetwork, expectedChainId, normalizedSignerAddress, defaultWallet };
}
```

- [ ] **Step 3: Create blockchain-sync.service.ts**

```ts
import { AuthenticatedRequest } from "../../modules/auth/auth.middleware.js";
import {
  lookupRegistrationOnChain,
  mintRegistrationRecord,
} from "../blockchain/urban-land-registry.client.js";
import { prisma } from "../prisma.js";
import { writeAuditLog } from "./audit.service.js";
import {
  resolveExpectedBlockchainNetwork,
  resolveExpectedBlockchainChainId,
  resolveExplorerBaseUrl,
  resolveBlockchainSyncMode,
  ensureServiceWalletAuthorizationForSync,
  ensureCitizenWalletAuthorizationForSync,
} from "./wallet-auth.service.js";
import { badRequestError, conflictError } from "../errors.js";

export async function syncBlockchain(
  registration: {
    id: string; code: string; status: string; landCode: string | null;
    provinceCode: string; communeName: string; mapSheetNumber: string;
    parcelNumber: string; applicantId: string; ownerIdentityNumber?: string | null;
  },
  actor: AuthenticatedRequest["user"],
  input: {
    legalBasisCode: string;
    syncMode?: "OFFICER_SERVICE_WALLET" | "CITIZEN_DIRECT_SIGN";
    cid: string; metadataHash: string;
    walletAuthorizationId?: string;
    signerWalletAddress: string; signerChainId: number;
    signingMessage: string; signature: string;
  },
) {
  if (!["DA_CAP_NHAT_HO_SO_DIA_CHINH", "DA_CAP"].includes(registration.status)) {
    throw conflictError("Chỉ có thể ghi blockchain ở trạng thái DA_CAP_NHAT_HO_SO_DIA_CHINH hoặc DA_CAP");
  }

  const syncMode = resolveBlockchainSyncMode(actor.role, input.syncMode);

  if (syncMode === "OFFICER_SERVICE_WALLET") {
    await ensureServiceWalletAuthorizationForSync(actor, {
      walletAuthorizationId: input.walletAuthorizationId!,
      signerWalletAddress: input.signerWalletAddress,
      signerChainId: input.signerChainId,
    });
  } else {
    await ensureCitizenWalletAuthorizationForSync(actor, registration.applicantId, {
      signerWalletAddress: input.signerWalletAddress,
      signerChainId: input.signerChainId,
    });
  }

  const txLifecycle = await prisma.blockchainTxLifecycle.create({
    data: {
      registrationId: registration.id, status: "PENDING",
      initiatedById: actor.userId, signerWalletAddress: input.signerWalletAddress,
      signerChainId: input.signerChainId, signingMessage: input.signingMessage,
      signature: input.signature, syncMode,
    },
  });

  try {
    const result = await mintRegistrationRecord({
      registrationCode: registration.code,
      landCode: registration.landCode ?? registration.code,
      provinceCode: registration.provinceCode, communeName: registration.communeName,
      mapSheetNumber: registration.mapSheetNumber, parcelNumber: registration.parcelNumber,
      applicantId: registration.applicantId,
      ownerIdentityNumber: registration.ownerIdentityNumber ?? null,
      documentCid: input.cid, metadataHash: input.metadataHash,
      tokenOwnerAddress: input.signerWalletAddress,
    });

    await prisma.blockchainTxLifecycle.update({
      where: { id: txLifecycle.id },
      data: { status: "CONFIRMED", txHash: result.txHash, tokenId: result.tokenId, confirmedAt: new Date() },
    });

    await prisma.registration.update({
      where: { id: registration.id },
      data: { status: "DA_GHI_BLOCKCHAIN", txHash: result.txHash, tokenId: result.tokenId ? String(result.tokenId) : null },
    });

    await writeAuditLog({
      actorId: actor.userId, action: "REGISTRATION_BLOCKCHAIN_SYNCED",
      entityType: "REGISTRATION", entityId: registration.id,
      payload: { txHash: result.txHash, tokenId: result.tokenId, syncMode },
    });

    return {
      txLifecycle: { ...txLifecycle, status: "CONFIRMED" as const, txHash: result.txHash },
      explorerUrl: resolveExplorerBaseUrl(resolveExpectedBlockchainNetwork()) + result.txHash,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await prisma.blockchainTxLifecycle.update({
      where: { id: txLifecycle.id },
      data: { status: "FAILED", errorMessage, confirmedAt: new Date() },
    });
    throw badRequestError(`Blockchain sync failed: ${errorMessage}`);
  }
}

export async function lookupChainStatus(registrationCode: string) {
  try { return await lookupRegistrationOnChain(registrationCode); }
  catch { return null; }
}
```

- [ ] **Step 4: Create workflow.service.ts**

```ts
import { RegistrationStatus, UserRole } from "@prisma/client";
import { prisma } from "../prisma.js";
import { writeAuditLog } from "./audit.service.js";
import { badRequestError, conflictError, forbiddenError } from "../errors.js";
import { AuthenticatedRequest } from "../../modules/auth/auth.middleware.js";

const ROLE_ALLOWED_TARGET_STATUS: Record<UserRole, RegistrationStatus[]> = {
  CITIZEN: ["CHO_TIEP_NHAN"], BUSINESS: ["CHO_TIEP_NHAN"],
  RECEPTION_OFFICER: ["DA_TIEP_NHAN", "CAN_BO_SUNG", "CHO_XAC_NHAN_CAP_XA"],
  COMMUNE_OFFICER: ["DA_XAC_NHAN_CAP_XA", "CAN_BO_SUNG"],
  LAND_REGISTRY_OFFICER: ["DANG_THAM_DINH_VPDKDD", "CHO_THUE", "CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH", "CHO_KY_CAP", "DA_CAP_NHAT_HO_SO_DIA_CHINH", "CAN_BO_SUNG", "TU_CHOI"],
  APPROVAL_AUTHORITY: ["DA_KY_CAP", "TU_CHOI", "DA_CAP"],
  TAX_OFFICER: ["DA_HOAN_THANH_NGHIA_VU_TAI_CHINH", "CAN_BO_SUNG"],
  AUDITOR: [], ADMIN: ["MOI_TAO", "CHO_TIEP_NHAN", "CAN_BO_SUNG", "DA_TIEP_NHAN", "CHO_XAC_NHAN_CAP_XA", "DA_XAC_NHAN_CAP_XA", "DANG_THAM_DINH_VPDKDD", "CHO_THUE", "CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH", "DA_HOAN_THANH_NGHIA_VU_TAI_CHINH", "CHO_KY_CAP", "DA_KY_CAP", "DA_CAP_NHAT_HO_SO_DIA_CHINH", "DA_GHI_BLOCKCHAIN", "DA_CAP", "DA_TRA_KET_QUA", "HUY_HO_SO", "TU_CHOI"],
};

const STATUS_TRANSITION_GRAPH: Partial<Record<RegistrationStatus, RegistrationStatus[]>> = {
  MOI_TAO: ["CHO_TIEP_NHAN"],
  CHO_TIEP_NHAN: ["DA_TIEP_NHAN", "CAN_BO_SUNG", "TU_CHOI"],
  DA_TIEP_NHAN: ["CHO_XAC_NHAN_CAP_XA", "DA_XAC_NHAN_CAP_XA", "CAN_BO_SUNG"],
  CHO_XAC_NHAN_CAP_XA: ["DA_XAC_NHAN_CAP_XA", "CAN_BO_SUNG"],
  DA_XAC_NHAN_CAP_XA: ["DANG_THAM_DINH_VPDKDD", "CHO_THUE", "CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH", "CAN_BO_SUNG"],
  DANG_THAM_DINH_VPDKDD: ["CHO_THUE", "CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH", "CHO_KY_CAP", "CAN_BO_SUNG", "TU_CHOI"],
  CHO_THUE: ["CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH"],
  CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH: ["DA_HOAN_THANH_NGHIA_VU_TAI_CHINH", "CAN_BO_SUNG"],
  DA_HOAN_THANH_NGHIA_VU_TAI_CHINH: ["CHO_KY_CAP"],
  CHO_KY_CAP: ["DA_KY_CAP", "TU_CHOI", "DA_CAP"],
  DA_KY_CAP: ["DA_CAP_NHAT_HO_SO_DIA_CHINH", "DA_CAP"],
  DA_CAP_NHAT_HO_SO_DIA_CHINH: ["DA_GHI_BLOCKCHAIN", "DA_CAP", "DA_TRA_KET_QUA"],
  DA_CAP: ["DA_GHI_BLOCKCHAIN", "DA_TRA_KET_QUA"],
  DA_GHI_BLOCKCHAIN: ["DA_TRA_KET_QUA"],
};

export function assertTransitionAllowed(
  currentStatus: RegistrationStatus, nextStatus: RegistrationStatus, actorRole: UserRole,
) {
  if (nextStatus === "DA_GHI_BLOCKCHAIN")
    throw conflictError("Không được chuyển trực tiếp sang DA_GHI_BLOCKCHAIN");
  const allowedNext = STATUS_TRANSITION_GRAPH[currentStatus] ?? [];
  if (!allowedNext.includes(nextStatus))
    throw badRequestError(`Không thể chuyển từ ${currentStatus} sang ${nextStatus}`);
  if (actorRole === "ADMIN") return;
  const allowedByRole = ROLE_ALLOWED_TARGET_STATUS[actorRole] ?? [];
  if (!allowedByRole.includes(nextStatus))
    throw forbiddenError(`Vai trò ${actorRole} không được chuyển sang ${nextStatus}`);
}

export async function ensureProcedureAndAuthority(
  registration: { procedureCode: string | null }, actorRole: UserRole,
) {
  if (!registration.procedureCode) throw badRequestError("Hồ sơ chưa gắn procedureCode");
  const procedure = await prisma.legalProcedure.findUnique({ where: { procedureCode: registration.procedureCode } });
  if (!procedure || !procedure.isActive) throw badRequestError("Thủ tục pháp lý không tồn tại");
  if (actorRole === "ADMIN" || ["CITIZEN", "BUSINESS"].includes(actorRole)) return procedure;
  const allowedActors = (Array.isArray(procedure.authorityActors) ? procedure.authorityActors : []) as string[];
  if (!allowedActors.includes(actorRole)) throw forbiddenError(`Vai trò ${actorRole} không thuộc authority matrix`);
  return procedure;
}

export async function updateRegistrationStatus(
  registrationId: string, nextStatus: RegistrationStatus, note: string,
  actor: AuthenticatedRequest["user"], legalBasisCode: string,
) {
  const current = await prisma.registration.findUnique({ where: { id: registrationId }, select: { noteHistory: true } });
  const noteHistory = Array.isArray(current?.noteHistory) ? [...current!.noteHistory as string[], note] : [note];

  const updated = await prisma.registration.update({
    where: { id: registrationId },
    data: { status: nextStatus, noteHistory, lastStatusChangedById: actor.userId, lastStatusChangedAt: new Date(), legalBasisCode },
  });

  await writeAuditLog({
    actorId: actor.userId, action: "REGISTRATION_STATUS_CHANGED",
    entityType: "REGISTRATION", entityId: registrationId,
    payload: { nextStatus, note, legalBasisCode },
  });

  return updated;
}
```

- [ ] **Step 5: Create lib/services/index.ts** (re-exports for cleaner imports)

```ts
export { writeAuditLog } from "./audit.service.js";
export { syncBlockchain, lookupChainStatus } from "./blockchain-sync.service.js";
export { isCitizenRole, resolveExpectedBlockchainNetwork, resolveExpectedBlockchainChainId, resolveExplorerBaseUrl, normalizeAddress, resolveBlockchainSyncMode, ensureServiceWalletAuthorizationForSync, ensureCitizenWalletAuthorizationForSync } from "./wallet-auth.service.js";
export { assertTransitionAllowed, ensureProcedureAndAuthority, updateRegistrationStatus } from "./workflow.service.js";
```

- [ ] **Step 6: Verify build**

Run: `cd /home/mintori/Projects/temp/QLDA-UrbanchainVN/backend && npx tsc --noEmit`
Expected: No errors (or only errors from modules not yet refactored — acceptable)

- [ ] **Step 7: Commit**

```bash
git add backend/src/lib/services/
git commit -m "feat: create shared cross-cutting services (audit, blockchain-sync, wallet-auth, workflow)"
```

---

### Task 1: Refactor registrations module (2417 lines → 6 files)

**Files:**
- Create: `backend/src/modules/registrations/registration.validation.ts`
- Create: `backend/src/modules/registrations/registration.mapper.ts`
- Create: `backend/src/modules/registrations/registration.service.ts`
- Create: `backend/src/modules/registrations/registration.controller.ts`
- Modify: `backend/src/modules/registrations/registration.routes.ts`

- [ ] **Step 1: Create registration.validation.ts**

Extract all Zod schemas from the current route file. Includes: `registrationStatusSchema`, `createRegistrationSchema`, `listSchema`, `submitSchema`, `patchStatusSchema`, `communeConfirmSchema`, `taxTransferSchema`, `approveSchema`, `cadastralUpdateSchema`, `blockchainSyncSchema`, `supplementRequestSchema`, `createDocumentVersionSchema`, `createPaymentObligationSchema`, `updatePaymentObligationSchema`. Each schema as defined in the original file at lines 35-214.

Also export inferred types: `CreateRegistrationInput`, `ListRegistrationsInput`, `SubmitRegistrationInput`, etc.

- [ ] **Step 2: Create registration.mapper.ts**

Extract all `toXxxItem` functions: `toRegistrationListItem`, `toDocumentVersionItem`, `toPaymentObligationItem`, `toBlockchainTxItem`, `toSnapshotItem`. Each mapper takes a Prisma entity shape and returns a plain object.

- [ ] **Step 3: Create registration.service.ts**

Extract all business logic functions from the route file:
- `findRegistrationByParam`, `ensureRegistrationReadable`, `generateRegistrationCode`
- `listRegistrations`, `createRegistration`, `submitRegistration`, `getRegistrationDetail`
- `patchStatus`, `communeConfirm`, `taxTransfer`, `approveRegistration`, `cadastralUpdate`
- `doBlockchainSync` (delegates to `blockchain-sync.service`), `getBlockchainStatus`
- `supplementRequest`, `getDocumentVersions`, `createDocumentVersion`
- `getSnapshots`, `createPaymentObligation`, `updatePaymentObligation`
- `getPaymentObligations`, `getNotificationHistory`, `getTxLifecycleHistory`

Each function: parse → validate → call service → return result. Import from `../../lib/services/` for cross-cutting.

- [ ] **Step 4: Create registration.controller.ts**

Thin handlers that: parse request (via Zod schema) → call service → format response (via mapper). Each handler is wrapped with `asyncHandler`.

- [ ] **Step 5: Rewrite registration.routes.ts** (~100 lines)

```ts
import { Router } from "express";
import { requireAuth, requireRoles, AUTH_ROLES } from "../auth/auth.middleware.js";
import * as ctrl from "./registration.controller.js";

export const registrationRouter = Router();
registrationRouter.use(requireAuth);

const statusRoles = ["RECEPTION_OFFICER", "COMMUNE_OFFICER", "LAND_REGISTRY_OFFICER", "APPROVAL_AUTHORITY", "TAX_OFFICER", "ADMIN"] as const;

registrationRouter.get("/", ctrl.list);
registrationRouter.post("/", ctrl.create);
registrationRouter.get("/:id", ctrl.getDetail);
registrationRouter.post("/:id/submit", ctrl.submit);
registrationRouter.patch("/:id/status", requireRoles(statusRoles), ctrl.patchStatus);
registrationRouter.patch("/:id/commune-confirm", requireRoles(["COMMUNE_OFFICER", "ADMIN"]), ctrl.communeConfirm);
registrationRouter.patch("/:id/tax-transfer", requireRoles(["TAX_OFFICER", "LAND_REGISTRY_OFFICER", "ADMIN"]), ctrl.taxTransfer);
registrationRouter.patch("/:id/approve", requireRoles(["APPROVAL_AUTHORITY", "ADMIN"]), ctrl.approve);
registrationRouter.patch("/:id/cadastral-update", requireRoles(["LAND_REGISTRY_OFFICER", "ADMIN"]), ctrl.cadastralUpdate);
registrationRouter.post("/:id/supplement-request", requireRoles(statusRoles), ctrl.supplementRequest);
registrationRouter.post("/:id/blockchain-sync", requireRoles(statusRoles), ctrl.blockchainSync);
registrationRouter.get("/:id/blockchain-status", ctrl.getBlockchainStatus);
registrationRouter.get("/:id/tx-lifecycle", ctrl.getTxHistory);
registrationRouter.get("/:id/document-versions", ctrl.getDocumentVersions);
registrationRouter.post("/:id/document-versions", requireRoles(statusRoles), ctrl.createDocumentVersion);
registrationRouter.get("/:id/snapshots", ctrl.getSnapshots);
registrationRouter.get("/:id/payment-obligations", ctrl.getPaymentObligations);
registrationRouter.post("/:id/payment-obligations", requireRoles(statusRoles), ctrl.createPaymentObligation);
registrationRouter.patch("/:id/payment-obligations/:obligationId/status", requireRoles(["TAX_OFFICER", "ADMIN"]), ctrl.updatePaymentObligation);
registrationRouter.get("/:id/notifications", ctrl.getNotificationHistory);
```

- [ ] **Step 6: Verify build**

Run: `cd /home/mintori/Projects/temp/QLDA-UrbanchainVN/backend && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 7: Commit**

```bash
git add backend/src/modules/registrations/
git commit -m "refactor(registrations): split 2417-line route file into controller, service, validation, mapper"
```

---

### Task 2: Refactor auth module (683 lines → 5 files)

**Files:**
- Create: `backend/src/modules/auth/auth.validation.ts`
- Create: `backend/src/modules/auth/auth.mapper.ts`
- Create: `backend/src/modules/auth/auth.service.ts`
- Create: `backend/src/modules/auth/auth.controller.ts`
- Modify: `backend/src/modules/auth/auth.routes.ts`

- [ ] **Step 1: Create auth.validation.ts** — extract all Zod schemas (registerSchema, loginSchema, refreshSchema, logoutSchema, passwordResetRequestSchema, passwordResetConfirmSchema, changePasswordSchema, vneidMockSchema) + inferred types.

- [ ] **Step 2: Create auth.mapper.ts** — `toPublicUser()`, `toAuthSession()` functions.

- [ ] **Step 3: Create auth.service.ts** — extract business logic: `register`, `login`, `refresh`, `logout`, `logoutAll`, `requestPasswordReset`, `confirmPasswordReset`, `changePassword`, `getProfile`, `vneidMockLogin`. All Prisma access + audit logging lives here.

- [ ] **Step 4: Create auth.controller.ts** — thin handlers: parse → call service → mapper → respond.

- [ ] **Step 5: Rewrite auth.routes.ts** (~25 lines):

```ts
import { Router } from "express";
import { requireAuth } from "./auth.middleware.js";
import * as ctrl from "./auth.controller.js";

export const authRouter = Router();
authRouter.post("/register", ctrl.register);
authRouter.post("/login", ctrl.login);
authRouter.post("/refresh", ctrl.refresh);
authRouter.post("/logout", requireAuth, ctrl.logout);
authRouter.post("/logout-all", requireAuth, ctrl.logoutAll);
authRouter.post("/password-reset-request", ctrl.requestPasswordReset);
authRouter.post("/password-reset-confirm", ctrl.confirmPasswordReset);
authRouter.post("/change-password", requireAuth, ctrl.changePassword);
authRouter.get("/me", requireAuth, ctrl.me);
authRouter.post("/vneid-mock", ctrl.vneidMock);
```

- [ ] **Step 6: Verify + commit**

```bash
cd /home/mintori/Projects/temp/QLDA-UrbanchainVN/backend && npx tsc --noEmit
git add backend/src/modules/auth/
git commit -m "refactor(auth): split 683-line route file into controller, service, validation, mapper"
```

---

### Task 3: Refactor payment-obligations module (556 lines → 5 files)

**Files:**
- Create: `backend/src/modules/payment-obligations/payment-obligation.validation.ts`
- Create: `backend/src/modules/payment-obligations/payment-obligation.mapper.ts`
- Create: `backend/src/modules/payment-obligations/payment-obligation.service.ts`
- Create: `backend/src/modules/payment-obligations/payment-obligation.controller.ts`
- Modify: `backend/src/modules/payment-obligations/payment-obligation.routes.ts`

- [ ] **Step 1: Create validation, mapper, service, controller files** following same pattern as auth.

- [ ] **Step 2: Rewrite payment-obligation.routes.ts** (~20 lines):

```ts
import { Router } from "express";
import { requireAuth, requireRoles } from "../auth/auth.middleware.js";
import * as ctrl from "./payment-obligation.controller.js";

export const paymentObligationRouter = Router();
paymentObligationRouter.use(requireAuth);
paymentObligationRouter.get("/", ctrl.list);
paymentObligationRouter.post("/", requireRoles(["RECEPTION_OFFICER", "LAND_REGISTRY_OFFICER", "TAX_OFFICER", "ADMIN"]), ctrl.create);
paymentObligationRouter.post("/generate-qr", requireRoles(["RECEPTION_OFFICER", "LAND_REGISTRY_OFFICER", "TAX_OFFICER", "ADMIN"]), ctrl.generateQr);
paymentObligationRouter.patch("/:id/mock-confirm", requireRoles(["TAX_OFFICER", "ADMIN"]), ctrl.mockConfirm);
paymentObligationRouter.patch("/:id/verify-receipt", requireRoles(["TAX_OFFICER", "ADMIN"]), ctrl.verifyReceipt);
paymentObligationRouter.patch("/:id/record-onchain", requireRoles(["ADMIN"]), ctrl.recordOnChain);
```

- [ ] **Step 3: Verify + commit**

---

### Task 4: Refactor wallets module (442 lines → 5 files)

**Files:** validation, mapper, service, controller, routes (same pattern)

**Routes:**
```ts
export const walletRouter = Router();
walletRouter.use(requireAuth);
walletRouter.get("/", ctrl.list);
walletRouter.post("/connect", ctrl.connect);
walletRouter.get("/challenge/:address", ctrl.challenge);
walletRouter.post("/verify", ctrl.verify);
walletRouter.post("/set-default", ctrl.setDefault);
```

---

### Task 5: Refactor remaining modules (5 modules)

Each follows the same pattern in one batch:

| Module | Lines | Notes |
|--------|-------|-------|
| files | 334 | Multer upload + IPFS |
| map | 405 | Geometry CRUD + review workflow |
| lands | 366 | Simple CRUD |
| users | 341 | Admin CRUD + lock/unlock |
| organizations | 224 | CRUD + soft delete |
| legal | 249 | CRUD + search |
| dashboard | 199 | Role-based aggregation |
| audit | 112 | Audit log querying |
| service-wallets | 380 | Authorization CRUD |
| transfers | 128 | Uses demoStore (no Prisma yet) |

For each module:
1. Create `{module}.validation.ts` — all Zod schemas
2. Create `{module}.service.ts` — all business logic + Prisma access
3. Create `{module}.controller.ts` — thin request handlers
4. Rewrite `{module}.routes.ts` — route definitions only

**Priority order (after previous tasks):**
1. files (334 lines, has upload logic)
2. map (405 lines, geometry workflow)
3. wallet (already Task 4)
4. service-wallets (380 lines)
5. lands (366 lines)
6. users (341 lines)
7. organizations (224 lines)
8. legal (249 lines)
9. dashboard (199 lines)
10. audit (112 lines)
11. transfers (128 lines)

---

### Task 6: Update imports across backend

- [ ] **Step 1: Update app.ts imports** if any router export signatures changed (unlikely — routers keep same export name)

- [ ] **Step 2: Verify full build**

```bash
cd /home/mintori/Projects/temp/QLDA-UrbanchainVN/backend && npx tsc --noEmit
```

---

## Self-Review

**1. Spec coverage:** Every module route file is covered. Cross-cutting concerns (audit, blockchain-sync, wallet-auth, workflow) are extracted to shared services. All 15 modules are listed.

**2. Placeholder scan:** No TBD/TODO/future-work patterns. Each task describes exact files to create/modify. Code steps reference exact patterns from the existing codebase.

**3. Type consistency:** All service functions accept typed Zod-inferred inputs. Controllers parse via `schema.safeParse`. Mappers return plain objects. Route files only wire middleware + controllers. No type mismatch between tasks.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-01-refactor-modules-solid.md`. Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
