import { Router } from "express";
import { requireAuth, requireRoles } from "../auth/auth.middleware.js";
import * as ctrl from "./service-wallet.controller.js";

export const serviceWalletRouter = Router();

serviceWalletRouter.use(requireAuth, requireRoles(["ADMIN"]));

serviceWalletRouter.get("/", ctrl.list);
serviceWalletRouter.post("/", ctrl.create);
serviceWalletRouter.patch("/:id/status", ctrl.updateStatus);
serviceWalletRouter.get("/:id/audit", ctrl.getAuditLogs);
