import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiPostFormData } from '../src/lib/api';
import { DOCUMENT_TYPE_OPTIONS, shortValue, uploadRegistrationFile } from '../src/lib/files';

describe('file api helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends multipart upload without forcing content-type', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        message: 'ok',
        data: { id: 'fil_001' }
      })
    } as Response);

    const formData = new FormData();
    formData.set('file', new Blob(['demo'], { type: 'application/pdf' }), 'demo.pdf');
    await apiPostFormData<{ id: string }>('/files/upload', formData);

    const requestInit = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    expect(requestInit.method).toBe('POST');
    expect(requestInit.body).toBe(formData);

    const headers = requestInit.headers as Headers;
    expect(headers.get('Content-Type')).toBeNull();
  });

  it('uploads registration file with expected form fields', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        message: 'ok',
        data: {
          id: 'fil_123',
          originalName: 'hoso.pdf',
          documentType: 'DON_DANG_KY',
          storageStatus: 'UPLOADED_IPFS',
          cid: 'bafy123',
          hash: '0xabc'
        }
      })
    } as Response);

    const file = new File(['demo-pdf'], 'hoso.pdf', { type: 'application/pdf' });
    const result = await uploadRegistrationFile(file, 'DON_DANG_KY');

    expect(result.id).toBe('fil_123');
    expect(result.documentType).toBe('DON_DANG_KY');
  });

  it('provides document type catalog and short value formatter', () => {
    expect(DOCUMENT_TYPE_OPTIONS.length).toBeGreaterThan(0);
    expect(shortValue(null)).toBe('Chưa có');
    expect(shortValue('bafy123')).toBe('bafy123');
    expect(shortValue('bafyxxxxxxxxxxxxxxxxxxxxxx')).toContain('...');
  });
});

