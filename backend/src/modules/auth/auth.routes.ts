import { Router } from "express";
import { requireAuth } from "./auth.middleware.js";
import * as ctrl from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/register", ctrl.register);
authRouter.post("/login", ctrl.login);
authRouter.post("/refresh", ctrl.refresh);
authRouter.post("/logout", requireAuth, ctrl.logout);
authRouter.post("/password/reset-request", ctrl.requestPasswordReset);
authRouter.post("/password/reset-confirm", ctrl.confirmPasswordReset);
authRouter.post("/change-password", requireAuth, ctrl.changePassword);
authRouter.get("/me", requireAuth, ctrl.me);
authRouter.post("/vneid/mock", ctrl.vneidMock);
