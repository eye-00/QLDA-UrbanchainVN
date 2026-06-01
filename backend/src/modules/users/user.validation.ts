import { z } from "zod";

export const roleSchema = z.enum([
  "CITIZEN",
  "BUSINESS",
  "RECEPTION_OFFICER",
  "COMMUNE_OFFICER",
  "LAND_REGISTRY_OFFICER",
  "TAX_OFFICER",
  "APPROVAL_AUTHORITY",
  "AUDITOR",
  "ADMIN"
]);

export const statusSchema = z.enum(["ACTIVE", "LOCKED"]);

export const listUserSchema = z.object({
  keyword: z.string().optional(),
  role: roleSchema.optional(),
  organizationId: z.string().optional(),
  status: statusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

export const createUserSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: roleSchema,
  identityNumber: z.string().optional(),
  organizationId: z.string().nullable().optional()
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: roleSchema.optional(),
  identityNumber: z.string().nullable().optional(),
  organizationId: z.string().nullable().optional()
});

export const userStatusSchema = z.object({
  status: statusSchema
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUserInput = z.infer<typeof listUserSchema>;
export type UserStatusInput = z.infer<typeof userStatusSchema>;
