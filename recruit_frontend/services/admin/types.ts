export interface AdminStatsResponse {
  tongNguoiDung: number;
  nguoiDungHoatDong: number;
  nguoiDungKhongHoatDong: number;
  tongCongTy: number;
  congTyChoDuyet: number;
  congTyDaDuyet: number;
  congTyBiTuChoi: number;
}

export interface AdminUser {
  id: number;
  hoTen: string;
  email: string;
  soDienThoai: string | null;
  vaiTroHeThong: string | null;
  dangHoatDong: boolean;
  trangThai: string;
  congTyTen: string | null;
  vaiTroCongTy: string | null;
  chiNhanhTen: string | null;
  ngayTao: string;
  ngayCapNhat: string;
}

export interface AdminCompany {
  id: number;
  ten: string;
  maSoThue: string;
  website: string | null;
  trangThai: string;
  lyDoTuChoi: string | null;
  chuCongTyHoTen: string | null;
  chuCongTyEmail: string | null;
  soChiNhanh: number;
  minhChungUrl: string | null;
  minhChungTrangThai: string | null;
  minhChungLyDoTuChoi: string | null;
  ngayTao: string;
  ngayCapNhat: string;
}

export interface UpdateUserStatusPayload {
  dangHoatDong: boolean;
}

export interface ReviewCompanyPayload {
  lyDoTuChoi: string;
}

export interface AdminCompanyDetailBranch {
  id: number | null;
  ten: string | null;
  diaChiChiTiet: string | null;
  xaPhuongTen: string | null;
  tinhThanhTen: string | null;
  laTruSoChinh: boolean | null;
  trangThai: string | null;
  ngayTao: string | null;
}

export interface AdminCompanyDetailProofDocument {
  id: number | null;
  tenTep: string | null;
  duongDanTep: string | null;
  loaiTaiLieu: string | null;
  trangThai: string | null;
  lyDoTuChoi: string | null;
  ngayTao: string | null;
}

export interface AdminCompanyDetailOwner {
  id: number | null;
  hoTen: string | null;
  email: string | null;
  soDienThoai: string | null;
  dangHoatDong: boolean | null;
}

export interface AdminCompanyDetail {
  congTy: AdminCompany;
  chuCongTy: AdminCompanyDetailOwner;
  chiNhanhs: AdminCompanyDetailBranch[];
  taiLieuMinhChungs: AdminCompanyDetailProofDocument[];
}

export interface AdminPackage {
  id: number | null;
  maGoi: string | null;
  tenGoi: string | null;
  moTa: string | null;
  giaNiemYet: number | null;
  soNgayHieuLuc: number | null;
  soCongTyDangSuDung: number | null;
}

export interface AdminPackageSubscription {
  id: number | null;
  congTy: string | null;
  goi: string | null;
  trangThai: string | null;
  trangThaiThanhToan: string | null;
  batDauLuc: string | null;
  hetHanLuc: string | null;
  giaTaiThoiDiemDangKy: number | null;
  ngayTao: string | null;
  coHieuLuc: boolean | null;
}

export interface AdminCatalogItem {
  id: number | null;
  ten: string | null;
  moTa: string | null;
}

export interface UpsertAdminCatalogItemPayload {
  ten: string;
  moTa?: string;
}

export interface AdminJob {
  id: number;
  tieuDe: string | null;
  congTyTen: string | null;
  chiNhanhTen: string | null;
  diaDiem: string | null;
  nganhNgheTen: string | null;
  capDoKinhNghiemTen: string | null;
  luongToiThieu: number | null;
  luongToiDa: number | null;
  trangThai: string | null;
  lyDoTuChoi: string | null;
  denHanLuc: string | null;
  ngayTao: string | null;
}

export interface AdminJobDetail {
  tongQuan: AdminJob;
  moTa: string | null;
  yeuCau: string | null;
  phucLoi: string | null;
  batBuocCV: boolean | null;
  mauCvUrl: string | null;
}

export interface AdminCandidateProof {
  id: number;
  hoSoUngVienId: number | null;
  loai: "EDUCATION" | "CERTIFICATE" | string;
  tieuDe: string | null;
  moTa: string | null;
  ungVienHoTen: string | null;
  ungVienEmail: string | null;
  duongDanTep: string | null;
  trangThai: string | null;
}

export interface ReviewJobPayload {
  lyDoTuChoi: string;
}

export interface CreatePackagePayload {
  tenGoi: string;
  moTa?: string;
  giaNiemYet: number;
  soNgayHieuLuc: number;
}

export interface UpdatePackagePayload {
  tenGoi: string;
  moTa?: string;
  giaNiemYet: number;
  soNgayHieuLuc: number;
}
