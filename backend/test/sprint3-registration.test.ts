import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Server } from "node:http";
import { createApp } from "../src/app.js";

let server: Server;
let baseUrl: string;

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

function legalPayload(reason: string) {
  return {
    procedureCode: "1.013978",
    legalBasisCode: "151/2025-ND-CP|3380/QD-BNNMT",
    reason,
    evidenceIds: ["EV-TEST-01"]
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
      body: JSON.stringify({ note: "Người dân nộp hồ sơ" })
    });
    expect(submitted.response.status).toBe(200);
    expect(submitted.body.data.status).toBe("CHO_TIEP_NHAN");

    const submitAgain = await api(`/api/v1/registrations/${registrationId}/submit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${citizenToken}`,
        "Content-Type": "application/json"
      }
    });
    expect(submitAgain.response.status).toBe(409);
  });

  it("officer can move registration across review flow endpoints", async () => {
    const citizenToken = await login("citizen@urbanchain.vn");
    const receptionToken = await login("reception@urbanchain.vn");
    const adminToken = await login("admin@urbanchain.vn");
    const registryToken = await login("registry@urbanchain.vn");
    const approvalToken = await login("approval@urbanchain.vn");
    const suffix = Date.now().toString();

    const created = await api("/api/v1/registrations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${citizenToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
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

    const submitted = await api(`/api/v1/registrations/${registrationId}/submit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${citizenToken}`,
        "Content-Type": "application/json"
      }
    });
    expect(submitted.response.status).toBe(200);

    const approveTooEarly = await api(`/api/v1/registrations/${registrationId}/approve`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${approvalToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        approvalNumber: `QD-EARLY-${suffix}`,
        approvalDate: "2026-04-28",
        ...legalPayload("Thử phê duyệt quá sớm")
      })
    });
    expect(approveTooEarly.response.status).toBe(409);

    const accept = await api(`/api/v1/registrations/${registrationId}/accept`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${receptionToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(legalPayload("Bộ phận một cửa đã tiếp nhận hồ sơ"))
    });
    expect(accept.response.status).toBe(200);
    expect(accept.body.data.status).toBe("DA_TIEP_NHAN");

    const moveToCommuneReview = await api(`/api/v1/registrations/${registrationId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${receptionToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: "CHO_XAC_NHAN_CAP_XA",
        reason: "Chuyển hồ sơ sang bước xác nhận cấp xã",
        procedureCode: "1.013978",
        legalBasisCode: "151/2025-ND-CP|3380/QD-BNNMT",
        evidenceIds: ["EV-TEST-00"]
      })
    });
    expect(moveToCommuneReview.response.status).toBe(200);
    expect(moveToCommuneReview.body.data.status).toBe("CHO_XAC_NHAN_CAP_XA");

    const statusWithoutReason = await api(`/api/v1/registrations/${registrationId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${receptionToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: "CAN_BO_SUNG",
        procedureCode: "1.013978",
        legalBasisCode: "151/2025-ND-CP|3380/QD-BNNMT",
        evidenceIds: ["EV-TEST-01"]
      })
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
        ...legalPayload("UBND cấp xã xác nhận thông tin hồ sơ")
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
        taxReferenceNo: `TAX-${suffix}`,
        ...legalPayload("Chuyển nghĩa vụ tài chính sang cơ quan thuế")
      })
    });
    expect(taxTransfer.response.status).toBe(200);
    expect(taxTransfer.body.data.status).toBe("CHO_THUE");

    const moveToFinanceWait = await api(`/api/v1/registrations/${registrationId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${registryToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: "CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH",
        reason: "Đang chờ xác nhận hoàn thành nghĩa vụ tài chính",
        procedureCode: "1.013978",
        legalBasisCode: "151/2025-ND-CP|3380/QD-BNNMT",
        evidenceIds: ["EV-TEST-02"]
      })
    });
    expect(moveToFinanceWait.response.status).toBe(200);
    expect(moveToFinanceWait.body.data.status).toBe("CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH");

    const moveToSigningQueue = await api(`/api/v1/registrations/${registrationId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${registryToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: "CHO_KY_CAP",
        reason: "Đã hoàn tất nghiệp vụ, chuyển hồ sơ sang hàng đợi ký cấp",
        procedureCode: "1.013978",
        legalBasisCode: "151/2025-ND-CP|3380/QD-BNNMT",
        evidenceIds: ["EV-TEST-03"]
      })
    });
    expect(moveToSigningQueue.response.status).toBe(200);
    expect(moveToSigningQueue.body.data.status).toBe("CHO_KY_CAP");

    const approve = await api(`/api/v1/registrations/${registrationId}/approve`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${approvalToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        approvalNumber: `QD-${suffix}`,
        approvalDate: "2026-04-28",
        ...legalPayload("Phê duyệt hồ sơ đã đủ điều kiện ký cấp")
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
      body: JSON.stringify(legalPayload("Đã cập nhật hồ sơ địa chính/CSDL đất đai"))
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
        cid: `bafy-s3-${suffix}`,
        metadataHash: `0x${suffix}`,
        ...legalPayload("Đồng bộ metadata hồ sơ lên blockchain")
      })
    });
    expect(sync.response.status).toBe(200);
    expect(sync.body.data.txHash).toBeTruthy();

    const rejectAfterIssued = await api(`/api/v1/registrations/${registrationId}/reject`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${approvalToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        note: "Không hợp lệ sau khi đã cấp",
        ...legalPayload("Không hợp lệ sau khi đã cấp")
      })
    });
    expect(rejectAfterIssued.response.status).toBe(409);
  }, 45000);

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
      }
    });
    expect(submitted.response.status).toBe(200);

    const invalidStatusJump = await api(`/api/v1/registrations/${registrationId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${receptionToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: "DA_CAP",
        reason: "Nhảy trạng thái",
        procedureCode: "1.013978",
        legalBasisCode: "151/2025-ND-CP|3380/QD-BNNMT",
        evidenceIds: ["EV-TEST-01"]
      })
    });
    expect(invalidStatusJump.response.status).toBe(409);

    const statusUpdated = await api(`/api/v1/registrations/${registrationId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${receptionToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: "CAN_BO_SUNG",
        reason: "Thiếu bản scan giấy tờ nguồn gốc đất",
        procedureCode: "1.013978",
        legalBasisCode: "151/2025-ND-CP|3380/QD-BNNMT",
        evidenceIds: ["EV-TEST-03"]
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

  it("enforces file ownership when attaching fileIds to registration create", async () => {
    const suffix = Date.now().toString();
    const citizenOneToken = await login("citizen@urbanchain.vn");
    const citizenTwoEmail = `s3.file.scope.${suffix}@urbanchain.vn`;

    const registerCitizenTwo = await api("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Scope Citizen File 2",
        email: citizenTwoEmail,
        password: "StrongPassword@123",
        role: "CITIZEN"
      })
    });
    expect(registerCitizenTwo.response.status).toBe(201);
    const citizenTwoToken = await login(citizenTwoEmail);

    const ownFileForm = new FormData();
    ownFileForm.set("documentType", "DON_DANG_KY");
    ownFileForm.set("ownerType", "USER");
    ownFileForm.set("file", new Blob(["own-file"], { type: "application/pdf" }), "own-file.pdf");
    const ownUploaded = await api("/api/v1/files/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${citizenOneToken}` },
      body: ownFileForm
    });
    expect(ownUploaded.response.status).toBe(201);

    const createWithOwnFile = await api("/api/v1/registrations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${citizenOneToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        landInfo: {
          provinceCode: "48",
          communeName: "Hòa Khánh",
          parcelNumber: `FILE-OWN-${suffix}`,
          mapSheetNumber: "55",
          area: 75,
          landUsePurpose: "ODT",
          address: "Số 5 Đường Demo"
        },
        ownerInfo: {
          ownerType: "INDIVIDUAL",
          fullName: "Owner File One"
        },
        fileIds: [ownUploaded.body.data.id]
      })
    });
    expect(createWithOwnFile.response.status).toBe(201);

    const foreignFileForm = new FormData();
    foreignFileForm.set("documentType", "GIAY_TO_NHAN_THAN");
    foreignFileForm.set("ownerType", "USER");
    foreignFileForm.set("file", new Blob(["foreign-file"], { type: "application/pdf" }), "foreign-file.pdf");
    const foreignUploaded = await api("/api/v1/files/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${citizenTwoToken}` },
      body: foreignFileForm
    });
    expect(foreignUploaded.response.status).toBe(201);

    const createWithForeignFile = await api("/api/v1/registrations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${citizenOneToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        landInfo: {
          provinceCode: "48",
          communeName: "Hòa Khánh",
          parcelNumber: `FILE-FOREIGN-${suffix}`,
          mapSheetNumber: "56",
          area: 80,
          landUsePurpose: "ODT",
          address: "Số 6 Đường Demo"
        },
        ownerInfo: {
          ownerType: "INDIVIDUAL",
          fullName: "Owner File Foreign"
        },
        fileIds: [foreignUploaded.body.data.id]
      })
    });
    expect(createWithForeignFile.response.status).toBe(403);

    const createWithMissingFile = await api("/api/v1/registrations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${citizenOneToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        landInfo: {
          provinceCode: "48",
          communeName: "Hòa Khánh",
          parcelNumber: `FILE-MISSING-${suffix}`,
          mapSheetNumber: "57",
          area: 81,
          landUsePurpose: "ODT",
          address: "Số 7 Đường Demo"
        },
        ownerInfo: {
          ownerType: "INDIVIDUAL",
          fullName: "Owner File Missing"
        },
        fileIds: ["fil-not-exists"]
      })
    });
    expect(createWithMissingFile.response.status).toBe(400);
  });
});
