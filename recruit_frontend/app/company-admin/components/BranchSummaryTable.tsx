type BranchRow = {
  chiNhanhId?: number | null;
  chiNhanhTen?: string | null;
  vaiTroCongTy?: string | null;
  trangThai?: string | null;
  laTruSoChinh?: boolean | null;
};

type BranchSummaryTableProps = {
  branches: BranchRow[];
};

export function BranchSummaryTable({ branches }: BranchSummaryTableProps) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <h2 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Chi nhánh
      </h2>
      {branches.length === 0 ? (
        <p className="py-4 text-sm text-slate-500">Chưa có chi nhánh nào được trả về từ hệ thống.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2 font-medium">Tên</th>
                <th className="py-2 font-medium">Vai trò</th>
                <th className="py-2 font-medium">Trạng thái</th>
                <th className="py-2 font-medium">Chi nhánh chính</th>
                <th className="py-2 font-medium">ID</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr key={branch.chiNhanhId ?? branch.chiNhanhTen} className="border-b border-slate-200">
                  <td className="py-2.5 pr-4 font-medium text-slate-900">{branch.chiNhanhTen ?? "--"}</td>
                  <td className="py-2.5 pr-4 text-slate-600">{branch.vaiTroCongTy ?? "--"}</td>
                  <td className="py-2.5 pr-4 text-slate-600">{branch.trangThai ?? "--"}</td>
                  <td className="py-2.5 pr-4 text-slate-600">{branch.laTruSoChinh ? "Có" : "Không"}</td>
                  <td className="py-2.5 text-slate-600">{branch.chiNhanhId ?? "--"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
