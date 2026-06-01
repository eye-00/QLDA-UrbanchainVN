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

export const selfRegisterRoleSchema = z.enum(["CITIZEN", "BUSINESS"]);

export const registerSchema = z.object({
  role: roleSchema.default("CITIZEN"),
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  identityNumber: z.string().optional(),
  organizationId: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20)
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(20).optional()
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email()
});

export const passwordResetConfirmSchema = z.object({
  email: z.string().email(),
  token: z.string().min(8),
  newPassword: z.string().min(8)
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8)
  })
  .refine(
    (value: { currentPassword: string; newPassword: string }) =>
      value.currentPassword !== value.newPassword,
    {
      message: "New password must be different from current password"
    }
  );

export const vneidMockSchema = z.object({
  identityNumber: z.string().min(6).optional()
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type VneidMockInput = z.infer<typeof vneidMockSchema>;
