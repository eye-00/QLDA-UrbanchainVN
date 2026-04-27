import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { forbidden, unauthorized } from "../../lib/response.js";
import { demoStore, type UserRole } from "../../lib/store/demo-store.js";

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
  officers: ["RECEPTION_OFFICER", "COMMUNE_OFFICER", "LAND_REGISTRY_OFFICER", "APPROVAL_AUTHORITY", "ADMIN"],
  dashboard: ["LAND_REGISTRY_OFFICER", "ADMIN"],
  admin: ["ADMIN"]
} as const satisfies Record<string, readonly UserRole[]>;

function getJwtSecret() {
  return process.env.JWT_SECRET || "dev-secret";
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
  if (!token) return unauthorized(res);

  try {
    const payload = jwt.verify(token, getJwtSecret()) as JwtPayload;
    const user = demoStore.getUserById(payload.sub);
    if (!user || user.status !== "ACTIVE") return unauthorized(res, "Invalid session");

    (req as AuthenticatedRequest).user = {
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    };
    return next();
  } catch {
    return unauthorized(res, "Invalid or expired token");
  }
}

export function requireRoles(roles: readonly UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return unauthorized(res);
    if (!roles.includes(user.role)) return forbidden(res, "Role is not allowed for this action");
    return next();
  };
}
