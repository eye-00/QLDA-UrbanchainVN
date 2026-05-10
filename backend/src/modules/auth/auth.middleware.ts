import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { forbiddenError, unauthorizedError } from "../../lib/errors.js";

export interface AuthUser {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export const AUTH_ROLES = {
  citizen: ["CITIZEN", "BUSINESS"],
  officers: [
    "RECEPTION_OFFICER",
    "COMMUNE_OFFICER",
    "LAND_REGISTRY_OFFICER",
    "APPROVAL_AUTHORITY",
    "TAX_OFFICER",
    "AUDITOR",
    "ADMIN"
  ],
  dashboard: [
    "CITIZEN",
    "BUSINESS",
    "RECEPTION_OFFICER",
    "COMMUNE_OFFICER",
    "LAND_REGISTRY_OFFICER",
    "APPROVAL_AUTHORITY",
    "TAX_OFFICER",
    "AUDITOR",
    "ADMIN"
  ],
  admin: ["ADMIN"]
} as const satisfies Record<string, readonly UserRole[]>;

function getJwtSecret() {
  const configuredSecret = process.env.JWT_SECRET?.trim();
  if (process.env.NODE_ENV === "production") {
    if (!configuredSecret) throw new Error("JWT_SECRET must be configured in production");
    if (configuredSecret === "dev-secret") {
      throw new Error("JWT_SECRET must not use development default in production");
    }
  }
  return configuredSecret || "dev-secret";
}

export function signAccessToken(user: AuthUser) {
  return jwt.sign({ email: user.email, role: user.role }, getJwtSecret(), {
    subject: user.userId,
    expiresIn: "1h"
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) return next(unauthorizedError());

  try {
    const payload = jwt.verify(token, getJwtSecret()) as JwtPayload;
    prisma.user
      .findUnique({ where: { id: payload.sub } })
      .then((user) => {
        if (!user || user.status !== "ACTIVE") {
          return next(unauthorizedError("Invalid session"));
        }

        (req as AuthenticatedRequest).user = {
          userId: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        };
        return next();
      })
      .catch(() => next(unauthorizedError("Invalid or expired token")));
  } catch {
    return next(unauthorizedError("Invalid or expired token"));
  }
}

export function requireRoles(roles: readonly UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return next(unauthorizedError());
    if (!roles.includes(user.role)) return next(forbiddenError("Role is not allowed for this action"));
    return next();
  };
}
