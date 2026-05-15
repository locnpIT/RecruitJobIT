import { MessageCircle, X } from "lucide-react";
import type { ChatConversation, ChatMessage } from "@/services/chat.service";
import { ChatComposer } from "./ChatComposer";
import { ChatMessageList } from "./ChatMessageList";

type JobChatModalProps = {
  open: boolean;
  loading: boolean;
  sending: boolean;
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  error: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

// Modal chat cho candidate trên trang chi tiết job.
// Modal chỉ render khi open=true để tránh mount thừa và side-effect ngoài ý muốn.
export function JobChatModal({
  open,
  loading,
  sending,
  conversation,
  messages,
  error,
  inputValue,
  onInputChange,
  onSubmit,
  onClose,
}: JobChatModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
      <section className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-800">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Chat tuyển dụng</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                {conversation?.nhaTuyenDungDisplayName ?? "Nhà tuyển dụng"}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="Đóng chat"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="px-5 py-4">
          <ChatMessageList loading={loading} messages={messages} error={error} />
          <ChatComposer
            value={inputValue}
            disabled={loading || !conversation}
            sending={sending}
            onChange={onInputChange}
            onSubmit={onSubmit}
          />
        </div>
      </section>
    </div>
  );
}
