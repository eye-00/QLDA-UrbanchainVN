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

describe("Sprint 4 service wallet governance", () => {
  it("allows admin to list and update service wallet authorization status", async () => {
    const adminToken = await login("admin@urbanchain.vn");

    const listed = await api("/api/v1/service-wallets?status=ACTIVE", {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    expect(listed.response.status).toBe(200);
    expect(listed.body.data.total).toBeGreaterThan(0);
    const target = listed.body.data.items.find(
      (item: { roleScope: string; status: string }) => item.roleScope === "APPROVAL_AUTHORITY" && item.status === "ACTIVE"
    );
    expect(Boolean(target)).toBe(true);

    const revoked = await api(`/api/v1/service-wallets/${target.id}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: "REVOKED",
        reason: "Kiểm thử thu hồi quyền ví công vụ"
      })
    });
    expect(revoked.response.status).toBe(200);
    expect(revoked.body.data.status).toBe("REVOKED");
    expect(Boolean(revoked.body.data.revokedAt)).toBe(true);

    const reactivated = await api(`/api/v1/service-wallets/${target.id}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: "ACTIVE",
        reason: "Khôi phục quyền ví công vụ sau kiểm thử"
      })
    });
    expect(reactivated.response.status).toBe(200);
    expect(reactivated.body.data.status).toBe("ACTIVE");
  });

  it("rejects non-admin access to service wallet governance endpoints", async () => {
    const approvalToken = await login("approval@urbanchain.vn");
    const listed = await api("/api/v1/service-wallets", {
      headers: {
        Authorization: `Bearer ${approvalToken}`
      }
    });
    expect(listed.response.status).toBe(403);
  });

  it("returns blockchain-sync candidates for officer by role/network/status", async () => {
    const approvalToken = await login("approval@urbanchain.vn");
    const candidates = await api("/api/v1/registrations/reg_demo_001/blockchain-sync/candidates", {
      headers: {
        Authorization: `Bearer ${approvalToken}`
      }
    });
    expect(candidates.response.status).toBe(200);
    expect(Array.isArray(candidates.body.data.items)).toBe(true);
    for (const item of candidates.body.data.items as Array<{ roleScope: string; status: string }>) {
      expect(item.roleScope).toBe("APPROVAL_AUTHORITY");
      expect(item.status).toBe("ACTIVE");
    }
  });

  it("rejects roleScope ADMIN when granting service wallet authorization", async () => {
    const adminToken = await login("admin@urbanchain.vn");
    const listed = await api("/api/v1/service-wallets?status=ACTIVE", {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    expect(listed.response.status).toBe(200);
    const target = listed.body.data.items[0];
    expect(Boolean(target)).toBe(true);

    const createWithAdminRole = await api("/api/v1/service-wallets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        walletId: target.walletId,
        roleScope: "ADMIN"
      })
    });
    expect(createWithAdminRole.response.status).toBe(400);
  });
});
