import { BlockchainNetwork, PrismaClient, WalletStatus } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendEnvPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".env");
dotenv.config({ path: backendEnvPath });

const prisma = new PrismaClient();

type SeedUserRef = {
  id: string;
  organizationId: string | null;
};

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("Seeding test users and linking custom MetaMask wallets...");

  // Find organizations
  const receptionOrg = await prisma.organization.findUniqueOrThrow({ where: { code: "ORG-RECEPTION" } });
  const landOrg = await prisma.organization.findUniqueOrThrow({ where: { code: "ORG-LAND" } });
  const approvalOrg = await prisma.organization.findUniqueOrThrow({ where: { code: "ORG-APPROVAL" } });

  const pwdHash = hashPassword("StrongPassword@123");

  // Create or update users
  const users = [
    { email: "citizen@urbanchain.vn", fullName: "Công dân A (Người bán)", role: "CITIZEN" as const, organizationId: null },
    { email: "citizen2@urbanchain.vn", fullName: "Công dân B (Người mua)", role: "CITIZEN" as const, organizationId: null },
    { email: "reception_test@urbanchain.vn", fullName: "Cán bộ Tiếp nhận (Test)", role: "RECEPTION_OFFICER" as const, organizationId: receptionOrg.id },
    { email: "commune_test@urbanchain.vn", fullName: "Cán bộ Cấp xã (Test)", role: "COMMUNE_OFFICER" as const, organizationId: receptionOrg.id },
    { email: "registry_test@urbanchain.vn", fullName: "Cán bộ VPĐKĐĐ (Test)", role: "LAND_REGISTRY_OFFICER" as const, organizationId: landOrg.id },
    { email: "tax_test@urbanchain.vn", fullName: "Cán bộ Thuế (Test)", role: "TAX_OFFICER" as const, organizationId: landOrg.id },
    { email: "approval_test@urbanchain.vn", fullName: "Cán bộ Phê duyệt (Test)", role: "APPROVAL_AUTHORITY" as const, organizationId: approvalOrg.id }
  ];

  const dbUsers: Record<string, SeedUserRef> = {};

  for (const user of users) {
    const dbUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        fullName: user.fullName,
        role: user.role,
        organizationId: user.organizationId,
        status: "ACTIVE"
      },
      create: {
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organizationId: user.organizationId,
        status: "ACTIVE",
        passwordHash: pwdHash
      }
    });
    dbUsers[user.email] = dbUser;
    console.log(`User seeded/updated: ${user.email}`);
  }

  // Wallets data from user
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

  // Link Wallet 2 also to Cán bộ Phê duyệt (so we can use same wallet or just authorize it)
  // Since address + network must be unique in walletAccount, we can duplicate the wallet only if we link it to one user.
  // Actually, we can also link Wallet 2 to Approval Officer. Wait, the schema has @@unique([network, address]).
  // This means a wallet address on Sepolia can ONLY belong to one user in WalletAccount.
  // If we want both Registry and Approval officers to use the same wallet 2, we can:
  // - Or link Wallet 2 to Registry Officer and authorize it.
  // - Let's see: ServiceWalletAuthorization links a walletId and a userId. The walletId belongs to one user, but the ServiceWalletAuthorization can authorize another user?
  // Let's check:
  // model ServiceWalletAuthorization {
  //   walletId       String
  //   userId         String
  //   roleScope      UserRole
  //   wallet         WalletAccount
  //   user           User
  // }
  // Yes! The user who owns the WalletAccount is the one who created it. But the ServiceWalletAuthorization allows that wallet to be used by the authorized userId!
  // So we can link Wallet 2 to registry_test@urbanchain.vn, and then authorize it for both registry_test@urbanchain.vn and approval_test@urbanchain.vn!
  // This is a brilliant and clean solution that strictly adheres to the unique database constraint!

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

  console.log("Successfully authorized Wallet 2 for both Registry and Approval Officers!");
  console.log("Seeding process completed!");
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
