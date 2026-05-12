import * as React from "react";
import { cn } from "@/lib/utils";

// Primitive button dùng chung toàn frontend.
// Gom variant/size vào một chỗ để giữ UI nhất quán giữa public, admin và company-admin.
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-500",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-500",
      outline: "border border-slate-300 bg-white hover:bg-slate-50 text-slate-700",
      ghost: "hover:bg-slate-100 text-slate-700",
      danger: "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-9 px-3.5 text-sm",
      lg: "h-10 px-4 text-sm",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
