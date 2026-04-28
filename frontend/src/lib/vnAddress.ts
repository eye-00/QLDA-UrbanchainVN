export type ProvinceOption = {
  code: string;
  name: string;
};

export type CommuneOption = {
  code: string;
  name: string;
  provinceCode: string;
};

type ProvinceApiItem = {
  code: number;
  name: string;
};

type WardApiItem = {
  code: number;
  name: string;
  province_code: number;
};

type ProvinceDetailApiItem = {
  code: number;
  wards: WardApiItem[];
};

const PROVINCES_API_BASE = 'https://provinces.open-api.vn/api/v2';
const REQUEST_TIMEOUT_MS = 3500;
const RETRY_COUNT = 1;

let provinceCache: ProvinceOption[] | null = null;
const communeCacheByProvince = new Map<string, CommuneOption[]>();

async function fetchJsonWithRetry<T>(url: string, retries = RETRY_COUNT): Promise<T> {
  try {
    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const response = await fetch(url, { signal: controller.signal });
    globalThis.clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    if (retries > 0) return fetchJsonWithRetry<T>(url, retries - 1);
    throw error;
  }
}

export async function loadProvinceOptions() {
  if (provinceCache) return provinceCache;
  const data = await fetchJsonWithRetry<ProvinceApiItem[]>(`${PROVINCES_API_BASE}/`);
  provinceCache = data
    .map((item) => ({ code: String(item.code), name: item.name }))
    .sort((left, right) => left.name.localeCompare(right.name, 'vi'));
  return provinceCache;
}

export async function loadCommuneOptionsByProvince(provinceCode: string) {
  const normalizedCode = provinceCode.trim();
  if (!normalizedCode) return [];
  const cached = communeCacheByProvince.get(normalizedCode);
  if (cached) return cached;

  const data = await fetchJsonWithRetry<ProvinceDetailApiItem>(
    `${PROVINCES_API_BASE}/p/${encodeURIComponent(normalizedCode)}?depth=2`
  );
  const options = (data.wards ?? [])
    .map((ward) => ({
      code: String(ward.code),
      name: ward.name,
      provinceCode: String(ward.province_code)
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'vi'));

  communeCacheByProvince.set(normalizedCode, options);
  return options;
}
