import { Router } from "express";
import multer from "multer";
import { AUTH_ROLES, requireAuth, requireRoles } from "../auth/auth.middleware.js";
import * as ctrl from "./file.controller.js";

const upload = multer({ dest: "tmp/uploads" });
export const fileRouter = Router();

fileRouter.post(
  "/upload",
  requireAuth,
  requireRoles([...AUTH_ROLES.citizen, ...AUTH_ROLES.officers]),
  upload.single("file"),
  ctrl.upload
);

fileRouter.get(
  "/:fileId",
  requireAuth,
  requireRoles([...AUTH_ROLES.citizen, ...AUTH_ROLES.officers]),
  ctrl.getDetail
);

fileRouter.get(
  "/:fileId/download",
  requireAuth,
  requireRoles([...AUTH_ROLES.citizen, ...AUTH_ROLES.officers]),
  ctrl.downloadUrl
);

fileRouter.get(
  "/:fileId/integrity",
  requireAuth,
  requireRoles([...AUTH_ROLES.citizen, ...AUTH_ROLES.officers]),
  ctrl.integrityCheck
);
