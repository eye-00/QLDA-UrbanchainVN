import { describe, expect, it } from "vitest";
import { buildOwnerRef, buildParcelRef, mintRegistrationRecord } from "../src/lib/blockchain/urban-land-registry.client.js";

describe("Sprint 4 blockchain client helpers", () => {
  it("builds deterministic parcel/owner refs", () => {
    const parcelRefA = buildParcelRef({
      provinceCode: "48",
      communeName: "Hoa Khanh",
      mapSheetNumber: "05",
      parcelNumber: "123"
    });
    const parcelRefB = buildParcelRef({
      provinceCode: "48",
      communeName: "Hoa Khanh",
      mapSheetNumber: "05",
      parcelNumber: "123"
    });
    const ownerRef = buildOwnerRef({
      ownerIdentityNumber: "0482xxxxxxx",
      applicantId: "usr_001"
    });

    expect(parcelRefA).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(parcelRefA).toBe(parcelRefB);
    expect(ownerRef).toMatch(/^0x[a-fA-F0-9]{64}$/);
  });

  it("returns synthetic tx in mock mode", async () => {
    process.env.BLOCKCHAIN_SYNC_MODE = "mock";
    const result = await mintRegistrationRecord({
      registrationCode: "REG-S4-001",
      landCode: "LAND-S4-001",
      provinceCode: "48",
      communeName: "Hoa Khanh",
      mapSheetNumber: "05",
      parcelNumber: "123",
      ownerIdentityNumber: "0482xxxxxxx",
      applicantId: "usr_001",
      documentCid: "bafyreg001",
      metadataHash: "0xabc123"
    });

    expect(result.mode).toBe("mock");
    expect(result.txHash).toMatch(/^0x[a-fA-F0-9]+chain$/);
    expect(result.tokenId).toBeNull();
    expect(result.contractAddress).toBeNull();
  });
});
