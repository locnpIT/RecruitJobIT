 "use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

type ProfileModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function ProfileModal({ open, title, description, onClose, children, footer }: ProfileModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 cursor-default bg-slate-900/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-10">
        <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
              {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Đóng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[70vh] overflow-auto px-6 py-5">{children}</div>

          {footer ? <div className="border-t border-slate-200 px-6 py-4">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

