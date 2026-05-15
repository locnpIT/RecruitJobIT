type TopCompaniesStatesProps = {
  loading: boolean;
  empty: boolean;
};

// Tách các trạng thái loading/empty riêng để giảm if-else lồng trong section chính.
export function TopCompaniesStates({ loading, empty }: TopCompaniesStatesProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        Đang tải danh sách doanh nghiệp...
      </div>
    );
  }

  if (empty) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        Chưa có doanh nghiệp nổi bật để hiển thị.
      </div>
    );
  }

  return null;
}
