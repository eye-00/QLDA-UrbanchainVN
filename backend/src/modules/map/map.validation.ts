import { z } from "zod";

export const sourceTypeSchema = z.enum([
  "DEMO",
  "IMPORTED",
  "OFFICIAL_REFERENCE",
  "UNKNOWN_NEEDS_REVIEW"
]);

export const geometryStatusSchema = z.enum([
  "DRAFT",
  "UNDER_REVIEW",
  "OFFCHAIN_APPROVED",
  "BOUNDARY_HASH_RECORDED"
]);

export const mapListSchema = z.object({
  keyword: z.string().optional(),
  sourceType: sourceTypeSchema.optional(),
  geometryStatus: geometryStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

export const geometryUpsertSchema = z.object({
  sourceType: sourceTypeSchema.optional(),
  geometry: z.record(z.any()),
  note: z.string().min(3).optional()
});

export const geometryReviewSchema = z.object({
  decision: z.enum(["REVIEWED", "NEEDS_UPDATE"]).default("REVIEWED"),
  note: z.string().min(3),
  sourceType: sourceTypeSchema.optional()
});

export const approveSchema = z.object({
  note: z.string().min(3).optional()
});

export const recordBoundaryHashSchema = z.object({
  boundaryHashValue: z.string().min(8),
  boundaryHashTxHash: z.string().min(8).optional(),
  boundaryHashCid: z.string().min(3).optional(),
  note: z.string().min(3).optional()
});

export type MapListInput = z.infer<typeof mapListSchema>;
export type GeometryUpsertInput = z.infer<typeof geometryUpsertSchema>;
export type GeometryReviewInput = z.infer<typeof geometryReviewSchema>;
export type ApproveInput = z.infer<typeof approveSchema>;
export type RecordBoundaryHashInput = z.infer<typeof recordBoundaryHashSchema>;
