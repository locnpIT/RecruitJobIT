import type { ChangeEvent } from "react";
import { useController, type Control } from "react-hook-form";

import { Input } from "@/components/ui/Input";
import type { JobFormValues } from "./job-form-types";

type JobSalaryFieldProps = {
  name: "luongToiThieu" | "luongToiDa";
  label: string;
  control: Control<JobFormValues>;
  placeholder?: string;
};

export function JobSalaryField({ name, label, control, placeholder }: JobSalaryFieldProps) {
  const { field } = useController({ name, control });
  const { name: inputName, onBlur, onChange, ref, value } = field;
  const displayValue =
    value != null && !Number.isNaN(value)
      ? new Intl.NumberFormat("vi-VN").format(value)
      : "";

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
    onChange(raw === "" ? undefined : Number(raw));
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-2">
        <Input
          name={inputName}
          ref={ref}
          onBlur={onBlur}
          value={displayValue}
          onChange={handleChange}
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
        />
        <span className="shrink-0 text-sm font-medium text-slate-500">VNĐ</span>
      </div>
    </div>
  );
}
