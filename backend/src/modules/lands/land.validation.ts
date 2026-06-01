import { z } from "zod";

export const landListSchema = z.object({
  keyword: z.string().optional(),
  ownerUserId: z.string().optional(),
  provinceCode: z.string().optional(),
  communeName: z.string().optional(),
  landUsePurpose: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

export const landCreateSchema = z.object({
  parcelCode: z.string().min(3),
  provinceCode: z.string().min(1),
  communeName: z.string().min(1),
  mapSheetNumber: z.string().min(1),
  parcelNumber: z.string().min(1),
  area: z.coerce.number().positive(),
  landUsePurpose: z.string().min(1),
  address: z.string().min(3),
  ownerUserId: z.string().nullable().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional()
});

export const landUpdateSchema = landCreateSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, "At least one field must be provided");

export const landSearchSchema = landListSchema;

export type LandCreateInput = z.infer<typeof landCreateSchema>;
export type LandUpdateInput = z.infer<typeof landUpdateSchema>;
export type LandListInput = z.infer<typeof landListSchema>;
