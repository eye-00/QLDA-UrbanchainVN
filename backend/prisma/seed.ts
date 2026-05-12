import {
  BlockchainNetwork,
  PaymentObligationStatus,
  PaymentObligationType,
  Prisma,
  PrismaClient,
  RegistrationStatus,
  TransferStatus,
  UserRole,
  UserStatus,
  WalletStatus
} from "@prisma/client";
import dotenv from "dotenv";
import { randomBytes, scryptSync } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendEnvPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".env");
dotenv.config({ path: backendEnvPath });

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = "StrongPassword@123";

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function resetTestData() {
  await prisma.auditLog.deleteMany();
  await prisma.paymentObligation.deleteMany();
  await prisma.registrationSubmitSnapshot.deleteMany();
  await prisma.registrationDocumentVersion.deleteMany();
  await prisma.walletVerificationChallenge.deleteMany();
  await prisma.walletAccount.deleteMany();
  await prisma.authSession.deleteMany();
  await prisma.fileAsset.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.legalProcedure.deleteMany();
  await prisma.transferRequest.deleteMany();
  await prisma.landParcel.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
}

async function seedOrganizations() {
  const organizations = [
    {
      code: "ORG-TNHS-DN",
      name: "Bộ phận Tiếp nhận hồ sơ Đà Nẵng",
      description: "Tiếp nhận và kiểm tra thành phần hồ sơ ban đầu",
      isActive: true
    },
    {
      code: "ORG-XA-HK",
      name: "UBND Phường Hòa Khánh",
      description: "Xác nhận thông tin thuộc thẩm quyền cấp xã/phường",
      isActive: true
    },
    {
      code: "ORG-VPDK-DN",
      name: "Chi nhánh VPĐKĐĐ Đà Nẵng",
      description: "Thẩm định nghiệp vụ và xử lý nghĩa vụ tài chính",
      isActive: true
    },
    {
      code: "ORG-PD-DN",
      name: "Cơ quan Phê duyệt Đà Nẵng",
      description: "Ký cấp/phê duyệt hồ sơ",
      isActive: true
    },
    {
      code: "ORG-TEMP-INACTIVE",
      name: "Đơn vị lưu trữ tạm (ngừng hoạt động)",
      description: "Dữ liệu kiểm thử trạng thái INACTIVE",
      isActive: false
    }
  ];

  await prisma.organization.createMany({ data: organizations });
  return prisma.organization.findMany();
}

async function seedUsers(orgByCode: Map<string, { id: string }>) {
  const sharedPasswordHash = hashPassword(DEFAULT_PASSWORD);
  const lockedPasswordHash = hashPassword(DEFAULT_PASSWORD);
  const now = Date.now();
  const lockedUntil = new Date(now + 24 * 60 * 60 * 1000);

  const users = [
    {
      email: "citizen.nguyenvana@urbanchain.vn",
      fullName: "Nguyễn Văn A",
      role: "CITIZEN" as UserRole,
      status: "ACTIVE" as UserStatus,
      identityNumber: "048201001234",
      organizationId: null as string | null,
      passwordHash: sharedPasswordHash
    },
    {
      email: "citizen@urbanchain.vn",
      fullName: "Nguyễn Văn A (legacy)",
      role: "CITIZEN" as UserRole,
      status: "ACTIVE" as UserStatus,
      identityNumber: "048201001200",
      organizationId: null as string | null,
      passwordHash: sharedPasswordHash
    },
    {
      email: "citizen.tranthib@urbanchain.vn",
      fullName: "Trần Thị B",
      role: "CITIZEN" as UserRole,
      status: "ACTIVE" as UserStatus,
      identityNumber: "048201001235",
      organizationId: null as string | null,
      passwordHash: sharedPasswordHash
    },
    {
      email: "business.minhphat@urbanchain.vn",
      fullName: "Công ty TNHH Minh Phát",
      role: "BUSINESS" as UserRole,
      status: "ACTIVE" as UserStatus,
      identityNumber: "0401987654",
      organizationId: null as string | null,
      passwordHash: sharedPasswordHash
    },
    {
      email: "reception.haichau@urbanchain.vn",
      fullName: "Lê Văn Tiếp Nhận",
      role: "RECEPTION_OFFICER" as UserRole,
      status: "ACTIVE" as UserStatus,
      identityNumber: null,
      organizationId: orgByCode.get("ORG-TNHS-DN")?.id ?? null,
      passwordHash: sharedPasswordHash
    },
    {
      email: "reception@urbanchain.vn",
      fullName: "Cán bộ tiếp nhận (legacy)",
      role: "RECEPTION_OFFICER" as UserRole,
      status: "ACTIVE" as UserStatus,
      identityNumber: null,
      organizationId: orgByCode.get("ORG-TNHS-DN")?.id ?? null,
      passwordHash: sharedPasswordHash
    },
    {
      email: "commune.hoakhanh@urbanchain.vn",
      fullName: "Phạm Thị Xác Nhận",
      role: "COMMUNE_OFFICER" as UserRole,
      status: "ACTIVE" as UserStatus,
      identityNumber: null,
      organizationId: orgByCode.get("ORG-XA-HK")?.id ?? null,
      passwordHash: sharedPasswordHash
    },
    {
      email: "registry.danang@urbanchain.vn",
      fullName: "Ngô Văn Thẩm Định",
      role: "LAND_REGISTRY_OFFICER" as UserRole,
      status: "ACTIVE" as UserStatus,
      identityNumber: null,
      organizationId: orgByCode.get("ORG-VPDK-DN")?.id ?? null,
      passwordHash: sharedPasswordHash
    },
    {
      email: "registry@urbanchain.vn",
      fullName: "Cán bộ VPĐKĐĐ (legacy)",
      role: "LAND_REGISTRY_OFFICER" as UserRole,
      status: "ACTIVE" as UserStatus,
      identityNumber: null,
      organizationId: orgByCode.get("ORG-VPDK-DN")?.id ?? null,
      passwordHash: sharedPasswordHash
    },
    {
      email: "approval.danang@urbanchain.vn",
      fullName: "Huỳnh Thị Phê Duyệt",
      role: "APPROVAL_AUTHORITY" as UserRole,
      status: "ACTIVE" as UserStatus,
      identityNumber: null,
      organizationId: orgByCode.get("ORG-PD-DN")?.id ?? null,
      passwordHash: sharedPasswordHash
    },
    {
      email: "tax.danang@urbanchain.vn",
      fullName: "Vũ Thị Thuế",
      role: "TAX_OFFICER" as UserRole,
      status: "ACTIVE" as UserStatus,
      identityNumber: null,
      organizationId: orgByCode.get("ORG-VPDK-DN")?.id ?? null,
      passwordHash: sharedPasswordHash
    },
    {
      email: "audit.compliance@urbanchain.vn",
      fullName: "Kiểm soát tuân thủ",
      role: "AUDITOR" as UserRole,
      status: "ACTIVE" as UserStatus,
      identityNumber: null,
      organizationId: orgByCode.get("ORG-PD-DN")?.id ?? null,
      passwordHash: sharedPasswordHash
    },
    {
      email: "approval@urbanchain.vn",
      fullName: "Cán bộ phê duyệt (legacy)",
      role: "APPROVAL_AUTHORITY" as UserRole,
      status: "ACTIVE" as UserStatus,
      identityNumber: null,
      organizationId: orgByCode.get("ORG-PD-DN")?.id ?? null,
      passwordHash: sharedPasswordHash
    },
    {
      email: "admin.system@urbanchain.vn",
      fullName: "Quản trị hệ thống",
      role: "ADMIN" as UserRole,
      status: "ACTIVE" as UserStatus,
      identityNumber: null,
      organizationId: orgByCode.get("ORG-PD-DN")?.id ?? null,
      passwordHash: sharedPasswordHash
    },
    {
      email: "admin@urbanchain.vn",
      fullName: "Quản trị hệ thống (legacy)",
      role: "ADMIN" as UserRole,
      status: "ACTIVE" as UserStatus,
      identityNumber: null,
      organizationId: orgByCode.get("ORG-PD-DN")?.id ?? null,
      passwordHash: sharedPasswordHash
    },
    {
      email: "citizen.locked@urbanchain.vn",
      fullName: "Người dùng bị khóa",
      role: "CITIZEN" as UserRole,
      status: "LOCKED" as UserStatus,
      identityNumber: "048201009999",
      organizationId: null as string | null,
      passwordHash: lockedPasswordHash,
      failedLoginAttempts: 5,
      lockedUntil
    }
  ];

  await prisma.user.createMany({ data: users });
  return prisma.user.findMany();
}

async function seedWallets(userByEmail: Map<string, { id: string }>) {
  const citizenId = userByEmail.get("citizen.nguyenvana@urbanchain.vn")?.id;
  const businessId = userByEmail.get("business.minhphat@urbanchain.vn")?.id;
  if (!citizenId || !businessId) throw new Error("Missing user for wallet seed");

  await prisma.walletAccount.createMany({
    data: [
      {
        userId: citizenId,
        address: "0x1234567890123456789012345678901234567890",
        network: BlockchainNetwork.SEPOLIA,
        status: WalletStatus.VERIFIED,
        isDefault: true,
        verifiedAt: new Date(),
        lastVerifiedAt: new Date()
      },
      {
        userId: businessId,
        address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        network: BlockchainNetwork.HARDHAT,
        status: WalletStatus.PENDING_VERIFICATION,
        isDefault: false
      }
    ]
  });

  const pendingWallet = await prisma.walletAccount.findFirst({
    where: {
      userId: businessId,
      status: WalletStatus.PENDING_VERIFICATION
    }
  });

  if (pendingWallet) {
    const issuedAt = new Date();
    const nonce = randomBytes(16).toString("hex");
    const message = [
      "UrbanChain-VN Wallet Verification",
      `Address: ${pendingWallet.address}`,
      `Nonce: ${nonce}`,
      `IssuedAt: ${issuedAt.toISOString()}`,
      "Purpose: Verify wallet ownership for account linking only."
    ].join("\n");

    await prisma.walletVerificationChallenge.create({
      data: {
        walletId: pendingWallet.id,
        nonce,
        message,
        expiresAt: new Date(issuedAt.getTime() + 10 * 60 * 1000)
      }
    });
  }

  return prisma.walletAccount.count();
}

async function seedLandParcels(userByEmail: Map<string, { id: string }>) {
  const lands = [
    {
      parcelCode: "LAND-DN-HK-0001",
      provinceCode: "48",
      communeName: "Phường Hòa Khánh",
      mapSheetNumber: "12",
      parcelNumber: "105",
      area: new Prisma.Decimal("120.50"),
      landUsePurpose: "ODT",
      address: "54 Nguyễn Lương Bằng, Phường Hòa Khánh",
      latitude: new Prisma.Decimal("16.0721000"),
      longitude: new Prisma.Decimal("108.1512000"),
      ownerUserId: userByEmail.get("citizen.nguyenvana@urbanchain.vn")?.id ?? null
    },
    {
      parcelCode: "LAND-DN-HK-0002",
      provinceCode: "48",
      communeName: "Phường Hòa Khánh",
      mapSheetNumber: "12",
      parcelNumber: "106",
      area: new Prisma.Decimal("95.75"),
      landUsePurpose: "ODT",
      address: "Số 08 Phạm Như Xương, Phường Hòa Khánh",
      latitude: new Prisma.Decimal("16.0731000"),
      longitude: new Prisma.Decimal("108.1492000"),
      ownerUserId: userByEmail.get("citizen.tranthib@urbanchain.vn")?.id ?? null
    },
    {
      parcelCode: "LAND-DN-HK-0003",
      provinceCode: "48",
      communeName: "Phường Hòa Khánh",
      mapSheetNumber: "09",
      parcelNumber: "233",
      area: new Prisma.Decimal("340.00"),
      landUsePurpose: "SKC",
      address: "Lô C2 KCN Hòa Khánh, Đà Nẵng",
      latitude: new Prisma.Decimal("16.0689000"),
      longitude: new Prisma.Decimal("108.1445000"),
      ownerUserId: userByEmail.get("business.minhphat@urbanchain.vn")?.id ?? null
    },
    {
      parcelCode: "LAND-DN-HK-0004",
      provinceCode: "48",
      communeName: "Phường Hòa Khánh",
      mapSheetNumber: "07",
      parcelNumber: "777",
      area: new Prisma.Decimal("95.75"),
      landUsePurpose: "ODT",
      address: "Tổ 3, Phường Hòa Khánh",
      latitude: null,
      longitude: null,
      ownerUserId: null
    },
    {
      parcelCode: "LAND-DEMO-001",
      provinceCode: "48",
      communeName: "Hoa Khanh",
      mapSheetNumber: "05",
      parcelNumber: "123",
      area: new Prisma.Decimal("120.50"),
      landUsePurpose: "ODT",
      address: "54 Nguyen Luong Bang",
      latitude: null,
      longitude: null,
      ownerUserId: userByEmail.get("citizen@urbanchain.vn")?.id ?? null
    }
  ];

  await prisma.landParcel.createMany({ data: lands });
}

async function seedRegistrations(userByEmail: Map<string, { id: string }>) {
  const baseRecords: Array<{
    code: string;
    applicantEmail: string;
    status: RegistrationStatus;
    provinceCode: string;
    communeName: string;
    parcelNumber: string;
    mapSheetNumber: string;
    area: string;
    landUsePurpose: string;
    address: string;
    ownerType: string;
    ownerFullName: string;
    ownerIdentityNumber: string;
    ownerAddress: string;
    noteHistory: string[];
    landCode?: string;
    tokenId?: number;
    txHash?: string;
    ipfsCid?: string;
    documentHash?: string;
  }> = [
    {
      code: "REG-2026-DN-0001",
      applicantEmail: "citizen.nguyenvana@urbanchain.vn",
      status: "MOI_TAO",
      provinceCode: "48",
      communeName: "Phường Hòa Khánh",
      parcelNumber: "105",
      mapSheetNumber: "12",
      area: "120.50",
      landUsePurpose: "ODT",
      address: "54 Nguyễn Lương Bằng, Phường Hòa Khánh",
      ownerType: "INDIVIDUAL",
      ownerFullName: "Nguyễn Văn A",
      ownerIdentityNumber: "048201001234",
      ownerAddress: "Phường Hòa Khánh, Đà Nẵng",
      noteHistory: ["Hồ sơ được khởi tạo trên hệ thống"]
    },
    {
      code: "REG-2026-DN-0002",
      applicantEmail: "citizen.tranthib@urbanchain.vn",
      status: "CHO_TIEP_NHAN",
      provinceCode: "48",
      communeName: "Phường Hòa Khánh",
      parcelNumber: "106",
      mapSheetNumber: "12",
      area: "95.75",
      landUsePurpose: "ODT",
      address: "Số 08 Phạm Như Xương, Phường Hòa Khánh",
      ownerType: "INDIVIDUAL",
      ownerFullName: "Trần Thị B",
      ownerIdentityNumber: "048201001235",
      ownerAddress: "Phường Hòa Khánh, Đà Nẵng",
      noteHistory: ["Hồ sơ được khởi tạo trên hệ thống", "Người dân đã nộp hồ sơ vào luồng tiếp nhận"]
    },
    {
      code: "REG-2026-DN-0003",
      applicantEmail: "business.minhphat@urbanchain.vn",
      status: "CAN_BO_SUNG",
      provinceCode: "48",
      communeName: "Phường Hòa Khánh",
      parcelNumber: "233",
      mapSheetNumber: "09",
      area: "340.00",
      landUsePurpose: "SKC",
      address: "Lô C2 KCN Hòa Khánh, Đà Nẵng",
      ownerType: "ORGANIZATION",
      ownerFullName: "Công ty TNHH Minh Phát",
      ownerIdentityNumber: "0401987654",
      ownerAddress: "KCN Hòa Khánh, Đà Nẵng",
      noteHistory: [
        "Hồ sơ được khởi tạo trên hệ thống",
        "Người dân đã nộp hồ sơ vào luồng tiếp nhận",
        "Thiếu bản scan giấy tờ nguồn gốc đất"
      ]
    },
    {
      code: "REG-2026-DN-0004",
      applicantEmail: "citizen.nguyenvana@urbanchain.vn",
      status: "DA_TIEP_NHAN",
      provinceCode: "48",
      communeName: "Phường Hòa Khánh",
      parcelNumber: "321",
      mapSheetNumber: "06",
      area: "88.00",
      landUsePurpose: "ODT",
      address: "Kiệt 20 Trần Đình Tri, Phường Hòa Khánh",
      ownerType: "INDIVIDUAL",
      ownerFullName: "Nguyễn Văn A",
      ownerIdentityNumber: "048201001234",
      ownerAddress: "Phường Hòa Khánh, Đà Nẵng",
      noteHistory: [
        "Hồ sơ được khởi tạo trên hệ thống",
        "Người dân đã nộp hồ sơ vào luồng tiếp nhận",
        "Bộ phận một cửa đã tiếp nhận hồ sơ"
      ]
    },
    {
      code: "REG-2026-DN-0005",
      applicantEmail: "citizen.tranthib@urbanchain.vn",
      status: "DA_XAC_NHAN_CAP_XA",
      provinceCode: "48",
      communeName: "Phường Hòa Khánh",
      parcelNumber: "654",
      mapSheetNumber: "14",
      area: "102.25",
      landUsePurpose: "ODT",
      address: "Số 21 Nguyễn Sinh Sắc, Phường Hòa Khánh",
      ownerType: "INDIVIDUAL",
      ownerFullName: "Trần Thị B",
      ownerIdentityNumber: "048201001235",
      ownerAddress: "Phường Hòa Khánh, Đà Nẵng",
      noteHistory: [
        "Hồ sơ được khởi tạo trên hệ thống",
        "Bộ phận một cửa đã tiếp nhận hồ sơ",
        "UBND cấp xã đã xác nhận thông tin hồ sơ"
      ]
    },
    {
      code: "REG-2026-DN-0006",
      applicantEmail: "business.minhphat@urbanchain.vn",
      status: "CHO_THUE",
      provinceCode: "48",
      communeName: "Phường Hòa Khánh",
      parcelNumber: "889",
      mapSheetNumber: "10",
      area: "412.70",
      landUsePurpose: "SKC",
      address: "Đường số 5 KCN Hòa Khánh, Đà Nẵng",
      ownerType: "ORGANIZATION",
      ownerFullName: "Công ty TNHH Minh Phát",
      ownerIdentityNumber: "0401987654",
      ownerAddress: "KCN Hòa Khánh, Đà Nẵng",
      noteHistory: [
        "Bộ phận một cửa đã tiếp nhận hồ sơ",
        "UBND cấp xã đã xác nhận thông tin hồ sơ",
        "Đã chuyển thông tin xác định nghĩa vụ tài chính sang cơ quan thuế"
      ]
    },
    {
      code: "REG-2026-DN-0007",
      applicantEmail: "citizen.nguyenvana@urbanchain.vn",
      status: "DA_GHI_BLOCKCHAIN",
      provinceCode: "48",
      communeName: "Phường Hòa Khánh",
      parcelNumber: "415",
      mapSheetNumber: "03",
      area: "75.40",
      landUsePurpose: "ODT",
      address: "Tổ 14, Phường Hòa Khánh",
      ownerType: "INDIVIDUAL",
      ownerFullName: "Nguyễn Văn A",
      ownerIdentityNumber: "048201001234",
      ownerAddress: "Phường Hòa Khánh, Đà Nẵng",
      noteHistory: [
        "Bộ phận một cửa đã tiếp nhận hồ sơ",
        "UBND cấp xã đã xác nhận thông tin hồ sơ",
        "Đã phê duyệt hồ sơ và cập nhật dữ liệu địa chính",
        "Đã cập nhật hồ sơ địa chính/CSDL đất đai",
        "Đã đồng bộ metadata hồ sơ lên blockchain"
      ],
      landCode: "LND-2026-0007",
      tokenId: 7007,
      txHash: "0x7a91b2f2a1c66f2e000000000000000000000000000000000000000000000007",
      ipfsCid: "bafybeifw7xpnxg2seed0007",
      documentHash: "0x2e00000000000000000000000000000000000000000000000000000000000007"
    },
    {
      code: "REG-2026-DN-0008",
      applicantEmail: "citizen.tranthib@urbanchain.vn",
      status: "TU_CHOI",
      provinceCode: "48",
      communeName: "Phường Hòa Khánh",
      parcelNumber: "900",
      mapSheetNumber: "15",
      area: "66.20",
      landUsePurpose: "ODT",
      address: "Kiệt 32 Âu Cơ, Phường Hòa Khánh",
      ownerType: "INDIVIDUAL",
      ownerFullName: "Trần Thị B",
      ownerIdentityNumber: "048201001235",
      ownerAddress: "Phường Hòa Khánh, Đà Nẵng",
      noteHistory: [
        "Bộ phận một cửa đã tiếp nhận hồ sơ",
        "Phát hiện hồ sơ kê khai chưa đúng nguồn gốc sử dụng đất",
        "Đã từ chối hồ sơ"
      ]
    },
    {
      code: "reg_demo_001",
      applicantEmail: "citizen@urbanchain.vn",
      status: "CHO_TIEP_NHAN",
      provinceCode: "48",
      communeName: "Hoa Khanh",
      parcelNumber: "123",
      mapSheetNumber: "05",
      area: "120.50",
      landUsePurpose: "ODT",
      address: "54 Nguyen Luong Bang",
      ownerType: "INDIVIDUAL",
      ownerFullName: "Nguyễn Văn A (legacy)",
      ownerIdentityNumber: "048201001200",
      ownerAddress: "Da Nang",
      noteHistory: ["Hồ sơ demo đã được seed", "Người dân đã nộp hồ sơ vào luồng tiếp nhận"],
      landCode: "LAND-DEMO-001",
      tokenId: 1001,
      txHash: "0xlegacy000000000000000000000000000000000000000000000000000000000001",
      ipfsCid: "bafybeigdyrzt-seed-001",
      documentHash: "0xabc001"
    }
  ];

  const created: Array<{ id: string; code: string; status: RegistrationStatus }> = [];

  for (const record of baseRecords) {
    const applicant = userByEmail.get(record.applicantEmail);
    if (!applicant) {
      throw new Error(`Missing applicant for ${record.code}`);
    }

    const createdItem = await prisma.registration.create({
      data: {
        code: record.code,
        applicantId: applicant.id,
        status: record.status,
        provinceCode: record.provinceCode,
        communeName: record.communeName,
        parcelNumber: record.parcelNumber,
        mapSheetNumber: record.mapSheetNumber,
        area: new Prisma.Decimal(record.area),
        landUsePurpose: record.landUsePurpose,
        address: record.address,
        ownerType: record.ownerType,
        ownerFullName: record.ownerFullName,
        ownerIdentityNumber: record.ownerIdentityNumber,
        ownerAddress: record.ownerAddress,
        procedureCode: "1.013978",
        legalBasisCode: "151/2025-ND-CP|3380/QD-BNNMT",
        noteHistory: record.noteHistory,
        landCode: record.landCode,
        tokenId: record.tokenId,
        txHash: record.txHash,
        ipfsCid: record.ipfsCid,
        documentHash: record.documentHash
      }
    });

    created.push({ id: createdItem.id, code: createdItem.code, status: createdItem.status });
  }

  return created;
}

async function seedFileAssets(registrations: Array<{ id: string; code: string }>) {
  const files = registrations.map((registration, index) => {
    const no = (index + 1).toString().padStart(3, "0");
    return {
      id: `fil-seed-${no}`,
      ownerType: "REGISTRATION",
      ownerId: registration.id,
      documentType: index % 2 === 0 ? "DON_DANG_KY" : "GIAY_TO_NGUON_GOC",
      originalName: index % 2 === 0 ? `don-dang-ky-${registration.code}.pdf` : `giay-to-nguon-goc-${registration.code}.pdf`,
      storageStatus: "UPLOADED_IPFS",
      cid: `bafybeiseedfile${no}`,
      hash: `0xseedfilehash${no}`,
      registrationId: registration.id
    };
  });

  const legacyRegistration = registrations.find((item) => item.code === "reg_demo_001");
  if (legacyRegistration) {
    files.push({
      id: "fil_demo_001",
      ownerType: "REGISTRATION",
      ownerId: legacyRegistration.id,
      documentType: "LAND_CERT_SUPPORT",
      originalName: "so-do-do.pdf",
      storageStatus: "UPLOADED_IPFS",
      cid: "bafybeigdyrzt-seed-001",
      hash: "0xabc001",
      registrationId: legacyRegistration.id
    });
  }

  await prisma.fileAsset.createMany({ data: files });
}

async function seedLegalProcedures() {
  await prisma.legalProcedure.createMany({
    data: [
      {
        procedureCode: "1.013978",
        name: "Đăng ký đất đai lần đầu",
        sourceDecision: "3380/QD-BNNMT",
        legalBasis: "151/2025/NĐ-CP|101/2024/NĐ-CP",
        level: "LIEN_THONG",
        authorityActors: [
          "RECEPTION_OFFICER",
          "COMMUNE_OFFICER",
          "LAND_REGISTRY_OFFICER",
          "TAX_OFFICER",
          "APPROVAL_AUTHORITY",
          "ADMIN"
        ],
        requiresTaxStep: true,
        isActive: true
      }
    ]
  });
}

async function seedRegistrationLegalArtifacts(
  registrations: Array<{ id: string; code: string; status: RegistrationStatus }>,
  userByEmail: Map<string, { id: string }>
) {
  const receptionId = userByEmail.get("reception.haichau@urbanchain.vn")?.id ?? null;
  const registryId = userByEmail.get("registry.danang@urbanchain.vn")?.id ?? null;

  const fileMap = await prisma.fileAsset.findMany({
    where: {
      registrationId: { in: registrations.map((item) => item.id) }
    },
    select: {
      id: true,
      registrationId: true,
      documentType: true,
      cid: true,
      hash: true
    }
  });

  for (const registration of registrations) {
    const files = fileMap.filter((item) => item.registrationId === registration.id);
    let versionNo = 1;
    for (const file of files) {
      await prisma.registrationDocumentVersion.create({
        data: {
          registrationId: registration.id,
          fileAssetId: file.id,
          documentType: file.documentType,
          versionNo,
          cid: file.cid,
          hash: file.hash,
          createdBy: receptionId
        }
      });
      versionNo += 1;
    }

    if (registration.status !== "MOI_TAO") {
      const versions = await prisma.registrationDocumentVersion.findMany({
        where: { registrationId: registration.id },
        orderBy: { createdAt: "asc" },
        select: { id: true, fileAssetId: true }
      });
      await prisma.registrationSubmitSnapshot.create({
        data: {
          registrationId: registration.id,
          snapshotNo: 1,
          procedureCode: "1.013978",
          legalBasisCode: "151/2025-ND-CP|3380/QD-BNNMT",
          authorityActor: "RECEPTION_OFFICER",
          fileVersionIds: versions.map((item) => item.id),
          fileIds: versions.map((item) => item.fileAssetId),
          submittedBy: receptionId!
        }
      });
    }

    await prisma.paymentObligation.create({
      data: {
        registrationId: registration.id,
        type: PaymentObligationType.INTAKE_FEE,
        status: registration.status === "MOI_TAO" ? PaymentObligationStatus.PENDING : PaymentObligationStatus.FULFILLED,
        amount: new Prisma.Decimal("25000.00"),
        note: "Lệ phí tiếp nhận hồ sơ",
        createdBy: receptionId!,
        fulfilledAt: registration.status === "MOI_TAO" ? null : new Date()
      }
    });
  }

  const taxReady = registrations.find((item) =>
    ["CHO_THUE", "CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH", "DA_HOAN_THANH_NGHIA_VU_TAI_CHINH", "DA_GHI_BLOCKCHAIN"].includes(
      item.status
    )
  );
  if (taxReady) {
    await prisma.paymentObligation.create({
      data: {
        registrationId: taxReady.id,
        type: PaymentObligationType.LAND_FINANCIAL_OBLIGATION,
        status: PaymentObligationStatus.PENDING,
        amount: new Prisma.Decimal("5000000.00"),
        referenceNo: "TAX-SEED-2026-001",
        note: "Nghĩa vụ tài chính đất đai",
        createdBy: registryId!
      }
    });
  }
}

async function seedTransferRequests(userByEmail: Map<string, { id: string }>) {
  await prisma.transferRequest.createMany({
    data: [
      {
        code: "TRF-2026-DN-0001",
        landCode: "LND-2026-0007",
        fromUserId: userByEmail.get("citizen.nguyenvana@urbanchain.vn")?.id ?? null,
        toUserRef: "Trần Thị B - 048201001235",
        status: "CHO_TIEP_NHAN" as TransferStatus,
        supportingCid: "bafybeitrfseed0001",
        supportingHash: "0xtrfseedhash0001",
        txHash: null
      },
      {
        code: "TRF-2026-DN-0002",
        landCode: "LND-2026-0007",
        fromUserId: userByEmail.get("citizen.nguyenvana@urbanchain.vn")?.id ?? null,
        toUserRef: "Công ty TNHH Minh Phát - 0401987654",
        status: "DA_CHUYEN_THUE" as TransferStatus,
        supportingCid: "bafybeitrfseed0002",
        supportingHash: "0xtrfseedhash0002",
        txHash: "0xtransfer0002abcdef000000000000000000000000000000000000000000000002"
      }
    ]
  });
}

async function seedAuditLogs(
  userByEmail: Map<string, { id: string }>,
  registrations: Array<{ id: string; code: string; status: RegistrationStatus }>
) {
  const adminId = userByEmail.get("admin.system@urbanchain.vn")?.id ?? null;
  const receptionId = userByEmail.get("reception.haichau@urbanchain.vn")?.id ?? null;

  const logs = registrations.slice(0, 5).map((registration, index) => ({
    actorId: index % 2 === 0 ? receptionId : adminId,
    action: "REGISTRATION_STATUS_UPDATED",
    entityType: "REGISTRATION",
    entityId: registration.id,
    payload: {
      registrationCode: registration.code,
      status: registration.status,
      source: "seed"
    }
  }));

  await prisma.auditLog.createMany({ data: logs });
}

async function main() {
  await resetTestData();

  const organizations = await seedOrganizations();
  const orgByCode = new Map(organizations.map((item) => [item.code, { id: item.id }]));

  const users = await seedUsers(orgByCode);
  const userByEmail = new Map(users.map((item) => [item.email, { id: item.id }]));
  const walletCount = await seedWallets(userByEmail);

  await seedLandParcels(userByEmail);
  await seedLegalProcedures();
  const registrations = await seedRegistrations(userByEmail);
  await seedFileAssets(registrations);
  await seedRegistrationLegalArtifacts(registrations, userByEmail);
  await seedTransferRequests(userByEmail);
  await seedAuditLogs(userByEmail, registrations);

  console.log("Seed completed:");
  console.log(`- Organizations: ${organizations.length}`);
  console.log(`- Users: ${users.length}`);
  console.log(`- Wallet accounts: ${walletCount}`);
  console.log("- Land parcels: 5");
  console.log(`- Registrations: ${registrations.length}`);
  console.log(`- File assets: ${registrations.length + 1}`);
  console.log("- Transfer requests: 2");
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
