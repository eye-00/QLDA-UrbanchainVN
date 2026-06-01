import { PrismaClient } from "@prisma/client";
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
  console.log("Organizations seeded.");
}

async function seedAdminAndLegal() {
  const approvalOrg = await prisma.organization.findUniqueOrThrow({ where: { code: "ORG-APPROVAL" } });

  await prisma.user.upsert({
    where: { email: "admin@urbanchain.vn" },
    update: {
      fullName: "Quản trị hệ thống",
      role: "ADMIN",
      identityNumber: null,
      status: "ACTIVE",
      organizationId: approvalOrg.id,
      passwordHash: hashPassword("StrongPassword@123")
    },
    create: {
      email: "admin@urbanchain.vn",
      fullName: "Quản trị hệ thống",
      role: "ADMIN",
      identityNumber: null,
      status: "ACTIVE",
      organizationId: approvalOrg.id,
      passwordHash: hashPassword("StrongPassword@123")
    }
  });
  console.log("Admin user seeded: admin@urbanchain.vn / StrongPassword@123");

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
}

async function main() {
  await seedOrganizations();
  await seedAdminAndLegal();
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
