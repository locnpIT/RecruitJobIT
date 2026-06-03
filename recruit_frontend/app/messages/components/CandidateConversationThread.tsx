import type { ChatConversation, ChatMessage } from "@/services/chat/chat.service";
import { ChatConversationThreadBase } from "@/components/chat/ChatConversationThreadBase";
import { buildRecruiterLabel } from "@/components/chat/chat-partner-label";

type CandidateConversationThreadProps = {
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string;
  inputValue: string;
  sending: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
};

// Wrapper candidate cho shared thread component.
export function CandidateConversationThread({
  conversation,
  messages,
  loading,
  error,
  inputValue,
  sending,
  onInputChange,
  onSend,
}: CandidateConversationThreadProps) {
  return (
    <ChatConversationThreadBase
      title={
        conversation
          ? buildRecruiterLabel(conversation.nhaTuyenDungHienThiTen, conversation.nhaTuyenDungCongTyTen)
          : "Chọn cuộc trò chuyện"
      }
      lastMessageAt={conversation?.tinNhanGanNhatLuc}
      emptySubtitle="Nhắn tin trực tiếp với nhà tuyển dụng"
      messages={messages}
      loading={loading}
      error={error}
      inputValue={inputValue}
      inputPlaceholder="Nhập tin nhắn cho nhà tuyển dụng..."
      sending={sending}
      conversationId={conversation?.id ?? null}
      onInputChange={onInputChange}
      onSend={onSend}
    />
  );
}
