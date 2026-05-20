import { Download, Eye, Loader2 } from "lucide-react";
import type { CompanyAdminApplication } from "@/services/company-admin/types";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import { Button } from "@/components/ui/Button";

type ApplicationsTableProps = {
  applications: CompanyAdminApplication[];
  loading: boolean;
  openingChatApplicationId: number | null;
  onOpenChat: (applicationId: number | null) => void;
  onOpenDetail: (applicationId: number | null) => void;
};

// Bảng danh sách đơn ứng tuyển đã lọc.
export function ApplicationsTable({
  applications,
  loading,
  openingChatApplicationId,
  onOpenChat,
  onOpenDetail,
}: ApplicationsTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-8 text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Đang tải ứng tuyển...
      </div>
    );
  }

  if (!applications.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Chưa có đơn ứng tuyển phù hợp với bộ lọc hiện tại.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
          <tr>
            <th className="py-3 pl-4 font-medium">Ứng viên</th>
            <th className="py-3 font-medium">Tin tuyển dụng</th>
            <th className="py-3 font-medium">CV</th>
            <th className="py-3 font-medium">Trạng thái</th>
            <th className="py-3 font-medium">Thời gian</th>
            <th className="py-3 pr-4 text-right font-medium">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => (
            <tr key={application.id ?? `${application.tinTuyenDungId}-${application.nguoiDungId}`} className="border-b border-slate-200 last:border-0">
              <td className="py-3 pl-4">
                <p className="font-medium text-slate-900">{application.ungVienHoTen ?? "--"}</p>
                <p className="text-xs text-slate-500">{application.ungVienEmail ?? "--"}</p>
              </td>
              <td className="max-w-xs py-3 text-slate-600">{application.tieuDeTinTuyenDung ?? "--"}</td>
              <td className="py-3 text-slate-600">
                {application.cvUrl ? (
                  <a href={application.cvUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-slate-800 hover:underline">
                    <Download className="h-4 w-4" />
                    Tải CV
                  </a>
                ) : (
                  <span className="text-slate-400">Không có</span>
                )}
              </td>
              <td className="py-3"><ApplicationStatusBadge status={application.trangThai} /></td>
              <td className="py-3 text-slate-600">{formatDateTime(application.ngayTao)}</td>
              <td className="py-3 pr-4 text-right">
                <div className="inline-flex items-center gap-2">
                  <Button variant="unstyled"
                    type="button"
                    disabled={openingChatApplicationId === application.id}
                    onClick={() => onOpenChat(application.id)}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {openingChatApplicationId === application.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang mở chat...
                      </>
                    ) : (
                      "Gửi tin nhắn"
                    )}
                  </Button>
                  <Button variant="unstyled"
                    type="button"
                    onClick={() => onOpenDetail(application.id)}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    <Eye className="h-4 w-4" />
                    Xem hồ sơ
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "--";
  }
  return new Date(value).toLocaleString("vi-VN");
}
