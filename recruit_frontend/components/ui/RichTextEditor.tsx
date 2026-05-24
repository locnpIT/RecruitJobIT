"use client";

import { useEffect, useRef } from "react";
import { Bold, Italic, Link, List, ListOrdered, Underline } from "lucide-react";
import { cn } from "@/lib/utils";
import { sanitizeRichTextHtml } from "@/lib/rich-text";
import { Button } from "./Button";

type RichTextEditorProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function RichTextEditor({ label, value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const focusedRef = useRef(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || focusedRef.current || editor.innerHTML === value) {
      return;
    }
    editor.innerHTML = value ?? "";
  }, [value]);

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    emitChange();
  };

  const emitChange = () => {
    onChange(sanitizeRichTextHtml(editorRef.current?.innerHTML ?? ""));
  };

  const createLink = () => {
    const url = window.prompt("Nhập đường dẫn liên kết");
    if (!url) {
      return;
    }
    runCommand("createLink", url);
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <div className="rounded-md border border-slate-300 bg-white">
        <div className="flex flex-wrap gap-1 border-b border-slate-200 p-2">
          <ToolbarButton label="In đậm" onClick={() => runCommand("bold")}>
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="In nghiêng" onClick={() => runCommand("italic")}>
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Gạch chân" onClick={() => runCommand("underline")}>
            <Underline className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Danh sách bullet" onClick={() => runCommand("insertUnorderedList")}>
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Danh sách số" onClick={() => runCommand("insertOrderedList")}>
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Chèn link" onClick={createLink}>
            <Link className="h-4 w-4" />
          </ToolbarButton>
        </div>
        <div
          ref={editorRef}
          role="textbox"
          aria-label={label}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder ?? ""}
          onFocus={() => {
            focusedRef.current = true;
          }}
          onBlur={() => {
            focusedRef.current = false;
            emitChange();
          }}
          onInput={emitChange}
          className={cn(
            "min-h-32 px-3 py-2 text-sm leading-6 text-slate-800 outline-none",
            "empty:before:pointer-events-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]",
            "[&_a]:text-[#008080] [&_a]:underline [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc"
          )}
        />
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onMouseDown={(event) => event.preventDefault()} onClick={onClick} aria-label={label}>
      {children}
    </Button>
  );
}

