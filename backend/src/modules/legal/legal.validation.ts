import { z } from "zod";

export const authorityActorSchema = z.enum([
  "RECEPTION_OFFICER",
  "COMMUNE_OFFICER",
  "LAND_REGISTRY_OFFICER",
  "APPROVAL_AUTHORITY",
  "TAX_OFFICER",
  "AUDITOR",
  "ADMIN"
]);

export const levelSchema = z.enum(["XA", "TINH", "LIEN_THONG"]);

export const listLegalSchema = z.object({
  keyword: z.string().optional(),
  level: levelSchema.optional(),
  isActive: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      if (typeof value === "boolean") return value;
      return value === "true";
    }),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

export const createLegalSchema = z.object({
  procedureCode: z.string().min(3).max(64),
  sourceDecision: z.string().min(3),
  legalBasis: z.string().min(3),
  level: levelSchema,
  authorityActors: z.array(authorityActorSchema).min(1),
  requiresTaxStep: z.boolean().default(false)
});

export const updateLegalSchema = z.object({
  sourceDecision: z.string().min(3).optional(),
  legalBasis: z.string().min(3).optional(),
  level: levelSchema.optional(),
  authorityActors: z.array(authorityActorSchema).min(1).optional(),
  requiresTaxStep: z.boolean().optional(),
  isActive: z.boolean().optional()
});

export type CreateLegalInput = z.infer<typeof createLegalSchema>;
export type UpdateLegalInput = z.infer<typeof updateLegalSchema>;
export type ListLegalInput = z.infer<typeof listLegalSchema>;
