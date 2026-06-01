import { Router } from "express";
import { AUTH_ROLES, requireAuth, requireRoles } from "../auth/auth.middleware.js";
import * as ctrl from "./payment-obligation.controller.js";

export const paymentObligationRouter = Router();
paymentObligationRouter.use(requireAuth);

paymentObligationRouter.post(
  "/",
  requireRoles(["TAX_OFFICER", "LAND_REGISTRY_OFFICER", "ADMIN"]),
  ctrl.create
);

paymentObligationRouter.get(
  "/:id",
  requireRoles([...AUTH_ROLES.citizen, ...AUTH_ROLES.officers]),
  ctrl.getById
);

paymentObligationRouter.post(
  "/:id/generate-qr-test",
  requireRoles(["TAX_OFFICER", "LAND_REGISTRY_OFFICER", "ADMIN"]),
  ctrl.generateQr
);

paymentObligationRouter.post(
  "/:id/mock-confirm",
  requireRoles(["CITIZEN", "BUSINESS", "TAX_OFFICER", "LAND_REGISTRY_OFFICER", "ADMIN"]),
  ctrl.mockConfirm
);

paymentObligationRouter.post(
  "/:id/verify-receipt",
  requireRoles(["TAX_OFFICER", "ADMIN"]),
  ctrl.verifyReceipt
);

paymentObligationRouter.post(
  "/:id/record-on-chain",
  requireRoles(["LAND_REGISTRY_OFFICER", "APPROVAL_AUTHORITY", "ADMIN"]),
  ctrl.recordOnChain
);
