import type { CompanyAdminHrAccount } from "@/services/company-admin.service";

// Bảng danh sách tài khoản HR của công ty.
// Hiển thị thông tin cơ bản, chi nhánh phụ trách và cung cấp action cập nhật/xóa.
type HrListTableProps = {
  hrs: CompanyAdminHrAccount[];
  onEdit: (hr: CompanyAdminHrAccount) => void;
  onDelete: (hr: CompanyAdminHrAccount) => void;
};

export function HrListTable({ hrs, onEdit, onDelete }: HrListTableProps) {
  return (
    <div>
      <div className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        Danh sách HR
      </div>

      {!hrs.length ? (
        <div className="border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
          Chưa có tài khoản HR nào.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr>
                <th className="py-3 font-normal">Họ tên</th>
                <th className="py-3 font-normal">Email</th>
                <th className="py-3 font-normal">Chi nhánh</th>
                <th className="py-3 font-normal">Trạng thái</th>
                <th className="py-3 font-normal">Mật khẩu</th>
                <th className="py-3 font-normal">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {hrs.map((hr) => (
                <tr key={hr.nguoiDungId ?? hr.email ?? hr.ten} className="border-b border-slate-200 align-top">
                  <td className="py-3 pr-4 font-medium text-slate-900">
                    {(hr.ho ?? "").trim()} {(hr.ten ?? "").trim()}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{hr.email ?? "--"}</td>
                  <td className="py-3 pr-4 text-slate-600">
                    {hr.chiNhanhs?.map((branch) => branch.chiNhanhTen ?? "--").join(", ") ?? "--"}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{hr.dangHoatDong ? "Hoạt động" : "Tạm khóa"}</td>
                  <td className="py-3 text-slate-600">Đã đặt</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(hr)}
                        className="rounded-md border border-slate-300 px-2.5 py-1 text-slate-700 hover:bg-slate-50"
                      >
                        Cập nhật
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(hr)}
                        className="rounded-md border border-rose-300 px-2.5 py-1 text-rose-700 hover:bg-rose-50"
                      >
                        Xoá
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
