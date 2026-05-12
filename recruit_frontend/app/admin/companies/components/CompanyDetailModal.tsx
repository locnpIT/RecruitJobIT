import { X } from "lucide-react";
import type { ReactNode } from "react";
import type { AdminCompanyDetail } from "@/services/admin.service";

type CompanyDetailModalProps = {
  company: AdminCompanyDetail;
  isMutating: boolean;
  onClose: () => void;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
};

export function CompanyDetailModal({
  company,
  isMutating,
  onClose,
  onApprove,
  onReject,
}: CompanyDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 px-4 py-10">
      <div className="w-full max-w-5xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Chi tiết công ty</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">{company.company.ten}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {company.company.maSoThue} · {company.company.trangThai}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center border border-slate-300 text-slate-700"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <Section title="Thông tin công ty">
              <InfoRow label="Website" value={company.company.website ?? "--"} />
              <InfoRow label="Trạng thái" value={company.company.trangThai ?? "--"} />
              <InfoRow label="Lý do từ chối" value={company.company.lyDoTuChoi ?? "--"} />
            </Section>

            <Section title="Chủ công ty">
              <InfoRow label="Họ tên" value={company.owner?.hoTen ?? "--"} />
              <InfoRow label="Email" value={company.owner?.email ?? "--"} />
              <InfoRow label="Số điện thoại" value={company.owner?.soDienThoai ?? "--"} />
              <InfoRow label="Hoạt động" value={company.owner?.dangHoatDong ? "Có" : "Không"} />
            </Section>

            <Section title="Chi nhánh">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 text-left text-slate-500">
                    <tr>
                      <th className="py-2 font-normal">Tên</th>
                      <th className="py-2 font-normal">Địa chỉ</th>
                      <th className="py-2 font-normal">Phường/Xã</th>
                      <th className="py-2 font-normal">Tỉnh/Thành</th>
                      <th className="py-2 font-normal">Chính</th>
                    </tr>
                  </thead>
                  <tbody>
                    {company.branches.map((branch) => (
                      <tr key={branch.id ?? branch.ten} className="border-b border-slate-100 align-top">
                        <td className="py-2 pr-4 font-medium text-slate-900">{branch.ten ?? "--"}</td>
                        <td className="py-2 pr-4 text-slate-600">{branch.diaChiChiTiet ?? "--"}</td>
                        <td className="py-2 pr-4 text-slate-600">{branch.xaPhuongTen ?? "--"}</td>
                        <td className="py-2 pr-4 text-slate-600">{branch.tinhThanhTen ?? "--"}</td>
                        <td className="py-2 text-slate-600">{branch.laTruSoChinh ? "Có" : "Không"} </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>

          <div className="space-y-4">
            <Section title="Minh chứng">
              <div className="space-y-3">
                {company.proofDocuments.length ? (
                  company.proofDocuments.map((doc) => (
                    <div key={doc.id ?? doc.tenTep} className="border border-slate-200 px-3 py-3">
                      <p className="text-sm font-medium text-slate-900">{doc.tenTep ?? "--"}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {doc.loaiTaiLieu ?? "--"} · {doc.trangThai ?? "--"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{doc.lyDoTuChoi ?? ""}</p>
                      {doc.duongDanTep ? (
                        <a
                          href={doc.duongDanTep}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-xs text-blue-600 hover:underline"
                        >
                          Xem file
                        </a>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Không có minh chứng.</p>
                )}
              </div>
            </Section>

            <Section title="Thao tác">
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isMutating || company.company.trangThai === "APPROVED"}
                  onClick={() => void onApprove()}
                  className="flex-1 border border-emerald-300 px-3 py-2 text-sm font-medium text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Duyệt
                </button>
                <button
                  type="button"
                  disabled={isMutating || company.company.trangThai === "REJECTED"}
                  onClick={() => void onReject()}
                  className="flex-1 border border-rose-300 px-3 py-2 text-sm font-medium text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Từ chối
                </button>
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        {title}
      </h3>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[70%] text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}
