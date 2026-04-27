import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedUsers() {
  const users = [
    {
      email: "citizen@urbanchain.vn",
      fullName: "Nguyen Van A",
      role: "CITIZEN" as const,
      identityNumber: "0482xxxxxxx"
    },
    {
      email: "reception@urbanchain.vn",
      fullName: "Can bo tiep nhan",
      role: "RECEPTION_OFFICER" as const,
      identityNumber: null
    },
    {
      email: "registry@urbanchain.vn",
      fullName: "Can bo VPDKDD",
      role: "LAND_REGISTRY_OFFICER" as const,
      identityNumber: null
    },
    {
      email: "approval@urbanchain.vn",
      fullName: "Can bo phe duyet",
      role: "APPROVAL_AUTHORITY" as const,
      identityNumber: null
    },
    {
      email: "admin@urbanchain.vn",
      fullName: "Quan tri he thong",
      role: "ADMIN" as const,
      identityNumber: null
    }
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        fullName: user.fullName,
        role: user.role,
        identityNumber: user.identityNumber
      },
      create: user
    });
  }
}

async function seedRegistrationAndFile() {
  const citizen = await prisma.user.findUniqueOrThrow({
    where: { email: "citizen@urbanchain.vn" }
  });

  const registration = await prisma.registration.upsert({
    where: { code: "REG-SEED-0001" },
    update: {
      applicantId: citizen.id,
      parcelNumber: "123",
      mapSheetNumber: "05",
      area: new Prisma.Decimal("120.50"),
      landUsePurpose: "ODT",
      address: "54 Nguyen Luong Bang",
      status: "CHO_TIEP_NHAN",
      ipfsCid: "bafybeigdyrzt-seed-001",
      documentHash: "0xabc001"
    },
    create: {
      code: "REG-SEED-0001",
      applicantId: citizen.id,
      parcelNumber: "123",
      mapSheetNumber: "05",
      area: new Prisma.Decimal("120.50"),
      landUsePurpose: "ODT",
      address: "54 Nguyen Luong Bang",
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

async function main() {
  await seedUsers();
  await seedRegistrationAndFile();
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
