import { z } from "zod";

export const managedRoleSchema = z.enum(["LAND_REGISTRY_OFFICER", "APPROVAL_AUTHORITY"]);

export const createAuthorizationSchema = z.object({
  walletId: z.string().min(1),
  roleScope: managedRoleSchema,
  chainId: z.coerce.number().int().positive().optional(),
  effectiveTo: z.string().datetime().optional(),
  reason: z.string().min(3).max(191).optional()
});

export const updateAuthorizationSchema = z.object({
  status: z.enum(["ACTIVE", "REVOKED", "EXPIRED"]),
  reason: z.string().min(3).max(191).optional()
});

export const listAuthorizationSchema = z.object({
  status: z.enum(["ACTIVE", "REVOKED", "EXPIRED"]).optional(),
  network: z.string().optional(),
  roleScope: managedRoleSchema.optional(),
  organizationId: z.string().min(1).optional(),
  chainId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

export type CreateAuthorizationInput = z.infer<typeof createAuthorizationSchema>;
export type UpdateAuthorizationInput = z.infer<typeof updateAuthorizationSchema>;
export type ListAuthorizationInput = z.infer<typeof listAuthorizationSchema>;
