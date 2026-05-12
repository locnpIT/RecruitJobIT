import { StatusPill } from "../../components/StatusPill";
import { EmptyState } from "../../components/EmptyState";
import type { AdminCompany } from "@/services/admin.service";

type CompanyTableProps = {
  companies: AdminCompany[];
  isLoading: boolean;
  isMutating: boolean;
  isDetailLoading: boolean;
  onViewDetail: (company: AdminCompany) => void;
  onApprove: (company: AdminCompany) => void;
  onReject: (company: AdminCompany) => void;
};

export function CompanyTable({
  companies,
  isLoading,
  isMutating,
  isDetailLoading,
  onViewDetail,
  onApprove,
  onReject,
}: CompanyTableProps) {
  if (!isLoading && companies.length === 0) {
    return <EmptyState title="Không có công ty phù hợp" description="Danh sách sẽ xuất hiện khi có hồ sơ doanh nghiệp tương ứng." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1140px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="pb-2 font-medium">Công ty</th>
            <th className="pb-2 font-medium">MST</th>
            <th className="pb-2 font-medium">Owner</th>
            <th className="pb-2 font-medium">Chi nhánh</th>
            <th className="pb-2 font-medium">Tin tuyển dụng</th>
            <th className="pb-2 font-medium">Trạng thái</th>
            <th className="pb-2 font-medium">Ngày gửi duyệt</th>
            <th className="pb-2 font-medium">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <tr key={company.id} className="border-b border-slate-100 last:border-none align-top">
              <td className="py-2.5 font-medium">
                <div>{company.ten}</div>
                <div className="text-xs text-slate-500">{company.website || "--"}</div>
              </td>
              <td className="py-2.5 text-slate-600">{company.maSoThue || "--"}</td>
              <td className="py-2.5 text-slate-700">
                <div>{company.chuCongTyHoTen || "--"}</div>
                <div className="text-xs text-slate-500">{company.chuCongTyEmail || "--"}</div>
              </td>
              <td className="py-2.5 text-slate-700">{company.soChiNhanh}</td>
              <td className="py-2.5 text-slate-700">--</td>
              <td className="py-2.5">
                <StatusPill value={company.trangThai} />
                {company.lyDoTuChoi ? <p className="mt-1 max-w-[240px] text-xs text-rose-700">{company.lyDoTuChoi}</p> : null}
              </td>
              <td className="py-2.5 text-slate-500">{new Date(company.ngayTao).toLocaleDateString("vi-VN")}</td>
              <td className="py-2.5">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isMutating || isDetailLoading}
                    onClick={() => onViewDetail(company)}
                    className="rounded-md border border-slate-300 px-2.5 py-1 text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Chi tiết
                  </button>
                  <button
                    type="button"
                    disabled={isMutating || company.trangThai === "APPROVED"}
                    onClick={() => onApprove(company)}
                    className="rounded-md border border-emerald-300 px-2.5 py-1 text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Duyệt
                  </button>
                  <button
                    type="button"
                    disabled={isMutating || company.trangThai === "REJECTED"}
                    onClick={() => onReject(company)}
                    className="rounded-md border border-rose-300 px-2.5 py-1 text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Từ chối
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
