type ChatComposerProps = {
  value: string;
  disabled?: boolean;
  sending?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

// Input gửi tin nhắn:
// - Enter gửi nhanh
// - Shift+Enter xuống dòng
export function ChatComposer({
  value,
  disabled = false,
  sending = false,
  onChange,
  onSubmit,
}: ChatComposerProps) {
  const canSend = value.trim().length > 0 && !disabled && !sending;

  return (
    <div className="mt-3 flex items-end gap-2">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (canSend) {
              onSubmit();
            }
          }
        }}
        rows={2}
        disabled={disabled}
        placeholder="Nhập tin nhắn..."
        className="min-h-[44px] flex-1 resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 disabled:cursor-not-allowed disabled:bg-slate-100"
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSend}
        className="h-11 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {sending ? "Đang gửi..." : "Gửi"}
      </button>
    </div>
  );
}
