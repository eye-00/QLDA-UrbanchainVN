import { expect } from "chai";
import { ethers } from "hardhat";

describe("UrbanLandRegistry", function () {
  it("registers land and records a transfer", async function () {
    const [admin, citizen1, citizen2] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("UrbanLandRegistry");
    const contract = await Factory.deploy(admin.address);
    await contract.waitForDeployment();

    await contract.registerLand(
      "REG-001",
      "LAND-001",
      ethers.keccak256(ethers.toUtf8Bytes("parcel-001")),
      ethers.keccak256(ethers.toUtf8Bytes("owner-001")),
      "bafy-land-doc-001",
      ethers.keccak256(ethers.toUtf8Bytes("dochash-001")),
      "ipfs://metadata/001",
      2,
      citizen1.address
    );

    const record = await contract.getLandRecord(1);
    expect(record.landCode).to.equal("LAND-001");
    expect(await contract.ownerOf(1)).to.equal(citizen1.address);

    await contract.recordTransfer(
      "TRF-001",
      1,
      ethers.keccak256(ethers.toUtf8Bytes("owner-001")),
      ethers.keccak256(ethers.toUtf8Bytes("owner-002")),
      "bafy-transfer-doc-001",
      ethers.keccak256(ethers.toUtf8Bytes("dochash-002")),
      citizen2.address
    );

    expect(await contract.ownerOf(1)).to.equal(citizen2.address);
  });
});
