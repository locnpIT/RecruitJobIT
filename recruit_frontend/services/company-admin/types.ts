export interface CompanyAdminUser {
  id: number | null;
  email: string | null;
  ten: string | null;
  ho: string | null;
  vaiTroHeThong: string | null;
  dangHoatDong: boolean | null;
}

export interface CompanyAdminCompany {
  id: number | null;
  ten: string | null;
  maSoThue: string | null;
  website: string | null;
  moTa: string | null;
  logoUrl: string | null;
  trangThai: string | null;
  lyDoTuChoi: string | null;
  coQuyenDangBai: boolean | null;
  goiDangBaiTen: string | null;
  goiDangBaiHetHanLuc: string | null;
  goiDangBaiTrangThai: string | null;
  goiDangBaiTrangThaiThanhToan: string | null;
}

export interface CompanyPackagePlan {
  id: number | null;
  maGoi: string | null;
  tenGoi: string | null;
  moTa: string | null;
  giaNiemYet: number | null;
  soNgayHieuLuc: number | null;
}

export interface CompanyPackageRegistration {
  id: number | null;
  congTyId: number | null;
  danhMucGoiId: number | null;
  maGoi: string | null;
  tenGoi: string | null;
  trangThai: string | null;
  trangThaiThanhToan: string | null;
  batDauLuc: string | null;
  hetHanLuc: string | null;
  giaTaiThoiDiemDangKy: number | null;
  ngayTao: string | null;
  coHieuLuc: boolean | null;
  paymentGateway?: string | null;
  paymentCode?: string | null;
  transferContent?: string | null;
  qrImageUrl?: string | null;
  checkoutFormAction?: string | null;
  checkoutFormFields?: Record<string, string> | null;
}

export interface CompanyPackageOverview {
  danhSachGoi: CompanyPackagePlan[];
  goiHienTai: CompanyPackageRegistration | null;
  coQuyenDangBai: boolean | null;
}

export interface CompanyAdminProof {
  id: number | null;
  tenTep: string | null;
  duongDanTep: string | null;
  loaiTaiLieu: string | null;
  trangThai: string | null;
  lyDoTuChoi: string | null;
  ngayTao: string | null;
}

export interface CompanyProofType {
  id: number | null;
  ten: string | null;
  moTa: string | null;
}

export interface CompanyProofUploadItemPayload {
  loaiTaiLieuId: number;
  duongDanTep: string;
  tenTep?: string;
}

export interface CompanyAdminBranch {
  chiNhanhId: number | null;
  chiNhanhTen: string | null;
  congTyId: number | null;
  congTyTen: string | null;
  vaiTroCongTy: string | null;
  laTruSoChinh: boolean | null;
  trangThai: string | null;
}

export interface CompanyAdminMeResponse {
  nguoiDung: CompanyAdminUser;
  congTy: CompanyAdminCompany;
  chiNhanhs: CompanyAdminBranch[];
}

export interface CompanyAdminJob {
  id: number | null;
  tieuDe: string | null;
  trangThai: string | null;
  chiNhanhId: number | null;
  chiNhanhTen: string | null;
  congTyId: number | null;
  congTyTen: string | null;
  moTa: string | null;
  yeuCau: string | null;
  phucLoi: string | null;
  batBuocCV: boolean | null;
  mauCvUrl: string | null;
  nganhNgheId: number | null;
  nganhNgheTen: string | null;
  loaiHinhLamViecId: number | null;
  loaiHinhLamViecTen: string | null;
  capDoKinhNghiemId: number | null;
  capDoKinhNghiemTen: string | null;
  luongToiThieu: number | null;
  luongToiDa: number | null;
  soLuongTuyen: number | null;
  lyDoTuChoi: string | null;
  denHanLuc: string | null;
  ngayTao: string | null;
  kyNangs?: CompanyJobSkillItem[];
}

export interface CompanyJobMetadataOption {
  id: number | null;
  ten: string | null;
}

export interface CompanyJobSkillItem {
  id: number | null;
  ten: string | null;
}

export interface CompanyJobMetadata {
  nganhNghes: CompanyJobMetadataOption[];
  loaiHinhLamViecs: CompanyJobMetadataOption[];
  capDoKinhNghiems: CompanyJobMetadataOption[];
  kyNangs: CompanyJobMetadataOption[];
}

export interface CompanyAdminApplication {
  id: number | null;
  trangThai: string | null;
  cvUrl: string | null;
  ngayTao: string | null;
  chiNhanhId: number | null;
  chiNhanhTen: string | null;
  congTyId: number | null;
  congTyTen: string | null;
  tinTuyenDungId: number | null;
  tieuDeTinTuyenDung: string | null;
  nguoiDungId: number | null;
  ungVienHoTen: string | null;
  ungVienEmail: string | null;
  ungVienSoDienThoai: string | null;
  ungVienAnhDaiDienUrl: string | null;
  hoSoUngVienId: number | null;
  gioiThieuBanThan: string | null;
  mucTieuNgheNghiep: string | null;
  hocVans?: CompanyAdminApplicationEducation[];
  chungChis?: CompanyAdminApplicationCertificate[];
  kyNangs?: CompanyAdminApplicationSkill[];
}

export interface CompanyAdminApplicationEducation {
  id: number | null;
  tenTruong: string | null;
  chuyenNganh: string | null;
  bacHoc: string | null;
  thoiGianBatDau: string | null;
  thoiGianKetThuc: string | null;
  duongDanTep: string | null;
  trangThai: string | null;
}

export interface CompanyAdminApplicationCertificate {
  id: number | null;
  loaiChungChiId: number | null;
  loaiChungChiTen: string | null;
  tenChungChi: string | null;
  ngayBatDau: string | null;
  ngayHetHan: string | null;
  duongDanTep: string | null;
  trangThai: string | null;
}

export interface CompanyAdminApplicationSkill {
  id: number | null;
  ten: string | null;
}

export interface CompanyCandidateSemanticMatch {
  hoSoUngVienId: number | null;
  nguoiDungId: number | null;
  tenHoSo: string | null;
  ungVienHoTen: string | null;
  email: string | null;
  soDienThoai: string | null;
  anhDaiDienUrl: string | null;
  mucTieuNgheNghiep: string | null;
  gioiThieuBanThan: string | null;
  diemPhuHop: number | null;
  tinHieuKhop: string[];
  canKiemTraThem: string[];
}

export interface CompanyAdminHrBranch {
  chiNhanhId: number | null;
  chiNhanhTen: string | null;
  laTruSoChinh: boolean | null;
}

export interface CompanyAdminHrAccount {
  nguoiDungId: number | null;
  email: string | null;
  ten: string | null;
  ho: string | null;
  soDienThoai: string | null;
  vaiTroHeThong: string | null;
  vaiTroCongTy: string | null;
  dangHoatDong: boolean | null;
  matKhauTam: string | null;
  chiNhanhs: CompanyAdminHrBranch[];
}

export interface CreateCompanyHrPayload {
  email: string;
  ten: string;
  ho: string;
  soDienThoai?: string;
  matKhau: string;
  chiNhanhIds: number[];
}

export interface UpdateCompanyHrPayload {
  email: string;
  ten: string;
  ho: string;
  soDienThoai?: string;
  dangHoatDong?: boolean;
  chiNhanhIds: number[];
}

export interface CreateCompanyJobPayload {
  chiNhanhId: number;
  tieuDe: string;
  nganhNgheId: number;
  moTa: string;
  yeuCau: string;
  phucLoi?: string;
  batBuocCV?: boolean;
  mauCvUrl?: string;
  loaiHinhLamViecId: number;
  capDoKinhNghiemId: number;
  luongToiThieu?: number;
  luongToiDa?: number;
  soLuongTuyen: number;
  denHanLuc?: string;
  kyNangIds?: number[];
}

export interface UpdateCompanyJobPayload {
  tieuDe: string;
  nganhNgheId: number;
  moTa: string;
  yeuCau: string;
  phucLoi?: string;
  batBuocCV?: boolean;
  mauCvUrl?: string;
  loaiHinhLamViecId: number;
  capDoKinhNghiemId: number;
  luongToiThieu?: number;
  luongToiDa?: number;
  soLuongTuyen: number;
  denHanLuc?: string;
  kyNangIds?: number[];
}
