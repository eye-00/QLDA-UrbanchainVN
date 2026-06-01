import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Server } from "node:http";
import { ethers } from "ethers";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

let server: Server;
let baseUrl: string;

const TEST_WALLET_KEYS = {
  LAND_REGISTRY_OFFICER: "0x59c6995e998f97a5a0044966f094538f5d9d315f0f74d45d4f4b63e5f9f9b6b1",
  APPROVAL_AUTHORITY: "0x5de4111afa1a4b94908c05a2db3fca5e9cb0ce3f4bfefd4dc2621c99ceb8590f"
} as const;

async function api(path: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const body = await response.json();
  return { response, body };
}

async function login(email: string, password = "StrongPassword@123") {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { citizenProfile: true, staffProfile: true }
  });

  let loginType: "CITIZEN" | "STAFF" | "ADMIN" = "CITIZEN";
  let identifier = email;

  if (user) {
    if (user.accountType === "CITIZEN") {
      loginType = "CITIZEN";
      identifier = user.citizenProfile?.citizenId || "";
    } else if (user.accountType === "STAFF") {
      loginType = "STAFF";
      identifier = user.staffProfile?.officialUsername || "";
    } else if (user.accountType === "SYSTEM_ADMIN" || user.accountType === "AGENCY_ADMIN") {
      loginType = "ADMIN";
      identifier = user.username || "";
    }
  }

  const { response, body } = await api("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginType, identifier, password })
  });

  expect(response.status).toBe(200);
  return body.data.accessToken as string;
}

async function getServiceWalletAuthorizationId(adminToken: string, roleScope: "LAND_REGISTRY_OFFICER" | "APPROVAL_AUTHORITY") {
  const listed = await api(`/api/v1/service-wallets?status=ACTIVE&roleScope=${roleScope}`, {
    headers: {
      Authorization: `Bearer ${adminToken}`
    }
  });
  expect(listed.response.status).toBe(200);
  return listed.body.data.items[0].id as string;
}

async function buildBlockchainSyncSignaturePayload(
  roleScope: "LAND_REGISTRY_OFFICER" | "APPROVAL_AUTHORITY",
  registrationCode: string
) {
  const signer = new ethers.Wallet(TEST_WALLET_KEYS[roleScope]);
  const signerChainId = Number(process.env.BLOCKCHAIN_CHAIN_ID ?? "11155111");
  const signingMessage = [
    "UrbanChain-VN Blockchain Sync Confirmation",
    `RegistrationCode: ${registrationCode}`,
    `RoleScope: ${roleScope}`,
    `Signer: ${signer.address}`,
    `ChainId: ${signerChainId}`,
    `IssuedAt: ${new Date().toISOString()}`
  ].join("\n");
  const signature = await signer.signMessage(signingMessage);
  return {
    signerWalletAddress: signer.address,
    signerChainId,
    signingMessage,
    signature
  };
}

beforeAll(async () => {
  server = createApp().listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind to a TCP port");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe("Sprint 2 legal-aligned core", () => {
  it("supports legal procedure registry APIs", async () => {
    const adminToken = await login("admin@urbanchain.vn");
    const suffix = Date.now().toString();
    const procedureCode = `LEG_PROC_${suffix}`;

    const createdProcedure = await api("/api/v1/legal/procedures", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        procedureCode,
        sourceDecision: "QD_TEST_2026",
        legalBasis: "NĐ 151/2025 + QĐ 3380/2025",
        level: "LIEN_THONG",
        authorityActors: ["RECEPTION_OFFICER", "LAND_REGISTRY_OFFICER", "TAX_OFFICER", "APPROVAL_AUTHORITY"],
        requiresTaxStep: true
      })
    });
    expect(createdProcedure.response.status).toBe(201);
    expect(createdProcedure.body.data.procedureCode).toBe(procedureCode);

    const list = await api(`/api/v1/legal/procedures?keyword=${procedureCode}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(list.response.status).toBe(200);
    expect(list.body.data.items.some((item: { procedureCode: string }) => item.procedureCode === procedureCode)).toBe(true);
  });

  it("locks document versions and creates submit snapshot", async () => {
    const citizenToken = await login("citizen@urbanchain.vn");
    const suffix = Date.now().toString();

    const created = await api("/api/v1/registrations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${citizenToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        procedureCode: "DKDD_LANDAU_3380",
        landInfo: {
          provinceCode: "48",
          communeName: "Hòa Khánh",
          parcelNumber: `LEGAL-SNAP-${suffix}`,
          mapSheetNumber: "10",
          area: 45.5,
          landUsePurpose: "ODT",
          address: "Số 10 Đường Legal"
        },
        ownerInfo: {
          ownerType: "INDIVIDUAL",
          fullName: "Snapshot Owner"
        }
      })
    });
    expect(created.response.status).toBe(201);
    const registrationId = created.body.data.registrationId as string;

    const formData = new FormData();
    formData.set("documentType", "LEGAL_SOURCE_DOC");
    formData.set("ownerType", "REGISTRATION");
    formData.set("registrationId", registrationId);
    formData.set("file", new Blob(["doc"], { type: "application/pdf" }), "legal.pdf");

    const uploaded = await api("/api/v1/files/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${citizenToken}`
      },
      body: formData
    });
    expect(uploaded.response.status).toBe(201);

    const versionsBeforeSubmit = await api(`/api/v1/registrations/${registrationId}/document-versions`, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    expect(versionsBeforeSubmit.response.status).toBe(200);
    expect(versionsBeforeSubmit.body.data.total).toBeGreaterThan(0);
    expect(versionsBeforeSubmit.body.data.items[0].status).toBe("ACTIVE");

    const submitted = await api(`/api/v1/registrations/${registrationId}/submit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${citizenToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        legalBasisCode: "QĐ3380-SNAPSHOT-SUBMIT",
        note: "Nộp hồ sơ đủ tài liệu"
      })
    });
    expect(submitted.response.status).toBe(200);
    expect(submitted.body.data.status).toBe("CHO_TIEP_NHAN");

    const versionsAfterSubmit = await api(`/api/v1/registrations/${registrationId}/document-versions`, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    expect(versionsAfterSubmit.response.status).toBe(200);
    expect(versionsAfterSubmit.body.data.items[0].status).toBe("LOCKED");

    const snapshots = await api(`/api/v1/registrations/${registrationId}/snapshots`, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    expect(snapshots.response.status).toBe(200);
    expect(snapshots.body.data.total).toBeGreaterThan(0);
    expect(snapshots.body.data.items[0].legalBasisCode).toBe("QĐ3380-SNAPSHOT-SUBMIT");
  });

  it("enforces legal transition guard, payment model and blockchain precondition", async () => {
    process.env.BLOCKCHAIN_SYNC_MODE = "mock";
    const citizenToken = await login("citizen@urbanchain.vn");
    const receptionToken = await login("reception@urbanchain.vn");
    const adminToken = await login("admin@urbanchain.vn");
    const registryToken = await login("registry@urbanchain.vn");
    const taxToken = await login("tax@urbanchain.vn");
    const approvalToken = await login("approval@urbanchain.vn");
    const approvalWalletAuthorizationId = await getServiceWalletAuthorizationId(adminToken, "APPROVAL_AUTHORITY");
    const suffix = Date.now().toString();

    const created = await api("/api/v1/registrations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${citizenToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        procedureCode: "DKDD_LANDAU_3380",
        landInfo: {
          provinceCode: "48",
          communeName: "Hòa Khánh",
          parcelNumber: `LEGAL-FLOW-${suffix}`,
          mapSheetNumber: "20",
          area: 77.7,
          landUsePurpose: "ODT",
          address: "Số 20 Đường Legal"
        },
        ownerInfo: {
          ownerType: "INDIVIDUAL",
          fullName: "Legal Flow Owner"
        }
      })
    });
    expect(created.response.status).toBe(201);
    const registrationId = created.body.data.registrationId as string;

    const communeEvidenceForm = new FormData();
    communeEvidenceForm.set("documentType", "COMMUNE_EVIDENCE");
    communeEvidenceForm.set("ownerType", "REGISTRATION");
    communeEvidenceForm.set("registrationId", registrationId);
    communeEvidenceForm.set("file", new Blob(["commune-evidence"], { type: "application/pdf" }), "commune-evidence.pdf");

    const communeEvidenceUpload = await api("/api/v1/files/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${citizenToken}`
      },
      body: communeEvidenceForm
    });
    expect(communeEvidenceUpload.response.status).toBe(201);

    const addVersion = await api(`/api/v1/registrations/${registrationId}/document-versions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${citizenToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        documentType: "LAND_CERT_SUPPORT",
        storageStatus: "UPLOADED_IPFS",
        cid: `bafy-legal-${suffix}`,
        hash: `0x${suffix}`
      })
    });
    expect(addVersion.response.status).toBe(201);

    const submitted = await api(`/api/v1/registrations/${registrationId}/submit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${citizenToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ legalBasisCode: "QĐ3380-SUBMIT-LEGAL-FLOW" })
    });
    expect(submitted.response.status).toBe(200);

    const acceptMissingLegalBasis = await api(`/api/v1/registrations/${registrationId}/accept`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${receptionToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });
    expect(acceptMissingLegalBasis.response.status).toBe(400);

    const accept = await api(`/api/v1/registrations/${registrationId}/accept`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${receptionToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ legalBasisCode: "QĐ3380-ACCEPT-FLOW" })
    });
    expect(accept.response.status).toBe(200);
    expect(accept.body.data.status).toBe("DA_TIEP_NHAN");

    const toCommuneQueue = await api(`/api/v1/registrations/${registrationId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${receptionToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: "CHO_XAC_NHAN_CAP_XA",
        legalBasisCode: "QĐ3380-QUEUE-COMMUNE"
      })
    });
    expect(toCommuneQueue.response.status).toBe(200);

    const communeConfirm = await api(`/api/v1/registrations/${registrationId}/commune-confirm`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        confirmed: true,
        legalBasisCode: "QĐ3380-COMMUNE-CONFIRM",
        notes: "UBND cấp xã xác nhận theo hồ sơ và chứng cứ đính kèm",
        evidenceFileId: communeEvidenceUpload.body.data.id
      })
    });
    expect(communeConfirm.response.status).toBe(200);

    const appraisal = await api(`/api/v1/registrations/${registrationId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${registryToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: "DANG_THAM_DINH_VPDKDD",
        legalBasisCode: "QĐ3380-APPRAISAL"
      })
    });
    expect(appraisal.response.status).toBe(200);

    const taxTransfer = await api(`/api/v1/registrations/${registrationId}/tax-transfer`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${registryToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        legalBasisCode: "QĐ3380-TAX-XFER",
        taxReferenceNo: `TAX-${suffix}`,
        amount: 100000
      })
    });
    expect(taxTransfer.response.status).toBe(200);
    expect(taxTransfer.body.data.status).toBe("CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH");

    const obligations = await api(`/api/v1/registrations/${registrationId}/payment-obligations`, {
      headers: { Authorization: `Bearer ${taxToken}` }
    });
    expect(obligations.response.status).toBe(200);
    const landObligation = obligations.body.data.items.find(
      (item: { type: string; status: string }) => item.type === "LAND_FINANCIAL_OBLIGATION" && item.status === "PENDING"
    );
    expect(Boolean(landObligation)).toBe(true);

    const obligationConfirmed = await api(
      `/api/v1/registrations/${registrationId}/payment-obligations/${landObligation.id}/status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${taxToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: "CONFIRMED",
          legalBasisCode: "QĐ3380-TAX-CONFIRM"
        })
      }
    );
    expect(obligationConfirmed.response.status).toBe(200);
    expect(obligationConfirmed.body.data.status).toBe("CONFIRMED");

    const toApprovalQueue = await api(`/api/v1/registrations/${registrationId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${registryToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: "CHO_KY_CAP",
        legalBasisCode: "QĐ3380-TO-APPROVAL"
      })
    });
    expect(toApprovalQueue.response.status).toBe(200);

    const approved = await api(`/api/v1/registrations/${registrationId}/approve`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${approvalToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        legalBasisCode: "QĐ3380-APPROVE-FLOW",
        approvalNumber: `QD-${suffix}`
      })
    });
    expect(approved.response.status).toBe(200);
    expect(approved.body.data.status).toBe("DA_KY_CAP");

    const blockchainBeforeCadastral = await api(`/api/v1/registrations/${registrationId}/blockchain-sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${approvalToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        legalBasisCode: "QĐ3380-BLOCKCHAIN-EARLY",
        cid: `bafy-early-${suffix}`,
        metadataHash: `0x${suffix}`,
        walletAuthorizationId: approvalWalletAuthorizationId,
        ...(await buildBlockchainSyncSignaturePayload("APPROVAL_AUTHORITY", created.body.data.registrationCode as string))
      })
    });
    expect(blockchainBeforeCadastral.response.status).toBe(409);

    const cadastralUpdate = await api(`/api/v1/registrations/${registrationId}/cadastral-update`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${registryToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        legalBasisCode: "QĐ3380-CADASTRAL-DONE",
        note: "Đã cập nhật hồ sơ địa chính"
      })
    });
    expect(cadastralUpdate.response.status).toBe(200);
    expect(cadastralUpdate.body.data.status).toBe("DA_CAP_NHAT_HO_SO_DIA_CHINH");

    const bypassStatusToBlockchain = await api(`/api/v1/registrations/${registrationId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: "DA_GHI_BLOCKCHAIN",
        legalBasisCode: "QĐ3380-BYPASS-BLOCKCHAIN"
      })
    });
    expect(bypassStatusToBlockchain.response.status).toBe(409);

    const adminBlockchainSync = await api(`/api/v1/registrations/${registrationId}/blockchain-sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        legalBasisCode: "QĐ3380-BLOCKCHAIN-ADMIN-FORBIDDEN",
        cid: `bafy-admin-${suffix}`,
        metadataHash: `0x${suffix}admin`,
        walletAuthorizationId: approvalWalletAuthorizationId,
        ...(await buildBlockchainSyncSignaturePayload("APPROVAL_AUTHORITY", created.body.data.registrationCode as string))
      })
    });
    expect(adminBlockchainSync.response.status).toBe(403);

    const blockchainOk = await api(`/api/v1/registrations/${registrationId}/blockchain-sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${approvalToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        legalBasisCode: "QĐ3380-BLOCKCHAIN-DONE",
        cid: `bafy-done-${suffix}`,
        metadataHash: `0x${suffix}done`,
        walletAuthorizationId: approvalWalletAuthorizationId,
        ...(await buildBlockchainSyncSignaturePayload("APPROVAL_AUTHORITY", created.body.data.registrationCode as string))
      })
    });
    expect(blockchainOk.response.status).toBe(200);
    expect(blockchainOk.body.success).toBe(true);
  });
});
