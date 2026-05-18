import * as z from "zod";

export const branchSchema = z.object({
  tenChiNhanh: z.string().min(1, "Tên chi nhánh không được để trống"),
  diaChiChiTietChiNhanh: z.string().min(1, "Địa chỉ chi nhánh không được để trống"),
  tinhThanhId: z.string().min(1, "Tỉnh/thành không được để trống"),
  tenXaPhuong: z.string().min(1, "Phường/xã không được để trống"),
});

export const ownerRegisterSchema = z.object({
  ho: z.string().min(1, "Họ không được để trống"),
  ten: z.string().min(1, "Tên không được để trống"),
  email: z.string().email("Email không hợp lệ"),
  soDienThoai: z.string().min(10, "Số điện thoại không hợp lệ"),
  matKhau: z.string().min(6, "Mật khẩu phải ít nhất 6 ký tự"),
  tenCongTy: z.string().min(1, "Tên công ty không được để trống"),
  maSoThue: z.string().min(1, "Mã số thuế không được để trống"),
  website: z.string().max(255).optional(),
  moTaCongTy: z.string().max(5000).optional(),
  chiNhanhs: z.array(branchSchema).min(1, "Cần ít nhất một chi nhánh"),
  tepMinhChung: z.any().refine((files) => files?.length > 0, "Vui lòng tải lên file minh chứng"),
});

export type OwnerFormValues = z.infer<typeof ownerRegisterSchema>;

export const defaultBranch = {
  tenChiNhanh: "",
  diaChiChiTietChiNhanh: "",
  tinhThanhId: "",
  tenXaPhuong: "",
};
