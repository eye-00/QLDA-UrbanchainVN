import { Prisma, RegistrationStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import { asyncHandler, badRequestError, forbiddenError, notFoundError } from "../../lib/errors.js";
import { created, ok } from "../../lib/response.js";
import { prisma } from "../../lib/prisma.js";
import { AUTH_ROLES, requireAuth, requireRoles, type AuthenticatedRequest } from "../auth/auth.middleware.js";

const registrationStatusSchema = z.enum([
  "MOI_TAO",
  "CHO_TIEP_NHAN",
  "CAN_BO_SUNG",
  "DA_TIEP_NHAN",
  "CHO_XAC_NHAN_CAP_XA",
  "DA_XAC_NHAN_CAP_XA",
  "DANG_THAM_DINH_VPDKDD",
  "CHO_THUE",
  "CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH",
  "CHO_KY_CAP",
  "DA_KY_CAP",
  "DA_CAP",
  "DA_TRA_KET_QUA",
  "TU_CHOI"
]);

const createRegistrationSchema = z.object({
  applicantId: z.string().min(1).optional(),
  landInfo: z.object({
    provinceCode: z.string().min(1),
    communeName: z.string().min(1),
    parcelNumber: z.string().min(1),
    mapSheetNumber: z.string().min(1),
    area: z.coerce.number().positive(),
    landUsePurpose: z.string().min(1),
    address: z.string().min(1)
  }),
  ownerInfo: z.object({
    ownerType: z.string().min(1).default("INDIVIDUAL"),
    fullName: z.string().min(2),
    identityNumber: z.string().optional(),
    address: z.string().optional()
  }),
  attachedFileIds: z.array(z.string()).optional(),
  fileIds: z.array(z.string()).optional()
});

const listSchema = z.object({
  status: registrationStatusSchema.optional(),
  keyword: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

const submitSchema = z.object({
  note: z.string().min(3).optional()
});

const patchStatusSchema = z
  .object({
    status: registrationStatusSchema,
    reason: z.string().min(3).optional()
  })
  .superRefine((value, ctx) => {
    if ((value.status === "CAN_BO_SUNG" || value.status === "TU_CHOI") && !value.reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reason"],
        message: "reason is required for supplement/reject status"
      });
    }
  });

const communeConfirmSchema = z.object({
  confirmed: z.boolean(),
  notes: z.string().min(3).optional()
});

const taxTransferSchema = z.object({
  taxReferenceNo: z.string().min(3),
  notes: z.string().min(3).optional()
});

const approveSchema = z.object({
  approvalNumber: z.string().min(3).optional(),
  approvalDate: z.string().optional(),
  note: z.string().min(3).optional(),
  txHash: z.string().optional(),
  landCode: z.string().optional()
});

const blockchainSyncSchema = z.object({
  cid: z.string().min(3),
  metadataHash: z.string().min(3)
});

const requiredNoteSchema = z.object({
  note: z.string().min(3)
});

const allAuthenticatedRoles = [...AUTH_ROLES.citizen, ...AUTH_ROLES.officers];

function isCitizenRole(role: string) {
  return AUTH_ROLES.citizen.includes(role as (typeof AUTH_ROLES.citizen)[number]);
}

function parseNoteHistory(value: Prisma.JsonValue | null) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function appendNoteHistory(value: Prisma.JsonValue | null, note: string) {
  return [...parseNoteHistory(value), note];
}

function generateRegistrationCode() {
  const now = Date.now();
  const randomSuffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `REG-${new Date().getFullYear()}-${now}-${randomSuffix}`;
}

function toRegistrationItem(item: {
  id: string;
  code: string;
  applicantId: string;
  provinceCode: string;
  communeName: string;
  parcelNumber: string;
  mapSheetNumber: string;
  area: Prisma.Decimal;
  landUsePurpose: string;
  address: string;
  ownerType: string;
  ownerFullName: string;
  ownerIdentityNumber: string | null;
  ownerAddress: string | null;
  status: RegistrationStatus;
  noteHistory: Prisma.JsonValue | null;
  landCode: string | null;
  tokenId: number | null;
  txHash: string | null;
  ipfsCid: string | null;
  documentHash: string | null;
  createdAt: Date;
  updatedAt: Date;
  files?: Array<{
    id: string;
    documentType: string;
    storageStatus: string;
    originalName: string;
    cid: string | null;
    hash: string | null;
  }>;
}) {
  const notes = parseNoteHistory(item.noteHistory);
  return {
    id: item.id,
    code: item.code,
    applicantId: item.applicantId,
    status: item.status,
    landCode: item.landCode,
    tokenId: item.tokenId,
    txHash: item.txHash,
    ipfsCid: item.ipfsCid,
    documentHash: item.documentHash,
    landInfo: {
      provinceCode: item.provinceCode,
      communeName: item.communeName,
      parcelNumber: item.parcelNumber,
      mapSheetNumber: item.mapSheetNumber,
      area: Number(item.area),
      landUsePurpose: item.landUsePurpose,
      address: item.address
    },
    ownerInfo: {
      ownerType: item.ownerType,
      fullName: item.ownerFullName,
      identityNumber: item.ownerIdentityNumber,
      address: item.ownerAddress
    },
    notes,
    files:
      item.files?.map((file) => ({
        id: file.id,
        documentType: file.documentType,
        storageStatus: file.storageStatus,
        originalName: file.originalName,
        cid: file.cid,
        hash: file.hash
      })) ?? [],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

async function findRegistrationByParam(input: string) {
  return prisma.registration.findFirst({
    where: {
      OR: [{ id: input }, { code: input }]
    },
    include: { files: true }
  });
}

async function updateStatus(
  registrationId: string,
  status: RegistrationStatus,
  note: string,
  actor: AuthenticatedRequest["user"],
  payload: Record<string, unknown> = {}
) {
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId }
  });
  if (!registration) throw notFoundError("Không tìm thấy hồ sơ đăng ký");

  const updated = await prisma.registration.update({
    where: { id: registration.id },
    data: {
      status,
      noteHistory: appendNoteHistory(registration.noteHistory, note)
    },
    include: { files: true }
  });

  await writeAuditLog({
    actorId: actor.userId,
    action: "REGISTRATION_STATUS_UPDATED",
    entityType: "REGISTRATION",
    entityId: updated.id,
    payload: {
      previousStatus: registration.status,
      status,
      note,
      ...payload
    }
  });

  return updated;
}

export const registrationRouter = Router();

registrationRouter.use(requireAuth);

registrationRouter.get(
  "/",
  requireRoles(allAuthenticatedRoles),
  asyncHandler(async (req, res) => {
    const parsed = listSchema.safeParse(req.query);
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const { page, pageSize, status, keyword } = parsed.data;
    const where: Prisma.RegistrationWhereInput = {
      ...(status ? { status } : {}),
      ...(isCitizenRole(user.role) ? { applicantId: user.userId } : {}),
      ...(keyword
        ? {
            OR: [
              { code: { contains: keyword } },
              { ownerFullName: { contains: keyword } },
              { parcelNumber: { contains: keyword } },
              { mapSheetNumber: { contains: keyword } },
              { address: { contains: keyword } }
            ]
          }
        : {})
    };

    const [items, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        include: { files: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.registration.count({ where })
    ]);

    return ok(res, { items: items.map((item) => toRegistrationItem(item)), total });
  })
);

registrationRouter.post(
  "/",
  requireRoles(AUTH_ROLES.citizen),
  asyncHandler(async (req, res) => {
    const parsed = createRegistrationSchema.safeParse(req.body);
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const inputFileIds = parsed.data.attachedFileIds ?? parsed.data.fileIds ?? [];
    const code = generateRegistrationCode();
    const initialNote = "Hồ sơ được khởi tạo trên hệ thống";

    const record = await prisma.registration.create({
      data: {
        code,
        applicantId: user.userId,
        provinceCode: parsed.data.landInfo.provinceCode,
        communeName: parsed.data.landInfo.communeName,
        parcelNumber: parsed.data.landInfo.parcelNumber,
        mapSheetNumber: parsed.data.landInfo.mapSheetNumber,
        area: new Prisma.Decimal(parsed.data.landInfo.area),
        landUsePurpose: parsed.data.landInfo.landUsePurpose,
        address: parsed.data.landInfo.address,
        ownerType: parsed.data.ownerInfo.ownerType,
        ownerFullName: parsed.data.ownerInfo.fullName,
        ownerIdentityNumber: parsed.data.ownerInfo.identityNumber,
        ownerAddress: parsed.data.ownerInfo.address,
        noteHistory: [initialNote],
        files:
          inputFileIds.length > 0
            ? {
                connect: inputFileIds.map((id) => ({ id }))
              }
            : undefined
      },
      include: { files: true }
    });

    await writeAuditLog({
      actorId: user.userId,
      action: "REGISTRATION_CREATED",
      entityType: "REGISTRATION",
      entityId: record.id,
      payload: {
        registrationCode: record.code,
        provinceCode: record.provinceCode,
        communeName: record.communeName
      }
    });

    return created(
      res,
      {
        registrationId: record.id,
        registrationCode: record.code,
        status: record.status,
        registration: toRegistrationItem(record)
      },
      "Đã tạo hồ sơ đăng ký đất đai lần đầu"
    );
  })
);

registrationRouter.get(
  "/:id",
  requireRoles(allAuthenticatedRoles),
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const record = await findRegistrationByParam(String(req.params.id));
    if (!record) throw notFoundError("Không tìm thấy hồ sơ đăng ký");

    if (isCitizenRole(user.role) && record.applicantId !== user.userId) {
      throw forbiddenError("Bạn không có quyền xem hồ sơ này");
    }

    return ok(res, toRegistrationItem(record));
  })
);

registrationRouter.post(
  "/:id/submit",
  requireRoles(AUTH_ROLES.citizen),
  asyncHandler(async (req, res) => {
    const parsed = submitSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
    if (existing.applicantId !== user.userId) throw forbiddenError("Bạn không có quyền nộp hồ sơ này");

    const updated = await updateStatus(
      existing.id,
      "CHO_TIEP_NHAN",
      parsed.data.note ?? "Người dân đã nộp hồ sơ vào luồng tiếp nhận",
      user
    );
    return ok(res, toRegistrationItem(updated), "Đã chuyển hồ sơ sang trạng thái chờ tiếp nhận");
  })
);

registrationRouter.patch(
  "/:id/status",
  requireRoles(["RECEPTION_OFFICER", "COMMUNE_OFFICER", "LAND_REGISTRY_OFFICER", "APPROVAL_AUTHORITY", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const parsed = patchStatusSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");

    const note =
      parsed.data.reason ??
      `Cập nhật trạng thái hồ sơ sang ${parsed.data.status} bởi ${user.role}`;

    const updated = await updateStatus(existing.id, parsed.data.status, note, user);
    return ok(res, toRegistrationItem(updated), "Đã cập nhật trạng thái hồ sơ");
  })
);

registrationRouter.post(
  "/:id/commune-confirm",
  requireRoles(["COMMUNE_OFFICER", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const parsed = communeConfirmSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");

    const nextStatus: RegistrationStatus = parsed.data.confirmed ? "DA_XAC_NHAN_CAP_XA" : "CAN_BO_SUNG";
    const note =
      parsed.data.notes ??
      (parsed.data.confirmed
        ? "UBND cấp xã đã xác nhận thông tin hồ sơ"
        : "UBND cấp xã yêu cầu bổ sung thông tin hồ sơ");

    const updated = await updateStatus(existing.id, nextStatus, note, user, {
      confirmed: parsed.data.confirmed
    });
    return ok(res, toRegistrationItem(updated), "Đã cập nhật kết quả xác nhận cấp xã");
  })
);

registrationRouter.post(
  "/:id/tax-transfer",
  requireRoles(["LAND_REGISTRY_OFFICER", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const parsed = taxTransferSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");

    const updated = await updateStatus(
      existing.id,
      "CHO_THUE",
      parsed.data.notes ?? "Đã chuyển thông tin xác định nghĩa vụ tài chính sang cơ quan thuế",
      user,
      { taxReferenceNo: parsed.data.taxReferenceNo }
    );
    return ok(res, toRegistrationItem(updated), "Đã chuyển thông tin nghĩa vụ tài chính");
  })
);

registrationRouter.post(
  "/:id/approve",
  requireRoles(["APPROVAL_AUTHORITY", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const parsed = approveSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");

    const updated = await prisma.registration.update({
      where: { id: existing.id },
      data: {
        status: "DA_CAP",
        landCode: parsed.data.landCode ?? existing.landCode ?? `LAND-${Date.now()}`,
        txHash: parsed.data.txHash ?? existing.txHash ?? `0x${Date.now().toString(16)}approved`,
        noteHistory: appendNoteHistory(
          existing.noteHistory,
          parsed.data.note ?? "Hồ sơ đã được phê duyệt/ký cấp"
        )
      },
      include: { files: true }
    });

    await writeAuditLog({
      actorId: user.userId,
      action: "REGISTRATION_APPROVED",
      entityType: "REGISTRATION",
      entityId: updated.id,
      payload: {
        approvalNumber: parsed.data.approvalNumber ?? null,
        approvalDate: parsed.data.approvalDate ?? null,
        landCode: updated.landCode,
        txHash: updated.txHash
      }
    });

    return ok(res, toRegistrationItem(updated), "Đã phê duyệt hồ sơ đăng ký");
  })
);

registrationRouter.post(
  "/:id/blockchain-sync",
  requireRoles(["LAND_REGISTRY_OFFICER", "APPROVAL_AUTHORITY", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const parsed = blockchainSyncSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");

    const updated = await prisma.registration.update({
      where: { id: existing.id },
      data: {
        ipfsCid: parsed.data.cid,
        documentHash: parsed.data.metadataHash,
        txHash: existing.txHash ?? `0x${Date.now().toString(16)}chain`,
        noteHistory: appendNoteHistory(existing.noteHistory, "Đã đồng bộ metadata hồ sơ lên blockchain")
      },
      include: { files: true }
    });

    await writeAuditLog({
      actorId: user.userId,
      action: "REGISTRATION_BLOCKCHAIN_SYNCED",
      entityType: "REGISTRATION",
      entityId: updated.id,
      payload: {
        cid: parsed.data.cid,
        metadataHash: parsed.data.metadataHash,
        txHash: updated.txHash
      }
    });

    return ok(
      res,
      {
        registrationId: updated.id,
        txHash: updated.txHash,
        cid: updated.ipfsCid,
        metadataHash: updated.documentHash
      },
      "Đã đồng bộ bản ghi số"
    );
  })
);

registrationRouter.post(
  "/:id/request-supplement",
  requireRoles(["RECEPTION_OFFICER", "COMMUNE_OFFICER", "LAND_REGISTRY_OFFICER"]),
  asyncHandler(async (req, res) => {
    const parsed = requiredNoteSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");

    const updated = await updateStatus(existing.id, "CAN_BO_SUNG", parsed.data.note, user);
    return ok(res, toRegistrationItem(updated), "Đã cập nhật yêu cầu bổ sung hồ sơ");
  })
);

registrationRouter.post(
  "/:id/accept",
  requireRoles(["RECEPTION_OFFICER"]),
  asyncHandler(async (req, res) => {
    const parsed = submitSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");

    const updated = await updateStatus(
      existing.id,
      "DA_TIEP_NHAN",
      parsed.data.note ?? "Bộ phận một cửa đã tiếp nhận hồ sơ",
      user
    );
    return ok(res, toRegistrationItem(updated), "Đã tiếp nhận hồ sơ hợp lệ");
  })
);

registrationRouter.post(
  "/:id/reject",
  requireRoles(["LAND_REGISTRY_OFFICER", "APPROVAL_AUTHORITY"]),
  asyncHandler(async (req, res) => {
    const parsed = requiredNoteSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");

    const updated = await updateStatus(existing.id, "TU_CHOI", parsed.data.note, user);
    return ok(res, toRegistrationItem(updated), "Đã từ chối hồ sơ");
  })
);
