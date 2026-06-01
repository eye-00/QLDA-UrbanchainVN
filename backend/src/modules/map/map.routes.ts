import { Router } from "express";
import { AUTH_ROLES, requireAuth, requireRoles } from "../auth/auth.middleware.js";
import * as ctrl from "./map.controller.js";

export const mapRouter = Router();
mapRouter.use(requireAuth);

mapRouter.get("/parcels", requireRoles([...AUTH_ROLES.officers, ...AUTH_ROLES.citizen]), ctrl.list);

mapRouter.get(
  "/parcels/:landRecordId",
  requireRoles([...AUTH_ROLES.officers, ...AUTH_ROLES.citizen]),
  ctrl.getById
);

mapRouter.post(
  "/parcels/:landRecordId/geometry",
  requireRoles(["LAND_REGISTRY_OFFICER", "ADMIN"]),
  ctrl.upsertGeometry
);

mapRouter.post(
  "/parcels/:landRecordId/review",
  requireRoles(["COMMUNE_OFFICER", "LAND_REGISTRY_OFFICER", "ADMIN"]),
  ctrl.reviewGeometry
);

mapRouter.post(
  "/parcels/:landRecordId/approve-offchain",
  requireRoles(["LAND_REGISTRY_OFFICER", "ADMIN"]),
  ctrl.approveOffchain
);

mapRouter.post(
  "/parcels/:landRecordId/record-boundary-hash",
  requireRoles(["LAND_REGISTRY_OFFICER", "APPROVAL_AUTHORITY", "ADMIN"]),
  ctrl.recordBoundaryHash
);

mapRouter.get(
  "/layers",
  requireRoles([...AUTH_ROLES.officers, ...AUTH_ROLES.citizen]),
  ctrl.getLayers
);
