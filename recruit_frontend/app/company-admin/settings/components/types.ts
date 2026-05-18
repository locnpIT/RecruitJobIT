export type CompanyInfoForm = {
  tenCongTy: string;
  maSoThue: string;
  website: string;
  moTaCongTy: string;
};

export type ProofRow = {
  id: string;
  file: File | null;
  fileName: string | null;
  loaiTaiLieuId: number | null;
};

// Factory tạo một dòng minh chứng mới với id unique cho UI list key.
export const createProofRow = (defaultTypeId: number | null): ProofRow => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  file: null,
  fileName: null,
  loaiTaiLieuId: defaultTypeId,
});
