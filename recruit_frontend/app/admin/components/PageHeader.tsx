import type { ReactNode } from "react";

// Header dùng lại cho nhiều màn admin/company-admin.
// Gom title/subtitle/actions vào một component để giữ bố cục quản trị nhất quán.
type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  secondaryAction?: string;
  primaryAction?: string;
  actions?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  secondaryAction,
  primaryAction,
  actions,
}: PageHeaderProps) {
  return (
    <header className="mb-4 border-b border-slate-200 bg-white px-1 pb-4 pt-1 sm:pb-5">
      <div className="flex flex-col p-5 gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          {eyebrow ? <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{eyebrow}</p> : null}
          <h1 className="mt-1 text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        </div>

        {actions || secondaryAction || primaryAction ? (
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            {secondaryAction ? (
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {secondaryAction}
              </button>
            ) : null}
            {primaryAction ? (
              <button
                type="button"
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                {primaryAction}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
