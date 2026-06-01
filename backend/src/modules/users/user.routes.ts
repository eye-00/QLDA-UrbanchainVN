import { Router } from "express";
import { AUTH_ROLES, requireAuth, requireRoles } from "../auth/auth.middleware.js";
import * as ctrl from "./user.controller.js";

export const userRouter = Router();

userRouter.use(requireAuth, requireRoles(AUTH_ROLES.admin));

userRouter.get("/", ctrl.list);
userRouter.post("/", ctrl.create);
userRouter.patch("/:id", ctrl.update);
userRouter.patch("/:id/status", ctrl.updateStatus);
