"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "../../components/PageHeader";
import { PackageFormModal } from "./PackageFormModal";
import { PackageStatsCards } from "./PackageStatsCards";
import { PackageSubscriptionsTable } from "./PackageSubscriptionsTable";
import { PackageTable } from "./PackageTable";
import { useAdminPlansData } from "../hooks/useAdminPlansData";
import { useAdminPlansActions } from "../hooks/useAdminPlansActions";

export function PlansAdminClient() {
  const data = useAdminPlansData();
  const actions = useAdminPlansActions({ onReload: data.loadData });
  const { actionError, actionSuccess, setActionError, setActionSuccess } = actions;

  useEffect(() => {
    if (data.error) {
      toast.error(data.error);
    }
  }, [data.error]);

  useEffect(() => {
    if (actionError) {
      toast.error(actionError);
      setActionError(null);
    }
  }, [actionError, setActionError]);

  useEffect(() => {
    if (actionSuccess) {
      toast.success(actionSuccess);
      setActionSuccess(null);
    }
  }, [actionSuccess, setActionSuccess]);

  return (
    <>
      <PageHeader
        eyebrow="Dịch vụ"
        title="Quản Lý Gói Dịch Vụ"
        subtitle="Thêm, sửa, xoá gói công ty và theo dõi các đăng ký gần đây."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => void data.loadData(true)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Làm mới
            </Button>
            <Button type="button" onClick={actions.openCreateModal}>
              Tạo gói mới
            </Button>
          </div>
        }
      />

      {data.isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Đang tải dữ liệu gói...
        </div>
      ) : data.error ? (
        <div className="border border-rose-200 px-4 py-3 text-sm text-rose-700">{data.error}</div>
      ) : (
        <div className="space-y-5">
          <PackageStatsCards totalPackages={data.packageStats.active} inUseCount={data.packageStats.inUse} />
          <PackageTable packages={data.packages} onEdit={actions.openEditModal} onDelete={actions.handleDelete} />
          <PackageSubscriptionsTable subscriptions={data.subscriptions} />
        </div>
      )}

      <PackageFormModal
        open={actions.isModalOpen}
        title={actions.editingId ? "Sửa gói" : "Tạo gói mới"}
        subtitle="Mã gói sẽ tự sinh theo số ngày hiệu lực."
        form={actions.form}
        isSubmitting={actions.isSaving}
        isEditing={actions.editingId != null}
        onClose={actions.closeModal}
        onSubmit={actions.handleSubmit}
        onChange={actions.setForm}
        onReset={actions.resetForm}
      />
    </>
  );
}
