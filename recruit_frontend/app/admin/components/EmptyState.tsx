type EmptyStateProps = {
  title: string;
  description?: string;
};

/**
 * Empty state dùng lại cho các bảng hoặc khối dữ liệu chưa có kết quả.
 * Chủ ý giữ tối giản để có thể tái sử dụng ở nhiều ngữ cảnh quản trị.
 */
export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
      <p className="text-sm font-medium text-slate-800">{title}</p>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}
