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
  return api("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
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

describe("auth and RBAC", () => {
  it("rejects invalid credentials", async () => {
    const { response, body } = await login("citizen@urbanchain.vn", "WrongPassword@123");
    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it("blocks privilege escalation in public register", async () => {
    const suffix = Date.now().toString();
    const { response, body } = await api("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Escalation attempt",
        email: `escalate.${suffix}@urbanchain.vn`,
        password: "StrongPassword@123",
        role: "ADMIN"
      })
    });

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
  });

  it("requires a bearer token for /auth/me", async () => {
    const { response, body } = await api("/api/v1/auth/me");
    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it("returns the current user from a valid token without password data", async () => {
    const loginResult = await login("citizen@urbanchain.vn");
    expect(loginResult.response.status).toBe(200);

    const { response, body } = await api("/api/v1/auth/me", {
      headers: { Authorization: `Bearer ${loginResult.body.data.accessToken}` }
    });

    expect(response.status).toBe(200);
    expect(body.data.email).toBe("citizen@urbanchain.vn");
    expect(body.data.role).toBe("CITIZEN");
    expect(body.data.password).toBeUndefined();
  });

  it("supports mock VNeID login for Sprint 1 citizen identity flow", async () => {
    const { response, body } = await api("/api/v1/auth/vneid/mock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identityNumber: "0482xxxxxxx" })
    });

    expect(response.status).toBe(200);
    expect(body.data.accessToken).toBeTruthy();
    expect(body.data.refreshToken).toBeTruthy();
    expect(body.data.user.role).toBe("CITIZEN");
    expect(body.data.identity.provider).toBe("VNEID_MOCK");
    expect(body.data.identity.verified).toBe(true);
    expect(body.data.user.identityNumber).toBeUndefined();
  });

  it("locks account after repeated failed logins", async () => {
    const suffix = Date.now().toString();
    const email = `lock.test.${suffix}@urbanchain.vn`;

    const created = await api("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Lock Test",
        email,
        password: "StrongPassword@123",
        role: "CITIZEN"
      })
    });
    expect(created.response.status).toBe(201);

    for (let index = 0; index < 5; index += 1) {
      const failed = await login(email, "WrongPassword@123");
      expect(failed.response.status).toBe(400);
    }

    const locked = await login(email, "StrongPassword@123");
    expect(locked.response.status).toBe(400);
    expect(String(locked.body.message)).toContain("locked");
  });

  it("supports refresh and logout session lifecycle", async () => {
    const loginResult = await login("citizen@urbanchain.vn");
    expect(loginResult.response.status).toBe(200);

    const refreshResult = await api("/api/v1/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: loginResult.body.data.refreshToken })
    });
    expect(refreshResult.response.status).toBe(200);
    expect(refreshResult.body.data.accessToken).toBeTruthy();
    expect(refreshResult.body.data.refreshToken).toBeTruthy();

    const reuseOldRefreshToken = await api("/api/v1/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: loginResult.body.data.refreshToken })
    });
    expect(reuseOldRefreshToken.response.status).toBe(401);

    const logoutResult = await api("/api/v1/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${refreshResult.body.data.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refreshToken: refreshResult.body.data.refreshToken })
    });
    expect(logoutResult.response.status).toBe(200);
    expect(logoutResult.body.data.revokedSessions).toBe(1);

    const refreshAfterLogout = await api("/api/v1/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refreshResult.body.data.refreshToken })
    });
    expect(refreshAfterLogout.response.status).toBe(401);
  });

  it("supports password reset request/confirm and blocks old password", async () => {
    const suffix = Date.now().toString();
    const email = `reset.user.${suffix}@urbanchain.vn`;
    const createUser = await api("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Reset User",
        email,
        password: "StrongPassword@123",
        role: "CITIZEN"
      })
    });
    expect(createUser.response.status).toBe(201);

    const request = await api("/api/v1/auth/password/reset-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    expect(request.response.status).toBe(200);
    expect(request.body.data.accepted).toBe(true);
    expect(request.body.data.resetToken).toBeTruthy();

    const confirm = await api("/api/v1/auth/password/reset-confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        token: request.body.data.resetToken,
        newPassword: "NewStrongPassword@123"
      })
    });
    expect(confirm.response.status).toBe(200);

    const oldPasswordLogin = await login(email, "StrongPassword@123");
    expect(oldPasswordLogin.response.status).toBe(400);

    const newPasswordLogin = await login(email, "NewStrongPassword@123");
    expect(newPasswordLogin.response.status).toBe(200);
  });

  it("blocks a citizen from officer approval actions", async () => {
    const citizenLogin = await login("citizen@urbanchain.vn", "StrongPassword@123");
    const approval = await api("/api/v1/registrations/reg_demo_001/approve", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${citizenLogin.body.data.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ note: "Attempted by citizen" })
    });

    expect(approval.response.status).toBe(403);
  });

  it("enforces ownership scope for registrations, transfers, and files", async () => {
    const suffix = Date.now().toString();
    const citizen2Email = `citizen.scope.${suffix}@urbanchain.vn`;

    const registerCitizen2 = await api("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Scope Citizen",
        email: citizen2Email,
        password: "StrongPassword@123",
        role: "CITIZEN"
      })
    });
    expect(registerCitizen2.response.status).toBe(201);

    const citizen1Login = await login("citizen@urbanchain.vn", "StrongPassword@123");
    const citizen2Login = await login(citizen2Email);
    expect(citizen1Login.response.status).toBe(200);
    expect(citizen2Login.response.status).toBe(200);

    const transferCreated = await api("/api/v1/transfers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${citizen1Login.body.data.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        landCode: "LAND-DEMO-001",
        toUserRef: "Nguoi mua demo",
        supportingFileIds: ["fil_demo_001"]
      })
    });
    expect(transferCreated.response.status).toBe(201);
    const transferId = transferCreated.body.data.transferRequestId as string;

    const registrationForbidden = await api("/api/v1/registrations/reg_demo_001", {
      headers: { Authorization: `Bearer ${citizen2Login.body.data.accessToken}` }
    });
    expect(registrationForbidden.response.status).toBe(403);

    const transferForbidden = await api(`/api/v1/transfers/${transferId}`, {
      headers: { Authorization: `Bearer ${citizen2Login.body.data.accessToken}` }
    });
    expect(transferForbidden.response.status).toBe(403);

    const fileForbidden = await api("/api/v1/files/fil_demo_001", {
      headers: { Authorization: `Bearer ${citizen2Login.body.data.accessToken}` }
    });
    expect(fileForbidden.response.status).toBe(403);
  });

  it("allows compliance/admin roles to read audit logs", async () => {
    const adminLogin = await login("admin@urbanchain.vn");
    expect(adminLogin.response.status).toBe(200);
    const citizenLogin = await login("citizen@urbanchain.vn");
    expect(citizenLogin.response.status).toBe(200);

    const adminAudit = await api("/api/v1/audit/access-logs?page=1&pageSize=10", {
      headers: { Authorization: `Bearer ${adminLogin.body.data.accessToken}` }
    });
    expect(adminAudit.response.status).toBe(200);
    expect(Array.isArray(adminAudit.body.data.items)).toBe(true);

    const citizenAudit = await api("/api/v1/audit/access-logs?page=1&pageSize=10", {
      headers: { Authorization: `Bearer ${citizenLogin.body.data.accessToken}` }
    });
    expect(citizenAudit.response.status).toBe(403);
  });
});
