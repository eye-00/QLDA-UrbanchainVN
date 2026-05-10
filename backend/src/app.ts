import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { errorHandler, notFoundHandler } from "./lib/errors.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { registrationRouter } from "./modules/registrations/registration.routes.js";
import { fileRouter } from "./modules/files/file.routes.js";
import { transferRouter } from "./modules/transfers/transfer.routes.js";
import { landRouter } from "./modules/lands/land.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { userRouter } from "./modules/users/user.routes.js";
import { organizationRouter } from "./modules/organizations/organization.routes.js";
import { auditRouter } from "./modules/audit/audit.routes.js";
import { walletRouter } from "./modules/wallets/wallet.routes.js";
import { legalRouter } from "./modules/legal/legal.routes.js";

const backendEnvPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".env");
dotenv.config({ path: backendEnvPath });

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(helmet());
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/api/v1/health", (_req, res) => res.json({ success: true, message: "ok" }));
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/files", fileRouter);
  app.use("/api/v1/registrations", registrationRouter);
  app.use("/api/v1/transfers", transferRouter);
  app.use("/api/v1/lands", landRouter);
  app.use("/api/v1/dashboard", dashboardRouter);
  app.use("/api/v1/users", userRouter);
  app.use("/api/v1/organizations", organizationRouter);
  app.use("/api/v1/audit", auditRouter);
  app.use("/api/v1/wallets", walletRouter);
  app.use("/api/v1/legal", legalRouter);
  app.use("/api/v1/wallets", walletRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
