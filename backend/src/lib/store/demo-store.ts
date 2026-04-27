export type RegistrationStatus =
  | "MOI_TAO"
  | "CHO_TIEP_NHAN"
  | "CAN_BO_SUNG"
  | "DA_TIEP_NHAN"
  | "CHO_XAC_NHAN_CAP_XA"
  | "DA_XAC_NHAN_CAP_XA"
  | "DANG_THAM_DINH_VPDKDD"
  | "CHO_THUE"
  | "CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH"
  | "CHO_KY_CAP"
  | "DA_KY_CAP"
  | "DA_CAP"
  | "DA_TRA_KET_QUA"
  | "TU_CHOI";

export type TransferStatus =
  | "MOI_TAO_BIEN_DONG"
  | "CHO_TIEP_NHAN"
  | "CAN_BO_SUNG"
  | "DA_TIEP_NHAN"
  | "DANG_KIEM_TRA_DIEU_KIEN"
  | "DA_CHUYEN_THUE"
  | "CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH"
  | "DANG_CAP_NHAT_BIEN_DONG"
  | "DA_DANG_KY_BIEN_DONG"
  | "DA_TRA_KET_QUA"
  | "TU_CHOI";

export type UserRole =
  | "CITIZEN"
  | "BUSINESS"
  | "RECEPTION_OFFICER"
  | "COMMUNE_OFFICER"
  | "LAND_REGISTRY_OFFICER"
  | "APPROVAL_AUTHORITY"
  | "ADMIN";

export interface UserRecord {
  userId: string;
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  status: "ACTIVE" | "LOCKED";
  phone?: string;
  identityNumber?: string;
}

export interface RegistrationFileRef {
  id: string;
  documentType: string;
}

export interface RegistrationRecord {
  id: string;
  code: string;
  applicantId: string;
  ownerFullName: string;
  ownerType: string;
  identityNumber?: string;
  provinceCode: string;
  districtName: string;
  communeName: string;
  parcelNumber: string;
  mapSheetNumber: string;
  area: number;
  landUsePurpose: string;
  address: string;
  fileIds: RegistrationFileRef[];
  status: RegistrationStatus;
  notes: string[];
  createdAt: string;
  updatedAt: string;
  landCode?: string;
  txHash?: string;
  tokenId?: number;
}

export interface TransferRecord {
  id: string;
  code: string;
  landCode: string;
  fromUserId: string;
  toUserRef: string;
  supportingFileIds: string[];
  status: TransferStatus;
  notes: string[];
  txHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LandHistoryItem {
  type: "REGISTRATION" | "TRANSFER" | "STATUS";
  message: string;
  txHash?: string;
  createdAt: string;
}

export interface LandRecord {
  landCode: string;
  parcelNumber: string;
  mapSheetNumber: string;
  area: number;
  landUsePurpose: string;
  address: string;
  ownerDisplayName: string;
  ownerRef: string;
  status: "ACTIVE" | "TRANSFERRED" | "LOCKED";
  registrationId: string;
  txHash?: string;
  history: LandHistoryItem[];
}

export interface FileAssetRecord {
  id: string;
  originalName: string;
  documentType: string;
  storageStatus: "UPLOADED_IPFS" | "FAILED";
  cid: string;
  hash: string;
  createdAt: string;
}

const nowIso = () => new Date().toISOString();
const makeId = (prefix: string) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

export class DemoStore {
  users = new Map<string, UserRecord>();
  registrations = new Map<string, RegistrationRecord>();
  transfers = new Map<string, TransferRecord>();
  lands = new Map<string, LandRecord>();
  files = new Map<string, FileAssetRecord>();

  constructor() {
    this.seed();
  }

  private seed() {
    const demoUsers: UserRecord[] = [
      {
        userId: "usr_demo",
        fullName: "Nguyen Van A",
        email: "citizen@urbanchain.vn",
        password: "StrongPassword@123",
        role: "CITIZEN",
        status: "ACTIVE",
        phone: "0901234567",
        identityNumber: "0482xxxxxxx"
      },
      {
        userId: "usr_reception",
        fullName: "Can bo tiep nhan",
        email: "reception@urbanchain.vn",
        password: "StrongPassword@123",
        role: "RECEPTION_OFFICER",
        status: "ACTIVE"
      },
      {
        userId: "usr_land_registry",
        fullName: "Can bo VPDKDD",
        email: "registry@urbanchain.vn",
        password: "StrongPassword@123",
        role: "LAND_REGISTRY_OFFICER",
        status: "ACTIVE"
      },
      {
        userId: "usr_approval",
        fullName: "Can bo phe duyet",
        email: "approval@urbanchain.vn",
        password: "StrongPassword@123",
        role: "APPROVAL_AUTHORITY",
        status: "ACTIVE"
      },
      {
        userId: "usr_admin",
        fullName: "Quan tri he thong",
        email: "admin@urbanchain.vn",
        password: "StrongPassword@123",
        role: "ADMIN",
        status: "ACTIVE"
      }
    ];
    demoUsers.forEach((user) => this.users.set(user.userId, user));

    const file: FileAssetRecord = {
      id: "fil_demo_001",
      originalName: "so-do-do.pdf",
      documentType: "LAND_CERT_SUPPORT",
      storageStatus: "UPLOADED_IPFS",
      cid: "bafybeigdyrzt-demo-cid-001",
      hash: "0xabc001",
      createdAt: nowIso()
    };
    this.files.set(file.id, file);

    const registration: RegistrationRecord = {
      id: "reg_demo_001",
      code: "REG-DEMO-001",
      applicantId: "usr_demo",
      ownerFullName: "Nguyen Van A",
      ownerType: "INDIVIDUAL",
      identityNumber: "0482xxxxxxx",
      provinceCode: "48",
      districtName: "Lien Chieu",
      communeName: "Hoa Khanh",
      parcelNumber: "123",
      mapSheetNumber: "05",
      area: 120.5,
      landUsePurpose: "ODT",
      address: "54 Nguyen Luong Bang",
      fileIds: [{ id: file.id, documentType: file.documentType }],
      status: "CHO_TIEP_NHAN",
      notes: ["Ho so demo duoc tao san de kiem thu"],
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    this.registrations.set(registration.id, registration);
  }

  listUsers() {
    return Array.from(this.users.values());
  }

  getUserById(userId: string) {
    return this.users.get(userId) ?? null;
  }

  getUserByEmail(email: string) {
    const normalized = email.toLowerCase();
    return this.listUsers().find((user) => user.email.toLowerCase() === normalized) ?? null;
  }

  createUser(input: Omit<UserRecord, "userId" | "status">) {
    const user: UserRecord = {
      ...input,
      userId: makeId("usr"),
      status: "ACTIVE"
    };
    this.users.set(user.userId, user);
    return user;
  }

  listRegistrations(status?: RegistrationStatus) {
    const items = Array.from(this.registrations.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return status ? items.filter((item) => item.status === status) : items;
  }

  createRegistration(input: Omit<RegistrationRecord, "id" | "code" | "status" | "notes" | "createdAt" | "updatedAt">) {
    const record: RegistrationRecord = {
      ...input,
      id: makeId("reg"),
      code: `REG-${Date.now()}`,
      status: "MOI_TAO",
      notes: ["Ho so duoc tao tren he thong"],
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    this.registrations.set(record.id, record);
    return record;
  }

  getRegistration(id: string) {
    return this.registrations.get(id) ?? null;
  }

  updateRegistrationStatus(id: string, status: RegistrationStatus, note: string) {
    const record = this.getRegistration(id);
    if (!record) return null;
    record.status = status;
    record.updatedAt = nowIso();
    record.notes.push(note);
    return record;
  }

  approveRegistration(id: string, txHash?: string) {
    const record = this.getRegistration(id);
    if (!record) return null;

    const landCode = record.landCode ?? `LAND-${Date.now()}`;
    const tokenId = record.tokenId ?? this.lands.size + 1;
    record.status = "DA_CAP";
    record.updatedAt = nowIso();
    record.landCode = landCode;
    record.tokenId = tokenId;
    record.txHash = txHash ?? `0x${Date.now().toString(16)}approved`;
    record.notes.push("Ho so da duoc phe duyet va cap ban ghi dat dai");

    const land: LandRecord = {
      landCode,
      parcelNumber: record.parcelNumber,
      mapSheetNumber: record.mapSheetNumber,
      area: record.area,
      landUsePurpose: record.landUsePurpose,
      address: record.address,
      ownerDisplayName: record.ownerFullName,
      ownerRef: record.applicantId,
      status: "ACTIVE",
      registrationId: record.id,
      txHash: record.txHash,
      history: [
        {
          type: "REGISTRATION",
          message: `Dang ky lan dau duoc phe duyet cho ${record.ownerFullName}`,
          txHash: record.txHash,
          createdAt: nowIso()
        }
      ]
    };

    this.lands.set(land.landCode, land);
    return { registration: record, land };
  }

  listLands(query?: string) {
    const items = Array.from(this.lands.values()).sort((a, b) => b.landCode.localeCompare(a.landCode));
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter((item) =>
      [item.landCode, item.parcelNumber, item.mapSheetNumber, item.address, item.ownerDisplayName]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }

  getLand(landCode: string) {
    return this.lands.get(landCode) ?? null;
  }

  createFile(originalName: string, documentType: string) {
    const file: FileAssetRecord = {
      id: makeId("fil"),
      originalName,
      documentType,
      storageStatus: "UPLOADED_IPFS",
      cid: `bafy-demo-${Date.now()}`,
      hash: `0x${Date.now().toString(16)}file`,
      createdAt: nowIso()
    };
    this.files.set(file.id, file);
    return file;
  }

  getFile(id: string) {
    return this.files.get(id) ?? null;
  }

  listTransfers() {
    return Array.from(this.transfers.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  createTransfer(input: Omit<TransferRecord, "id" | "code" | "status" | "notes" | "createdAt" | "updatedAt">) {
    const transfer: TransferRecord = {
      ...input,
      id: makeId("trf"),
      code: `TRF-${Date.now()}`,
      status: "MOI_TAO_BIEN_DONG",
      notes: ["Ho so bien dong duoc tao"],
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    this.transfers.set(transfer.id, transfer);
    return transfer;
  }

  updateTransferStatus(id: string, status: TransferStatus, note: string) {
    const transfer = this.transfers.get(id);
    if (!transfer) return null;
    transfer.status = status;
    transfer.updatedAt = nowIso();
    transfer.notes.push(note);
    return transfer;
  }

  completeTransfer(id: string) {
    const transfer = this.transfers.get(id);
    if (!transfer) return null;

    const land = this.lands.get(transfer.landCode);
    if (!land) return null;

    transfer.status = "DA_DANG_KY_BIEN_DONG";
    transfer.updatedAt = nowIso();
    transfer.txHash = `0x${Date.now().toString(16)}transfer`;
    transfer.notes.push("Ho so bien dong da hoan tat");

    land.ownerRef = transfer.toUserRef;
    land.ownerDisplayName = transfer.toUserRef;
    land.status = "TRANSFERRED";
    land.txHash = transfer.txHash;
    land.history.unshift({
      type: "TRANSFER",
      message: `Chuyen nhuong sang ${transfer.toUserRef}`,
      txHash: transfer.txHash,
      createdAt: nowIso()
    });

    return { transfer, land };
  }

  getDashboardSummary() {
    const registrations = Array.from(this.registrations.values());
    const transfers = Array.from(this.transfers.values());

    return {
      registrations: {
        total: registrations.length,
        pending: registrations.filter((r) => ["CHO_TIEP_NHAN", "DA_TIEP_NHAN", "DANG_THAM_DINH_VPDKDD", "CHO_KY_CAP"].includes(r.status)).length,
        approved: registrations.filter((r) => r.status === "DA_CAP").length,
        rejected: registrations.filter((r) => r.status === "TU_CHOI").length,
        supplement: registrations.filter((r) => r.status === "CAN_BO_SUNG").length
      },
      transfers: {
        total: transfers.length,
        pending: transfers.filter((t) => t.status !== "DA_DANG_KY_BIEN_DONG" && t.status !== "TU_CHOI").length,
        completed: transfers.filter((t) => t.status === "DA_DANG_KY_BIEN_DONG").length,
        rejected: transfers.filter((t) => t.status === "TU_CHOI").length
      },
      blockchain: {
        latestTxCount: registrations.filter((r) => Boolean(r.txHash)).length + transfers.filter((t) => Boolean(t.txHash)).length
      }
    };
  }
}

export const demoStore = new DemoStore();
