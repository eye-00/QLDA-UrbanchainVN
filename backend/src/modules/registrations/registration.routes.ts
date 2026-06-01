import { Router } from "express";
import { AUTH_ROLES, requireAuth, requireRoles } from "../auth/auth.middleware.js";
import * as ctrl from "./registration.controller.js";
import { allAuthenticatedRoles, statusMutationRoles } from "./registration.validation.js";

export const registrationRouter = Router();

registrationRouter.use(requireAuth);

registrationRouter.get("/", requireRoles(allAuthenticatedRoles), ctrl.list);
registrationRouter.post("/", requireRoles(AUTH_ROLES.citizen), ctrl.create);
registrationRouter.get("/:id", requireRoles(allAuthenticatedRoles), ctrl.getDetail);
registrationRouter.get(
  "/:id/notifications",
  requireRoles(allAuthenticatedRoles),
  ctrl.getNotificationHistory
);
registrationRouter.get(
  "/:id/document-versions",
  requireRoles(allAuthenticatedRoles),
  ctrl.getDocumentVersions
);
registrationRouter.post(
  "/:id/document-versions",
  requireRoles([
    ...AUTH_ROLES.citizen,
    "RECEPTION_OFFICER",
    "COMMUNE_OFFICER",
    "LAND_REGISTRY_OFFICER",
    "ADMIN"
  ]),
  ctrl.createDocumentVersion
);
registrationRouter.get("/:id/snapshots", requireRoles(allAuthenticatedRoles), ctrl.getSnapshots);
registrationRouter.get(
  "/:id/document-history",
  requireRoles(allAuthenticatedRoles),
  ctrl.getDocumentHistory
);
registrationRouter.get(
  "/:id/payment-obligations",
  requireRoles(allAuthenticatedRoles),
  ctrl.getPaymentObligations
);
registrationRouter.post(
  "/:id/payment-obligations",
  requireRoles(["RECEPTION_OFFICER", "LAND_REGISTRY_OFFICER", "TAX_OFFICER", "ADMIN"]),
  ctrl.createPaymentObligation
);
registrationRouter.patch(
  "/:id/payment-obligations/:obligationId/status",
  requireRoles(["TAX_OFFICER", "ADMIN"]),
  ctrl.updatePaymentObligation
);
registrationRouter.post("/:id/submit", requireRoles(AUTH_ROLES.citizen), ctrl.submit);
registrationRouter.post("/:id/accept", requireRoles(["RECEPTION_OFFICER", "ADMIN"]), ctrl.accept);
registrationRouter.post(
  "/:id/reject",
  requireRoles(["LAND_REGISTRY_OFFICER", "APPROVAL_AUTHORITY", "ADMIN"]),
  ctrl.reject
);
registrationRouter.patch("/:id/status", requireRoles(statusMutationRoles), ctrl.patchStatus);
registrationRouter.post(
  "/:id/commune-confirm",
  requireRoles(["COMMUNE_OFFICER", "ADMIN"]),
  ctrl.communeConfirm
);
registrationRouter.post(
  "/:id/tax-transfer",
  requireRoles(["LAND_REGISTRY_OFFICER", "ADMIN"]),
  ctrl.taxTransfer
);
registrationRouter.post(
  "/:id/approve",
  requireRoles(["APPROVAL_AUTHORITY", "ADMIN"]),
  ctrl.approve
);
registrationRouter.post(
  "/:id/cadastral-update",
  requireRoles(["LAND_REGISTRY_OFFICER", "ADMIN"]),
  ctrl.cadastralUpdate
);
registrationRouter.post(
  "/:id/request-supplement",
  requireRoles([
    "RECEPTION_OFFICER",
    "COMMUNE_OFFICER",
    "LAND_REGISTRY_OFFICER",
    "TAX_OFFICER",
    "ADMIN"
  ]),
  ctrl.supplementRequest
);
registrationRouter.get(
  "/:id/blockchain-sync/candidates",
  requireRoles(["LAND_REGISTRY_OFFICER", "APPROVAL_AUTHORITY"]),
  ctrl.getBlockchainCandidates
);
registrationRouter.post(
  "/:id/blockchain-sync",
  requireRoles(["LAND_REGISTRY_OFFICER", "APPROVAL_AUTHORITY", "CITIZEN", "BUSINESS"]),
  ctrl.blockchainSync
);
registrationRouter.get(
  "/:id/blockchain-status",
  requireRoles(["LAND_REGISTRY_OFFICER", "APPROVAL_AUTHORITY", "ADMIN", "AUDITOR"]),
  ctrl.getBlockchainStatus
);
registrationRouter.get(
  "/:id/tx-lifecycle",
  requireRoles(["LAND_REGISTRY_OFFICER", "APPROVAL_AUTHORITY", "ADMIN", "AUDITOR"]),
  ctrl.getTxHistory
);
