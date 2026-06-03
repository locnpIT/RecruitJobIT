import { ExternalLink } from "lucide-react";
import type { CompanyAdminApplication } from "@/services/company-admin/types";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";

type ApplicationProfileSectionsProps = {
  application: CompanyAdminApplication;
};

// Khối nội dung hồ sơ chi tiết để modal chính không bị quá dài.
export function ApplicationProfileSections({ application }: ApplicationProfileSectionsProps) {
  return (
    <>
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

      <section className="rounded-lg border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-950">Kinh nghiệm làm việc</h3>
        {application.kinhNghiems?.length ? (
          <div className="mt-3 space-y-5">
            {application.kinhNghiems.map((experience) => (
              <div key={experience.id} className="text-sm text-slate-700">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{experience.chucDanh ?? "Chưa cập nhật chức danh"}</p>
                    <p className="text-slate-600">{experience.tenCongTy ?? "--"}</p>
                  </div>
                  <p className="shrink-0 text-xs font-medium text-slate-500">
                    {formatDate(experience.thoiGianBatDau)} - {formatDate(experience.thoiGianKetThuc)}
                  </p>
                </div>
                {experience.moTaCongViec ? (
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{experience.moTaCongViec}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Chưa cập nhật kinh nghiệm làm việc.</p>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-950">Học vấn</h3>
          <div className="mt-3 space-y-3">
            {application.hocVans?.length ? application.hocVans.map((education) => (
              <div key={education.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <p className="font-medium text-slate-900">{education.tenTruong ?? "--"}</p>
                <p className="text-sm text-slate-600">
                  {education.chuyenNganh ?? "--"} · {education.bacHoc ?? "--"}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDate(education.thoiGianBatDau)} - {formatDate(education.thoiGianKetThuc)}
                </p>
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
                <p className="text-xs text-slate-500">
                  {formatDate(certificate.ngayBatDau)} - {formatDate(certificate.ngayHetHan)}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <ApplicationStatusBadge status={certificate.trangThai} />
                  {certificate.duongDanTep ? <ProofLink href={certificate.duongDanTep} /> : null}
                </div>
              </div>
            )) : <p className="text-sm text-slate-500">Chưa cập nhật chứng chỉ.</p>}
          </div>
        </section>
      </div>
    </>
  );
}

function ProofLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:underline"
    >
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
