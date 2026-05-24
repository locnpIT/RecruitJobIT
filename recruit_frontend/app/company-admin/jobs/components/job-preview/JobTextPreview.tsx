"use client";

import { RichTextContent } from "@/app/components/shared/RichTextContent";

type JobTextPreviewProps = {
  title: string;
  text: string | null;
};

export function JobTextPreview({ title, text }: JobTextPreviewProps) {
  return (
    <section className="mt-8 border-t border-slate-200 pt-7">
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      <RichTextContent html={text} />
    </section>
  );
}
