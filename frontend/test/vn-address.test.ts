import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Vietnam locality API helpers', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps province list to sorted options', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { code: 79, name: 'Thành phố Hồ Chí Minh' },
        { code: 1, name: 'Thành phố Hà Nội' }
      ]
    });
    vi.stubGlobal('fetch', fetchMock);

    const { loadProvinceOptions } = await import('../src/lib/vnAddress');
    const options = await loadProvinceOptions();

    expect(options).toEqual([
      { code: '1', name: 'Thành phố Hà Nội' },
      { code: '79', name: 'Thành phố Hồ Chí Minh' }
    ]);
  });

  it('loads communes by province and reuses in-memory cache', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ code: 48, name: 'Thành phố Đà Nẵng' }]
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 48,
          wards: [
            { code: 20245, name: 'Phường Hòa Khánh', province_code: 48 },
            { code: 20242, name: 'Phường Hải Châu', province_code: 48 }
          ]
        })
      });
    vi.stubGlobal('fetch', fetchMock);

    const { loadProvinceOptions, loadCommuneOptionsByProvince } = await import('../src/lib/vnAddress');
    await loadProvinceOptions();

    const first = await loadCommuneOptionsByProvince('48');
    const second = await loadCommuneOptionsByProvince('48');

    expect(first).toEqual([
      { code: '20242', name: 'Phường Hải Châu', provinceCode: '48' },
      { code: '20245', name: 'Phường Hòa Khánh', provinceCode: '48' }
    ]);
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
