import { Router } from "express";
import { ok } from "../../lib/response.js";
import { demoStore } from "../../lib/store/demo-store.js";
import { AUTH_ROLES, requireAuth, requireRoles } from "../auth/auth.middleware.js";

export const dashboardRouter = Router();

dashboardRouter.get("/summary", requireAuth, requireRoles(AUTH_ROLES.dashboard), (_req, res) => {
  return ok(res, demoStore.getDashboardSummary());
});
