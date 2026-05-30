import { BlockchainNetwork, Prisma, PrismaClient, WalletStatus, AccountType } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendEnvPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".env");
dotenv.config({ path: backendEnvPath });

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function seedOrganizations() {
  const organizations = [
    { code: "ORG-RECEPTION", name: "Bộ phận tiếp nhận", description: "Đơn vị tiếp nhận hồ sơ" },
    { code: "ORG-LAND", name: "Chi nhánh VPĐKĐĐ", description: "Đơn vị thẩm định chuyên môn" },
    { code: "ORG-APPROVAL", name: "Cơ quan phê duyệt", description: "Đơn vị ký cấp kết quả" }
  ];

  for (const org of organizations) {
    await prisma.organization.upsert({
      where: { code: org.code },
      update: org,
      create: org
    });
  }
}

async function seedUsers() {
  const receptionOrg = await prisma.organization.findUniqueOrThrow({ where: { code: "ORG-RECEPTION" } });
  const landOrg = await prisma.organization.findUniqueOrThrow({ where: { code: "ORG-LAND" } });
  const approvalOrg = await prisma.organization.findUniqueOrThrow({ where: { code: "ORG-APPROVAL" } });

  const users = [
    {
      email: "citizen@urbanchain.vn",
      fullName: "Nguyễn Văn A",
      role: "CITIZEN" as const,
      identityNumber: "048183746143",
      organizationId: null as string | null
    },
    {
      email: "reception@urbanchain.vn",
      fullName: "Cán bộ tiếp nhận",
      role: "RECEPTION_OFFICER" as const,
      identityNumber: null,
      organizationId: receptionOrg.id
    },
    {
      email: "registry@urbanchain.vn",
      fullName: "Cán bộ VPĐKĐĐ",
      role: "LAND_REGISTRY_OFFICER" as const,
      identityNumber: null,
      organizationId: landOrg.id
    },
    {
      email: "approval@urbanchain.vn",
      fullName: "Cán bộ phê duyệt",
      role: "APPROVAL_AUTHORITY" as const,
      identityNumber: null,
      organizationId: approvalOrg.id
    },
    {
      email: "tax@urbanchain.vn",
      fullName: "Cán bộ thuế",
      role: "TAX_OFFICER" as const,
      identityNumber: null,
      organizationId: approvalOrg.id
    },
    {
      email: "auditor@urbanchain.vn",
      fullName: "Cán bộ kiểm soát",
      role: "AUDITOR" as const,
      identityNumber: null,
      organizationId: approvalOrg.id
    },
    {
      email: "admin@urbanchain.vn",
      fullName: "Quản trị hệ thống",
      role: "ADMIN" as const,
      identityNumber: null,
      organizationId: approvalOrg.id
    }
  ];

  for (const user of users) {
    let accountType: AccountType = "CITIZEN";
    let username: string | null = null;

    if (user.role === "ADMIN") {
      accountType = "SYSTEM_ADMIN";
      username = "admin";
    } else if (user.role === "CITIZEN" || user.role === "BUSINESS") {
      accountType = "CITIZEN";
    } else {
      accountType = "STAFF";
    }

    const dbUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        fullName: user.fullName,
        role: user.role,
        accountType,
        username,
        identityNumber: user.identityNumber,
        status: "ACTIVE",
        organizationId: user.organizationId,
        passwordHash: hashPassword("StrongPassword@123")
      },
      create: {
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        accountType,
        username,
        identityNumber: user.identityNumber,
        status: "ACTIVE",
        organizationId: user.organizationId,
        passwordHash: hashPassword("StrongPassword@123")
      }
    });

    if (accountType === "CITIZEN") {
      await prisma.citizenProfile.upsert({
        where: { userId: dbUser.id },
        update: {
          citizenId: user.identityNumber || "012345678901",
          fullName: user.fullName,
          phone: "0901234567",
          address: "Đà Nẵng"
        },
        create: {
          userId: dbUser.id,
          citizenId: user.identityNumber || "012345678901",
          fullName: user.fullName,
          phone: "0901234567",
          address: "Đà Nẵng"
        }
      });
    } else if (accountType === "STAFF") {
      await prisma.staffProfile.upsert({
        where: { userId: dbUser.id },
        update: {
          staffCode: `STF_${user.role}`,
          officialUsername: user.email.split("@")[0],
          fullName: user.fullName,
          position: user.role,
          officialEmail: user.email
        },
        create: {
          userId: dbUser.id,
          staffCode: `STF_${user.role}`,
          officialUsername: user.email.split("@")[0],
          fullName: user.fullName,
          position: user.role,
          officialEmail: user.email
        }
      });
    }
  }
}

async function seedLegalProcedures() {
  const procedures = [
    {
      procedureCode: "DKDD_LANDAU_3380",
      sourceDecision: "QD_3380_2025",
      legalBasis: "QĐ 3380/2025 + NĐ 151/2025",
      level: "LIEN_THONG" as const,
      authorityActors: ["RECEPTION_OFFICER", "COMMUNE_OFFICER", "LAND_REGISTRY_OFFICER", "TAX_OFFICER", "APPROVAL_AUTHORITY"],
      requiresTaxStep: true
    },
    {
      procedureCode: "DKDD_LANDAU_DON_GIAN",
      sourceDecision: "QD_2304_2024",
      legalBasis: "QĐ 2304/2024",
      level: "TINH" as const,
      authorityActors: ["RECEPTION_OFFICER", "LAND_REGISTRY_OFFICER", "APPROVAL_AUTHORITY"],
      requiresTaxStep: false
    }
  ];

  for (const item of procedures) {
    await prisma.legalProcedure.upsert({
      where: { procedureCode: item.procedureCode },
      update: {
        sourceDecision: item.sourceDecision,
        legalBasis: item.legalBasis,
        level: item.level,
        authorityActors: item.authorityActors,
        requiresTaxStep: item.requiresTaxStep,
        isActive: true
      },
      create: {
        procedureCode: item.procedureCode,
        sourceDecision: item.sourceDecision,
        legalBasis: item.legalBasis,
        level: item.level,
        authorityActors: item.authorityActors,
        requiresTaxStep: item.requiresTaxStep
      }
    });
  }
}

async function seedRegistrationAndFile() {
  const citizen = await prisma.user.findUniqueOrThrow({
    where: { email: "citizen@urbanchain.vn" }
  });

  const registration = await prisma.registration.upsert({
    where: { code: "reg_demo_001" },
    update: {
      applicantId: citizen.id,
      provinceCode: "48",
      communeName: "Hòa Khánh",
      parcelNumber: "123",
      mapSheetNumber: "05",
      area: new Prisma.Decimal("120.50"),
      landUsePurpose: "ODT",
      address: "54 Nguyễn Lương Bằng",
      ownerType: "INDIVIDUAL",
      ownerFullName: "Nguyễn Văn A",
      ownerIdentityNumber: "0482xxxxxxx",
      ownerAddress: "Đà Nẵng",
      procedureCode: "DKDD_LANDAU_3380",
      legalBasisCode: "QĐ3380-STEP-RECEPTION",
      noteHistory: ["Hồ sơ demo đã được seed"],
      status: "CHO_TIEP_NHAN",
      ipfsCid: "bafybeigdyrzt-seed-001",
      documentHash: "0xabc001"
    },
    create: {
      id: "reg_demo_001",
      code: "reg_demo_001",
      applicantId: citizen.id,
      provinceCode: "48",
      communeName: "Hòa Khánh",
      parcelNumber: "123",
      mapSheetNumber: "05",
      area: new Prisma.Decimal("120.50"),
      landUsePurpose: "ODT",
      address: "54 Nguyễn Lương Bằng",
      ownerType: "INDIVIDUAL",
      ownerFullName: "Nguyễn Văn A",
      ownerIdentityNumber: "0482xxxxxxx",
      ownerAddress: "Đà Nẵng",
      procedureCode: "DKDD_LANDAU_3380",
      legalBasisCode: "QĐ3380-STEP-RECEPTION",
      noteHistory: ["Hồ sơ demo đã được seed"],
      status: "CHO_TIEP_NHAN",
      ipfsCid: "bafybeigdyrzt-seed-001",
      documentHash: "0xabc001"
    }
  });

  await prisma.fileAsset.upsert({
    where: { id: "fil_seed_001" },
    update: {
      ownerType: "REGISTRATION",
      ownerId: registration.id,
      documentType: "LAND_CERT_SUPPORT",
      originalName: "so-do-do.pdf",
      storageStatus: "UPLOADED_IPFS",
      cid: "bafybeigdyrzt-seed-001",
      hash: "0xabc001",
      registrationId: registration.id
    },
    create: {
      id: "fil_seed_001",
      ownerType: "REGISTRATION",
      ownerId: registration.id,
      documentType: "LAND_CERT_SUPPORT",
      originalName: "so-do-do.pdf",
      storageStatus: "UPLOADED_IPFS",
      cid: "bafybeigdyrzt-seed-001",
      hash: "0xabc001",
      registrationId: registration.id
    }
  });
}

async function seedLandParcels() {
  const owner = await prisma.user.findUniqueOrThrow({
    where: { email: "citizen@urbanchain.vn" }
  });

  await prisma.landParcel.upsert({
    where: {
      land_parcel_unique_code_area: {
        parcelCode: "LAND-DEMO-001",
        provinceCode: "48",
        communeName: "Hoa Khanh"
      }
    },
    update: {
      mapSheetNumber: "05",
      parcelNumber: "123",
      area: new Prisma.Decimal("120.50"),
      landUsePurpose: "ODT",
      address: "54 Nguyen Luong Bang",
      ownerUserId: owner.id
    },
    create: {
      parcelCode: "LAND-DEMO-001",
      provinceCode: "48",
      communeName: "Hoa Khanh",
      mapSheetNumber: "05",
      parcelNumber: "123",
      area: new Prisma.Decimal("120.50"),
      landUsePurpose: "ODT",
      address: "54 Nguyen Luong Bang",
      ownerUserId: owner.id
    }
  });
}

async function seedWallets() {
  const citizen = await prisma.user.findUniqueOrThrow({
    where: { email: "citizen@urbanchain.vn" }
  });
  const registryOfficer = await prisma.user.findUniqueOrThrow({
    where: { email: "registry@urbanchain.vn" }
  });
  const approvalOfficer = await prisma.user.findUniqueOrThrow({
    where: { email: "approval@urbanchain.vn" }
  });

  const verifiedWallet = await prisma.walletAccount.upsert({
    where: {
      wallet_network_address_unique: {
        network: BlockchainNetwork.SEPOLIA,
        address: "0x1234567890123456789012345678901234567890"
      }
    },
    update: {
      userId: citizen.id,
      status: WalletStatus.VERIFIED,
      isDefault: true,
      verifiedAt: new Date(),
      lastVerifiedAt: new Date()
    },
    create: {
      userId: citizen.id,
      network: BlockchainNetwork.SEPOLIA,
      address: "0x1234567890123456789012345678901234567890",
      status: WalletStatus.VERIFIED,
      isDefault: true,
      verifiedAt: new Date(),
      lastVerifiedAt: new Date()
    }
  });

  const pendingWallet = await prisma.walletAccount.upsert({
    where: {
      wallet_network_address_unique: {
        network: BlockchainNetwork.HARDHAT,
        address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
      }
    },
    update: {
      userId: citizen.id,
      status: WalletStatus.PENDING_VERIFICATION,
      isDefault: false
    },
    create: {
      userId: citizen.id,
      network: BlockchainNetwork.HARDHAT,
      address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      status: WalletStatus.PENDING_VERIFICATION,
      isDefault: false
    }
  });

  await prisma.walletVerificationChallenge.deleteMany({
    where: { walletId: pendingWallet.id }
  });

  const issuedAt = new Date();
  const nonce = randomBytes(16).toString("hex");
  const message = [
    "UrbanChain-VN Wallet Verification",
    `Address: ${pendingWallet.address}`,
    `Nonce: ${nonce}`,
    `IssuedAt: ${issuedAt.toISOString()}`
  ].join("\n");

  await prisma.walletVerificationChallenge.create({
    data: {
      walletId: pendingWallet.id,
      nonce,
      message,
      expiresAt: new Date(issuedAt.getTime() + 10 * 60 * 1000)
    }
  });

  await prisma.walletAccount.update({
    where: { id: verifiedWallet.id },
    data: { isDefault: true }
  });

  const registryWallet = await prisma.walletAccount.upsert({
    where: {
      wallet_network_address_unique: {
        network: BlockchainNetwork.SEPOLIA,
        address: "0x130F64878F3CEAd6eF8263D743230514a0D6A561"
      }
    },
    update: {
      userId: registryOfficer.id,
      status: WalletStatus.VERIFIED,
      isDefault: true,
      verifiedAt: new Date(),
      lastVerifiedAt: new Date()
    },
    create: {
      userId: registryOfficer.id,
      network: BlockchainNetwork.SEPOLIA,
      address: "0x130F64878F3CEAd6eF8263D743230514a0D6A561",
      status: WalletStatus.VERIFIED,
      isDefault: true,
      verifiedAt: new Date(),
      lastVerifiedAt: new Date()
    }
  });

  const approvalWallet = await prisma.walletAccount.upsert({
    where: {
      wallet_network_address_unique: {
        network: BlockchainNetwork.SEPOLIA,
        address: "0x130F64878F3CEAd6eF8263D743230514a0D6A561"
      }
    },
    update: {
      userId: approvalOfficer.id,
      status: WalletStatus.VERIFIED,
      isDefault: true,
      verifiedAt: new Date(),
      lastVerifiedAt: new Date()
    },
    create: {
      userId: approvalOfficer.id,
      network: BlockchainNetwork.SEPOLIA,
      address: "0x130F64878F3CEAd6eF8263D743230514a0D6A561",
      status: WalletStatus.VERIFIED,
      isDefault: true,
      verifiedAt: new Date(),
      lastVerifiedAt: new Date()
    }
  });

  const defaultChainId = Number(process.env.BLOCKCHAIN_CHAIN_ID ?? "11155111");
  const now = new Date();

  await prisma.serviceWalletAuthorization.deleteMany({});

  await prisma.serviceWalletAuthorization.createMany({
    data: [
      {
        walletId: registryWallet.id,
        userId: registryOfficer.id,
        organizationId: registryOfficer.organizationId ?? null,
        roleScope: "LAND_REGISTRY_OFFICER",
        network: BlockchainNetwork.SEPOLIA,
        chainId: Number.isFinite(defaultChainId) && defaultChainId > 0 ? defaultChainId : 11155111,
        status: "ACTIVE",
        effectiveFrom: now,
        reason: "Seed service wallet authorization"
      },
      {
        walletId: approvalWallet.id,
        userId: approvalOfficer.id,
        organizationId: approvalOfficer.organizationId ?? null,
        roleScope: "APPROVAL_AUTHORITY",
        network: BlockchainNetwork.SEPOLIA,
        chainId: Number.isFinite(defaultChainId) && defaultChainId > 0 ? defaultChainId : 11155111,
        status: "ACTIVE",
        effectiveFrom: now,
        reason: "Seed service wallet authorization"
      }
    ]
  });
}

async function main() {
  await seedOrganizations();
  await seedUsers();
  await seedLegalProcedures();
  await seedRegistrationAndFile();
  await seedLandParcels();
  await seedWallets();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
