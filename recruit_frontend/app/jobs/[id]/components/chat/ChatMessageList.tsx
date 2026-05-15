import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/services/chat.service";
import { ChatMessageItem } from "./ChatMessageItem";

type ChatMessageListProps = {
  loading: boolean;
  messages: ChatMessage[];
  error: string;
};

// Khu vực danh sách tin nhắn:
// - tự cuộn xuống cuối khi có message mới
// - giữ loading/empty/error state tách khỏi modal cha
export function ChatMessageList({ loading, messages, error }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-500">
        Đang tải cuộc trò chuyện...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-72 items-center justify-center rounded-md border border-red-200 bg-red-50 px-4 text-center text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-4 text-center text-sm text-slate-500">
        Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện với nhà tuyển dụng.
      </div>
    );
  }

  return (
    <div className="h-72 space-y-3 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3">
      {messages.map((message) => (
        <ChatMessageItem key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
