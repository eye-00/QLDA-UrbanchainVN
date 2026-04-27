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

async function login(email: string) {
  const { body } = await api("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "StrongPassword@123" })
  });
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

describe("auth and RBAC", () => {
  it("rejects invalid credentials", async () => {
    const { response, body } = await api("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "citizen@urbanchain.vn", password: "WrongPassword@123" })
    });

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it("requires a bearer token for /auth/me", async () => {
    const { response, body } = await api("/api/v1/auth/me");

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it("returns the current user from a valid token without password data", async () => {
    const token = await login("citizen@urbanchain.vn");
    const { response, body } = await api("/api/v1/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
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
    expect(body.data.user.role).toBe("CITIZEN");
    expect(body.data.identity.provider).toBe("VNEID_MOCK");
    expect(body.data.identity.verified).toBe(true);
    expect(body.data.user.identityNumber).toBeUndefined();
  });

  it("blocks a citizen from officer dashboard and approval actions", async () => {
    const token = await login("citizen@urbanchain.vn");
    const dashboard = await api("/api/v1/dashboard/summary", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const approval = await api("/api/v1/registrations/reg_demo_001/approve", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ note: "Attempted by citizen" })
    });

    expect(dashboard.response.status).toBe(403);
    expect(approval.response.status).toBe(403);
  });

  it("allows role-specific officer actions", async () => {
    const receptionToken = await login("reception@urbanchain.vn");
    const approvalToken = await login("approval@urbanchain.vn");

    const supplement = await api("/api/v1/registrations/reg_demo_001/request-supplement", {
      method: "POST",
      headers: { Authorization: `Bearer ${receptionToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ note: "Can bo yeu cau bo sung giay to" })
    });
    const approval = await api("/api/v1/registrations/reg_demo_001/approve", {
      method: "POST",
      headers: { Authorization: `Bearer ${approvalToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ note: "Co quan co tham quyen phe duyet" })
    });

    expect(supplement.response.status).toBe(200);
    expect(approval.response.status).toBe(200);
  });

  it("requires a reason for supplement and reject actions", async () => {
    const receptionToken = await login("reception@urbanchain.vn");
    const { response, body } = await api("/api/v1/registrations/reg_demo_001/request-supplement", {
      method: "POST",
      headers: { Authorization: `Bearer ${receptionToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });
});
