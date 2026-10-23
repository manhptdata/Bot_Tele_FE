const VIET_QR_BANKS_URL = 'https://api.vietqr.io/v2/banks';

type VietQrBankResponse = {
  id?: number | string;
  name?: string;
  shortName?: string;
  code?: string;
  bin?: string;
};

type VietQrBanksResponse = {
  code?: string;
  data?: VietQrBankResponse[];
};

export type BankOption = {
  key: string;
  displayName: string;
  shortName: string;
  qrCode: string;
};

const normalizeBank = (bank: VietQrBankResponse): BankOption | null => {
  const displayName = bank.name?.trim() || '';
  const shortName = bank.shortName?.trim() || bank.code?.trim() || '';

  // Keep provider-specific field precedence at this boundary. VietQR Quick Link
  // accepts a bank code or BIN, while shortName remains a legacy fallback.
  const qrCode = bank.code?.trim() || bank.bin?.trim() || shortName;
  if (!shortName || !qrCode) return null;

  return {
    key: String(bank.id ?? bank.bin ?? bank.code ?? shortName),
    displayName: displayName || shortName,
    shortName,
    qrCode,
  };
};

export const fetchVietQrBanks = async (signal?: AbortSignal): Promise<BankOption[]> => {
  const response = await fetch(VIET_QR_BANKS_URL, { signal });
  if (!response.ok) {
    throw new Error(`VietQR bank catalog returned HTTP ${response.status}`);
  }

  const body = (await response.json()) as VietQrBanksResponse;
  if (body.code !== '00' || !Array.isArray(body.data)) {
    throw new Error('VietQR bank catalog returned an unexpected response');
  }

  return body.data
    .map(normalizeBank)
    .filter((bank): bank is BankOption => bank !== null);
};
