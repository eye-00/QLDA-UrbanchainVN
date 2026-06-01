import { z } from "zod";

export const legalBasisCodeSchema = z.string().min(3).max(191);

export const createPaymentObligationSchema = z.object({
  registrationId: z.string().min(3),
  type: z.enum([
    "INTAKE_FEE",
    "LAND_FINANCIAL_OBLIGATION",
    "REGISTRATION_FEE",
    "LATE_FEE",
    "OTHER_LEGAL_FEE"
  ]),
  legalBasisCode: legalBasisCodeSchema,
  referenceNo: z.string().min(3).optional(),
  noticeRef: z.string().min(3).optional(),
  amount: z.coerce.number().positive().optional(),
  note: z.string().min(3).optional()
});

export const generateQrSchema = z.object({
  legalBasisCode: legalBasisCodeSchema,
  noticeRef: z.string().min(3).optional(),
  amount: z.coerce.number().positive().optional(),
  note: z.string().min(3).optional()
});

export const mockConfirmSchema = z
  .object({
    legalBasisCode: legalBasisCodeSchema,
    receiptRef: z.string().min(3).optional(),
    receiptFileId: z.string().min(3).optional(),
    note: z.string().min(3).optional()
  })
  .superRefine((value, ctx) => {
    if (!value.receiptRef && !value.receiptFileId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["receiptRef"],
        message: "receiptRef hoặc receiptFileId là bắt buộc"
      });
    }
  });

export const verifyReceiptSchema = z.object({
  legalBasisCode: legalBasisCodeSchema,
  verified: z.boolean(),
  verifyNote: z.string().min(3).optional()
});

export const recordOnChainSchema = z.object({
  legalBasisCode: legalBasisCodeSchema,
  evidenceTxHash: z.string().min(6),
  evidenceCid: z.string().min(3).optional(),
  evidenceHash: z.string().min(3).optional(),
  note: z.string().min(3).optional()
});

export const listObligationsSchema = z.object({
  registrationId: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

export type CreatePaymentObligationInput = z.infer<typeof createPaymentObligationSchema>;
export type GenerateQrInput = z.infer<typeof generateQrSchema>;
export type MockConfirmInput = z.infer<typeof mockConfirmSchema>;
export type VerifyReceiptInput = z.infer<typeof verifyReceiptSchema>;
export type RecordOnChainInput = z.infer<typeof recordOnChainSchema>;
export type ListObligationsInput = z.infer<typeof listObligationsSchema>;
