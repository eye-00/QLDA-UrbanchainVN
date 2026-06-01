import { Router } from "express";
import { AUTH_ROLES, requireAuth, requireRoles } from "../auth/auth.middleware.js";
import * as ctrl from "./organization.controller.js";

export const organizationRouter = Router();

organizationRouter.use(requireAuth, requireRoles(AUTH_ROLES.admin));

organizationRouter.get("/", ctrl.list);
organizationRouter.post("/", ctrl.create);
organizationRouter.patch("/:id", ctrl.update);
organizationRouter.delete("/:id", ctrl.deactivate);
