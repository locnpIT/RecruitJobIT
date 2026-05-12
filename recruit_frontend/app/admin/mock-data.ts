import type { DuyetGanDayItem, ThongKeNhanhItem } from "./types";

export const thongKeNhanh: ThongKeNhanhItem[] = [
  { label: "Người dùng mới", value: "+128", description: "+12.4% so với tuần trước" },
  { label: "Tin chờ duyệt", value: "43", description: "-4.2% so với tuần trước" },
  { label: "Công ty hoạt động", value: "218", description: "+2.1% so với tuần trước" },
  { label: "Doanh thu tháng", value: "₫182M", description: "+8.7% so với tuần trước" },
];

export const duyetGanDay: DuyetGanDayItem[] = [
  { ten: "Frontend Engineer", congTy: "Nova Talent", trangThai: "PENDING", ngay: "30/04/2026" },
  { ten: "Data Analyst", congTy: "Blue River", trangThai: "APPROVED", ngay: "30/04/2026" },
  { ten: "QA Automation", congTy: "Apex Works", trangThai: "REJECTED", ngay: "29/04/2026" },
  { ten: "Backend Java", congTy: "Koi Labs", trangThai: "PENDING", ngay: "29/04/2026" },
];

export const hoatDong: string[] = [
  "Owner của Nova Talent đã tạo 2 HR mới",
  "Hệ thống ghi nhận 63 đơn ứng tuyển trong 1 giờ qua",
  "3 công ty mới gửi hồ sơ minh chứng",
  "Admin Linh vừa khóa 1 tài khoản spam",
];

export const quickActions: string[] = [
  "Duyệt công ty",
  "Khóa tài khoản",
  "Xử lý báo cáo",
  "Gửi thông báo",
];
