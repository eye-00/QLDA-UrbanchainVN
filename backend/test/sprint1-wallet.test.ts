import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Server } from "node:http";
import { Wallet } from "ethers";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

let server: Server;
let baseUrl: string;

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

  const result = await api("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginType, identifier, password })
  });

  expect(result.response.status).toBe(200);
  return result.body.data.accessToken as string;
}

async function registerCitizen(email: string) {
  const result = await api("/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Wallet Test User",
      email,
      password: "StrongPassword@123",
      role: "CITIZEN"
    })
  });
  expect(result.response.status).toBe(201);
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

describe("Sprint 1 wallet ownership verification (US-547..558)", () => {
  it("connects wallet, creates challenge, verifies signature and sets default", async () => {
    const token = await login("citizen@urbanchain.vn");
    const signer = Wallet.createRandom();

    const connected = await api("/api/v1/wallets/connect", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        address: signer.address,
        network: "SEPOLIA"
      })
    });
    expect(connected.response.status).toBe(201);
    expect(connected.body.data.status).toBe("PENDING_VERIFICATION");

    const walletId = connected.body.data.id as string;
    const challenge = await api(`/api/v1/wallets/${walletId}/challenge`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    expect(challenge.response.status).toBe(200);
    expect(challenge.body.data.message).toContain("UrbanChain-VN Wallet Verification");

    const signature = await signer.signMessage(challenge.body.data.message as string);
    const verified = await api(`/api/v1/wallets/${walletId}/verify`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ signature })
    });
    expect(verified.response.status).toBe(200);
    expect(verified.body.data.status).toBe("VERIFIED");

    const setDefault = await api(`/api/v1/wallets/${walletId}/default`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });
    expect(setDefault.response.status).toBe(200);
    expect(setDefault.body.data.isDefault).toBe(true);

    const listing = await api("/api/v1/wallets/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(listing.response.status).toBe(200);
    expect(listing.body.data.total).toBeGreaterThan(0);
    expect(listing.body.data.items.some((item: { id: string }) => item.id === walletId)).toBe(true);
  });

  it("rejects invalid EVM address and unverified default wallet", async () => {
    const token = await login("citizen@urbanchain.vn");

    const invalidAddress = await api("/api/v1/wallets/connect", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        address: "not-an-address",
        network: "SEPOLIA"
      })
    });
    expect(invalidAddress.response.status).toBe(400);

    const signer = Wallet.createRandom();
    const connected = await api("/api/v1/wallets/connect", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        address: signer.address,
        network: "HARDHAT"
      })
    });
    expect(connected.response.status).toBe(201);

    const setDefault = await api(`/api/v1/wallets/${connected.body.data.id as string}/default`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });
    expect(setDefault.response.status).toBe(400);
  });

  it("rejects wrong signature and blocks cross-user wallet access", async () => {
    const token = await login("citizen@urbanchain.vn");
    const ownerWallet = Wallet.createRandom();
    const wrongWallet = Wallet.createRandom();

    const connected = await api("/api/v1/wallets/connect", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        address: ownerWallet.address,
        network: "GANACHE"
      })
    });
    expect(connected.response.status).toBe(201);
    const walletId = connected.body.data.id as string;

    const challenge = await api(`/api/v1/wallets/${walletId}/challenge`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    expect(challenge.response.status).toBe(200);
    const wrongSignature = await wrongWallet.signMessage(challenge.body.data.message as string);

    const verifyFailed = await api(`/api/v1/wallets/${walletId}/verify`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ signature: wrongSignature })
    });
    expect(verifyFailed.response.status).toBe(400);

    const email = `wallet.scope.${Date.now()}@urbanchain.vn`;
    await registerCitizen(email);
    const token2 = await login(email);

    const foreignAccess = await api(`/api/v1/wallets/${walletId}/challenge`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token2}`,
        "Content-Type": "application/json"
      }
    });
    expect(foreignAccess.response.status).toBe(403);
  });

  it("prevents duplicate wallet address on the same network across users", async () => {
    const token = await login("citizen@urbanchain.vn");
    const signer = Wallet.createRandom();

    const connected = await api("/api/v1/wallets/connect", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        address: signer.address,
        network: "SEPOLIA"
      })
    });
    expect(connected.response.status).toBe(201);

    const secondEmail = `wallet.dup.${Date.now()}@urbanchain.vn`;
    await registerCitizen(secondEmail);
    const token2 = await login(secondEmail);

    const duplicate = await api("/api/v1/wallets/connect", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token2}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        address: signer.address,
        network: "SEPOLIA"
      })
    });
    expect(duplicate.response.status).toBe(409);
  });
});
