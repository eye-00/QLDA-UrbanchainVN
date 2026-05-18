import type { UploadedFileItem } from '../lib/files';

export const DEFAULT_REGISTRATION_PROCEDURE_CODE = 'DKDD_LANDAU_3380';

export type CitizenRegistrationFormState = {
  procedureCode: string;
  fullName: string;
  identityNumber: string;
  mapSheetNumber: string;
  parcelNumber: string;
  area: string;
  landUsePurpose: string;
  address: string;
  provinceCode: string;
  communeName: string;
};

export function buildCreateRegistrationPayload(
  form: CitizenRegistrationFormState,
  attachedFiles: UploadedFileItem[]
) {
  const procedureCode = form.procedureCode.trim() || DEFAULT_REGISTRATION_PROCEDURE_CODE;
  return {
    procedureCode,
    landInfo: {
      provinceCode: form.provinceCode.trim(),
      communeName: form.communeName.trim(),
      parcelNumber: form.parcelNumber.trim(),
      mapSheetNumber: form.mapSheetNumber.trim(),
      area: Number(form.area),
      landUsePurpose: form.landUsePurpose.trim(),
      address: form.address.trim()
    },
    ownerInfo: {
      ownerType: 'INDIVIDUAL',
      fullName: form.fullName.trim(),
      identityNumber: form.identityNumber.trim()
    },
    fileIds: attachedFiles.map((item) => item.id)
  };
}

export function buildSubmitRegistrationPayload(now = new Date()) {
  return {
    legalBasisCode: `QĐ3380-SUBMIT-${now.getFullYear()}`
  };
}
