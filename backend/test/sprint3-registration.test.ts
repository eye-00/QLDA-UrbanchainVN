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
          communeName: "Hoa Khanh",
          parcelNumber: `P-${suffix}`,
          mapSheetNumber: "11",
          area: 88.8,
          landUsePurpose: "ODT",
          address: "So 1 Duong Demo"
        },
        ownerInfo: {
          ownerType: "INDIVIDUAL",
          fullName: "Nguyen Van Demo",
          identityNumber: "0482demo",
          address: "Da Nang"
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
      body: JSON.stringify({ note: "Nguoi dan nop ho so" })
    });
    expect(submitted.response.status).toBe(200);
    expect(submitted.body.data.status).toBe("CHO_TIEP_NHAN");
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
          communeName: "Hoa Khanh",
          parcelNumber: `FLOW-${suffix}`,
          mapSheetNumber: "22",
          area: 95,
          landUsePurpose: "ODT",
          address: "So 2 Duong Demo"
        },
        ownerInfo: {
          ownerType: "INDIVIDUAL",
          fullName: "Nguyen Van Flow"
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

    const accept = await api(`/api/v1/registrations/${registrationId}/accept`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${receptionToken}`,
        "Content-Type": "application/json"
      }
    });
    expect(accept.response.status).toBe(200);
    expect(accept.body.data.status).toBe("DA_TIEP_NHAN");

    const statusWithoutReason = await api(`/api/v1/registrations/${registrationId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${receptionToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: "CAN_BO_SUNG" })
    });
    expect(statusWithoutReason.response.status).toBe(400);

    const communeConfirm = await api(`/api/v1/registrations/${registrationId}/commune-confirm`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ confirmed: true })
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
        taxReferenceNo: `TAX-${suffix}`
      })
    });
    expect(taxTransfer.response.status).toBe(200);
    expect(taxTransfer.body.data.status).toBe("CHO_THUE");

    const approve = await api(`/api/v1/registrations/${registrationId}/approve`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${approvalToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        approvalNumber: `QD-${suffix}`,
        approvalDate: "2026-04-28"
      })
    });
    expect(approve.response.status).toBe(200);
    expect(approve.body.data.status).toBe("DA_CAP");

    const sync = await api(`/api/v1/registrations/${registrationId}/blockchain-sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${approvalToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        cid: `bafy-s3-${suffix}`,
        metadataHash: `0x${suffix}`
      })
    });
    expect(sync.response.status).toBe(200);
    expect(sync.body.data.txHash).toBeTruthy();
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
          communeName: "Hoa Khanh",
          parcelNumber: `SCOPE-${suffix}`,
          mapSheetNumber: "33",
          area: 100,
          landUsePurpose: "ODT",
          address: "So 3 Duong Demo"
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
