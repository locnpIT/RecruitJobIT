import { ExternalLink, FileText, Loader2, X } from "lucide-react";
import type { CompanyAdminApplication } from "@/services/company-admin.service";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";

const STATUS_ACTIONS = [
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "REVIEWING", label: "Đang xem xét" },
  { value: "ACCEPTED", label: "Chấp nhận" },
  { value: "REJECTED", label: "Từ chối" },
];

type ApplicationDetailModalProps = {
  open: boolean;
  application: CompanyAdminApplication | null;
  loading: boolean;
  savingStatus: boolean;
  onClose: () => void;
  onStatusChange: (status: string) => void;
};

// Modal chi tiết đơn ứng tuyển cho Owner/HR.
// Dữ liệu được lấy từ API detail để tránh list page phải tải toàn bộ học vấn/chứng chỉ/kỹ năng cho mọi dòng.
export function ApplicationDetailModal({
  open,
  application,
  loading,
  savingStatus,
  onClose,
  onStatusChange,
}: ApplicationDetailModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 px-4 py-8">
      <section className="w-full max-w-4xl rounded-lg bg-white shadow-xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Chi tiết ứng tuyển</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">
              {application?.ungVienHoTen ?? "Ứng viên"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{application?.tieuDeTinTuyenDung ?? "Tin tuyển dụng"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"
            aria-label="Đóng chi tiết đơn ứng tuyển"
          >
            <X className="h-4 w-4" />
          </button>
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

              <div className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Trạng thái đơn</p>
                    <div className="mt-2"><ApplicationStatusBadge status={application.trangThai} /></div>
                  </div>
                  {application.cvUrl ? (
                    <a
                      href={application.cvUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      <FileText className="h-4 w-4" />
                      Tải CV
                    </a>
                  ) : (
                    <span className="text-sm text-slate-500">Không có CV đính kèm</span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {STATUS_ACTIONS.map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      disabled={savingStatus || application.trangThai?.toUpperCase() === status.value}
                      onClick={() => onStatusChange(status.value)}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      {savingStatus ? "Đang lưu..." : status.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <section className="rounded-lg border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-950">Giới thiệu hồ sơ</h3>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Giới thiệu bản thân</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                    {application.gioiThieuBanThan || "Ứng viên chưa cập nhật giới thiệu."}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Mục tiêu nghề nghiệp</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                    {application.mucTieuNgheNghiep || "Ứng viên chưa cập nhật mục tiêu nghề nghiệp."}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-950">Kỹ năng</h3>
              {application.kyNangs?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {application.kyNangs.map((skill) => (
                    <span key={skill.id ?? skill.ten} className="rounded-full border border-slate-300 px-3 py-1 text-sm text-slate-700">
                      {skill.ten}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Chưa cập nhật kỹ năng.</p>
              )}
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-lg border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-950">Học vấn</h3>
                <div className="mt-3 space-y-3">
                  {application.hocVans?.length ? application.hocVans.map((education) => (
                    <div key={education.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <p className="font-medium text-slate-900">{education.tenTruong ?? "--"}</p>
                      <p className="text-sm text-slate-600">{education.chuyenNganh ?? "--"} · {education.bacHoc ?? "--"}</p>
                      <p className="text-xs text-slate-500">{formatDate(education.thoiGianBatDau)} - {formatDate(education.thoiGianKetThuc)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <ApplicationStatusBadge status={education.trangThai} />
                        {education.duongDanTep ? <ProofLink href={education.duongDanTep} /> : null}
                      </div>
                    </div>
                  )) : <p className="text-sm text-slate-500">Chưa cập nhật học vấn.</p>}
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-950">Chứng chỉ</h3>
                <div className="mt-3 space-y-3">
                  {application.chungChis?.length ? application.chungChis.map((certificate) => (
                    <div key={certificate.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <p className="font-medium text-slate-900">{certificate.tenChungChi ?? "--"}</p>
                      <p className="text-sm text-slate-600">{certificate.loaiChungChiTen ?? "--"}</p>
                      <p className="text-xs text-slate-500">{formatDate(certificate.ngayBatDau)} - {formatDate(certificate.ngayHetHan)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <ApplicationStatusBadge status={certificate.trangThai} />
                        {certificate.duongDanTep ? <ProofLink href={certificate.duongDanTep} /> : null}
                      </div>
                    </div>
                  )) : <p className="text-sm text-slate-500">Chưa cập nhật chứng chỉ.</p>}
                </div>
              </section>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function ProofLink({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:underline">
      Minh chứng
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return "--";
  }
  return new Date(value).toLocaleDateString("vi-VN");
}
