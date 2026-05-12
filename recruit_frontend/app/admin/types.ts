export type ThongKeNhanhItem = {
  label: string;
  value: string;
  description: string;
};

export type DuyetGanDayStatus = "PENDING" | "APPROVED" | "REJECTED";

export type DuyetGanDayItem = {
  ten: string;
  congTy: string;
  trangThai: DuyetGanDayStatus;
  ngay: string;
};
