import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendEnvPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", ".env");
dotenv.config({ path: backendEnvPath });

export const prisma = new PrismaClient();
