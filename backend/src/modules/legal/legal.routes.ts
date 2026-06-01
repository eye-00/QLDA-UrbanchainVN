import { Router } from "express";
import { AUTH_ROLES, requireAuth, requireRoles } from "../auth/auth.middleware.js";
import * as ctrl from "./legal.controller.js";

export const legalRouter = Router();

legalRouter.use(requireAuth);

legalRouter.get(
  "/procedures",
  requireRoles([...AUTH_ROLES.officers, ...AUTH_ROLES.citizen]),
  ctrl.list
);

legalRouter.get(
  "/procedures/:procedureCode",
  requireRoles([...AUTH_ROLES.officers, ...AUTH_ROLES.citizen]),
  ctrl.getById
);

legalRouter.post("/procedures", requireRoles(AUTH_ROLES.admin), ctrl.create);

legalRouter.patch("/procedures/:id", requireRoles(AUTH_ROLES.admin), ctrl.update);
