"use client";

import { useMemo } from "react";
import { isRichTextEmpty, sanitizeRichTextHtml } from "@/lib/rich-text";

type RichTextContentProps = {
  html: string | null;
  emptyText?: string;
};

export function RichTextContent({ html, emptyText = "Chưa cập nhật." }: RichTextContentProps) {
  const sanitizedHtml = useMemo(() => sanitizeRichTextHtml(html), [html]);
  const empty = useMemo(() => isRichTextEmpty(sanitizedHtml), [sanitizedHtml]);

  if (empty) {
    return <p className="mt-3 text-sm text-slate-500">{emptyText}</p>;
  }

  return (
    <div
      className="mt-3 space-y-3 text-sm leading-6 text-slate-700 [&_a]:font-medium [&_a]:text-[#008080] [&_a]:underline [&_li]:ml-5 [&_ol]:list-decimal [&_p]:m-0 [&_strong]:font-semibold [&_ul]:list-disc"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

