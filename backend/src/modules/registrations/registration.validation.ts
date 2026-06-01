import { z } from "zod";
import { AUTH_ROLES } from "../auth/auth.middleware.js";

export const registrationStatusSchema = z.enum([
  "MOI_TAO",
  "CHO_TIEP_NHAN",
  "CAN_BO_SUNG",
  "DA_TIEP_NHAN",
  "CHO_XAC_NHAN_CAP_XA",
  "DA_XAC_NHAN_CAP_XA",
  "DANG_THAM_DINH_VPDKDD",
  "CHO_THUE",
  "CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH",
  "DA_HOAN_THANH_NGHIA_VU_TAI_CHINH",
  "CHO_KY_CAP",
  "DA_KY_CAP",
  "DA_CAP_NHAT_HO_SO_DIA_CHINH",
  "DA_GHI_BLOCKCHAIN",
  "DA_CAP",
  "DA_TRA_KET_QUA",
  "HUY_HO_SO",
  "TU_CHOI"
]);

export const legalBasisCodeSchema = z.string().min(3).max(191);

export const DEFAULT_REGISTRATION_PROCEDURE_CODE = (
  process.env.DEFAULT_REGISTRATION_PROCEDURE_CODE ?? "DKDD_LANDAU_3380"
)
  .trim()
  .toUpperCase();

export const createRegistrationSchema = z.object({
  landInfo: z.object({
    provinceCode: z.string().min(1),
    communeName: z.string().min(1),
    parcelNumber: z.string().min(1),
    mapSheetNumber: z.string().min(1),
    area: z.coerce.number().positive(),
    landUsePurpose: z.string().min(1),
    address: z.string().min(1)
  }),
  ownerInfo: z.object({
    ownerType: z.string().min(1).default("INDIVIDUAL"),
    fullName: z.string().min(2),
    identityNumber: z.string().optional(),
    address: z.string().optional()
  }),
  procedureCode: z.string().min(3).max(64).optional(),
  legalBasisCode: legalBasisCodeSchema.optional(),
  attachedFileIds: z.array(z.string()).optional(),
  fileIds: z.array(z.string()).optional()
});

export const listSchema = z.object({
  status: registrationStatusSchema.optional(),
  keyword: z.string().optional(),
  procedureCode: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

export const submitSchema = z.object({
  legalBasisCode: legalBasisCodeSchema,
  note: z.string().min(3).optional()
});

export const patchStatusSchema = z
  .object({
    status: registrationStatusSchema,
    legalBasisCode: legalBasisCodeSchema,
    reason: z.string().min(3).optional()
  })
  .superRefine((value, ctx) => {
    if ((value.status === "CAN_BO_SUNG" || value.status === "TU_CHOI") && !value.reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reason"],
        message: "reason is required for supplement/reject status"
      });
    }
  });

export const communeConfirmSchema = z.object({
  confirmed: z.boolean(),
  legalBasisCode: legalBasisCodeSchema,
  notes: z.string().min(3),
  evidenceFileId: z.string().min(3)
});

export const taxTransferSchema = z.object({
  legalBasisCode: legalBasisCodeSchema,
  taxReferenceNo: z.string().min(3),
  amount: z.coerce.number().positive().optional(),
  notes: z.string().min(3).optional()
});

export const approveSchema = z.object({
  legalBasisCode: legalBasisCodeSchema,
  approvalNumber: z.string().min(3).optional(),
  approvalDate: z.string().optional(),
  note: z.string().min(3).optional(),
  landCode: z.string().optional()
});

export const cadastralUpdateSchema = z.object({
  legalBasisCode: legalBasisCodeSchema,
  note: z.string().min(3).optional()
});

export const blockchainSyncModeSchema = z.enum(["OFFICER_SERVICE_WALLET", "CITIZEN_DIRECT_SIGN"]);

export const blockchainSyncSchema = z.object({
  legalBasisCode: legalBasisCodeSchema,
  syncMode: blockchainSyncModeSchema.optional(),
  cid: z.string().min(3),
  metadataHash: z.string().min(3),
  walletAuthorizationId: z.string().min(1).optional(),
  signerWalletAddress: z.string().min(1),
  signerChainId: z.coerce.number().int().positive(),
  signingMessage: z.string().min(3),
  signature: z.string().min(20)
});

export const requiredNoteSchema = z.object({
  legalBasisCode: legalBasisCodeSchema,
  note: z.string().min(3)
});

export const supplementRequestSchema = z
  .object({
    legalBasisCode: legalBasisCodeSchema,
    note: z.string().min(3),
    missingItems: z.array(z.string().min(2)).min(1),
    deadlineAt: z.string().datetime()
  })
  .superRefine((value, ctx) => {
    const deadline = new Date(value.deadlineAt);
    if (Number.isNaN(deadline.getTime()) || deadline <= new Date()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deadlineAt"],
        message: "deadlineAt must be a valid future datetime"
      });
    }
  });

export const createDocumentVersionSchema = z.object({
  documentType: z.string().min(1),
  storageStatus: z.string().min(1).default("UPLOADED_IPFS"),
  fileAssetId: z.string().optional(),
  cid: z.string().optional(),
  hash: z.string().optional(),
  note: z.string().optional()
});

export const createPaymentObligationSchema = z.object({
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
  receiptRef: z.string().min(3).optional(),
  receiptFileId: z.string().min(3).optional(),
  amount: z.coerce.number().positive().optional(),
  note: z.string().min(3).optional()
});

export const updatePaymentObligationSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]),
  legalBasisCode: legalBasisCodeSchema,
  note: z.string().min(3).optional()
});

export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>;
export type ListRegistrationsInput = z.infer<typeof listSchema>;
export type SubmitRegistrationInput = z.infer<typeof submitSchema>;
export type PatchStatusInput = z.infer<typeof patchStatusSchema>;
export type CommuneConfirmInput = z.infer<typeof communeConfirmSchema>;
export type TaxTransferInput = z.infer<typeof taxTransferSchema>;
export type ApproveInput = z.infer<typeof approveSchema>;
export type CadastralUpdateInput = z.infer<typeof cadastralUpdateSchema>;
export type BlockchainSyncInput = z.infer<typeof blockchainSyncSchema>;
export type RequiredNoteInput = z.infer<typeof requiredNoteSchema>;
export type SupplementRequestInput = z.infer<typeof supplementRequestSchema>;
export type CreateDocumentVersionInput = z.infer<typeof createDocumentVersionSchema>;
export type CreatePaymentObligationInput = z.infer<typeof createPaymentObligationSchema>;
export type UpdatePaymentObligationInput = z.infer<typeof updatePaymentObligationSchema>;
export type BlockchainSyncMode = z.infer<typeof blockchainSyncModeSchema>;

export const allAuthenticatedRoles = [...AUTH_ROLES.citizen, ...AUTH_ROLES.officers];
export const statusMutationRoles = [
  "RECEPTION_OFFICER",
  "COMMUNE_OFFICER",
  "LAND_REGISTRY_OFFICER",
  "APPROVAL_AUTHORITY",
  "TAX_OFFICER",
  "ADMIN"
] as const;
