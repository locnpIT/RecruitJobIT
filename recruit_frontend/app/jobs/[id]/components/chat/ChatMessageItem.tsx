import type { ChatMessage } from "@/services/chat.service";

type ChatMessageItemProps = {
  message: ChatMessage;
};

function formatTime(value: string | null) {
  if (!value) {
    return "--:--";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

// Bubble tin nhắn của một dòng chat.
// Tách riêng để phần list chỉ tập trung render danh sách/scroll.
export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const mine = Boolean(message.mine);

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <article
        className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
          mine
            ? "rounded-br-md bg-slate-900 text-white"
            : "rounded-bl-md border border-slate-200 bg-white text-slate-900"
        }`}
      >
        {!mine ? (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {message.senderDisplayName ?? "Nhà tuyển dụng"}
          </p>
        ) : null}
        <p className="whitespace-pre-wrap break-words leading-6">{message.noiDung}</p>
        <p className={`mt-1 text-right text-[11px] ${mine ? "text-slate-300" : "text-slate-500"}`}>
          {formatTime(message.ngayTao)}
        </p>
      </article>
    </div>
  );
}
