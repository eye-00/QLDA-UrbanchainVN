import { Prisma, PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function seedOrganizations() {
  const organizations = [
    { code: "ORG-RECEPTION", name: "Bo phan tiep nhan", description: "Don vi tiep nhan ho so" },
    { code: "ORG-LAND", name: "Chi nhanh VPDKDD", description: "Don vi tham dinh chuyen mon" },
    { code: "ORG-APPROVAL", name: "Co quan phe duyet", description: "Don vi ky cap ket qua" }
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
      fullName: "Nguyen Van A",
      role: "CITIZEN" as const,
      identityNumber: "0482xxxxxxx",
      organizationId: null as string | null
    },
    {
      email: "reception@urbanchain.vn",
      fullName: "Can bo tiep nhan",
      role: "RECEPTION_OFFICER" as const,
      identityNumber: null,
      organizationId: receptionOrg.id
    },
    {
      email: "registry@urbanchain.vn",
      fullName: "Can bo VPDKDD",
      role: "LAND_REGISTRY_OFFICER" as const,
      identityNumber: null,
      organizationId: landOrg.id
    },
    {
      email: "approval@urbanchain.vn",
      fullName: "Can bo phe duyet",
      role: "APPROVAL_AUTHORITY" as const,
      identityNumber: null,
      organizationId: approvalOrg.id
    },
    {
      email: "admin@urbanchain.vn",
      fullName: "Quan tri he thong",
      role: "ADMIN" as const,
      identityNumber: null,
      organizationId: approvalOrg.id
    }
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        fullName: user.fullName,
        role: user.role,
        identityNumber: user.identityNumber,
        status: "ACTIVE",
        organizationId: user.organizationId,
        passwordHash: hashPassword("StrongPassword@123")
      },
      create: {
        ...user,
        status: "ACTIVE",
        passwordHash: hashPassword("StrongPassword@123")
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
      communeName: "Hoa Khanh",
      parcelNumber: "123",
      mapSheetNumber: "05",
      area: new Prisma.Decimal("120.50"),
      landUsePurpose: "ODT",
      address: "54 Nguyen Luong Bang",
      ownerType: "INDIVIDUAL",
      ownerFullName: "Nguyen Van A",
      ownerIdentityNumber: "0482xxxxxxx",
      ownerAddress: "Da Nang",
      noteHistory: ["Ho so demo da duoc seed"],
      status: "CHO_TIEP_NHAN",
      ipfsCid: "bafybeigdyrzt-seed-001",
      documentHash: "0xabc001"
    },
    create: {
      id: "reg_demo_001",
      code: "reg_demo_001",
      applicantId: citizen.id,
      provinceCode: "48",
      communeName: "Hoa Khanh",
      parcelNumber: "123",
      mapSheetNumber: "05",
      area: new Prisma.Decimal("120.50"),
      landUsePurpose: "ODT",
      address: "54 Nguyen Luong Bang",
      ownerType: "INDIVIDUAL",
      ownerFullName: "Nguyen Van A",
      ownerIdentityNumber: "0482xxxxxxx",
      ownerAddress: "Da Nang",
      noteHistory: ["Ho so demo da duoc seed"],
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
        districtName: "Lien Chieu",
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
      districtName: "Lien Chieu",
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

async function main() {
  await seedOrganizations();
  await seedUsers();
  await seedRegistrationAndFile();
  await seedLandParcels();
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
