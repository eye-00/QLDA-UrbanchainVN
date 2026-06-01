import { asyncHandler } from "../../lib/errors.js";
import { ok } from "../../lib/response.js";
import * as service from "./dashboard.service.js";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";

export const getSummary = asyncHandler(async (req, res) => {
  const user = (req as AuthenticatedRequest).user;
  return ok(res, await service.getDashboardData(user));
});
