import { Loader2, X } from "lucide-react";
import type { CompanyAdminApplication } from "@/services/company-admin/types";
import { Button } from "@/components/ui/Button";
import { ApplicationDetailSummary } from "./ApplicationDetailSummary";
import { ApplicationProfileSections } from "./ApplicationProfileSections";

type ApplicationDetailModalProps = {
  open: boolean;
  application: CompanyAdminApplication | null;
  loading: boolean;
  savingStatus: boolean;
  sendingInterviewEmail: boolean;
  openingChat: boolean;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  onOpenInterviewEmail: () => void;
  onOpenChat: () => void;
};

// Modal chi tiết đơn ứng tuyển cho Owner/HR.
// Phần gửi email mời phỏng vấn được tách sang modal riêng để luồng rõ ràng hơn.
export function ApplicationDetailModal({
  open,
  application,
  loading,
  savingStatus,
  sendingInterviewEmail,
  openingChat,
  onClose,
  onStatusChange,
  onOpenInterviewEmail,
  onOpenChat,
}: ApplicationDetailModalProps) {
  if (!open) {
    return null;
  }
  const hasApplication = application?.id != null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 px-4 py-8">
        <section className="w-full max-w-4xl rounded-lg bg-white shadow-xl">
          <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {hasApplication ? "Chi tiết ứng tuyển" : "Hồ sơ ứng viên"}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                {application?.ungVienHoTen ?? "Ứng viên"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{application?.tieuDeTinTuyenDung ?? "Tin tuyển dụng"}</p>
            </div>
            <Button
              variant="unstyled"
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"
              aria-label="Đóng chi tiết đơn ứng tuyển"
            >
              <X className="h-4 w-4" />
            </Button>
          </header>

          {loading ? (
            <div className="flex items-center justify-center px-5 py-16 text-sm text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Đang tải hồ sơ ứng viên...
            </div>
          ) : application ? (
            <div className="space-y-5 px-5 py-5">
              <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-14 w-14 place-items-center rounded-md bg-slate-100 text-lg font-semibold text-slate-800">
                      {application.ungVienAnhDaiDienUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={application.ungVienAnhDaiDienUrl} alt="Avatar ứng viên" className="h-full w-full rounded-md object-cover" />
                      ) : (
                        (application.ungVienHoTen ?? "U").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950">{application.ungVienHoTen ?? "--"}</p>
                      <p className="text-sm text-slate-600">{application.ungVienEmail ?? "--"}</p>
                      <p className="text-sm text-slate-600">{application.ungVienSoDienThoai ?? "Chưa cập nhật số điện thoại"}</p>
                    </div>
                  </div>
                </div>

                <ApplicationDetailSummary
                  application={application}
                  savingStatus={savingStatus}
                  sendingInterviewEmail={sendingInterviewEmail}
                  openingChat={openingChat}
                  onStatusChange={onStatusChange}
                  onOpenInterviewEmail={onOpenInterviewEmail}
                  onOpenChat={onOpenChat}
                />
              </div>

              <ApplicationProfileSections application={application} />
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}
