/**
 * Format label cho phía nhà tuyển dụng để candidate dễ phân biệt nhiều HR:
 * "Tên HR - Tên công ty".
 */
export function buildRecruiterLabel(
  recruiterName: string | null | undefined,
  companyName: string | null | undefined,
  fallback = "Nhà tuyển dụng"
) {
  const safeRecruiterName = recruiterName?.trim();
  const safeCompanyName = companyName?.trim();

  if (safeRecruiterName && safeCompanyName) {
    return `${safeRecruiterName} - ${safeCompanyName}`;
  }
  return safeRecruiterName || fallback;
}
