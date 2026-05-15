// Utility tách riêng để section chính tập trung vào orchestration (fetch + render state).
export function getCompanyInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

// Marquee cần tối thiểu một số lượng item để chuyển động mượt.
// Nếu backend trả ít công ty, hàm này lặp dữ liệu đủ ngưỡng rồi nhân đôi để chạy loop liền mạch.
export function buildMarqueeCompanies<T>(companies: T[], minimumVisible = 8): T[] {
  if (companies.length === 0) {
    return [];
  }

  const repeated = Array.from(
    { length: Math.ceil(minimumVisible / companies.length) },
    () => companies
  ).flat();

  const base = repeated.slice(0, Math.max(minimumVisible, companies.length));
  return [...base, ...base];
}
