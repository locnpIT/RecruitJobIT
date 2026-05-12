"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { adminService, type AdminPackage, type AdminPackageSubscription } from "@/services/admin.service";
import { PageHeader } from "../components/PageHeader";
import { PackageFormModal } from "./components/PackageFormModal";
import { PackageStatsCards } from "./components/PackageStatsCards";
import { PackageSubscriptionsTable } from "./components/PackageSubscriptionsTable";
import { PackageTable } from "./components/PackageTable";
import type { PackageFormState } from "./components/package-types";

const emptyForm: PackageFormState = {
  tenGoi: "",
  moTa: "",
  giaNiemYet: "",
  soNgayHieuLuc: "",
};

export function PlansAdminClient() {
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [subscriptions, setSubscriptions] = useState<AdminPackageSubscription[]>([]);
  const [form, setForm] = useState<PackageFormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      const [packageData, subscriptionData] = await Promise.all([
        adminService.listPackages(),
        adminService.listPackageSubscriptions(),
      ]);
      setPackages(packageData);
      setSubscriptions(subscriptionData);
    } catch {
      setError("Không tải được dữ liệu gói.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const packageStats = useMemo(() => {
    const active = packages.length;
    const inUse = packages.reduce((sum, pkg) => sum + (pkg.soCongTyDangSuDung ?? 0), 0);
    return { active, inUse };
  }, [packages]);

  const openCreateModal = () => {
    setError(null);
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: AdminPackage) => {
    setEditingId(pkg.id ?? null);
    setForm({
      tenGoi: pkg.tenGoi ?? "",
      moTa: pkg.moTa ?? "",
      giaNiemYet: pkg.giaNiemYet?.toString() ?? "",
      soNgayHieuLuc: pkg.soNgayHieuLuc?.toString() ?? "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const tenGoi = form.tenGoi.trim();
    const moTa = form.moTa.trim();
    const giaNiemYet = Number(form.giaNiemYet);
    const soNgayHieuLuc = Number(form.soNgayHieuLuc);

    if (!tenGoi) {
      toast.error("Vui lòng nhập tên gói.");
      return;
    }
    if (!Number.isFinite(giaNiemYet) || giaNiemYet < 0) {
      toast.error("Giá niêm yết không hợp lệ.");
      return;
    }
    if (!Number.isFinite(soNgayHieuLuc) || soNgayHieuLuc <= 0) {
      toast.error("Số ngày hiệu lực phải lớn hơn 0.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await adminService.updatePackage(editingId, {
          tenGoi,
          moTa,
          giaNiemYet,
          soNgayHieuLuc,
        });
        toast.success("Đã cập nhật gói.");
      } else {
        await adminService.createPackage({
          tenGoi,
          moTa,
          giaNiemYet,
          soNgayHieuLuc,
        });
        toast.success("Đã tạo gói mới.");
      }

      setForm(emptyForm);
      setEditingId(null);
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      const message =
        typeof err === "object" && err !== null && "response" in err
          ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Không thể lưu gói.")
          : "Không thể lưu gói.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (pkg: AdminPackage) => {
    if (!pkg.id) return;
    const confirmed = window.confirm(`Xoá gói ${pkg.tenGoi ?? ""}?`);
    if (!confirmed) return;
    try {
      await adminService.deletePackage(pkg.id);
      toast.success("Đã xoá gói.");
      if (editingId === pkg.id) {
        setEditingId(null);
        setForm(emptyForm);
        setIsModalOpen(false);
      }
      await loadData();
    } catch (err) {
      const message =
        typeof err === "object" && err !== null && "response" in err
          ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Không thể xoá gói.")
          : "Không thể xoá gói.";
      toast.error(message);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Dịch vụ"
        title="Quản Lý Gói Dịch Vụ"
        subtitle="Thêm, sửa, xoá gói công ty và theo dõi các đăng ký gần đây."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => void loadData(true)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Làm mới
            </Button>
            <Button type="button" onClick={openCreateModal}>
              Tạo gói mới
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Đang tải dữ liệu gói...
        </div>
      ) : error ? (
        <div className="border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : (
        <div className="space-y-5">
          <PackageStatsCards totalPackages={packageStats.active} inUseCount={packageStats.inUse} />
          <PackageTable packages={packages} onEdit={openEditModal} onDelete={handleDelete} />
          <PackageSubscriptionsTable subscriptions={subscriptions} />
        </div>
      )}

      <PackageFormModal
        open={isModalOpen}
        title={editingId ? "Sửa gói" : "Tạo gói mới"}
        subtitle="Mã gói sẽ tự sinh theo số ngày hiệu lực."
        form={form}
        isSubmitting={isSaving}
        isEditing={editingId != null}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onChange={setForm}
        onReset={resetForm}
      />
    </>
  );
}
