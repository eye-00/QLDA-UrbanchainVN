import { Router } from "express";
import { badRequest, ok } from "../../lib/response.js";
import { demoStore } from "../../lib/store/demo-store.js";
import { AUTH_ROLES, requireAuth, requireRoles } from "../auth/auth.middleware.js";

export const landRouter = Router();

landRouter.get("/search", requireAuth, requireRoles([...AUTH_ROLES.citizen, ...AUTH_ROLES.officers]), (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q : undefined;
  const items = demoStore.listLands(query);
  return ok(res, { query: query ?? null, items, total: items.length });
});

landRouter.get("/:landCode", requireAuth, requireRoles([...AUTH_ROLES.citizen, ...AUTH_ROLES.officers]), (req, res) => {
  const item = demoStore.getLand(String(req.params.landCode));
  if (!item) return badRequest(res, "Không tìm thấy thửa đất");
  return ok(res, item);
});
