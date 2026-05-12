import type { CompanyItem, JobItem } from "./types";

export const featuredJobs: JobItem[] = [
  {
    id: "JOB-10241",
    tieuDe: "Backend Developer (Java/Spring)",
    congTy: "Nova Tech Solutions",
    diaDiem: "TP.HCM",
    mucLuong: "25 - 40 triệu",
    capDo: "Middle",
    hinhThuc: "Toàn thời gian",
    hanNop: "25/05/2026",
    tag: "Hot",
  },
  {
    id: "JOB-10238",
    tieuDe: "Frontend Developer (React/Next.js)",
    congTy: "Apex Digital",
    diaDiem: "Hà Nội",
    mucLuong: "20 - 35 triệu",
    capDo: "Junior - Middle",
    hinhThuc: "Hybrid",
    hanNop: "22/05/2026",
    tag: "Mới",
  },
  {
    id: "JOB-10232",
    tieuDe: "QA Automation Engineer",
    congTy: "Koi Labs",
    diaDiem: "Đà Nẵng",
    mucLuong: "18 - 30 triệu",
    capDo: "Middle",
    hinhThuc: "Toàn thời gian",
    hanNop: "20/05/2026",
    tag: "Ưu tiên",
  },
  {
    id: "JOB-10229",
    tieuDe: "Chuyên viên Tuyển dụng IT",
    congTy: "Talent Bridge",
    diaDiem: "TP.HCM",
    mucLuong: "15 - 22 triệu",
    capDo: "Junior",
    hinhThuc: "Toàn thời gian",
    hanNop: "18/05/2026",
    tag: "Mới",
  },
];

export const topCompanies: CompanyItem[] = [
  { ten: "Nova Tech Solutions", linhVuc: "Công nghệ", dangTuyen: 18 },
  { ten: "Apex Digital", linhVuc: "Sản phẩm số", dangTuyen: 12 },
  { ten: "Blue River Retail", linhVuc: "Thương mại điện tử", dangTuyen: 9 },
  { ten: "Koi Labs", linhVuc: "Outsourcing", dangTuyen: 14 },
];

export const quickFilters = ["Java", "Frontend", "Kế toán", "Marketing", "Bảo vệ", "Part-time", "Remote"];
