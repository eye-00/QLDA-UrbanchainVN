import { z } from "zod";

export const dashboardQuerySchema = z.object({});

export type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>;
