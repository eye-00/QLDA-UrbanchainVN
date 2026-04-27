import { Router } from "express";
import { z } from "zod";
import { badRequest, created, ok } from "../../lib/response.js";
import { demoStore, type UserRole } from "../../lib/store/demo-store.js";
import { requireAuth, signAccessToken, type AuthenticatedRequest } from "./auth.middleware.js";

const roleSchema = z.enum([
  "CITIZEN",
  "BUSINESS",
  "RECEPTION_OFFICER",
  "COMMUNE_OFFICER",
  "LAND_REGISTRY_OFFICER",
  "APPROVAL_AUTHORITY",
  "ADMIN"
]);

const registerSchema = z.object({
  role: roleSchema.default("CITIZEN"),
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  identityNumber: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const vneidMockSchema = z.object({
  identityNumber: z.string().min(6).optional()
});

export const authRouter = Router();

function publicUser(user: { userId: string; fullName: string; email: string; role: UserRole; status: string }) {
  return {
    userId: user.userId,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    status: user.status
  };
}

authRouter.post("/register", (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return badRequest(res, "Validation error", parsed.error.issues);
  if (demoStore.getUserByEmail(parsed.data.email)) {
    return badRequest(res, "Email already exists");
  }
  const user = demoStore.createUser(parsed.data);
  return created(res, {
    userId: user.userId,
    role: user.role,
    status: user.status
  });
});

authRouter.post("/login", (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return badRequest(res, "Validation error", parsed.error.issues);

  const user = demoStore.getUserByEmail(parsed.data.email);
  if (!user || user.password !== parsed.data.password || user.status !== "ACTIVE") {
    return badRequest(res, "Invalid email or password");
  }

  const accessToken = signAccessToken(user);
  return ok(res, {
    accessToken,
    refreshToken: "refresh-token-demo",
    user: publicUser(user)
  });
});

authRouter.post("/vneid/mock", (req, res) => {
  const parsed = vneidMockSchema.safeParse(req.body ?? {});
  if (!parsed.success) return badRequest(res, "Validation error", parsed.error.issues);

  const user = demoStore.getUserByEmail("citizen@urbanchain.vn");
  if (!user || user.status !== "ACTIVE") return badRequest(res, "Mock VNeID user is not available");

  const accessToken = signAccessToken(user);
  return ok(res, {
    accessToken,
    refreshToken: "refresh-token-demo",
    user: publicUser(user),
    identity: {
      provider: "VNEID_MOCK",
      identityNumber: parsed.data.identityNumber ?? user.identityNumber ?? "0482xxxxxxx",
      verified: true
    }
  }, "Đăng nhập VNeID mô phỏng thành công");
});

authRouter.get("/me", requireAuth, (req, res) => {
  const user = (req as AuthenticatedRequest).user;
  return ok(res, publicUser({ ...user, status: "ACTIVE" }));
});
