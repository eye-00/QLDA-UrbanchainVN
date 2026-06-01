import { asyncHandler, badRequestError } from "../../lib/errors.js";
import { created, ok } from "../../lib/response.js";
import * as validation from "./auth.validation.js";
import * as mapper from "./auth.mapper.js";
import * as service from "./auth.service.js";
import type { AuthenticatedRequest } from "./auth.middleware.js";

export const register = asyncHandler(async (req, res) => {
  const parsed = validation.registerSchema.safeParse(req.body);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const user = await service.register(parsed.data);
  return created(
    res,
    { userId: user.id, role: user.role, status: user.status },
    "Created successfully"
  );
});

export const login = asyncHandler(async (req, res) => {
  const parsed = validation.loginSchema.safeParse(req.body);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const result = await service.login(parsed.data);
  return ok(
    res,
    {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: mapper.toPublicUser(result.user)
    },
    "Đăng nhập thành công"
  );
});

export const refresh = asyncHandler(async (req, res) => {
  const parsed = validation.refreshSchema.safeParse(req.body);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const result = await service.refresh(parsed.data);
  return ok(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: mapper.toPublicUser(result.user)
  });
});

export const logout = asyncHandler(async (req, res) => {
  const parsed = validation.logoutSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const authUser = (req as AuthenticatedRequest).user;
  const result = await service.logout(authUser.userId, parsed.data.refreshToken);
  return ok(res, result, "Logout successful");
});

export const logoutAll = asyncHandler(async (req, res) => {
  const authUser = (req as AuthenticatedRequest).user;
  const result = await service.logoutAll(authUser.userId);
  return ok(res, result, "Logout successful");
});

export const requestPasswordReset = asyncHandler(async (req, res) => {
  const parsed = validation.passwordResetRequestSchema.safeParse(req.body);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const result = await service.requestPasswordReset(parsed.data);
  return ok(res, result, "If the account exists, reset instructions have been created");
});

export const confirmPasswordReset = asyncHandler(async (req, res) => {
  const parsed = validation.passwordResetConfirmSchema.safeParse(req.body);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const result = await service.confirmPasswordReset(parsed.data);
  return ok(res, result, "Password has been reset");
});

export const changePassword = asyncHandler(async (req, res) => {
  const parsed = validation.changePasswordSchema.safeParse(req.body);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const authUser = (req as AuthenticatedRequest).user;
  const result = await service.changePassword(authUser.userId, parsed.data);
  return ok(res, result, "Password has been changed");
});

export const me = asyncHandler(async (req, res) => {
  const authUser = (req as AuthenticatedRequest).user;
  const user = await service.getProfile(authUser.userId);
  return ok(res, mapper.toPublicUser(user));
});

export const vneidMock = asyncHandler(async (req, res) => {
  const parsed = validation.vneidMockSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const result = await service.vneidMockLogin(parsed.data);
  return ok(
    res,
    {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: mapper.toPublicUser(result.user),
      identity: result.identity
    },
    "Đăng nhập VNeID mô phỏng thành công"
  );
});
