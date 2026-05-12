type SystemActivityProps = {
  items: string[];
};

/**
 * Timeline đơn giản cho dashboard admin.
 * Dữ liệu đầu vào đã được chuẩn hóa thành chuỗi dễ đọc từ tầng container.
 */
export function SystemActivity({ items }: SystemActivityProps) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">Hoạt động gần đây</h2>
      <ol className="mt-3 space-y-3 text-sm text-slate-600">
        {items.map((item, index) => (
          <li key={item} className="flex gap-3">
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-600">
              {index + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}
