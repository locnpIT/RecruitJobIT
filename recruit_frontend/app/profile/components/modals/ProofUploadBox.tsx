"use client";

import { Upload } from "lucide-react";

type ProofUploadBoxProps = {
  value: string;
  error: string;
  uploading: boolean;
  onUpload: (file: File) => Promise<string>;
  onChange: (url: string) => void;
  onClearError: () => void;
};

export function ProofUploadBox({
  value,
  error,
  uploading,
  onUpload,
  onChange,
  onClearError,
}: ProofUploadBoxProps) {
  const hasError = Boolean(error);

  return (
    <div className={["rounded-md p-3", hasError ? "border border-red-300 bg-red-50" : "border border-slate-200 bg-slate-50"].join(" ")}>
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
          <Upload className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {uploading ? "Đang tải minh chứng..." : "Tải minh chứng"}
          <input
            type="file"
            className="hidden"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }
              void (async () => {
                const uploaded = await onUpload(file);
                if (!uploaded) {
                  return;
                }
                onChange(uploaded);
                onClearError();
              })();
              event.currentTarget.value = "";
            }}
          />
        </label>
        {value ? (
          <a href={value} target="_blank" rel="noreferrer" className="text-xs text-slate-700 underline">
            Xem minh chứng
          </a>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
