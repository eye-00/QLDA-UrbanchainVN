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

async function main() {
  console.log("Starting Seeding for Target Auth Model with Citizen & Staff Profiles...");

  // 1. Seed Organizations
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
  console.log("Organizations seeded.");

  const receptionOrg = await prisma.organization.findUniqueOrThrow({ where: { code: "ORG-RECEPTION" } });
  const landOrg = await prisma.organization.findUniqueOrThrow({ where: { code: "ORG-LAND" } });
  const approvalOrg = await prisma.organization.findUniqueOrThrow({ where: { code: "ORG-APPROVAL" } });

  // Common password hash for test accounts
  const pwdHash = hashPassword("StrongPassword@123");

  // 2. Seed Users
  const userSeeds = [
    {
      email: "admin@urbanchain.vn",
      fullName: "Quản trị hệ thống",
      role: "ADMIN" as const,
      accountType: AccountType.SYSTEM_ADMIN,
      username: "admin",
      organizationId: approvalOrg.id
    },
    {
      email: "citizen@urbanchain.vn",
      fullName: "Công dân A (Người bán)",
      role: "CITIZEN" as const,
      accountType: AccountType.CITIZEN,
      username: null,
      organizationId: null
    },
    {
      email: "citizen2@urbanchain.vn",
      fullName: "Công dân B (Người mua)",
      role: "CITIZEN" as const,
      accountType: AccountType.CITIZEN,
      username: null,
      organizationId: null
    },
    {
      email: "reception_test@urbanchain.vn",
      fullName: "Cán bộ Tiếp nhận (Test)",
      role: "RECEPTION_OFFICER" as const,
      accountType: AccountType.STAFF,
      username: null,
      organizationId: receptionOrg.id
    },
    {
      email: "commune_test@urbanchain.vn",
      fullName: "Cán bộ Cấp xã (Test)",
      role: "COMMUNE_OFFICER" as const,
      accountType: AccountType.STAFF,
      username: null,
      organizationId: receptionOrg.id
    },
    {
      email: "registry_test@urbanchain.vn",
      fullName: "Cán bộ VPĐKĐĐ (Test)",
      role: "LAND_REGISTRY_OFFICER" as const,
      accountType: AccountType.STAFF,
      username: null,
      organizationId: landOrg.id
    },
    {
      email: "tax_test@urbanchain.vn",
      fullName: "Cán bộ Thuế (Test)",
      role: "TAX_OFFICER" as const,
      accountType: AccountType.STAFF,
      username: null,
      organizationId: landOrg.id
    },
    {
      email: "approval_test@urbanchain.vn",
      fullName: "Cán bộ Phê duyệt (Test)",
      role: "APPROVAL_AUTHORITY" as const,
      accountType: AccountType.STAFF,
      username: null,
      organizationId: approvalOrg.id
    }
  ];

  const dbUsers: Record<string, any> = {};

  for (const seed of userSeeds) {
    const dbUser = await prisma.user.upsert({
      where: { email: seed.email },
      update: {
        fullName: seed.fullName,
        role: seed.role,
        accountType: seed.accountType,
        username: seed.username,
        organizationId: seed.organizationId,
        status: "ACTIVE"
      },
      create: {
        email: seed.email,
        fullName: seed.fullName,
        role: seed.role,
        accountType: seed.accountType,
        username: seed.username,
        organizationId: seed.organizationId,
        status: "ACTIVE",
        passwordHash: pwdHash
      }
    });
    dbUsers[seed.email] = dbUser;
    console.log(`User seeded/updated: ${seed.email}`);
  }

  // 3. Seed Profiles (CitizenProfile and StaffProfile)
  // Citizen Profiles
  await prisma.citizenProfile.upsert({
    where: { userId: dbUsers["citizen@urbanchain.vn"].id },
    update: {
      citizenId: "012345678901",
      fullName: "Công dân A (Người bán)",
      phone: "0901234567",
      address: "Đà Nẵng"
    },
    create: {
      userId: dbUsers["citizen@urbanchain.vn"].id,
      citizenId: "012345678901",
      fullName: "Công dân A (Người bán)",
      phone: "0901234567",
      address: "Đà Nẵng"
    }
  });
  console.log("CitizenProfile seeded: citizen@urbanchain.vn -> citizenId: 012345678901");

  await prisma.citizenProfile.upsert({
    where: { userId: dbUsers["citizen2@urbanchain.vn"].id },
    update: {
      citizenId: "012345678902",
      fullName: "Công dân B (Người mua)",
      phone: "0909876543",
      address: "Đà Nẵng"
    },
    create: {
      userId: dbUsers["citizen2@urbanchain.vn"].id,
      citizenId: "012345678902",
      fullName: "Công dân B (Người mua)",
      phone: "0909876543",
      address: "Đà Nẵng"
    }
  });
  console.log("CitizenProfile seeded: citizen2@urbanchain.vn -> citizenId: 012345678902");

  // Staff Profiles
  const staffSeeds = [
    {
      email: "admin@urbanchain.vn",
      staffCode: "STF_ADMIN",
      officialUsername: "admin_test",
      fullName: "Quản trị hệ thống",
      position: "Quản trị viên"
    },
    {
      email: "reception_test@urbanchain.vn",
      staffCode: "STF_RECEPTION",
      officialUsername: "reception_officer",
      fullName: "Cán bộ Tiếp nhận (Test)",
      position: "Chuyên viên tiếp nhận"
    },
    {
      email: "commune_test@urbanchain.vn",
      staffCode: "STF_COMMUNE",
      officialUsername: "commune_officer",
      fullName: "Cán bộ Cấp xã (Test)",
      position: "Công chức địa chính xã"
    },
    {
      email: "registry_test@urbanchain.vn",
      staffCode: "STF_REGISTRY",
      officialUsername: "registry_officer",
      fullName: "Cán bộ VPĐKĐĐ (Test)",
      position: "Thẩm định viên VPĐKĐĐ"
    },
    {
      email: "tax_test@urbanchain.vn",
      staffCode: "STF_TAX",
      officialUsername: "tax_officer",
      fullName: "Cán bộ Thuế (Test)",
      position: "Cán bộ thuế quận"
    },
    {
      email: "approval_test@urbanchain.vn",
      staffCode: "STF_APPROVAL",
      officialUsername: "approval_officer",
      fullName: "Cán bộ Phê duyệt (Test)",
      position: "Lãnh đạo phê duyệt"
    }
  ];

  for (const staff of staffSeeds) {
    const userId = dbUsers[staff.email].id;
    await prisma.staffProfile.upsert({
      where: { userId },
      update: {
        staffCode: staff.staffCode,
        officialUsername: staff.officialUsername,
        fullName: staff.fullName,
        position: staff.position,
        officialEmail: staff.email
      },
      create: {
        userId,
        staffCode: staff.staffCode,
        officialUsername: staff.officialUsername,
        fullName: staff.fullName,
        position: staff.position,
        officialEmail: staff.email
      }
    });
    console.log(`StaffProfile seeded: ${staff.email} -> staffCode: ${staff.staffCode}, officialUsername: ${staff.officialUsername}`);
  }

  // 4. Seed Wallets
  const wallet1Address = "0xfb395242dC71Aece60749eB2532fdC9f09b81ce2".toLowerCase(); // Citizen A
  const wallet2Address = "0x130F64878F3CEAd6eF8263D743230514a0D6A561".toLowerCase(); // Officer (Registry & Approval)
  const wallet3Address = "0x9e117a91BD210d5265716006Fe4407547F119b4B".toLowerCase(); // Citizen B

  // Link Wallet 1 (Citizen A)
  await prisma.walletAccount.upsert({
    where: {
      wallet_network_address_unique: {
        network: BlockchainNetwork.SEPOLIA,
        address: wallet1Address
      }
    },
    update: {
      userId: dbUsers["citizen@urbanchain.vn"].id,
      status: WalletStatus.VERIFIED,
      isDefault: true,
      verifiedAt: new Date(),
      lastVerifiedAt: new Date()
    },
    create: {
      userId: dbUsers["citizen@urbanchain.vn"].id,
      network: BlockchainNetwork.SEPOLIA,
      address: wallet1Address,
      status: WalletStatus.VERIFIED,
      isDefault: true,
      verifiedAt: new Date(),
      lastVerifiedAt: new Date()
    }
  });
  console.log(`Linked Wallet 1 (${wallet1Address}) to citizen@urbanchain.vn`);

  // Link Wallet 3 (Citizen B)
  await prisma.walletAccount.upsert({
    where: {
      wallet_network_address_unique: {
        network: BlockchainNetwork.SEPOLIA,
        address: wallet3Address
      }
    },
    update: {
      userId: dbUsers["citizen2@urbanchain.vn"].id,
      status: WalletStatus.VERIFIED,
      isDefault: true,
      verifiedAt: new Date(),
      lastVerifiedAt: new Date()
    },
    create: {
      userId: dbUsers["citizen2@urbanchain.vn"].id,
      network: BlockchainNetwork.SEPOLIA,
      address: wallet3Address,
      status: WalletStatus.VERIFIED,
      isDefault: true,
      verifiedAt: new Date(),
      lastVerifiedAt: new Date()
    }
  });
  console.log(`Linked Wallet 3 (${wallet3Address}) to citizen2@urbanchain.vn`);

  // Link Wallet 2 to Cán bộ VPĐKĐĐ
  const w2Registry = await prisma.walletAccount.upsert({
    where: {
      wallet_network_address_unique: {
        network: BlockchainNetwork.SEPOLIA,
        address: wallet2Address
      }
    },
    update: {
      userId: dbUsers["registry_test@urbanchain.vn"].id,
      status: WalletStatus.VERIFIED,
      isDefault: true,
      verifiedAt: new Date(),
      lastVerifiedAt: new Date()
    },
    create: {
      userId: dbUsers["registry_test@urbanchain.vn"].id,
      network: BlockchainNetwork.SEPOLIA,
      address: wallet2Address,
      status: WalletStatus.VERIFIED,
      isDefault: true,
      verifiedAt: new Date(),
      lastVerifiedAt: new Date()
    }
  });
  console.log(`Linked Wallet 2 (${wallet2Address}) to registry_test@urbanchain.vn`);

  // 5. Seed Service Wallet Authorizations
  const defaultChainId = Number(process.env.BLOCKCHAIN_CHAIN_ID ?? "11155111");
  const now = new Date();

  // Clear old authorizations for these users
  await prisma.serviceWalletAuthorization.deleteMany({
    where: {
      userId: { in: [dbUsers["registry_test@urbanchain.vn"].id, dbUsers["approval_test@urbanchain.vn"].id] }
    }
  });

  // Create Service Wallet Authorizations
  await prisma.serviceWalletAuthorization.createMany({
    data: [
      {
        walletId: w2Registry.id,
        userId: dbUsers["registry_test@urbanchain.vn"].id,
        organizationId: dbUsers["registry_test@urbanchain.vn"].organizationId,
        roleScope: "LAND_REGISTRY_OFFICER",
        network: BlockchainNetwork.SEPOLIA,
        chainId: defaultChainId,
        status: "ACTIVE",
        effectiveFrom: now,
        reason: "Ủy quyền ví công vụ kiểm thử VPĐKĐĐ"
      },
      {
        walletId: w2Registry.id,
        userId: dbUsers["approval_test@urbanchain.vn"].id,
        organizationId: dbUsers["approval_test@urbanchain.vn"].organizationId,
        roleScope: "APPROVAL_AUTHORITY",
        network: BlockchainNetwork.SEPOLIA,
        chainId: defaultChainId,
        status: "ACTIVE",
        effectiveFrom: now,
        reason: "Ủy quyền ví công vụ kiểm thử Cán bộ Phê duyệt"
      }
    ]
  });
  console.log("Authorized Wallet 2 for both Registry and Approval Officers!");

  // 6. Seed Legal Procedures
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
  console.log("Legal procedures seeded.");
  console.log("All Seeding completed successfully for Target Auth Model!");
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
