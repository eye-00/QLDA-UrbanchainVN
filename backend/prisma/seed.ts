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
      identityNumber: "0482xxxxxxx",
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
      email: "admin@urbanchain.vn",
      fullName: "Quản trị hệ thống",
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
