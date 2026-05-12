import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Server } from "node:http";
import { ethers } from "ethers";
import { createApp } from "../src/app.js";

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
  const { response, body } = await api("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  expect(response.status).toBe(200);
  return body.data.accessToken as string;
}

async function uploadRegistrationEvidence(token: string, registrationId: string, filename = "commune-evidence.pdf") {
  const formData = new FormData();
  formData.set("documentType", "COMMUNE_EVIDENCE");
  formData.set("ownerType", "REGISTRATION");
  formData.set("registrationId", registrationId);
  formData.set("file", new Blob(["evidence"], { type: "application/pdf" }), filename);

  const uploaded = await api("/api/v1/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });
  expect(uploaded.response.status).toBe(201);
  return uploaded.body.data.id as string;
}

async function getServiceWalletAuthorizationId(adminToken: string, roleScope: "LAND_REGISTRY_OFFICER" | "APPROVAL_AUTHORITY") {
  const listed = await api(`/api/v1/service-wallets?status=ACTIVE&roleScope=${roleScope}`, {
    headers: {
      Authorization: `Bearer ${adminToken}`
    }
  });
  expect(listed.response.status).toBe(200);
  const first = listed.body.data.items[0];
  expect(Boolean(first)).toBe(true);
  return first.id as string;
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

describe("Sprint 3 registration core workflow", () => {
  it("citizen can create and submit registration", async () => {
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
          parcelNumber: `P-${suffix}`,
          mapSheetNumber: "11",
          area: 88.8,
          landUsePurpose: "ODT",
          address: "Số 1 Đường Demo"
        },
        ownerInfo: {
          ownerType: "INDIVIDUAL",
          fullName: "Nguyễn Văn Demo",
          identityNumber: "0482demo",
          address: "Đà Nẵng"
        },
        fileIds: []
      })
    });

    expect(created.response.status).toBe(201);
    expect(created.body.data.registrationCode).toContain("REG-");
    expect(created.body.data.status).toBe("MOI_TAO");
    const registrationId = created.body.data.registrationId as string;

    const submitted = await api(`/api/v1/registrations/${registrationId}/submit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${citizenToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ legalBasisCode: "QĐ3380-SUBMIT-01", note: "Người dân nộp hồ sơ" })
    });
    expect(submitted.response.status).toBe(200);
    expect(submitted.body.data.status).toBe("CHO_TIEP_NHAN");
  });

  it("officer can move registration across review flow endpoints", async () => {
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
          parcelNumber: `FLOW-${suffix}`,
          mapSheetNumber: "22",
          area: 95,
          landUsePurpose: "ODT",
          address: "Số 2 Đường Demo"
        },
        ownerInfo: {
          ownerType: "INDIVIDUAL",
          fullName: "Nguyễn Văn Flow"
        }
      })
    });
    expect(created.response.status).toBe(201);
    const registrationId = created.body.data.registrationId as string;
    const evidenceFileId = await uploadRegistrationEvidence(citizenToken, registrationId);

    const submitted = await api(`/api/v1/registrations/${registrationId}/submit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${citizenToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ legalBasisCode: "QĐ3380-SUBMIT-02" })
    });
    expect(submitted.response.status).toBe(200);

    const accept = await api(`/api/v1/registrations/${registrationId}/accept`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${receptionToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ legalBasisCode: "QĐ3380-RECEPTION-ACCEPT" })
    });
    expect(accept.response.status).toBe(200);
    expect(accept.body.data.status).toBe("DA_TIEP_NHAN");

    const statusWithoutReason = await api(`/api/v1/registrations/${registrationId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${receptionToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: "CAN_BO_SUNG", legalBasisCode: "QĐ3380-RECEPTION-SUPP" })
    });
    expect(statusWithoutReason.response.status).toBe(400);

    const communeConfirm = await api(`/api/v1/registrations/${registrationId}/commune-confirm`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        confirmed: true,
        legalBasisCode: "QĐ3380-COMMUNE-CONFIRM",
        notes: "UBND cấp xã xác nhận hồ sơ hợp lệ theo thẩm quyền",
        evidenceFileId
      })
    });
    expect(communeConfirm.response.status).toBe(200);
    expect(communeConfirm.body.data.status).toBe("DA_XAC_NHAN_CAP_XA");

    const taxTransfer = await api(`/api/v1/registrations/${registrationId}/tax-transfer`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${registryToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        legalBasisCode: "QĐ3380-TAX-TRANSFER",
        taxReferenceNo: `TAX-${suffix}`
      })
    });
    expect(taxTransfer.response.status).toBe(200);
    expect(taxTransfer.body.data.status).toBe("CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH");

    const obligations = await api(`/api/v1/registrations/${registrationId}/payment-obligations`, {
      headers: {
        Authorization: `Bearer ${taxToken}`
      }
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
          legalBasisCode: "QĐ3380-TAX-CONFIRM-S3"
        })
      }
    );
    expect(obligationConfirmed.response.status).toBe(200);

    const toApprovalQueue = await api(`/api/v1/registrations/${registrationId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${registryToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: "CHO_KY_CAP",
        legalBasisCode: "QĐ3380-TO-APPROVAL-S3"
      })
    });
    expect(toApprovalQueue.response.status).toBe(200);

    const approve = await api(`/api/v1/registrations/${registrationId}/approve`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${approvalToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        legalBasisCode: "QĐ3380-APPROVE",
        approvalNumber: `QD-${suffix}`,
        approvalDate: "2026-04-28"
      })
    });
    expect(approve.response.status).toBe(200);
    expect(approve.body.data.status).toBe("DA_KY_CAP");

    const cadastralUpdated = await api(`/api/v1/registrations/${registrationId}/cadastral-update`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${registryToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        legalBasisCode: "QĐ3380-CADASTRAL-UPDATE",
        note: "Đã cập nhật hồ sơ địa chính tại VPĐKĐĐ"
      })
    });
    expect(cadastralUpdated.response.status).toBe(200);
    expect(cadastralUpdated.body.data.status).toBe("DA_CAP_NHAT_HO_SO_DIA_CHINH");

    const sync = await api(`/api/v1/registrations/${registrationId}/blockchain-sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${approvalToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        legalBasisCode: "QĐ3380-BLOCKCHAIN-SYNC",
        cid: `bafy-s3-${suffix}`,
        metadataHash: `0x${suffix}`,
        walletAuthorizationId: approvalWalletAuthorizationId,
        ...(await buildBlockchainSyncSignaturePayload("APPROVAL_AUTHORITY", created.body.data.registrationCode as string))
      })
    });
    expect(sync.response.status).toBe(200);
    expect(sync.body.data.txHash).toBeTruthy();
  });

  it("supports status update and notification history for registration processing result", async () => {
    const citizenToken = await login("citizen@urbanchain.vn");
    const receptionToken = await login("reception@urbanchain.vn");
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
          parcelNumber: `STATUS-${suffix}`,
          mapSheetNumber: "88",
          area: 66,
          landUsePurpose: "ODT",
          address: "Số 8 Đường Demo"
        },
        ownerInfo: {
          ownerType: "INDIVIDUAL",
          fullName: "Nguyễn Văn Status"
        }
      })
    });
    expect(created.response.status).toBe(201);
    const registrationId = created.body.data.registrationId as string;

    const submitted = await api(`/api/v1/registrations/${registrationId}/submit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${citizenToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ legalBasisCode: "QĐ3380-SUBMIT-03" })
    });
    expect(submitted.response.status).toBe(200);

    const statusUpdated = await api(`/api/v1/registrations/${registrationId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${receptionToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: "CAN_BO_SUNG",
        legalBasisCode: "QĐ3380-RECEPTION-SUPP-02",
        reason: "Thiếu bản scan giấy tờ nguồn gốc đất"
      })
    });
    expect(statusUpdated.response.status).toBe(200);
    expect(statusUpdated.body.data.status).toBe("CAN_BO_SUNG");
    expect(statusUpdated.body.data.notes.at(-1)).toContain("Thiếu bản scan");

    const notifications = await api(`/api/v1/registrations/${registrationId}/notifications`, {
      headers: {
        Authorization: `Bearer ${citizenToken}`
      }
    });
    expect(notifications.response.status).toBe(200);
    expect(notifications.body.data.total).toBeGreaterThan(0);
    expect(
      notifications.body.data.items.some(
        (item: { status: string | null; message: string }) =>
          item.status === "CAN_BO_SUNG" && item.message.includes("CAN_BO_SUNG")
      )
    ).toBe(true);
  });

  it("enforces legal supplement checklist and exposes document history timeline", async () => {
    const citizenToken = await login("citizen@urbanchain.vn");
    const receptionToken = await login("reception@urbanchain.vn");
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
          parcelNumber: `LEGAL-S3-${suffix}`,
          mapSheetNumber: "66",
          area: 77,
          landUsePurpose: "ODT",
          address: "Số 6 Đường Demo"
        },
        ownerInfo: {
          ownerType: "INDIVIDUAL",
          fullName: "Nguyễn Văn Legal"
        }
      })
    });
    expect(created.response.status).toBe(201);
    const registrationId = created.body.data.registrationId as string;

    const uploadedFileId = await uploadRegistrationEvidence(citizenToken, registrationId, "history-evidence.pdf");

    const submit = await api(`/api/v1/registrations/${registrationId}/submit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${citizenToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ legalBasisCode: "QĐ3380-S3-SUBMIT-HISTORY" })
    });
    expect(submit.response.status).toBe(200);

    const invalidSupplement = await api(`/api/v1/registrations/${registrationId}/request-supplement`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${receptionToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        legalBasisCode: "QĐ3380-S3-SUPP-INVALID",
        note: "Thiếu hồ sơ"
      })
    });
    expect(invalidSupplement.response.status).toBe(400);

    const validSupplement = await api(`/api/v1/registrations/${registrationId}/request-supplement`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${receptionToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        legalBasisCode: "QĐ3380-S3-SUPP-VALID",
        note: "Yêu cầu bổ sung hồ sơ theo phiếu kiểm tra",
        missingItems: ["Thiếu bản scan giấy tờ nguồn gốc đất", "Thiếu minh chứng nghĩa vụ tài chính"],
        deadlineAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      })
    });
    expect(validSupplement.response.status).toBe(200);
    expect(validSupplement.body.data.status).toBe("CAN_BO_SUNG");

    const history = await api(`/api/v1/registrations/${registrationId}/document-history`, {
      headers: {
        Authorization: `Bearer ${receptionToken}`
      }
    });
    expect(history.response.status).toBe(200);
    expect(history.body.data.total).toBeGreaterThan(0);
    expect(
      history.body.data.items.some(
        (item: { type: string; detail: { status?: string; documentType?: string }; title: string }) =>
          item.type === "DOCUMENT_VERSION" &&
          item.detail.documentType === "COMMUNE_EVIDENCE" &&
          item.detail.status === "LOCKED"
      )
    ).toBe(true);
    expect(
      history.body.data.items.some((item: { type: string; title: string }) => item.type === "SUBMIT_SNAPSHOT")
    ).toBe(true);
    expect(
      history.body.data.items.some((item: { type: string; title: string }) => item.type === "STATUS_AUDIT")
    ).toBe(true);

    const badCommuneConfirm = await api(`/api/v1/registrations/${registrationId}/commune-confirm`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${receptionToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        confirmed: true,
        legalBasisCode: "QĐ3380-S3-COMMUNE-BAD",
        notes: "Xác nhận hồ sơ",
        evidenceFileId: uploadedFileId
      })
    });
    expect(badCommuneConfirm.response.status).toBe(403);
  });

  it("supports blockchain status reconciliation and blocks duplicate sync", async () => {
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
          parcelNumber: `CHAIN-${suffix}`,
          mapSheetNumber: "44",
          area: 103.4,
          landUsePurpose: "ODT",
          address: "Số 4 Đường Demo"
        },
        ownerInfo: {
          ownerType: "INDIVIDUAL",
          fullName: "Nguyễn Văn Chain",
          identityNumber: "0482chain"
        }
      })
    });
    expect(created.response.status).toBe(201);
    const registrationId = created.body.data.registrationId as string;
    const evidenceFileId = await uploadRegistrationEvidence(citizenToken, registrationId, "chain-evidence.pdf");

    const submit = await api(`/api/v1/registrations/${registrationId}/submit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${citizenToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ legalBasisCode: "QĐ3380-S4-SUBMIT" })
    });
    expect(submit.response.status).toBe(200);

    const accept = await api(`/api/v1/registrations/${registrationId}/accept`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${receptionToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ legalBasisCode: "QĐ3380-S4-ACCEPT", note: "Tiếp nhận hồ sơ đầy đủ" })
    });
    expect(accept.response.status).toBe(200);

    const communeConfirm = await api(`/api/v1/registrations/${registrationId}/commune-confirm`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        confirmed: true,
        legalBasisCode: "QĐ3380-S4-COMMUNE",
        notes: "Xác nhận địa giới 2 cấp hợp lệ",
        evidenceFileId
      })
    });
    expect(communeConfirm.response.status).toBe(200);

    const taxTransfer = await api(`/api/v1/registrations/${registrationId}/tax-transfer`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${registryToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        legalBasisCode: "QĐ3380-S4-TAX-TRANSFER",
        taxReferenceNo: `S4-TAX-${suffix}`
      })
    });
    expect(taxTransfer.response.status).toBe(200);

    const obligations = await api(`/api/v1/registrations/${registrationId}/payment-obligations`, {
      headers: {
        Authorization: `Bearer ${taxToken}`
      }
    });
    expect(obligations.response.status).toBe(200);
    const pendingObligation = obligations.body.data.items.find(
      (item: { type: string; status: string }) => item.type === "LAND_FINANCIAL_OBLIGATION" && item.status === "PENDING"
    );
    expect(Boolean(pendingObligation)).toBe(true);

    const obligationConfirmed = await api(
      `/api/v1/registrations/${registrationId}/payment-obligations/${pendingObligation.id}/status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${taxToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: "CONFIRMED",
          legalBasisCode: "QĐ3380-S4-TAX-CONFIRM"
        })
      }
    );
    expect(obligationConfirmed.response.status).toBe(200);

    const toApprovalQueue = await api(`/api/v1/registrations/${registrationId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${registryToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: "CHO_KY_CAP",
        legalBasisCode: "QĐ3380-S4-TO-APPROVAL"
      })
    });
    expect(toApprovalQueue.response.status).toBe(200);

    const approve = await api(`/api/v1/registrations/${registrationId}/approve`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${approvalToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        legalBasisCode: "QĐ3380-S4-APPROVE",
        approvalNumber: `S4-QD-${suffix}`,
        approvalDate: "2026-05-10"
      })
    });
    expect(approve.response.status).toBe(200);

    const cadastralUpdated = await api(`/api/v1/registrations/${registrationId}/cadastral-update`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${registryToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        legalBasisCode: "QĐ3380-S4-CADASTRAL",
        note: "Hoàn tất cập nhật địa chính trước khi sync chain"
      })
    });
    expect(cadastralUpdated.response.status).toBe(200);

    const precheckStatus = await api(`/api/v1/registrations/${registrationId}/blockchain-status`, {
      headers: {
        Authorization: `Bearer ${approvalToken}`
      }
    });
    expect(precheckStatus.response.status).toBe(200);
    expect(precheckStatus.body.data.inSync).toBe(true);
    expect(precheckStatus.body.data.onChain.registrationTokenId).toBeNull();
    expect(precheckStatus.body.data.offChain.txHash).toBeNull();

    const sync = await api(`/api/v1/registrations/${registrationId}/blockchain-sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${approvalToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        legalBasisCode: "QĐ3380-S4-BLOCKCHAIN",
        cid: `bafy-s4-${suffix}`,
        metadataHash: `0x${suffix}`,
        walletAuthorizationId: approvalWalletAuthorizationId,
        ...(await buildBlockchainSyncSignaturePayload("APPROVAL_AUTHORITY", created.body.data.registrationCode as string))
      })
    });
    expect(sync.response.status).toBe(200);
    expect(sync.body.data.txHash).toBeTruthy();

    const postSyncStatus = await api(`/api/v1/registrations/${registrationId}/blockchain-status`, {
      headers: {
        Authorization: `Bearer ${approvalToken}`
      }
    });
    expect(postSyncStatus.response.status).toBe(200);
    expect(postSyncStatus.body.data.inSync).toBe(false);
    expect(postSyncStatus.body.data.offChain.txHash).toBeTruthy();
    expect(postSyncStatus.body.data.onChain.registrationTokenId).toBeNull();

    const duplicateSync = await api(`/api/v1/registrations/${registrationId}/blockchain-sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${approvalToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        legalBasisCode: "QĐ3380-S4-BLOCKCHAIN-RETRY",
        cid: `bafy-s4-dup-${suffix}`,
        metadataHash: `0xdup${suffix}`,
        walletAuthorizationId: approvalWalletAuthorizationId,
        ...(await buildBlockchainSyncSignaturePayload("APPROVAL_AUTHORITY", created.body.data.registrationCode as string))
      })
    });
    expect(duplicateSync.response.status).toBe(409);
  });

  it("citizen cannot read another citizen registration", async () => {
    const suffix = Date.now().toString();
    const citizenTwoEmail = `s3.scope.${suffix}@urbanchain.vn`;

    const registerCitizenTwo = await api("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Scope Citizen 2",
        email: citizenTwoEmail,
        password: "StrongPassword@123",
        role: "CITIZEN"
      })
    });
    expect(registerCitizenTwo.response.status).toBe(201);

    const citizenOneToken = await login("citizen@urbanchain.vn");
    const citizenTwoToken = await login(citizenTwoEmail);

    const created = await api("/api/v1/registrations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${citizenOneToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        procedureCode: "DKDD_LANDAU_3380",
        landInfo: {
          provinceCode: "48",
          communeName: "Hòa Khánh",
          parcelNumber: `SCOPE-${suffix}`,
          mapSheetNumber: "33",
          area: 100,
          landUsePurpose: "ODT",
          address: "Số 3 Đường Demo"
        },
        ownerInfo: {
          ownerType: "INDIVIDUAL",
          fullName: "Scope Owner"
        }
      })
    });
    expect(created.response.status).toBe(201);

    const forbiddenRead = await api(`/api/v1/registrations/${created.body.data.registrationId}`, {
      headers: {
        Authorization: `Bearer ${citizenTwoToken}`
      }
    });
    expect(forbiddenRead.response.status).toBe(403);
  });
});
