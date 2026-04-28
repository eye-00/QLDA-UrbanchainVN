import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError, apiPost } from '../src/lib/api';

describe('api error envelope handling', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps duplicate parcel conflict to ApiRequestError 409', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        success: false,
        message: 'Land parcel already exists',
        errors: [{ code: 'LAND_DUPLICATE' }]
      })
    } as Response);

    await expect(apiPost('/lands', { parcelCode: 'LAND-001' })).rejects.toMatchObject<ApiRequestError>({
      statusCode: 409,
      message: 'Land parcel already exists'
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
