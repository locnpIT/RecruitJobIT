import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger";

export function ProfileActionButton({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  const base = "rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60";
  const palette =
    variant === "primary"
      ? "bg-slate-900 text-white hover:bg-slate-800"
      : variant === "danger"
        ? "border border-red-300 bg-white text-red-700 hover:bg-red-50"
        : "bg-slate-900 text-white hover:bg-slate-800";

  return (
    <button {...props} className={`${base} ${palette} ${className}`.trim()}>
      {children}
    </button>
  );
}
