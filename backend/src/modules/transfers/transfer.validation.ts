import { z } from "zod";

export const createTransferSchema = z.object({
  landCode: z.string().min(1),
  fromUserId: z.string().min(1).optional(),
  toUserRef: z.string().min(1),
  supportingFileIds: z.array(z.string()).default([])
});

export const updateTransferSchema = z.object({
  note: z.string().min(3).optional()
});

export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export type UpdateTransferInput = z.infer<typeof updateTransferSchema>;
