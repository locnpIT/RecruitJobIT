"use client";

import { adminService, type AdminSettings } from "@/services/admin.service";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { PageHeader } from "../components/PageHeader";

/**
 * Trang cấu hình vận hành nội bộ.
 * Toàn bộ form bám theo object `AdminSettings` nên việc dirty-check và save/reset
 * có thể xử lý tập trung thay vì quản lý từng field rời rạc.
 */
export default function SettingsAdminPage() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [initialSettings, setInitialSettings] = useState<AdminSettings | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const data = await adminService.getSettings();
        setSettings(data);
        setInitialSettings(data);
      } catch (error) {
        console.error(error);
        toast.error("Không tải được cài đặt admin.");
      } finally {
        setLoading(false);
      }
    };

    void loadSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      // API update trả lại cấu hình mới nhất sau khi backend chuẩn hóa dữ liệu.
      const updated = await adminService.updateSettings(settings);
      setSettings(updated);
      setInitialSettings(updated);
      toast.success("Đã lưu cấu hình hệ thống.");
    } catch (error) {
      console.error(error);
      toast.error("Lưu cài đặt thất bại.");
    } finally {
      setSaving(false);
    }
  };

  // So sánh snapshot đầu và snapshot hiện tại để bật/tắt nút lưu/đặt lại.
  const dirty = useMemo(() => JSON.stringify(settings) !== JSON.stringify(initialSettings), [settings, initialSettings]);

  const handleReset = () => {
    if (!initialSettings) return;
    setSettings(initialSettings);
  };

  if (loading || !settings) {
    return (
      <>
        <PageHeader
          eyebrow="Hệ thống"
          title="Cài Đặt Quản Trị"
          subtitle="Quản lý chính sách duyệt, thông báo và bảo mật cho vận hành nội bộ."
        />
        <section className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">Đang tải cài đặt...</section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Hệ thống"
        title="Cài Đặt Quản Trị"
        subtitle="Quản lý chính sách duyệt, thông báo và bảo mật cho vận hành nội bộ."
        actions={
          <>
            <button
              type="button"
              onClick={handleReset}
              disabled={!dirty || saving}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Đặt lại
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!dirty || saving}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </>
        }
      />

      <div className="space-y-4">
        <section className="rounded-md border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Cài đặt hệ thống</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Field label="Tên hệ thống" description="Hiển thị trong email và thông báo tự động.">
              <input
                type="text"
                value={settings.systemName}
                onChange={(e) => setSettings((prev) => (prev ? { ...prev, systemName: e.target.value } : prev))}
                className="h-10 rounded-md border border-slate-300 px-3 text-sm"
              />
            </Field>
            <Field label="Múi giờ mặc định" description="Áp dụng cho báo cáo và lịch tác vụ nền.">
              <select
                className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                value={settings.timezone}
                onChange={(e) => setSettings((prev) => (prev ? { ...prev, timezone: e.target.value } : prev))}
              >
                <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh</option>
                <option value="UTC">UTC</option>
              </select>
            </Field>
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Cài đặt duyệt công ty</h2>
          <div className="mt-3 space-y-3 text-sm">
            <Switch
              label="Yêu cầu mã số thuế hợp lệ"
              description="Không cho duyệt nếu thiếu hoặc sai định dạng MST."
              checked={settings.requireTaxCode}
              onChange={(checked) => setSettings((prev) => (prev ? { ...prev, requireTaxCode: checked } : prev))}
            />
            <Switch
              label="Bắt buộc minh chứng pháp lý"
              description="Công ty phải có tối thiểu một tài liệu minh chứng hợp lệ."
              checked={settings.requireLegalProof}
              onChange={(checked) => setSettings((prev) => (prev ? { ...prev, requireLegalProof: checked } : prev))}
            />
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Cài đặt duyệt tin tuyển dụng</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Field label="Từ khóa cấm" description="Tách bằng dấu phẩy; dùng cho kiểm duyệt tự động.">
              <input
                type="text"
                value={settings.bannedKeywords}
                onChange={(e) => setSettings((prev) => (prev ? { ...prev, bannedKeywords: e.target.value } : prev))}
                className="h-10 rounded-md border border-slate-300 px-3 text-sm"
              />
            </Field>
            <Field label="SLA duyệt tin (giờ)" description="Thời gian tối đa để hoàn tất duyệt tin.">
              <input
                type="number"
                value={settings.reviewSlaHours}
                min={1}
                onChange={(e) =>
                  setSettings((prev) => (prev ? { ...prev, reviewSlaHours: Number(e.target.value) || 1 } : prev))
                }
                className="h-10 rounded-md border border-slate-300 px-3 text-sm"
              />
            </Field>
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Cài đặt thông báo</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Field label="Email nhận cảnh báo" description="Nhận cảnh báo sự cố và vi phạm hệ thống.">
              <input
                type="email"
                value={settings.alertEmail}
                onChange={(e) => setSettings((prev) => (prev ? { ...prev, alertEmail: e.target.value } : prev))}
                className="h-10 rounded-md border border-slate-300 px-3 text-sm"
              />
            </Field>
            <Field label="Ngưỡng cảnh báo báo cáo/ngày" description="Vượt ngưỡng sẽ gửi cảnh báo tới nhóm vận hành.">
              <input
                type="number"
                min={1}
                value={settings.dailyReportAlertThreshold}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev ? { ...prev, dailyReportAlertThreshold: Number(e.target.value) || 1 } : prev,
                  )
                }
                className="h-10 rounded-md border border-slate-300 px-3 text-sm"
              />
            </Field>
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Cài đặt bảo mật</h2>
          <div className="mt-3 space-y-3 text-sm">
            <Switch
              label="Bật xác thực 2 lớp cho ADMIN"
              description="Yêu cầu OTP với tài khoản quản trị hệ thống."
              checked={settings.adminTwoFactorEnabled}
              onChange={(checked) => setSettings((prev) => (prev ? { ...prev, adminTwoFactorEnabled: checked } : prev))}
            />
            <Switch
              label="Khóa tạm sau 5 lần đăng nhập sai"
              description="Giảm nguy cơ brute-force vào trang admin."
              checked={settings.lockAfterFiveFailedAttempts}
              onChange={(checked) =>
                setSettings((prev) => (prev ? { ...prev, lockAfterFiveFailedAttempts: checked } : prev))
              }
            />
            <Switch
              label="Bắt buộc đổi mật khẩu mỗi 90 ngày"
              description="Áp dụng cho toàn bộ tài khoản admin."
              checked={settings.forcePasswordRotation90Days}
              onChange={(checked) =>
                setSettings((prev) => (prev ? { ...prev, forcePasswordRotation90Days: checked } : prev))
              }
            />
          </div>
        </section>
      </div>
    </>
  );
}

/**
 * Wrapper hiển thị label + mô tả + control cho các field text/select.
 */
function Field({ label, description, children }: { label: string; description: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      <div className="mt-2">{children}</div>
    </label>
  );
}

/**
 * Switch nhị phân dùng cho các cấu hình chính sách/bảo mật.
 */
function Switch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-md border border-slate-200 p-3">
      <span>
        <span className="block font-medium text-slate-800">{label}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4"
      />
    </label>
  );
}
