import { z } from "zod";

export const uploadFileSchema = z.object({
  documentType: z.string().min(1).default("UNKNOWN"),
  ownerType: z.string().min(1).default("USER"),
  ownerId: z.string().optional(),
  registrationId: z.string().optional(),
  originalName: z.string().optional()
});

export const fileListSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  documentType: z.string().optional(),
  ownerType: z.string().optional(),
  ownerId: z.string().optional(),
  registrationId: z.string().optional()
});

export const fileDeleteSchema = z.object({
  reason: z.string().min(3).optional()
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;
export type FileListInput = z.infer<typeof fileListSchema>;
export type FileDeleteInput = z.infer<typeof fileDeleteSchema>;
