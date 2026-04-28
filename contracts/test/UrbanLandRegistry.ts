import { expect } from "chai";
import { ethers } from "hardhat";

describe("UrbanLandRegistry", function () {
  const ACTIVE_STATUS = 2;
  const hash = (value: string) => ethers.keccak256(ethers.toUtf8Bytes(value));

  async function deployFixture() {
    const [admin, citizen1, citizen2, outsider] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("UrbanLandRegistry");
    const contract = await Factory.deploy(admin.address);
    await contract.waitForDeployment();
    return { contract, admin, citizen1, citizen2, outsider };
  }

  async function registerDefaultLand(
    contract: any,
    owner: string,
    registrationCode = "REG-001",
    landCode = "LAND-001"
  ) {
    await contract.registerLand(
      registrationCode,
      landCode,
      hash(`parcel-${registrationCode}`),
      hash(`owner-${registrationCode}`),
      `bafy-land-doc-${registrationCode}`,
      hash(`dochash-${registrationCode}`),
      `ipfs://metadata/${registrationCode}`,
      ACTIVE_STATUS,
      owner
    );
  }

  it("registers land and records transfer via business function", async function () {
    const { contract, citizen1, citizen2 } = await deployFixture();

    await registerDefaultLand(contract, citizen1.address);

    await contract.recordTransfer(
      "TRF-001",
      1,
      hash("owner-REG-001"),
      hash("owner-002"),
      "bafy-transfer-doc-001",
      hash("dochash-trf-001"),
      citizen2.address
    );

    expect(await contract.ownerOf(1)).to.equal(citizen2.address);
  });

  it("blocks public approve and transfer functions to prevent bypass", async function () {
    const { contract, citizen1, citizen2 } = await deployFixture();
    await registerDefaultLand(contract, citizen1.address);

    await expect(contract.connect(citizen1).approve(citizen2.address, 1)).to.be.revertedWith("approve disabled");
    await expect(contract.connect(citizen1).setApprovalForAll(citizen2.address, true)).to.be.revertedWith("approve disabled");
    await expect(contract.connect(citizen1).transferFrom(citizen1.address, citizen2.address, 1)).to.be.revertedWith("direct transfer disabled");
    await expect(contract.connect(citizen1)["safeTransferFrom(address,address,uint256)"](citizen1.address, citizen2.address, 1)).to.be.revertedWith("direct transfer disabled");
    await expect(
      contract.connect(citizen1)["safeTransferFrom(address,address,uint256,bytes)"](
        citizen1.address,
        citizen2.address,
        1,
        "0x"
      )
    ).to.be.revertedWith("direct transfer disabled");
  });

  it("rejects role violations for register and transfer", async function () {
    const { contract, citizen1, citizen2, outsider } = await deployFixture();

    await expect(
      contract.connect(outsider).registerLand(
        "REG-ROLE-FAIL",
        "LAND-ROLE-FAIL",
        hash("parcel-role"),
        hash("owner-role"),
        "bafy-role",
        hash("dochash-role"),
        "ipfs://metadata/role",
        ACTIVE_STATUS,
        citizen1.address
      )
    ).to.be.revertedWithCustomError(contract, "AccessControlUnauthorizedAccount");

    await registerDefaultLand(contract, citizen1.address);

    await expect(
      contract.connect(outsider).recordTransfer(
        "TRF-ROLE-FAIL",
        1,
        hash("owner-REG-001"),
        hash("owner-role-2"),
        "bafy-transfer-role",
        hash("dochash-transfer-role"),
        citizen2.address
      )
    ).to.be.revertedWithCustomError(contract, "AccessControlUnauthorizedAccount");
  });

  it("enforces pause on register and business transfer path", async function () {
    const { contract, citizen1, citizen2 } = await deployFixture();

    await registerDefaultLand(contract, citizen1.address);
    await contract.pause();

    await expect(
      contract.registerLand(
        "REG-PAUSED",
        "LAND-PAUSED",
        hash("parcel-paused"),
        hash("owner-paused"),
        "bafy-paused",
        hash("dochash-paused"),
        "ipfs://metadata/paused",
        ACTIVE_STATUS,
        citizen1.address
      )
    ).to.be.revertedWithCustomError(contract, "EnforcedPause");

    await expect(
      contract.recordTransfer(
        "TRF-PAUSED",
        1,
        hash("owner-REG-001"),
        hash("owner-paused-2"),
        "bafy-transfer-paused",
        hash("dochash-transfer-paused"),
        citizen2.address
      )
    ).to.be.revertedWithCustomError(contract, "EnforcedPause");
  });

  it("rejects duplicate registration and active landCode reuse", async function () {
    const { contract, citizen1, citizen2 } = await deployFixture();

    await registerDefaultLand(contract, citizen1.address, "REG-DUP-1", "LAND-DUP-1");

    await expect(registerDefaultLand(contract, citizen2.address, "REG-DUP-1", "LAND-DUP-2")).to.be.revertedWith(
      "registration already used"
    );

    await expect(registerDefaultLand(contract, citizen2.address, "REG-DUP-2", "LAND-DUP-1")).to.be.revertedWith(
      "landCode already active"
    );
  });

  it("rejects replay transferCode and invalid transfer payload", async function () {
    const { contract, citizen1, citizen2 } = await deployFixture();
    await registerDefaultLand(contract, citizen1.address);

    await expect(
      contract.recordTransfer(
        "",
        1,
        hash("owner-REG-001"),
        hash("owner-invalid"),
        "bafy-transfer-invalid",
        hash("dochash-invalid"),
        citizen2.address
      )
    ).to.be.revertedWith("transferCode required");

    await expect(
      contract.recordTransfer(
        "TRF-INVALID-HASH",
        1,
        hash("owner-REG-001"),
        hash("owner-invalid"),
        "bafy-transfer-invalid",
        ethers.ZeroHash,
        citizen2.address
      )
    ).to.be.revertedWith("supportingHash required");

    await contract.recordTransfer(
      "TRF-REPLAY-001",
      1,
      hash("owner-REG-001"),
      hash("owner-002"),
      "bafy-transfer-replay",
      hash("dochash-replay"),
      citizen2.address
    );

    await expect(
      contract.recordTransfer(
        "TRF-REPLAY-001",
        1,
        hash("owner-002"),
        hash("owner-003"),
        "bafy-transfer-replay-2",
        hash("dochash-replay-2"),
        citizen1.address
      )
    ).to.be.revertedWith("transfer code used");
  });

  it("rejects invalid register inputs", async function () {
    const { contract, citizen1 } = await deployFixture();

    await expect(
      contract.registerLand(
        "REG-INVALID-1",
        "LAND-INVALID-1",
        hash("parcel-invalid"),
        hash("owner-invalid"),
        "bafy-invalid",
        ethers.ZeroHash,
        "ipfs://metadata/invalid",
        ACTIVE_STATUS,
        citizen1.address
      )
    ).to.be.revertedWith("documentHash required");

    await expect(
      contract.registerLand(
        "REG-INVALID-2",
        "LAND-INVALID-2",
        ethers.ZeroHash,
        hash("owner-invalid"),
        "bafy-invalid",
        hash("dochash-invalid"),
        "ipfs://metadata/invalid",
        ACTIVE_STATUS,
        citizen1.address
      )
    ).to.be.revertedWith("parcelRef required");

    await expect(
      contract.registerLand(
        "REG-INVALID-3",
        "LAND-INVALID-3",
        hash("parcel-invalid"),
        ethers.ZeroHash,
        "bafy-invalid",
        hash("dochash-invalid"),
        "ipfs://metadata/invalid",
        ACTIVE_STATUS,
        citizen1.address
      )
    ).to.be.revertedWith("ownerRef required");
  });
});
