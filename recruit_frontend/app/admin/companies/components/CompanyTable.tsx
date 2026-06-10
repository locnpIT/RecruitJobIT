import { StatusPill } from "../../components/StatusPill";
import { EmptyState } from "../../components/EmptyState";
import type { AdminCompany } from "@/services/admin/types";
import { Button } from "@/components/ui/Button";

type CompanyTableProps = {
  companies: AdminCompany[];
  status: string;
  isLoading: boolean;
  isMutating: boolean;
  isDetailLoading: boolean;
  onViewDetail: (company: AdminCompany) => void;
  onApprove: (company: AdminCompany) => void;
  onReject: (company: AdminCompany) => void;
  onEdit: (company: AdminCompany) => void;
  onDelete: (company: AdminCompany) => void;
};

export function CompanyTable({
  companies,
  status,
  isLoading,
  isMutating,
  isDetailLoading,
  onViewDetail,
  onApprove,
  onReject,
  onEdit,
  onDelete,
}: CompanyTableProps) {
  const showReviewActions = status !== "";

  if (!isLoading && companies.length === 0) {
    return <EmptyState title="Không có công ty phù hợp" description="Danh sách sẽ xuất hiện khi có hồ sơ doanh nghiệp tương ứng." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-300 text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="pb-2 font-medium">Công ty</th>
            <th className="pb-2 font-medium">MST</th>
            <th className="pb-2 font-medium">Owner</th>
            <th className="pb-2 font-medium">Chi nhánh</th>
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
              </td>
              <td className="py-2.5 text-slate-700">{company.soChiNhanh}</td>
              <td className="py-2.5">
                <StatusPill value={company.trangThai} />
                {company.lyDoTuChoi ? <p className="mt-1 max-w-[240px] text-xs text-rose-700">{company.lyDoTuChoi}</p> : null}
              </td>
              <td className="py-2.5 text-slate-500">{new Date(company.ngayTao).toLocaleDateString("vi-VN")}</td>
              <td className="py-2.5">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" type="button"
                    disabled={isMutating || isDetailLoading}
                    onClick={() => onViewDetail(company)}>
                    Chi tiết
                  </Button>
                  {showReviewActions && company.trangThai !== "APPROVED" && company.trangThai !== "DELETED" ? (
                    <Button variant="primary" size="sm" type="button"
                      disabled={isMutating}
                      onClick={() => onApprove(company)}>
                      Duyệt
                    </Button>
                  ) : null}
                  {showReviewActions && company.trangThai !== "REJECTED" && company.trangThai !== "DELETED" ? (
                    <Button variant="unstyled" size="sm" type="button"
                      disabled={isMutating}
                      onClick={() => onReject(company)}
                      className="rounded-md border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                    >
                      Từ chối
                    </Button>
                  ) : null}
                  {company.trangThai !== "DELETED" ? (
                    <Button variant="unstyled" size="sm" type="button"
                      disabled={isMutating}
                      onClick={() => onEdit(company)}
                      className="rounded-md border border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100"
                    >
                      Sửa
                    </Button>
                  ) : null}
                  {company.trangThai !== "DELETED" ? (
                    <Button variant="unstyled" size="sm" type="button"
                      disabled={isMutating}
                      onClick={() => onDelete(company)}
                      className="rounded-md border border-rose-300 bg-white text-rose-700 hover:bg-rose-50"
                    >
                      Xoá
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
