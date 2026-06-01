import { Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth, requireRoles } from "../auth/auth.middleware.js";
import * as ctrl from "./wallet.controller.js";

const WALLET_MANAGE_ROLES: UserRole[] = ["CITIZEN", "BUSINESS"];

export const walletRouter = Router();
walletRouter.use(requireAuth, requireRoles(WALLET_MANAGE_ROLES));
walletRouter.get("/me", ctrl.list);
walletRouter.post("/connect", ctrl.connect);
walletRouter.post("/:id/challenge", ctrl.challenge);
walletRouter.post("/:id/verify", ctrl.verify);
walletRouter.patch("/:id/default", ctrl.setDefault);
