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

describe("Sprint 2 user, organization, land and dashboard", () => {
  it("admin can create/update/lock user and locked user can no longer login", async () => {
    const adminToken = await login("admin@urbanchain.vn");
    const suffix = Date.now().toString();
    const email = `s2.user.${suffix}@urbanchain.vn`;

    const createdUser = await api("/api/v1/users", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fullName: "Sprint 2 User",
        email,
        password: "StrongPassword@123",
        role: "RECEPTION_OFFICER"
      })
    });
    expect(createdUser.response.status).toBe(201);
    const userId = createdUser.body.data.userId as string;

    const updatedUser = await api(`/api/v1/users/${userId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ fullName: "Sprint 2 User Updated" })
    });
    expect(updatedUser.response.status).toBe(200);
    expect(updatedUser.body.data.fullName).toBe("Sprint 2 User Updated");

    const lockResult = await api(`/api/v1/users/${userId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: "LOCKED" })
    });
    expect(lockResult.response.status).toBe(200);
    expect(lockResult.body.data.status).toBe("LOCKED");

    const lockedLogin = await api("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "StrongPassword@123" })
    });
    expect(lockedLogin.response.status).toBe(400);
    expect(lockedLogin.body.success).toBe(false);
  });

  it("supports organization CRUD, user assignment and organization filter", async () => {
    const adminToken = await login("admin@urbanchain.vn");
    const suffix = Date.now().toString();
    const code = `ORG-S2-${suffix}`;
    const email = `s2.org.user.${suffix}@urbanchain.vn`;

    const createOrg = await api("/api/v1/organizations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code,
        name: "Organization Sprint 2"
      })
    });
    expect(createOrg.response.status).toBe(201);
    const organizationId = createOrg.body.data.id as string;

    const createUser = await api("/api/v1/users", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fullName: "Organization User",
        email,
        password: "StrongPassword@123",
        role: "LAND_REGISTRY_OFFICER",
        organizationId
      })
    });
    expect(createUser.response.status).toBe(201);

    const listByOrg = await api(`/api/v1/users?organizationId=${encodeURIComponent(organizationId)}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(listByOrg.response.status).toBe(200);
    expect(listByOrg.body.data.items.some((item: { email: string }) => item.email === email)).toBe(true);

    const updateOrg = await api(`/api/v1/organizations/${organizationId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: "Organization Sprint 2 Updated" })
    });
    expect(updateOrg.response.status).toBe(200);
    expect(updateOrg.body.data.name).toBe("Organization Sprint 2 Updated");

    const deactivateOrg = await api(`/api/v1/organizations/${organizationId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(deactivateOrg.response.status).toBe(200);
    expect(deactivateOrg.body.data.isActive).toBe(false);
  });

  it("supports land create/update/list and returns 409 for duplicate parcel key", async () => {
    const officerToken = await login("registry@urbanchain.vn");
    const suffix = Date.now().toString();
    const parcelCode = `LAND-S2-${suffix}`;

    const createLand = await api("/api/v1/lands", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${officerToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        parcelCode,
        provinceCode: "48",
        communeName: "Hoa Khanh",
        mapSheetNumber: "07",
        parcelNumber: "777",
        area: 90.5,
        landUsePurpose: "ODT",
        address: "Test address"
      })
    });
    expect(createLand.response.status).toBe(201);
    const landId = createLand.body.data.id as string;

    const updateLand = await api(`/api/v1/lands/${landId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${officerToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ area: 95.75 })
    });
    expect(updateLand.response.status).toBe(200);
    expect(updateLand.body.data.area).toBe(95.75);

    const listLand = await api(`/api/v1/lands?keyword=${encodeURIComponent(parcelCode)}`, {
      headers: { Authorization: `Bearer ${officerToken}` }
    });
    expect(listLand.response.status).toBe(200);
    expect(listLand.body.data.total).toBeGreaterThan(0);

    const duplicateLand = await api("/api/v1/lands", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${officerToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        parcelCode,
        provinceCode: "48",
        communeName: "Hoa Khanh",
        mapSheetNumber: "08",
        parcelNumber: "888",
        area: 80,
        landUsePurpose: "ODT",
        address: "Duplicate key test"
      })
    });
    expect(duplicateLand.response.status).toBe(409);
    expect(duplicateLand.body.success).toBe(false);
  });

  it("supports file integrity check for uploaded legal documents", async () => {
    const citizenToken = await login("citizen@urbanchain.vn");
    const formData = new FormData();
    formData.set("documentType", "LAND_CERT_SUPPORT");
    formData.set("ownerType", "USER");
    formData.set("originalName", `integrity-${Date.now()}.pdf`);
    formData.set("file", new Blob(["demo"], { type: "application/pdf" }), "integrity.pdf");

    const uploaded = await api("/api/v1/files/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${citizenToken}`
      },
      body: formData
    });

    expect(uploaded.response.status).toBe(201);
    const fileId = uploaded.body.data.id as string;

    const integrity = await api(`/api/v1/files/${fileId}/integrity`, {
      headers: {
        Authorization: `Bearer ${citizenToken}`
      }
    });

    expect(integrity.response.status).toBe(200);
    expect(integrity.body.data.fileId).toBe(fileId);
    expect(integrity.body.data.isValid).toBe(true);
    expect(integrity.body.data.checks.hasCid).toBe(true);
    expect(integrity.body.data.checks.hasHash).toBe(true);
  });

  it("returns role-based dashboard summary payload", async () => {
    const adminToken = await login("admin@urbanchain.vn");
    const citizenToken = await login("citizen@urbanchain.vn");

    const adminSummary = await api("/api/v1/dashboard/summary", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(adminSummary.response.status).toBe(200);
    expect(adminSummary.body.data.role).toBe("ADMIN");
    expect(adminSummary.body.data.summary.users.total).toBeGreaterThan(0);

    const citizenSummary = await api("/api/v1/dashboard/summary", {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    expect(citizenSummary.response.status).toBe(200);
    expect(citizenSummary.body.data.role).toBe("CITIZEN");
    expect(citizenSummary.body.data.summary.registrations).toBeTruthy();
  });

  it("keeps error envelope for validation, forbidden, conflict and not found", async () => {
    const adminToken = await login("admin@urbanchain.vn");
    const citizenToken = await login("citizen@urbanchain.vn");
    const suffix = Date.now().toString();
    const code = `ORG-ERR-${suffix}`;

    const validationError = await api("/api/v1/users", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });
    expect(validationError.response.status).toBe(400);
    expect(validationError.body.success).toBe(false);
    expect(Array.isArray(validationError.body.errors)).toBe(true);

    const forbiddenError = await api("/api/v1/users", {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    expect(forbiddenError.response.status).toBe(403);
    expect(forbiddenError.body.success).toBe(false);

    const createOrg = await api("/api/v1/organizations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ code, name: "Conflict Org" })
    });
    expect(createOrg.response.status).toBe(201);

    const duplicateOrg = await api("/api/v1/organizations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ code, name: "Conflict Org 2" })
    });
    expect(duplicateOrg.response.status).toBe(409);
    expect(duplicateOrg.body.success).toBe(false);

    const notFound = await api("/api/v1/users/non-existing-user/status", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: "LOCKED" })
    });
    expect(notFound.response.status).toBe(404);
    expect(notFound.body.success).toBe(false);
  });
});
