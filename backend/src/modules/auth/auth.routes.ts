import { createHash, randomBytes } from "node:crypto";
import { Prisma, User, AccountType } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import { asyncHandler, badRequestError, conflictError, forbiddenError, notFoundError, unauthorizedError } from "../../lib/errors.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { created, ok } from "../../lib/response.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, signAccessToken, type AuthenticatedRequest } from "./auth.middleware.js";

const roleSchema = z.enum([
  "CITIZEN",
  "BUSINESS",
  "RECEPTION_OFFICER",
  "COMMUNE_OFFICER",
  "LAND_REGISTRY_OFFICER",
  "TAX_OFFICER",
  "APPROVAL_AUTHORITY",
  "AUDITOR",
  "ADMIN"
]);
const selfRegisterRoleSchema = z.enum(["CITIZEN", "BUSINESS"]);

const registerSchema = z.object({
  role: roleSchema.default("CITIZEN"),
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  identityNumber: z.string().optional(),
  organizationId: z.string().optional(),
  accountType: z.enum(["CITIZEN", "STAFF", "AGENCY_ADMIN", "SYSTEM_ADMIN"]).default("CITIZEN"),
  citizenId: z.string().min(6).optional()
});

const loginSchema = z.object({
  loginType: z.enum(["CITIZEN", "STAFF", "ADMIN"]),
  identifier: z.string().min(3),
  password: z.string().min(8)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(20)
});

const logoutSchema = z.object({
  refreshToken: z.string().min(20).optional()
});

const passwordResetRequestSchema = z.object({
  email: z.string().email()
});

const passwordResetConfirmSchema = z.object({
  email: z.string().email(),
  token: z.string().min(8),
  newPassword: z.string().min(8)
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8)
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: "New password must be different from current password"
  });

const vneidMockSchema = z.object({
  identityNumber: z.string().min(6).optional()
});

export const authRouter = Router();

const LOCK_THRESHOLD = Number(process.env.AUTH_MAX_FAILED_ATTEMPTS || 5);
const AUTO_LOCK_MINUTES = Number(process.env.AUTH_LOCK_MINUTES || 15);
const REFRESH_TTL_DAYS = Number(process.env.AUTH_REFRESH_TTL_DAYS || 7);
const RESET_TOKEN_TTL_MINUTES = Number(process.env.AUTH_RESET_TOKEN_TTL_MINUTES || 15);

function publicUser(user: Pick<User, "id" | "fullName" | "email" | "role" | "accountType" | "organizationId">) {
  return {
    userId: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    accountType: user.accountType,
    roles: [user.role],
    primaryRole: user.role,
    organizationId: user.organizationId
  };
}

function resolvePortalMapping(accountType: AccountType) {
  if (accountType === "CITIZEN") {
    return {
      portal: "Portal người dân",
      redirectTo: "/citizen/dashboard"
    };
  }
  if (accountType === "STAFF") {
    return {
      portal: "Portal cán bộ",
      redirectTo: "/staff/dashboard"
    };
  }
  if (accountType === "AGENCY_ADMIN") {
    return {
      portal: "Portal quản trị cơ quan",
      redirectTo: "/admin/dashboard"
    };
  }
  if (accountType === "SYSTEM_ADMIN") {
    return {
      portal: "Portal quản trị hệ thống",
      redirectTo: "/system/dashboard"
    };
  }
  return {
    portal: "Portal người dân",
    redirectTo: "/citizen/dashboard"
  };
}

function computeSessionExpiry() {
  return new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
}

function generatePlainToken(bytes = 48) {
  return randomBytes(bytes).toString("hex");
}

function computeRefreshTokenFingerprint(refreshToken: string) {
  return createHash("sha256").update(refreshToken).digest("hex");
}

function isVneidMockAllowed() {
  return process.env.NODE_ENV !== "production";
}

async function createSession(user: Pick<User, "id">) {
  const refreshToken = generatePlainToken();
  await prisma.authSession.create({
    data: {
      userId: user.id,
      refreshTokenHash: hashPassword(refreshToken),
      refreshTokenFingerprint: computeRefreshTokenFingerprint(refreshToken),
      expiresAt: computeSessionExpiry()
    }
  });
  return refreshToken;
}

async function findActiveSessionByRefreshToken(refreshToken: string) {
  const session = await prisma.authSession.findFirst({
    where: {
      refreshTokenFingerprint: computeRefreshTokenFingerprint(refreshToken),
      revokedAt: null,
      expiresAt: { gt: new Date() }
    },
    include: { user: true }
  });

  if (!session) return null;
  if (!verifyPassword(refreshToken, session.refreshTokenHash)) return null;
  return session;
}

async function findActiveUserSessionByRefreshToken(userId: string, refreshToken: string) {
  const session = await prisma.authSession.findFirst({
    where: {
      userId,
      refreshTokenFingerprint: computeRefreshTokenFingerprint(refreshToken),
      revokedAt: null,
      expiresAt: { gt: new Date() }
    }
  });

  if (!session) return null;
  if (!verifyPassword(refreshToken, session.refreshTokenHash)) return null;
  return session;
}

function shouldAutoUnlock(user: Pick<User, "status" | "lockedUntil">) {
  return Boolean(user.status === "LOCKED" && user.lockedUntil && user.lockedUntil.getTime() <= Date.now());
}

async function ensureLoginAllowed(user: User) {
  if (shouldAutoUnlock(user)) {
    return prisma.user.update({
      where: { id: user.id },
      data: {
        status: "ACTIVE",
        lockedUntil: null,
        failedLoginAttempts: 0
      }
    });
  }
  return user;
}

async function recordFailedLogin(user: User | null, emailOrId: string) {
  if (!user) {
    await writeAuditLog({
      action: "AUTH_LOGIN_FAILED",
      entityType: "USER",
      entityId: emailOrId.toLowerCase(),
      payload: { identifier: emailOrId.toLowerCase(), reason: "USER_NOT_FOUND" }
    });
    return;
  }

  const nextAttempts = user.failedLoginAttempts + 1;
  const shouldLock = user.status === "ACTIVE" && nextAttempts >= LOCK_THRESHOLD;
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: nextAttempts,
      ...(shouldLock
        ? {
            status: "LOCKED",
            lockedUntil: new Date(Date.now() + AUTO_LOCK_MINUTES * 60 * 1000)
          }
        : {})
    }
  });

  await writeAuditLog({
    actorId: user.id,
    action: shouldLock ? "AUTH_ACCOUNT_LOCKED_AUTO" : "AUTH_LOGIN_FAILED",
    entityType: "USER",
    entityId: user.id,
    payload: {
      email: user.email,
      failedLoginAttempts: updated.failedLoginAttempts,
      lockedUntil: updated.lockedUntil?.toISOString() ?? null
    }
  });
}

async function resetLoginFailureState(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date()
    }
  });
}

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const registerRole = selfRegisterRoleSchema.safeParse(parsed.data.role);
    if (!registerRole.success) {
      await writeAuditLog({
        action: "AUTH_REGISTER_BLOCKED_ROLE",
        entityType: "USER",
        entityId: parsed.data.email.toLowerCase(),
        payload: {
          attemptedRole: parsed.data.role,
          email: parsed.data.email.toLowerCase()
        }
      });
      throw forbiddenError("Public register only supports CITIZEN or BUSINESS roles");
    }

    try {
      const accountType = parsed.data.accountType ?? AccountType.CITIZEN;
      const citizenId = parsed.data.citizenId || parsed.data.identityNumber || `cit_${Date.now()}`;

      const user = await prisma.user.create({
        data: {
          role: registerRole.data,
          fullName: parsed.data.fullName,
          email: parsed.data.email.toLowerCase(),
          passwordHash: hashPassword(parsed.data.password),
          identityNumber: parsed.data.identityNumber,
          organizationId: parsed.data.organizationId,
          status: "ACTIVE",
          accountType,
          ...(accountType === AccountType.CITIZEN
            ? {
                citizenProfile: {
                  create: {
                    citizenId,
                    fullName: parsed.data.fullName,
                    phone: parsed.data.phone,
                    address: ""
                  }
                }
              }
            : {})
        }
      });

      await writeAuditLog({
        actorId: user.id,
        action: "AUTH_REGISTER_SUCCESS",
        entityType: "USER",
        entityId: user.id,
        payload: { role: user.role }
      });

      return created(
        res,
        {
          userId: user.id,
          accountType: user.accountType,
          role: user.role,
          status: user.status
        },
        "Created successfully"
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw conflictError("Email or Citizen ID already exists");
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw badRequestError("Organization is invalid");
      }
      throw error;
    }
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const { loginType, identifier, password } = parsed.data;
    let user: User | null = null;

    if (loginType === "CITIZEN") {
      const profile = await prisma.citizenProfile.findUnique({
        where: { citizenId: identifier },
        include: { user: true }
      });
      if (profile) {
        user = profile.user;
      }
    } else if (loginType === "STAFF") {
      const profile = await prisma.staffProfile.findFirst({
        where: {
          OR: [
            { officialUsername: identifier },
            { staffCode: identifier }
          ]
        },
        include: { user: true }
      });
      if (profile) {
        user = profile.user;
      }
    } else if (loginType === "ADMIN") {
      user = await prisma.user.findUnique({
        where: { username: identifier }
      });
    }

    if (!user) {
      await recordFailedLogin(null, identifier);
      throw badRequestError("Invalid identifier or password");
    }

    if (loginType === "CITIZEN" && user.accountType !== "CITIZEN") {
      throw forbiddenError("Invalid portal boundary for citizen");
    }
    if (loginType === "STAFF" && user.accountType !== "STAFF") {
      throw forbiddenError("Invalid portal boundary for staff");
    }
    if (loginType === "ADMIN" && user.accountType !== "AGENCY_ADMIN" && user.accountType !== "SYSTEM_ADMIN") {
      throw forbiddenError("Invalid portal boundary for admin");
    }

    const availableUser = await ensureLoginAllowed(user);
    if (availableUser.status !== "ACTIVE") {
      await recordFailedLogin(availableUser, identifier);
      throw badRequestError("Account is locked", [
        {
          field: "status",
          code: "ACCOUNT_LOCKED",
          detail: `Tài khoản của bạn đã bị khóa tạm thời. Vui lòng thử lại sau ${availableUser.lockedUntil?.toLocaleTimeString("vi-VN") || "ít phút"}.`,
          lockedUntil: availableUser.lockedUntil?.toISOString()
        }
      ]);
    }

    if (!verifyPassword(password, availableUser.passwordHash)) {
      await recordFailedLogin(availableUser, identifier);
      throw badRequestError("Invalid identifier or password");
    }

    await resetLoginFailureState(availableUser.id);
    const refreshToken = await createSession(availableUser);
    const latestUser = await prisma.user.findUniqueOrThrow({ where: { id: availableUser.id } });
    const accessToken = signAccessToken({
      userId: latestUser.id,
      fullName: latestUser.fullName,
      email: latestUser.email,
      role: latestUser.role
    });

    await writeAuditLog({
      actorId: latestUser.id,
      action: "AUTH_LOGIN_SUCCESS",
      entityType: "USER",
      entityId: latestUser.id,
      payload: { role: latestUser.role }
    });

    const portalInfo = resolvePortalMapping(latestUser.accountType);

    return ok(res, {
      accessToken,
      refreshToken,
      user: publicUser(latestUser),
      ...portalInfo
    });
  })
);


authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const currentRefreshToken = parsed.data.refreshToken;
    const session = await findActiveSessionByRefreshToken(currentRefreshToken);
    if (!session) throw unauthorizedError("Invalid refresh token");
    if (session.user.status !== "ACTIVE") throw unauthorizedError("Invalid session");

    const now = new Date();
    const nextRefreshToken = generatePlainToken();
    const rotateResult = await prisma.authSession.updateMany({
      where: {
        id: session.id,
        refreshTokenHash: session.refreshTokenHash,
        refreshTokenFingerprint: computeRefreshTokenFingerprint(currentRefreshToken),
        revokedAt: null,
        expiresAt: { gt: now }
      },
      data: {
        refreshTokenHash: hashPassword(nextRefreshToken),
        refreshTokenFingerprint: computeRefreshTokenFingerprint(nextRefreshToken),
        expiresAt: computeSessionExpiry(),
        lastUsedAt: now
      }
    });
    if (rotateResult.count !== 1) throw unauthorizedError("Invalid refresh token");

    const accessToken = signAccessToken({
      userId: session.user.id,
      fullName: session.user.fullName,
      email: session.user.email,
      role: session.user.role
    });

    await writeAuditLog({
      actorId: session.user.id,
      action: "AUTH_REFRESH_SUCCESS",
      entityType: "AUTH_SESSION",
      entityId: session.id,
      payload: {
        userId: session.user.id
      }
    });

    return ok(res, {
      accessToken,
      refreshToken: nextRefreshToken,
      user: publicUser(session.user)
    });
  })
);

authRouter.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = logoutSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
    const authUser = (req as AuthenticatedRequest).user;
    const now = new Date();

    if (parsed.data.refreshToken) {
      const candidate = await findActiveUserSessionByRefreshToken(authUser.userId, parsed.data.refreshToken);
      if (!candidate) return ok(res, { revokedSessions: 0 }, "No active session was matched");

      await prisma.authSession.update({
        where: { id: candidate.id },
        data: { revokedAt: now }
      });
      await writeAuditLog({
        actorId: authUser.userId,
        action: "AUTH_LOGOUT",
        entityType: "AUTH_SESSION",
        entityId: candidate.id
      });
      return ok(res, { revokedSessions: 1 }, "Logout successful");
    }

    const revokeResult = await prisma.authSession.updateMany({
      where: { userId: authUser.userId, revokedAt: null },
      data: { revokedAt: now }
    });

    await writeAuditLog({
      actorId: authUser.userId,
      action: "AUTH_LOGOUT_ALL",
      entityType: "USER",
      entityId: authUser.userId,
      payload: { revokedSessions: revokeResult.count }
    });

    return ok(res, { revokedSessions: revokeResult.count }, "Logout successful");
  })
);

authRouter.post(
  "/password/reset-request",
  asyncHandler(async (req, res) => {
    const parsed = passwordResetRequestSchema.safeParse(req.body);
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    const resetToken = generatePlainToken(24);

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetTokenHash: hashPassword(resetToken),
          passwordResetExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000)
        }
      });

      await writeAuditLog({
        actorId: user.id,
        action: "AUTH_PASSWORD_RESET_REQUESTED",
        entityType: "USER",
        entityId: user.id
      });
    } else {
      await writeAuditLog({
        action: "AUTH_PASSWORD_RESET_REQUESTED_UNKNOWN",
        entityType: "USER",
        entityId: parsed.data.email.toLowerCase()
      });
    }

    return ok(
      res,
      {
        accepted: true,
        ...(process.env.NODE_ENV !== "production" ? { resetToken } : {})
      },
      "If the account exists, reset instructions have been created"
    );
  })
);

authRouter.post(
  "/password/reset-confirm",
  asyncHandler(async (req, res) => {
    const parsed = passwordResetConfirmSchema.safeParse(req.body);
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() }
    });
    if (!user || !user.passwordResetTokenHash || !user.passwordResetExpiresAt) {
      throw badRequestError("Reset token is invalid");
    }
    if (user.passwordResetExpiresAt.getTime() < Date.now()) {
      throw badRequestError("Reset token is expired");
    }
    if (!verifyPassword(parsed.data.token, user.passwordResetTokenHash)) {
      throw badRequestError("Reset token is invalid");
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashPassword(parsed.data.newPassword),
          status: "ACTIVE",
          failedLoginAttempts: 0,
          lockedUntil: null,
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null
        }
      }),
      prisma.authSession.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() }
      }),
      prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: "AUTH_PASSWORD_RESET_CONFIRMED",
          entityType: "USER",
          entityId: user.id
        }
      })
    ]);

    return ok(res, { reset: true }, "Password has been reset");
  })
);

authRouter.post(
  "/change-password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
    const authUser = (req as AuthenticatedRequest).user;
    const user = await prisma.user.findUnique({ where: { id: authUser.userId } });
    if (!user) throw notFoundError("User not found");
    if (!verifyPassword(parsed.data.currentPassword, user.passwordHash)) {
      throw badRequestError("Current password is invalid");
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashPassword(parsed.data.newPassword),
          failedLoginAttempts: 0,
          lockedUntil: null,
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null
        }
      }),
      prisma.authSession.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() }
      }),
      prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: "AUTH_PASSWORD_CHANGED",
          entityType: "USER",
          entityId: user.id
        }
      })
    ]);

    return ok(res, { changed: true }, "Password has been changed");
  })
);

authRouter.post(
  "/vneid/mock",
  asyncHandler(async (req, res) => {
    if (!isVneidMockAllowed()) throw forbiddenError("VNeID mock endpoint is not enabled");

    const parsed = vneidMockSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const citizenId = parsed.data.identityNumber ?? "012345678901";
    const profile = await prisma.citizenProfile.findUnique({
      where: { citizenId },
      include: { user: true }
    });

    let user = profile?.user ?? null;
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: "citizen@urbanchain.vn" }
      });
    }

    if (!user || user.status !== "ACTIVE") throw notFoundError("Mock VNeID user is not available");

    await resetLoginFailureState(user.id);
    const refreshToken = await createSession(user);
    const latestUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { citizenProfile: true, staffProfile: true }
    });
    const accessToken = signAccessToken({
      userId: latestUser.id,
      fullName: latestUser.fullName,
      email: latestUser.email,
      role: latestUser.role
    });

    await writeAuditLog({
      actorId: latestUser.id,
      action: "AUTH_VNEID_MOCK_LOGIN_SUCCESS",
      entityType: "USER",
      entityId: latestUser.id
    });

    const portalInfo = resolvePortalMapping(latestUser.accountType);

    return ok(
      res,
      {
        accessToken,
        refreshToken,
        user: publicUser(latestUser),
        ...portalInfo,
        identity: {
          provider: "VNEID_MOCK",
          identityNumber: citizenId,
          verified: true
        }
      },
      "Dang nhap VNeID mo phong thanh cong"
    );
  })
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const authUser = (req as AuthenticatedRequest).user;
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      include: { citizenProfile: true, staffProfile: true }
    });
    if (!user) throw notFoundError("User not found");
    return ok(res, publicUser(user));
  })
);
