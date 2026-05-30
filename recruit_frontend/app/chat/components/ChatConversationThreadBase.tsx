import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/services/chat/chat.service";
import { Button } from "@/components/ui/Button";

type ChatConversationThreadBaseProps = {
  title: string;
  lastMessageAt: string | null | undefined;
  emptySubtitle: string;
  messages: ChatMessage[];
  loading: boolean;
  error: string;
  inputValue: string;
  inputPlaceholder: string;
  sending: boolean;
  conversationId: number | null;
  onInputChange: (value: string) => void;
  onSend: () => void;
};

function formatTime(value: string | null | undefined) {
  if (!value) {
    return "--:--";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

// Shared message thread UI cho cả candidate và recruiter inbox.
export function ChatConversationThreadBase({
  title,
  lastMessageAt,
  emptySubtitle,
  messages,
  loading,
  error,
  inputValue,
  inputPlaceholder,
  sending,
  conversationId,
  onInputChange,
  onSend,
}: ChatConversationThreadBaseProps) {
  const canSend = inputValue.trim().length > 0 && !sending && Boolean(conversationId);
  const messageContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    const container = messageContainerRef.current;
    if (!container) {
      return;
    }
    container.scrollTop = container.scrollHeight;
  };

  useEffect(() => {
    // Khi mở room hoặc load xong lịch sử, luôn đưa viewport xuống tin mới nhất.
    if (!loading) {
      scrollToBottom();
    }
  }, [loading, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <header className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">
          {lastMessageAt ? `Tin nhắn gần nhất lúc ${formatTime(lastMessageAt)}` : emptySubtitle}
        </p>
      </header>

      <div className="p-4">
        {loading ? (
          <div className="flex h-80 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-500">
            Đang tải tin nhắn...
          </div>
        ) : error ? (
          <div className="flex h-80 items-center justify-center rounded-md border border-red-200 bg-red-50 text-sm text-red-700">
            {error}
          </div>
        ) : (
          <div
            ref={messageContainerRef}
            className="h-80 space-y-3 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3"
          >
            {messages.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có tin nhắn nào.</p>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex ${message.cuaToi ? "justify-end" : "justify-start"}`}>
                  <article
                    className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                      message.cuaToi
                        ? "rounded-br-md bg-slate-900 text-white"
                        : "rounded-bl-md border border-slate-200 bg-white text-slate-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words leading-6">{message.noiDung}</p>
                    <p className={`mt-1 text-right text-[11px] ${message.cuaToi ? "text-slate-300" : "text-slate-500"}`}>
                      {formatTime(message.ngayTao)}
                    </p>
                  </article>
                </div>
              ))
            )}
          </div>
        )}

        <div className="mt-3 flex items-end gap-2">
          <textarea
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (canSend) {
                  onSend();
                }
              }
            }}
            disabled={!conversationId || sending}
            rows={2}
            placeholder={inputPlaceholder}
            className="min-h-[44px] flex-1 resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
          <Button variant="unstyled"
            type="button"
            onClick={onSend}
            disabled={!canSend}
            className="h-11 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {sending ? "Đang gửi..." : "Gửi"}
          </Button>
        </div>
      </div>
    </section>
  );
}

