import { z } from "zod";

export const listOrgSchema = z.object({
  keyword: z.string().optional(),
  includeInactive: z.preprocess((value) => {
    if (typeof value === "string") return value.toLowerCase() === "true";
    return value;
  }, z.boolean().default(false))
});

export const createOrgSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional()
});

export const updateOrgSchema = z.object({
  code: z.string().min(2).optional(),
  name: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional()
});

export type CreateOrgInput = z.infer<typeof createOrgSchema>;
export type UpdateOrgInput = z.infer<typeof updateOrgSchema>;
export type ListOrgInput = z.infer<typeof listOrgSchema>;
