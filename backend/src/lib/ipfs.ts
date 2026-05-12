import { createHash } from "node:crypto";

export type IpfsUploadResult = {
  cid: string;
  hash: string;
  provider: "mock" | "pinata" | "local";
};

type UploadInput = {
  buffer: Buffer;
  fileName: string;
  contentType?: string;
};

const PINATA_ENDPOINT = "https://api.pinata.cloud/pinning/pinFileToIPFS";

function computeHexHash(buffer: Buffer) {
  return `0x${createHash("sha256").update(buffer).digest("hex")}`;
}

function getUploadMode() {
  return (process.env.IPFS_UPLOAD_MODE ?? "mock").toLowerCase();
}

export async function uploadToIpfs(input: UploadInput): Promise<IpfsUploadResult> {
  const contentType = input.contentType ?? "application/octet-stream";
  const bytes = new Uint8Array(input.buffer.byteLength);
  bytes.set(input.buffer);
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: contentType }), input.fileName);

  const hash = computeHexHash(input.buffer);
  const mode = getUploadMode();

  if (mode === "pinata") {
    const jwt = process.env.PINATA_JWT;
    if (!jwt) throw new Error("PINATA_JWT is required when IPFS_UPLOAD_MODE=pinata");

    const response = await fetch(PINATA_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`
      },
      body: form
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata upload failed: ${response.status} ${errorText}`);
    }

    const payload = (await response.json()) as { IpfsHash?: string };
    if (!payload.IpfsHash) throw new Error("Pinata response missing IpfsHash");

    return {
      cid: payload.IpfsHash,
      hash,
      provider: "pinata"
    };
  }

  if (mode === "local") {
    const baseUrl = process.env.IPFS_API_URL ?? "http://localhost:5001";
    const endpoint = `${baseUrl.replace(/\/+$/, "")}/api/v0/add`;
    const response = await fetch(endpoint, {
      method: "POST",
      body: form
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Local IPFS upload failed: ${response.status} ${errorText}`);
    }

    const payload = (await response.json()) as { Hash?: string };
    if (!payload.Hash) throw new Error("Local IPFS response missing Hash");

    return {
      cid: payload.Hash,
      hash,
      provider: "local"
    };
  }

  return {
    cid: `bafy-mock-${Date.now()}`,
    hash,
    provider: "mock"
  };
}
