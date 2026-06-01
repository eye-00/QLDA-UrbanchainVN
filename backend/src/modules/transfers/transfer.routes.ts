import { Router } from "express";
import { AUTH_ROLES, requireAuth, requireRoles } from "../auth/auth.middleware.js";
import * as ctrl from "./transfer.controller.js";

export const transferRouter = Router();
const allAuthenticatedRoles = [...AUTH_ROLES.citizen, ...AUTH_ROLES.officers];

transferRouter.use(requireAuth);

transferRouter.get("/", requireRoles(allAuthenticatedRoles), ctrl.list);
transferRouter.get("/:id", requireRoles(allAuthenticatedRoles), ctrl.getById);
transferRouter.post("/", requireRoles(AUTH_ROLES.citizen), ctrl.create);
transferRouter.post("/:id/confirm", requireRoles(AUTH_ROLES.citizen), ctrl.confirm);
transferRouter.post(
  "/:id/request-supplement",
  requireRoles(["RECEPTION_OFFICER", "LAND_REGISTRY_OFFICER"]),
  ctrl.requestSupplement
);
transferRouter.post(
  "/:id/complete",
  requireRoles(["LAND_REGISTRY_OFFICER", "APPROVAL_AUTHORITY", "ADMIN"]),
  ctrl.complete
);
