import type { UseFormRegisterReturn } from "react-hook-form";

import { Input } from "@/components/ui/Input";

type JobFormFieldProps = {
  label: string;
  inputProps: UseFormRegisterReturn;
  min?: string | number;
  placeholder?: string;
  type?: string;
};

export function JobFormField({
  label,
  inputProps,
  min,
  placeholder,
  type = "text",
}: JobFormFieldProps) {
  const preventNegativeInput = type === "number" && Number(min) >= 0;

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <Input
        {...inputProps}
        type={type}
        min={min}
        placeholder={placeholder}
        onKeyDown={(event) => {
          if (preventNegativeInput && ["-", "+", "e", "E"].includes(event.key)) {
            event.preventDefault();
          }
        }}
        onPaste={(event) => {
          if (preventNegativeInput && event.clipboardData.getData("text").trim().startsWith("-")) {
            event.preventDefault();
          }
        }}
      />
    </div>
  );
}
