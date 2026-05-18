import type { ChatConversation, ChatMessage } from "@/services/chat.service";
import { ChatConversationThreadBase } from "@/app/chat/components/ChatConversationThreadBase";

type ConversationThreadProps = {
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string;
  inputValue: string;
  sending: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
};

// Wrapper recruiter cho shared thread component.
export function ConversationThread({
  conversation,
  messages,
  loading,
  error,
  inputValue,
  sending,
  onInputChange,
  onSend,
}: ConversationThreadProps) {
  return (
    <ChatConversationThreadBase
      title={conversation?.ungVienHienThiTen || "Chọn cuộc trò chuyện"}
      lastMessageAt={conversation?.tinNhanGanNhatLuc}
      emptySubtitle="Nhắn tin trực tiếp với ứng viên"
      messages={messages}
      loading={loading}
      error={error}
      inputValue={inputValue}
      inputPlaceholder="Nhập phản hồi cho ứng viên..."
      sending={sending}
      conversationId={conversation?.id ?? null}
      onInputChange={onInputChange}
      onSend={onSend}
    />
  );
}
