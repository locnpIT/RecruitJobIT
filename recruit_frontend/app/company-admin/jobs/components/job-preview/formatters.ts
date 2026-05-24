import type { CompanyAdminJob } from "@/services/company-admin/types";

const currencyFormatter = new Intl.NumberFormat("vi-VN");
const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatDate(value: string | null) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

export function formatSalary(job: CompanyAdminJob) {
  if (job.luongToiThieu == null && job.luongToiDa == null) {
    return "Thỏa thuận";
  }
  if (job.luongToiThieu != null && job.luongToiDa != null) {
    return `${currencyFormatter.format(job.luongToiThieu)} - ${currencyFormatter.format(job.luongToiDa)}`;
  }
  return currencyFormatter.format(job.luongToiThieu ?? job.luongToiDa ?? 0);
}
