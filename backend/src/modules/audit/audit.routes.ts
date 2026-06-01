import { Router } from "express";
import { requireAuth, requireRoles } from "../auth/auth.middleware.js";
import * as ctrl from "./audit.controller.js";

const AUDIT_VIEW_ROLES = ["LAND_REGISTRY_OFFICER", "TAX_OFFICER", "AUDITOR", "ADMIN"] as const;

export const auditRouter = Router();

auditRouter.use(requireAuth, requireRoles(AUDIT_VIEW_ROLES));

auditRouter.get("/access-logs", ctrl.queryAccessLogs);
auditRouter.get("/user-actions", ctrl.queryUserActions);
auditRouter.get("/rbac-changes", ctrl.queryRbacChanges);
