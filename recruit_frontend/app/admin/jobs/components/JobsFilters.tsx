type JobsFiltersProps = {
  keyword: string;
  company: string;
  location: string;
  industry: string;
  status: string;
  onKeywordChange: (value: string) => void;
  onCompanyChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onIndustryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
};

// Filter bar cho trang duyệt tin tuyển dụng admin.
export function JobsFilters({
  keyword,
  company,
  location,
  industry,
  status,
  onKeywordChange,
  onCompanyChange,
  onLocationChange,
  onIndustryChange,
  onStatusChange,
}: JobsFiltersProps) {
  return (
    <div className="mb-4 grid gap-2 md:grid-cols-5">
      <input
        type="text"
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
        placeholder="Tìm tiêu đề"
        className="h-10 rounded-md border border-slate-300 px-3 text-sm"
      />
      <input
        type="text"
        value={company}
        onChange={(e) => onCompanyChange(e.target.value)}
        placeholder="Lọc theo công ty"
        className="h-10 rounded-md border border-slate-300 px-3 text-sm"
      />
      <input
        type="text"
        value={location}
        onChange={(e) => onLocationChange(e.target.value)}
        placeholder="Lọc theo địa điểm"
        className="h-10 rounded-md border border-slate-300 px-3 text-sm"
      />
      <input
        type="text"
        value={industry}
        onChange={(e) => onIndustryChange(e.target.value)}
        placeholder="Lọc theo ngành nghề"
        className="h-10 rounded-md border border-slate-300 px-3 text-sm"
      />
      <select value={status} onChange={(e) => onStatusChange(e.target.value)} className="h-10 rounded-md border border-slate-300 px-3 text-sm">
        <option value="">Tất cả trạng thái</option>
        <option value="PENDING">Chờ duyệt</option>
        <option value="APPROVED">Đã duyệt</option>
        <option value="REJECTED">Từ chối</option>
        <option value="HIDDEN">Đã ẩn</option>
        <option value="EXPIRED">Hết hạn</option>
      </select>
    </div>
  );
}
