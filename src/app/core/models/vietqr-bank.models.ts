/** Phản hồi https://api.vietqr.io/v2/banks */
export interface VietQrBankDto {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  transferSupported: number;
  lookupSupported: number;
  short_name: string;
  support: number;
  isTransfer: number;
  swift_code: string | null;
}

export interface VietQrBanksApiResponse {
  code: string;
  desc: string;
  data: VietQrBankDto[];
}
