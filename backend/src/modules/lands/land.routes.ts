import { Router } from "express";
import { AUTH_ROLES, requireAuth, requireRoles } from "../auth/auth.middleware.js";
import * as ctrl from "./land.controller.js";

export const landRouter = Router();
const officerRoles = AUTH_ROLES.officers;

landRouter.use(requireAuth, requireRoles(officerRoles));

landRouter.get("/", ctrl.list);
landRouter.get("/search", ctrl.search);
landRouter.post("/", ctrl.create);
landRouter.patch("/:id", ctrl.update);
landRouter.get("/:id", ctrl.getById);
