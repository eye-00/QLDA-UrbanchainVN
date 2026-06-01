import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { User } from "@prisma/client";
import { writeAuditLog } from "../../lib/services/audit.service.js";
import {
  badRequestError,
  conflictError,
  forbiddenError,
  notFoundError,
  unauthorizedError
} from "../../lib/errors.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { prisma } from "../../lib/prisma.js";
import { signAccessToken } from "./auth.middleware.js";
import { selfRegisterRoleSchema } from "./auth.validation.js";
import type {
  RegisterInput,
  LoginInput,
  RefreshInput,
  PasswordResetRequestInput,
  PasswordResetConfirmInput,
  ChangePasswordInput
} from "./auth.validation.js";

const LOCK_THRESHOLD = Number(process.env.AUTH_MAX_FAILED_ATTEMPTS || 5);
const AUTO_LOCK_MINUTES = Number(process.env.AUTH_LOCK_MINUTES || 15);
const REFRESH_TTL_DAYS = Number(process.env.AUTH_REFRESH_TTL_DAYS || 7);
const RESET_TOKEN_TTL_MINUTES = Number(process.env.AUTH_RESET_TOKEN_TTL_MINUTES || 15);

function computeSessionExpiry() {
  return new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
}

function generatePlainToken(bytes = 48) {
  return randomBytes(bytes).toString("hex");
}

function computeRefreshTokenFingerprint(refreshToken: string) {
  return createHash("sha256").update(refreshToken).digest("hex");
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
  return Boolean(
    user.status === "LOCKED" && user.lockedUntil && user.lockedUntil.getTime() <= Date.now()
  );
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

async function recordFailedLogin(user: User | null, email: string) {
  if (!user) {
    await writeAuditLog({
      action: "AUTH_LOGIN_FAILED",
      entityType: "USER",
      entityId: email.toLowerCase(),
      payload: { email: email.toLowerCase(), reason: "USER_NOT_FOUND" }
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

export async function register(data: RegisterInput) {
  const registerRole = selfRegisterRoleSchema.safeParse(data.role);
  if (!registerRole.success) {
    await writeAuditLog({
      action: "AUTH_REGISTER_BLOCKED_ROLE",
      entityType: "USER",
      entityId: data.email.toLowerCase(),
      payload: {
        attemptedRole: data.role,
        email: data.email.toLowerCase()
      }
    });
    throw forbiddenError("Public register only supports CITIZEN or BUSINESS roles");
  }

  try {
    const user = await prisma.user.create({
      data: {
        role: registerRole.data,
        fullName: data.fullName,
        email: data.email.toLowerCase(),
        passwordHash: hashPassword(data.password),
        identityNumber: data.identityNumber,
        organizationId: data.organizationId,
        status: "ACTIVE"
      }
    });

    await writeAuditLog({
      actorId: user.id,
      action: "AUTH_REGISTER_SUCCESS",
      entityType: "USER",
      entityId: user.id,
      payload: { role: user.role }
    });

    return user;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if ((err as Prisma.PrismaClientKnownRequestError).code === "P2002")
        throw conflictError("Email already exists");
      if ((err as Prisma.PrismaClientKnownRequestError).code === "P2003")
        throw badRequestError("Organization is invalid");
    }
    throw err;
  }
}

export async function login(data: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() }
  });

  if (!user) {
    await recordFailedLogin(null, data.email);
    throw badRequestError("Invalid email or password");
  }

  const availableUser = await ensureLoginAllowed(user);
  if (availableUser.status !== "ACTIVE") {
    await recordFailedLogin(availableUser, data.email);
    throw badRequestError("Account is locked");
  }

  if (!verifyPassword(data.password, availableUser.passwordHash)) {
    await recordFailedLogin(availableUser, data.email);
    throw badRequestError("Invalid email or password");
  }

  await resetLoginFailureState(availableUser.id);
  const refreshToken = await createSession(availableUser);
  const latestUser = await prisma.user.findUniqueOrThrow({
    where: { id: availableUser.id }
  });
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

  return { user: latestUser, accessToken, refreshToken };
}

export async function refresh(data: RefreshInput) {
  const currentRefreshToken = data.refreshToken;
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
    payload: { userId: session.user.id }
  });

  return { user: session.user, accessToken, refreshToken: nextRefreshToken };
}

export async function logout(userId: string, refreshToken?: string) {
  const now = new Date();

  if (refreshToken) {
    const candidate = await findActiveUserSessionByRefreshToken(userId, refreshToken);
    if (!candidate) return { revokedSessions: 0 };

    await prisma.authSession.update({
      where: { id: candidate.id },
      data: { revokedAt: now }
    });
    await writeAuditLog({
      actorId: userId,
      action: "AUTH_LOGOUT",
      entityType: "AUTH_SESSION",
      entityId: candidate.id
    });
    return { revokedSessions: 1 };
  }

  const revokeResult = await prisma.authSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: now }
  });

  await writeAuditLog({
    actorId: userId,
    action: "AUTH_LOGOUT_ALL",
    entityType: "USER",
    entityId: userId,
    payload: { revokedSessions: revokeResult.count }
  });

  return { revokedSessions: revokeResult.count };
}

export async function logoutAll(userId: string) {
  const now = new Date();
  const result = await prisma.authSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: now }
  });

  await writeAuditLog({
    actorId: userId,
    action: "AUTH_LOGOUT_ALL",
    entityType: "USER",
    entityId: userId,
    payload: { revokedSessions: result.count }
  });

  return { revokedSessions: result.count };
}

export async function requestPasswordReset(data: PasswordResetRequestInput) {
  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() }
  });
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
      entityId: data.email.toLowerCase()
    });
  }

  return {
    accepted: true,
    ...(process.env.NODE_ENV !== "production" ? { resetToken } : {})
  };
}

export async function confirmPasswordReset(data: PasswordResetConfirmInput) {
  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() }
  });
  if (!user || !user.passwordResetTokenHash || !user.passwordResetExpiresAt) {
    throw badRequestError("Reset token is invalid");
  }
  if (user.passwordResetExpiresAt.getTime() < Date.now()) {
    throw badRequestError("Reset token is expired");
  }
  if (!verifyPassword(data.token, user.passwordResetTokenHash)) {
    throw badRequestError("Reset token is invalid");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(data.newPassword),
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

  return { reset: true };
}

export async function changePassword(userId: string, data: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFoundError("User not found");
  if (!verifyPassword(data.currentPassword, user.passwordHash)) {
    throw badRequestError("Current password is invalid");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(data.newPassword),
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

  return { changed: true };
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFoundError("User not found");
  return user;
}

export async function vneidMockLogin(data: { identityNumber?: string }) {
  if (process.env.NODE_ENV === "production") {
    throw forbiddenError("VNeID mock endpoint is not enabled");
  }

  const user = await prisma.user.findUnique({
    where: { email: "citizen@urbanchain.vn" }
  });
  if (!user || user.status !== "ACTIVE") {
    throw notFoundError("Mock VNeID user is not available");
  }

  await resetLoginFailureState(user.id);
  const refreshToken = await createSession(user);
  const accessToken = signAccessToken({
    userId: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role
  });

  await writeAuditLog({
    actorId: user.id,
    action: "AUTH_VNEID_MOCK_LOGIN_SUCCESS",
    entityType: "USER",
    entityId: user.id
  });

  return {
    user,
    accessToken,
    refreshToken,
    identity: {
      provider: "VNEID_MOCK" as const,
      identityNumber: data.identityNumber ?? user.identityNumber ?? "0482xxxxxxx",
      verified: true
    }
  };
}

export async function accountLock(userId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      status: "LOCKED",
      lockedUntil: new Date(Date.now() + AUTO_LOCK_MINUTES * 60 * 1000)
    }
  });

  await writeAuditLog({
    actorId: userId,
    action: "AUTH_ACCOUNT_LOCKED_ADMIN",
    entityType: "USER",
    entityId: userId
  });

  return user;
}

export async function accountUnlock(userId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      status: "ACTIVE",
      lockedUntil: null,
      failedLoginAttempts: 0
    }
  });

  await writeAuditLog({
    actorId: userId,
    action: "AUTH_ACCOUNT_UNLOCKED",
    entityType: "USER",
    entityId: userId
  });

  return user;
}
