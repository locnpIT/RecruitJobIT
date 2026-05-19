"use client";

import { useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import type { AdminCatalogItem } from "@/services/admin/types";
import { EmptyState } from "../../components/EmptyState";

export type CatalogFormState = {
  ten: string;
  moTa: string;
};

const EMPTY_FORM: CatalogFormState = {
  ten: "",
  moTa: "",
};

export function CatalogCrudSection({
  title,
  description,
  ruleNote,
  loading,
  items,
  saving,
  deletingId,
  onCreate,
  onUpdate,
  onDelete,
}: {
  title: string;
  description: string;
  ruleNote?: string;
  loading: boolean;
  items: AdminCatalogItem[];
  saving: boolean;
  deletingId: number | null;
  onCreate: (payload: CatalogFormState) => Promise<void>;
  onUpdate: (id: number, payload: CatalogFormState) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<CatalogFormState>(EMPTY_FORM);

  const sectionItems = useMemo(() => {
    return items.map((item) => ({
      id: item.id ?? 0,
      ten: item.ten ?? "",
      moTa: item.moTa ?? "",
    }));
  }, [items]);

  const startCreate = () => {
    setEditingId(null);
    setIsCreating(true);
    setForm(EMPTY_FORM);
  };

  const startEdit = (item: { id: number; ten: string; moTa: string }) => {
    setEditingId(item.id);
    setIsCreating(false);
    setForm({
      ten: item.ten,
      moTa: item.moTa,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setForm(EMPTY_FORM);
  };

  const submit = async () => {
    const payload = {
      ten: form.ten.trim(),
      moTa: form.moTa.trim(),
    };

    if (!payload.ten) {
      return;
    }

    if (editingId !== null) {
      await onUpdate(editingId, payload);
    } else {
      await onCreate(payload);
    }
    cancelEdit();
  };

  const isFormOpen = editingId !== null || isCreating;
  const totalItems = sectionItems.length;

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
              {totalItems} item
            </span>
          </div>
          <p className="text-sm text-slate-500">{description}</p>
          {ruleNote ? <p className="text-xs text-amber-700">{ruleNote}</p> : null}
        </div>
        <Button type="button" onClick={startCreate} disabled={saving || loading}>
          <Plus className="mr-2 h-4 w-4" />
          Tạo mới
        </Button>
      </div>

      {isFormOpen ? (
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-800">
              {editingId !== null ? "Cập nhật danh mục" : "Tạo danh mục mới"}
            </p>
            <button
              type="button"
              onClick={cancelEdit}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              <X className="h-4 w-4" />
              Đóng
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Tên</span>
              <input
                value={form.ten}
                onChange={(event) => setForm((prev) => ({ ...prev, ten: event.target.value }))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500"
                placeholder="Nhập tên danh mục"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Mô tả</span>
              <input
                value={form.moTa}
                onChange={(event) => setForm((prev) => ({ ...prev, moTa: event.target.value }))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500"
                placeholder="Nhập mô tả ngắn"
              />
            </label>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Button type="button" onClick={() => void submit()} disabled={saving || !form.ten.trim()}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingId !== null ? "Lưu chỉnh sửa" : "Thêm danh mục"}
            </Button>
            <Button type="button" variant="outline" onClick={cancelEdit} disabled={saving}>
              Huỷ
            </Button>
          </div>
        </div>
      ) : null}

      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-sm text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang tải dữ liệu...
          </div>
        ) : sectionItems.length === 0 ? (
          <EmptyState title="Chưa có dữ liệu" description="Danh mục sẽ hiển thị ở đây sau khi bạn thêm mới." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Tên</th>
                  <th className="px-3 py-2">Mô tả</th>
                  <th className="px-3 py-2 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {sectionItems.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 bg-white last:border-b-0">
                    <td className="px-3 py-2 text-slate-600">{item.id}</td>
                    <td className="px-3 py-2 font-medium text-slate-900">{item.ten}</td>
                    <td className="px-3 py-2 text-slate-600">{item.moTa || "--"}</td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => startEdit(item)}
                          disabled={saving}
                          title="Sửa"
                          aria-label={`Sửa ${item.ten}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={saving || deletingId === item.id}
                          onClick={() => void onDelete(item.id)}
                          title="Xoá"
                          aria-label={`Xoá ${item.ten}`}
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
