import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import * as ctrl from "./dashboard.controller.js";

export const dashboardRouter = Router();

dashboardRouter.get("/summary", requireAuth, ctrl.getSummary);
