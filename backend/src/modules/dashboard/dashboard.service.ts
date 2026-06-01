import { prisma } from "../../lib/prisma.js";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";

export async function getDashboardData(actor: AuthenticatedRequest["user"]) {
  if (actor.role === "ADMIN") {
    const [
      totalUsers,
      activeUsers,
      lockedUsers,
      totalOrganizations,
      activeOrganizations,
      totalLands,
      totalRegistrations,
      pendingRegistrations
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { status: "LOCKED" } }),
      prisma.organization.count(),
      prisma.organization.count({ where: { isActive: true } }),
      prisma.landParcel.count(),
      prisma.registration.count(),
      prisma.registration.count({
        where: {
          status: { in: ["CHO_TIEP_NHAN", "DA_TIEP_NHAN", "CAN_BO_SUNG"] }
        }
      })
    ]);

    return {
      role: actor.role,
      summary: {
        users: {
          total: totalUsers,
          active: activeUsers,
          locked: lockedUsers
        },
        organizations: {
          total: totalOrganizations,
          active: activeOrganizations
        },
        lands: { total: totalLands },
        registrations: {
          total: totalRegistrations,
          pending: pendingRegistrations
        }
      }
    };
  }

  if (actor.role === "LAND_REGISTRY_OFFICER") {
    const [totalLands, appraisingQueue, waitingApproval, supplementQueue] = await Promise.all([
      prisma.landParcel.count(),
      prisma.registration.count({
        where: { status: "DANG_THAM_DINH_VPDKDD" }
      }),
      prisma.registration.count({ where: { status: "CHO_KY_CAP" } }),
      prisma.registration.count({ where: { status: "CAN_BO_SUNG" } })
    ]);
    return {
      role: actor.role,
      summary: {
        lands: { total: totalLands },
        queue: {
          appraising: appraisingQueue,
          waitingApproval,
          supplement: supplementQueue
        }
      }
    };
  }

  if (actor.role === "RECEPTION_OFFICER") {
    const [submittedQueue, supplementQueue, acceptedQueue] = await Promise.all([
      prisma.registration.count({ where: { status: "CHO_TIEP_NHAN" } }),
      prisma.registration.count({ where: { status: "CAN_BO_SUNG" } }),
      prisma.registration.count({ where: { status: "DA_TIEP_NHAN" } })
    ]);
    return {
      role: actor.role,
      summary: {
        queue: {
          submitted: submittedQueue,
          supplement: supplementQueue,
          accepted: acceptedQueue
        }
      }
    };
  }

  if (actor.role === "COMMUNE_OFFICER") {
    const [pendingCommune, confirmedCommune] = await Promise.all([
      prisma.registration.count({ where: { status: "CHO_XAC_NHAN_CAP_XA" } }),
      prisma.registration.count({ where: { status: "DA_XAC_NHAN_CAP_XA" } })
    ]);
    return {
      role: actor.role,
      summary: {
        queue: { pendingCommune, confirmedCommune }
      }
    };
  }

  if (actor.role === "APPROVAL_AUTHORITY") {
    const [waitingApproval, approved, rejected] = await Promise.all([
      prisma.registration.count({ where: { status: "CHO_KY_CAP" } }),
      prisma.registration.count({ where: { status: "DA_CAP" } }),
      prisma.registration.count({ where: { status: "TU_CHOI" } })
    ]);
    return {
      role: actor.role,
      summary: {
        queue: { waitingApproval, approved, rejected }
      }
    };
  }

  if (actor.role === "TAX_OFFICER") {
    const [waitingTax, completedTax, cancelledTax] = await Promise.all([
      prisma.registrationPaymentObligation.count({
        where: { type: "LAND_FINANCIAL_OBLIGATION", status: "PENDING" }
      }),
      prisma.registrationPaymentObligation.count({
        where: { type: "LAND_FINANCIAL_OBLIGATION", status: "CONFIRMED" }
      }),
      prisma.registrationPaymentObligation.count({
        where: { type: "LAND_FINANCIAL_OBLIGATION", status: "CANCELLED" }
      })
    ]);
    return {
      role: actor.role,
      summary: {
        obligations: { waitingTax, completedTax, cancelledTax }
      }
    };
  }

  if (actor.role === "AUDITOR") {
    const [totalAuditLogs, legalTransitionLogs, blockchainSyncLogs] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({
        where: { action: "REGISTRATION_STATUS_UPDATED" }
      }),
      prisma.auditLog.count({
        where: { action: "REGISTRATION_BLOCKCHAIN_SYNCED" }
      })
    ]);
    return {
      role: actor.role,
      summary: {
        audits: { totalAuditLogs, legalTransitionLogs, blockchainSyncLogs }
      }
    };
  }

  const [myRegistrations, myApprovedRegistrations, myTransfers, myCompletedTransfers] =
    await Promise.all([
      prisma.registration.count({ where: { applicantId: actor.userId } }),
      prisma.registration.count({
        where: { applicantId: actor.userId, status: "DA_CAP" }
      }),
      prisma.transferRequest.count({ where: { fromUserId: actor.userId } }),
      prisma.transferRequest.count({
        where: { fromUserId: actor.userId, status: "DA_DANG_KY_BIEN_DONG" }
      })
    ]);

  return {
    role: actor.role,
    summary: {
      registrations: {
        total: myRegistrations,
        approved: myApprovedRegistrations
      },
      transfers: { total: myTransfers, completed: myCompletedTransfers }
    }
  };
}
