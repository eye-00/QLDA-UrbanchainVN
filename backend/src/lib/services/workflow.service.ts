import { RegistrationStatus, UserRole } from "@prisma/client";
import { prisma } from "../prisma.js";
import { writeAuditLog } from "./audit.service.js";
import { badRequestError, conflictError, forbiddenError } from "../errors.js";
import { AuthenticatedRequest } from "../../modules/auth/auth.middleware.js";

const ROLE_ALLOWED_TARGET_STATUS: Record<UserRole, RegistrationStatus[]> = {
  CITIZEN: ["CHO_TIEP_NHAN"],
  BUSINESS: ["CHO_TIEP_NHAN"],
  RECEPTION_OFFICER: ["DA_TIEP_NHAN", "CAN_BO_SUNG", "CHO_XAC_NHAN_CAP_XA"],
  COMMUNE_OFFICER: ["DA_XAC_NHAN_CAP_XA", "CAN_BO_SUNG"],
  LAND_REGISTRY_OFFICER: [
    "DANG_THAM_DINH_VPDKDD",
    "CHO_THUE",
    "CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH",
    "CHO_KY_CAP",
    "DA_CAP_NHAT_HO_SO_DIA_CHINH",
    "CAN_BO_SUNG",
    "TU_CHOI"
  ],
  APPROVAL_AUTHORITY: ["DA_KY_CAP", "TU_CHOI", "DA_CAP"],
  TAX_OFFICER: ["DA_HOAN_THANH_NGHIA_VU_TAI_CHINH", "CAN_BO_SUNG"],
  AUDITOR: [],
  ADMIN: [
    "MOI_TAO",
    "CHO_TIEP_NHAN",
    "CAN_BO_SUNG",
    "DA_TIEP_NHAN",
    "CHO_XAC_NHAN_CAP_XA",
    "DA_XAC_NHAN_CAP_XA",
    "DANG_THAM_DINH_VPDKDD",
    "CHO_THUE",
    "CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH",
    "DA_HOAN_THANH_NGHIA_VU_TAI_CHINH",
    "CHO_KY_CAP",
    "DA_KY_CAP",
    "DA_CAP_NHAT_HO_SO_DIA_CHINH",
    "DA_GHI_BLOCKCHAIN",
    "DA_CAP",
    "DA_TRA_KET_QUA",
    "HUY_HO_SO",
    "TU_CHOI"
  ]
};

const STATUS_TRANSITION_GRAPH: Partial<Record<RegistrationStatus, RegistrationStatus[]>> = {
  MOI_TAO: ["CHO_TIEP_NHAN"],
  CHO_TIEP_NHAN: ["DA_TIEP_NHAN", "CAN_BO_SUNG", "TU_CHOI"],
  DA_TIEP_NHAN: ["CHO_XAC_NHAN_CAP_XA", "DA_XAC_NHAN_CAP_XA", "CAN_BO_SUNG"],
  CHO_XAC_NHAN_CAP_XA: ["DA_XAC_NHAN_CAP_XA", "CAN_BO_SUNG"],
  DA_XAC_NHAN_CAP_XA: [
    "DANG_THAM_DINH_VPDKDD",
    "CHO_THUE",
    "CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH",
    "CAN_BO_SUNG"
  ],
  DANG_THAM_DINH_VPDKDD: [
    "CHO_THUE",
    "CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH",
    "CHO_KY_CAP",
    "CAN_BO_SUNG",
    "TU_CHOI"
  ],
  CHO_THUE: ["CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH"],
  CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH: ["DA_HOAN_THANH_NGHIA_VU_TAI_CHINH", "CAN_BO_SUNG"],
  DA_HOAN_THANH_NGHIA_VU_TAI_CHINH: ["CHO_KY_CAP"],
  CHO_KY_CAP: ["DA_KY_CAP", "TU_CHOI", "DA_CAP"],
  DA_KY_CAP: ["DA_CAP_NHAT_HO_SO_DIA_CHINH", "DA_CAP"],
  DA_CAP_NHAT_HO_SO_DIA_CHINH: ["DA_GHI_BLOCKCHAIN", "DA_CAP", "DA_TRA_KET_QUA"],
  DA_CAP: ["DA_GHI_BLOCKCHAIN", "DA_TRA_KET_QUA"],
  DA_GHI_BLOCKCHAIN: ["DA_TRA_KET_QUA"]
};

export function assertTransitionAllowed(
  currentStatus: RegistrationStatus,
  nextStatus: RegistrationStatus,
  actorRole: UserRole
) {
  if (nextStatus === "DA_GHI_BLOCKCHAIN")
    throw conflictError("Không được chuyển trực tiếp sang DA_GHI_BLOCKCHAIN");
  const allowedNext = STATUS_TRANSITION_GRAPH[currentStatus] ?? [];
  if (!allowedNext.includes(nextStatus))
    throw badRequestError(`Không thể chuyển từ ${currentStatus} sang ${nextStatus}`);
  if (actorRole === "ADMIN") return;
  const allowedByRole = ROLE_ALLOWED_TARGET_STATUS[actorRole] ?? [];
  if (!allowedByRole.includes(nextStatus))
    throw forbiddenError(`Vai trò ${actorRole} không được chuyển sang ${nextStatus}`);
}

export async function ensureProcedureAndAuthority(
  registration: { procedureCode: string | null },
  actorRole: UserRole
) {
  if (!registration.procedureCode) throw badRequestError("Hồ sơ chưa gắn procedureCode");
  const procedure = await prisma.legalProcedure.findUnique({
    where: { procedureCode: registration.procedureCode }
  });
  if (!procedure || !procedure.isActive) throw badRequestError("Thủ tục pháp lý không tồn tại");
  if (actorRole === "ADMIN" || ["CITIZEN", "BUSINESS"].includes(actorRole)) return procedure;
  const allowedActors = (
    Array.isArray(procedure.authorityActors) ? procedure.authorityActors : []
  ) as string[];
  if (!allowedActors.includes(actorRole))
    throw forbiddenError(`Vai trò ${actorRole} không thuộc authority matrix`);
  return procedure;
}

export async function updateRegistrationStatus(
  registrationId: string,
  nextStatus: RegistrationStatus,
  note: string,
  actor: AuthenticatedRequest["user"],
  legalBasisCode: string
) {
  const current = await prisma.registration.findUnique({
    where: { id: registrationId },
    select: { noteHistory: true }
  });
  const noteHistory = Array.isArray(current?.noteHistory)
    ? [...(current!.noteHistory as string[]), note]
    : [note];

  const updated = await prisma.registration.update({
    where: { id: registrationId },
    data: {
      status: nextStatus,
      noteHistory,
      lastStatusChangedById: actor.userId,
      lastStatusChangedAt: new Date(),
      legalBasisCode
    }
  });

  await writeAuditLog({
    actorId: actor.userId,
    action: "REGISTRATION_STATUS_CHANGED",
    entityType: "REGISTRATION",
    entityId: registrationId,
    payload: { nextStatus, note, legalBasisCode }
  });

  return updated;
}
