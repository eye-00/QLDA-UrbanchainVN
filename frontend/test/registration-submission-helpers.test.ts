import { describe, expect, it } from 'vitest';
import {
  buildCreateRegistrationPayload,
  buildSubmitRegistrationPayload,
  DEFAULT_REGISTRATION_PROCEDURE_CODE,
  type CitizenRegistrationFormState
} from '../src/pages/registrationSubmissionHelpers';

const baseForm: CitizenRegistrationFormState = {
  procedureCode: '',
  fullName: ' Nguyễn Văn A ',
  identityNumber: ' 0482xxxxxxx ',
  mapSheetNumber: ' 03 ',
  parcelNumber: ' 123 ',
  area: '120.5',
  landUsePurpose: ' ODT ',
  address: ' 52 Nguyễn Lương Bằng ',
  provinceCode: ' 48 ',
  communeName: ' Phường Liên Chiểu '
};

describe('registration submission helpers', () => {
  it('builds create registration payload with default procedure and attached file ids', () => {
    expect(
      buildCreateRegistrationPayload(baseForm, [
        {
          id: 'fil_001',
          originalName: 'don.pdf',
          documentType: 'DON_DANG_KY',
          storageStatus: 'UPLOADED_IPFS',
          cid: 'bafy123',
          hash: '0xabc'
        }
      ])
    ).toEqual({
      procedureCode: DEFAULT_REGISTRATION_PROCEDURE_CODE,
      landInfo: {
        provinceCode: '48',
        communeName: 'Phường Liên Chiểu',
        parcelNumber: '123',
        mapSheetNumber: '03',
        area: 120.5,
        landUsePurpose: 'ODT',
        address: '52 Nguyễn Lương Bằng'
      },
      ownerInfo: {
        ownerType: 'INDIVIDUAL',
        fullName: 'Nguyễn Văn A',
        identityNumber: '0482xxxxxxx'
      },
      fileIds: ['fil_001']
    });
  });

  it('preserves explicit procedure code and builds submit payload with legal basis', () => {
    expect(
      buildCreateRegistrationPayload(
        {
          ...baseForm,
          procedureCode: ' DKDD_BIEN_DONG_3380 '
        },
        []
      ).procedureCode
    ).toBe('DKDD_BIEN_DONG_3380');

    expect(buildSubmitRegistrationPayload(new Date('2026-05-17T09:00:00.000Z'))).toEqual({
      legalBasisCode: 'QĐ3380-SUBMIT-2026'
    });
  });
});
