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

describe("Sprint 5 legal core", () => {
  it("supports top-level payment obligation legal lifecycle with RBAC", async () => {
    const citizenToken = await login("citizen@urbanchain.vn");
    const taxToken = await login("tax@urbanchain.vn");
    const registryToken = await login("registry@urbanchain.vn");

    const suffix = Date.now().toString();
    const createdRegistration = await api("/api/v1/registrations", {
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
          parcelNumber: `S5-PAY-${suffix}`,
          mapSheetNumber: "32",
          area: 55.5,
          landUsePurpose: "ODT",
          address: "Số 32 Đường Sprint 5"
        },
        ownerInfo: {
          ownerType: "INDIVIDUAL",
          fullName: "Sprint 5 Payment Owner"
        }
      })
    });
    expect(createdRegistration.response.status).toBe(201);
    const registrationId = createdRegistration.body.data.registrationId as string;

    const citizenCreate = await api("/api/v1/payment-obligations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${citizenToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        registrationId,
        type: "REGISTRATION_FEE",
        legalBasisCode: "151/2025-ND-CP|3380/QD-BNNMT",
        amount: 800000
      })
    });
    expect(citizenCreate.response.status).toBe(403);

    const createdObligation = await api("/api/v1/payment-obligations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${taxToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        registrationId,
        type: "REGISTRATION_FEE",
        legalBasisCode: "151/2025-ND-CP|3380/QD-BNNMT",
        amount: 800000,
        note: "Tạo nghĩa vụ tài chính theo LEG-S5-001"
      })
    });
    expect(createdObligation.response.status).toBe(201);
    expect(createdObligation.body.data.type).toBe("REGISTRATION_FEE");
    const obligationId = createdObligation.body.data.id as string;

    const issuedNotice = await api(`/api/v1/payment-obligations/${obligationId}/generate-qr-test`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${taxToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        legalBasisCode: "151/2025-ND-CP|3380/QD-BNNMT",
        note: "Phát hành thông báo nộp phí"
      })
    });
    expect(issuedNotice.response.status).toBe(200);
    expect(Boolean(issuedNotice.body.data.noticeRef)).toBe(true);

    const uploadedReceipt = new FormData();
    uploadedReceipt.set("documentType", "PAYMENT_RECEIPT");
    uploadedReceipt.set("ownerType", "REGISTRATION");
    uploadedReceipt.set("registrationId", registrationId);
    uploadedReceipt.set("file", new Blob(["receipt"], { type: "application/pdf" }), "receipt.pdf");

    const receiptFile = await api("/api/v1/files/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${citizenToken}` },
      body: uploadedReceipt
    });
    expect(receiptFile.response.status).toBe(201);

    const submittedReceipt = await api(`/api/v1/payment-obligations/${obligationId}/mock-confirm`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${citizenToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        legalBasisCode: "151/2025-ND-CP|3380/QD-BNNMT",
        receiptRef: `RCP-${suffix}`,
        receiptFileId: receiptFile.body.data.id
      })
    });
    expect(submittedReceipt.response.status).toBe(200);
    expect(Boolean(submittedReceipt.body.data.receiptSubmittedAt)).toBe(true);

    const verifiedReceipt = await api(`/api/v1/payment-obligations/${obligationId}/verify-receipt`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${taxToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        legalBasisCode: "151/2025-ND-CP|3380/QD-BNNMT",
        verified: true,
        verifyNote: "Biên nhận hợp lệ"
      })
    });
    expect(verifiedReceipt.response.status).toBe(200);
    expect(verifiedReceipt.body.data.status).toBe("CONFIRMED");

    const recordEvidence = await api(`/api/v1/payment-obligations/${obligationId}/record-on-chain`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${registryToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        legalBasisCode: "151/2025-ND-CP|3380/QD-BNNMT",
        evidenceTxHash: `0x${suffix}abcdef`,
        evidenceCid: `bafy-s5-payment-${suffix}`,
        evidenceHash: `0xhash${suffix}`
      })
    });
    expect(recordEvidence.response.status).toBe(200);
    expect(recordEvidence.body.data.evidenceTxHash).toContain(`0x${suffix}`);
  });

  it("supports map legal source and geometry state flow", async () => {
    const adminToken = await login("admin@urbanchain.vn");
    const registryToken = await login("registry@urbanchain.vn");
    const approvalToken = await login("approval@urbanchain.vn");
    const suffix = Date.now().toString();

    const createdLand = await api("/api/v1/lands", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        parcelCode: `LAND-S5-${suffix}`,
        provinceCode: "48",
        communeName: "Hòa Khánh",
        mapSheetNumber: "09",
        parcelNumber: `99-${suffix.slice(-3)}`,
        area: 88.88,
        landUsePurpose: "ODT",
        address: "Khu vực map legal source"
      })
    });
    expect(createdLand.response.status).toBe(201);
    const landId = createdLand.body.data.id as string;

    const listBefore = await api("/api/v1/map/parcels?sourceType=DEMO", {
      headers: {
        Authorization: `Bearer ${registryToken}`
      }
    });
    expect(listBefore.response.status).toBe(200);
    expect(listBefore.body.data.items.some((item: { id: string }) => item.id === landId)).toBe(true);

    const geometryUpsert = await api(`/api/v1/map/parcels/${landId}/geometry`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${registryToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sourceType: "IMPORTED",
        geometry: {
          type: "Polygon",
          coordinates: [[[108.17, 16.07], [108.18, 16.07], [108.18, 16.08], [108.17, 16.08], [108.17, 16.07]]]
        },
        note: "Nạp dữ liệu hình học phục vụ review"
      })
    });
    expect(geometryUpsert.response.status).toBe(200);
    expect(geometryUpsert.body.data.geometryStatus).toBe("DRAFT");
    expect(geometryUpsert.body.data.sourceType).toBe("IMPORTED");

    const reviewed = await api(`/api/v1/map/parcels/${landId}/review`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${registryToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        decision: "REVIEWED",
        note: "UBND cấp xã đã rà soát ranh giới"
      })
    });
    expect(reviewed.response.status).toBe(200);
    expect(reviewed.body.data.geometryStatus).toBe("UNDER_REVIEW");

    const approved = await api(`/api/v1/map/parcels/${landId}/approve-offchain`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${registryToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        note: "VPĐKĐĐ phê duyệt off-chain"
      })
    });
    expect(approved.response.status).toBe(200);
    expect(approved.body.data.geometryStatus).toBe("OFFCHAIN_APPROVED");

    const recorded = await api(`/api/v1/map/parcels/${landId}/record-boundary-hash`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${approvalToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        boundaryHashValue: `0xboundary${suffix}`,
        boundaryHashTxHash: `0xtx${suffix}`,
        boundaryHashCid: `bafy-s5-map-${suffix}`,
        note: "Ghi hash ranh giới lên hệ thống truy vết"
      })
    });
    expect(recorded.response.status).toBe(200);
    expect(recorded.body.data.geometryStatus).toBe("BOUNDARY_HASH_RECORDED");

    const tryEditAfterRecorded = await api(`/api/v1/map/parcels/${landId}/geometry`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${registryToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        geometry: {
          type: "Polygon",
          coordinates: [[[108.11, 16.01], [108.12, 16.01], [108.12, 16.02], [108.11, 16.02], [108.11, 16.01]]]
        },
        note: "Thử sửa sau khi đã record hash"
      })
    });
    expect(tryEditAfterRecorded.response.status).toBe(409);

    const layers = await api("/api/v1/map/layers", {
      headers: {
        Authorization: `Bearer ${registryToken}`
      }
    });
    expect(layers.response.status).toBe(200);
    expect(Array.isArray(layers.body.data.items)).toBe(true);
    expect(layers.body.data.items.length).toBeGreaterThan(0);
  });
});
