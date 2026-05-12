"use client";

import { useEffect, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { authService } from "@/services/auth.service";
import {
  companyAdminService,
  type CompanyAdminMeResponse,
  type CompanyProofType,
  type CompanyProofUploadItemPayload,
} from "@/services/company-admin.service";
import { isCompanyApproved } from "../company-admin-status";
import { CompanyAdminRestrictedNotice } from "../components/CompanyAdminRestrictedNotice";

/**
 * Trang cấu hình công ty.
 * Đây là màn quan trọng nhất của luồng duyệt doanh nghiệp vì nó cho phép:
 * - cập nhật thông tin cơ bản
 * - cập nhật logo
 * - tải minh chứng pháp lý
 * - gửi duyệt lại nếu công ty bị từ chối
 */
type CompanyInfoForm = {
  tenCongTy: string;
  maSoThue: string;
  website: string;
  moTaCongTy: string;
};

const emptyForm: CompanyInfoForm = {
  tenCongTy: "",
  maSoThue: "",
  website: "",
  moTaCongTy: "",
};

type ProofRow = {
  id: string;
  file: File | null;
  fileName: string | null;
  loaiTaiLieuId: number | null;
};

// Mỗi dòng minh chứng đại diện cho một file + loại tài liệu mà user chuẩn bị tải lên.
const createProofRow = (defaultTypeId: number | null): ProofRow => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  file: null,
  fileName: null,
  loaiTaiLieuId: defaultTypeId,
});

export default function CompanyAdminSettingsPage() {
  const [data, setData] = useState<CompanyAdminMeResponse | null>(null);
  const [form, setForm] = useState<CompanyInfoForm>(emptyForm);
  const [proofTypes, setProofTypes] = useState<CompanyProofType[]>([]);
  const [proofRows, setProofRows] = useState<ProofRow[]>([createProofRow(null)]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingProofs, setIsSavingProofs] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isResubmitting, setIsResubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    companyAdminService
      .getMe()
      .then((response) => {
        if (!active) return;
        setData(response);
        setForm({
          tenCongTy: response.congTy.ten ?? "",
          maSoThue: response.congTy.maSoThue ?? "",
          website: response.congTy.website ?? "",
          moTaCongTy: response.congTy.moTa ?? "",
        });
      })
      .catch(() => {
        if (!active) return;
        setError("Không tải được thông tin công ty.");
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    companyAdminService
      .getCompanyProofTypes()
      .then((types) => {
        if (!active) return;
        setProofTypes(types);
        // Gán sẵn loại tài liệu mặc định cho các dòng trống để user thao tác nhanh hơn.
        const defaultTypeId = types[0]?.id ?? null;
        setProofRows((current) =>
          current.map((row) =>
            row.loaiTaiLieuId == null ? { ...row, loaiTaiLieuId: defaultTypeId } : row
          )
        );
      })
      .catch(() => {
        if (!active) return;
        setProofTypes([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const companyApproved = isCompanyApproved(data?.congTy.trangThai);
  const companyRejected = data?.congTy.trangThai?.toUpperCase() === "REJECTED";
  const companyLogo = data?.congTy.logoUrl ?? null;

  /**
   * Chỉ tạo preview local cho logo, chưa upload ngay.
   * Upload thật chỉ xảy ra khi người dùng bấm nút cập nhật.
   */
  const handleLogoChange = (file: File | null) => {
    setLogoFile(file);

    if (!file) {
      setLogoPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
  };

  const addProofRow = () => {
    setProofRows((current) => [...current, createProofRow(proofTypes[0]?.id ?? null)]);
  };

  const removeProofRow = (rowId: string) => {
    setProofRows((current) => {
      const next = current.filter((row) => row.id !== rowId);
      return next.length > 0 ? next : [createProofRow(proofTypes[0]?.id ?? null)];
    });
  };

  const updateProofRow = (rowId: string, updater: (row: ProofRow) => ProofRow) => {
    setProofRows((current) => current.map((row) => (row.id === rowId ? updater(row) : row)));
  };

  /**
   * Upload logo lên Cloudinary, sau đó lưu URL về backend.
   * Sau khi thành công sẽ phát custom event để sidebar shell cập nhật logo ngay.
   */
  const handleUploadLogo = async () => {
    if (!logoFile) {
      toast.error("Bạn chưa chọn file logo.");
      return;
    }

    setIsSaving(true);
    try {
      const signature = await authService.getCloudinarySignature("logo");
      const uploadedUrl = await authService.uploadToCloudinary(logoFile, signature);
      const updatedCompany = await companyAdminService.updateCompanyLogo(uploadedUrl);

      setData((current) =>
        current
          ? {
              ...current,
              congTy: {
                ...current.congTy,
                ...updatedCompany,
              },
            }
          : current
      );
      window.dispatchEvent(
        new CustomEvent("company-logo-updated", {
          detail: {
            logoUrl: updatedCompany.logoUrl,
            companyName: updatedCompany.ten,
          },
        })
      );
      setLogoFile(null);
      setLogoPreview(null);
      toast.success("Đã cập nhật logo công ty.");
    } catch {
      toast.error("Không thể cập nhật logo công ty.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadProofs = async () => {
    const validRows = proofRows.filter((row) => row.file && row.loaiTaiLieuId != null);
    if (validRows.length === 0) {
      toast.error("Bạn chưa chọn đủ file và loại tài liệu.");
      return;
    }

    const invalidRow = proofRows.find((row) => row.file && row.loaiTaiLieuId == null);
    if (invalidRow) {
      toast.error("Vui lòng chọn loại tài liệu cho tất cả file đã tải lên.");
      return;
    }

    setIsSavingProofs(true);
    try {
      const uploadedProofs: CompanyProofUploadItemPayload[] = [];
      for (const row of validRows) {
        // Minh chứng được upload từng file vì mỗi file cần một signature Cloudinary hợp lệ.
        const signature = await authService.getCloudinarySignature("proof");
        const uploadedUrl = await authService.uploadToCloudinary(row.file as File, signature);
        uploadedProofs.push({
          loaiTaiLieuId: row.loaiTaiLieuId as number,
          duongDanTep: uploadedUrl,
          tenTep: row.file?.name,
        });
      }

      const createdProofs = await companyAdminService.uploadCompanyProofs({
        minhChungs: uploadedProofs,
      });

      setProofRows([createProofRow(proofTypes[0]?.id ?? null)]);
      toast.success(`Đã tải lên ${createdProofs.length} minh chứng.`);
    } catch {
      toast.error("Không thể tải lên minh chứng.");
    } finally {
      setIsSavingProofs(false);
    }
  };

  /**
   * Luồng gửi duyệt lại gồm 2 bước:
   * 1. lưu thông tin công ty mới nhất
   * 2. gọi endpoint resubmit để backend chuyển trạng thái quay lại chờ duyệt
   */
  const handleResubmit = async () => {
    if (!companyRejected) {
      toast.error("Chỉ công ty bị từ chối mới có thể gửi duyệt lại.");
      return;
    }

    if (!form.tenCongTy.trim()) {
      toast.error("Tên công ty không được để trống.");
      return;
    }

    const confirmed = window.confirm("Bạn muốn gửi hồ sơ công ty duyệt lại ngay bây giờ?");
    if (!confirmed) {
      return;
    }

    setIsResubmitting(true);
    try {
      const savedCompany = await companyAdminService.updateCompanyInfo({
        tenCongTy: form.tenCongTy.trim(),
        maSoThue: form.maSoThue.trim() || undefined,
        website: form.website.trim() || undefined,
        moTaCongTy: form.moTaCongTy.trim() || undefined,
      });

      setData((current) =>
        current
          ? {
              ...current,
              congTy: {
                ...current.congTy,
                ...savedCompany,
              },
            }
          : current
      );
      window.dispatchEvent(
        new CustomEvent("company-info-updated", {
          detail: {
            companyName: savedCompany.ten,
            companyStatus: savedCompany.trangThai,
          },
        })
      );

      const resubmittedCompany = await companyAdminService.resubmitCompany();
      setData((current) =>
        current
          ? {
              ...current,
              congTy: {
                ...current.congTy,
                ...resubmittedCompany,
              },
            }
          : current
      );
      window.dispatchEvent(
        new CustomEvent("company-status-updated", {
          detail: {
            companyStatus: resubmittedCompany.trangThai,
          },
        })
      );
      toast.success("Đã gửi duyệt lại công ty.");
    } catch {
      toast.error("Không thể gửi duyệt lại công ty.");
    } finally {
      setIsResubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Đang tải tuỳ chỉnh...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        {error ?? "Không có dữ liệu công ty."}
      </div>
    );
  }

  return (
    <div className="space-y-8 text-slate-900">
      <header className="border-b border-slate-200 pb-4">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tuỳ chỉnh</p>
        <h1 className="mt-2 text-2xl font-semibold">{data.congTy.ten ?? "Công ty chưa có tên"}</h1>
        <p className="mt-2 text-sm text-slate-600">Cập nhật thông tin công ty, logo và gửi duyệt lại khi cần.</p>
      </header>

      {!companyApproved ? (
        <CompanyAdminRestrictedNotice
          title={companyRejected ? "Hồ sơ công ty bị từ chối" : "Công ty đang chờ duyệt"}
          tone={companyRejected ? "danger" : "success"}
          description={
            companyRejected
              ? `Lý do từ chối: ${data.congTy.lyDoTuChoi ?? "Chưa có lý do"}`
              : "Công ty đang chờ duyệt. Bạn vẫn có thể cập nhật thông tin và logo."
          }
        />
      ) : null}

      <section className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div>
            <h2 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Thông tin công ty
            </h2>
            <div className="mt-4 space-y-4">
              <Field
                label="Tên công ty"
                value={form.tenCongTy}
                onChange={(value) => setForm((current) => ({ ...current, tenCongTy: value }))}
                placeholder="Tên công ty"
              />
              <Field
                label="Mã số thuế"
                value={form.maSoThue}
                onChange={(value) => setForm((current) => ({ ...current, maSoThue: value }))}
                placeholder="Mã số thuế"
              />
              <Field
                label="Website"
                value={form.website}
                onChange={(value) => setForm((current) => ({ ...current, website: value }))}
                placeholder="https://..."
              />
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Mô tả công ty</label>
                <textarea
                  value={form.moTaCongTy}
                  onChange={(event) => setForm((current) => ({ ...current, moTaCongTy: event.target.value }))}
                  rows={5}
                  className="w-full border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
                  placeholder="Mô tả ngắn về công ty"
                />
              </div>
            </div>
          </div>

          {!companyApproved ? (
            <div className="border-t border-slate-200 pt-6">
              <h2 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Minh chứng công ty
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Tải nhiều file minh chứng cùng lúc. Mỗi file cần chọn đúng loại tài liệu tương ứng.
              </p>

              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-700">
                    {proofTypes.length ? "Danh sách loại tài liệu đã có trong hệ thống" : "Đang tải loại tài liệu..."}
                  </p>
                  <button
                    type="button"
                    onClick={addProofRow}
                    className="inline-flex items-center justify-center border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 hover:shadow-sm"
                  >
                    + Thêm file
                  </button>
                </div>

                <div className="space-y-3">
                  {proofRows.map((row, index) => (
                    <div key={row.id} className="border border-slate-200 bg-white p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-slate-900">Minh chứng {index + 1}</p>
                        <button
                          type="button"
                          onClick={() => removeProofRow(row.id)}
                          disabled={proofRows.length === 1}
                          className="inline-flex items-center justify-center border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 transition-all duration-200 hover:border-rose-300 hover:bg-rose-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Xoá
                        </button>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">Chọn file</span>
                          <input
                            type="file"
                            accept="application/pdf,image/*"
                            onChange={(event) => {
                              const file = event.target.files?.[0] ?? null;
                              updateProofRow(row.id, (current) => ({
                                ...current,
                                file,
                                fileName: file?.name ?? null,
                              }));
                            }}
                            className="block w-full text-sm text-slate-600 file:mr-4 file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:transition file:hover:bg-emerald-700"
                          />
                          {row.fileName ? <p className="mt-2 text-xs text-slate-500">Đã chọn: {row.fileName}</p> : null}
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">Loại tài liệu</span>
                          <select
                            value={row.loaiTaiLieuId ?? ""}
                            onChange={(event) => {
                              const nextValue = event.target.value ? Number(event.target.value) : null;
                              updateProofRow(row.id, (current) => ({
                                ...current,
                                loaiTaiLieuId: nextValue,
                              }));
                            }}
                            className="w-full border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
                          >
                            <option value="">Chọn loại tài liệu</option>
                            {proofTypes.map((type) => (
                              <option key={type.id ?? type.ten} value={type.id ?? ""}>
                                {type.moTa ?? type.ten ?? "--"}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleUploadProofs}
                  disabled={isSavingProofs || proofTypes.length === 0}
                  className="inline-flex items-center justify-center border border-emerald-600 px-4 py-3 text-sm font-medium text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-700 hover:bg-emerald-600 hover:text-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  {isSavingProofs ? "Đang tải lên..." : "Tải lên tất cả minh chứng"}
                </button>
              </div>
            </div>
          ) : null}

          <div className="border-t border-slate-200 pt-6">
            <h2 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Gửi duyệt lại
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Nút này sẽ lưu các thay đổi hiện tại rồi gửi hồ sơ để admin hệ thống duyệt lại.
            </p>
            <button
              type="button"
              onClick={handleResubmit}
              disabled={isResubmitting}
              className="mt-4 inline-flex items-center justify-center border border-emerald-600 px-4 py-3 text-sm font-medium text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-700 hover:bg-emerald-600 hover:text-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {isResubmitting ? "Đang gửi..." : "Gửi duyệt lại"}
            </button>
          </div>
        </div>

        <div>
          <h2 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Logo công ty
          </h2>
          <div className="mt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden border border-slate-200 bg-white">
                {companyLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={companyLogo} alt="Logo công ty" className="h-full w-full object-contain p-1" />
                ) : null}
              </div>
              <div className="text-sm text-slate-600">{companyLogo ? "Đã cập nhật" : "Chưa có logo"}</div>
            </div>

            <div className="mt-6 space-y-3">
              <label className="block text-sm font-medium text-slate-700">Chọn file logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleLogoChange(event.target.files?.[0] ?? null)}
                className="block w-full text-sm text-slate-600 file:mr-4 file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:transition file:hover:bg-emerald-700"
              />

              {logoPreview ? (
                <div className="border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoPreview} alt="Xem trước logo" className="h-44 w-full object-contain p-3" />
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleUploadLogo}
                disabled={isSaving}
                className="inline-flex w-full items-center justify-center gap-2 border border-emerald-600 px-4 py-3 text-sm font-medium text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-700 hover:bg-emerald-600 hover:text-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                <Upload className="h-4 w-4" />
                {isSaving ? "Đang lưu..." : "Cập nhật logo"}
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
      />
    </label>
  );
}
