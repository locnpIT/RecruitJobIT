import type { CompanyAdminBranch } from "@/services/company-admin.service";

type BranchesTableProps = {
  branches: CompanyAdminBranch[];
};

// Bảng hiển thị danh sách chi nhánh truy cập được của account doanh nghiệp hiện tại.
export function BranchesTable({ branches }: BranchesTableProps) {
  if (!branches.length) {
    return (
      <div className="border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        Chưa có chi nhánh nào được trả về từ hệ thống.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-200">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 text-left text-slate-500">
          <tr>
            <th className="py-3 pl-4 font-normal">Tên</th>
            <th className="py-3 font-normal">Vai trò</th>
            <th className="py-3 font-normal">Công ty</th>
            <th className="py-3 font-normal">Chính</th>
            <th className="py-3 font-normal">Trạng thái</th>
            <th className="py-3 font-normal">ID</th>
          </tr>
        </thead>
        <tbody>
          {branches.map((branch) => (
            <tr key={`${branch.chiNhanhId}-${branch.vaiTroCongTy}`} className="border-b border-slate-200">
              <td className="py-3 pl-4 font-medium text-slate-900">{branch.chiNhanhTen ?? "--"}</td>
              <td className="py-3 text-slate-600">{branch.vaiTroCongTy ?? "--"}</td>
              <td className="py-3 text-slate-600">{branch.congTyTen ?? "--"}</td>
              <td className="py-3 text-slate-600">{branch.laTruSoChinh ? "Có" : "Không"}</td>
              <td className="py-3 text-slate-600">{branch.trangThai ?? "--"}</td>
              <td className="py-3 text-slate-600">{branch.chiNhanhId?.toString() ?? "--"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
