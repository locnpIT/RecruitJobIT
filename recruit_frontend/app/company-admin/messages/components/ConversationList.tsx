import type { ChatConversation } from "@/services/chat.service";
import { ChatConversationListBase } from "@/app/chat/components/ChatConversationListBase";

type ConversationListProps = {
  conversations: ChatConversation[];
  selectedConversationId: number | null;
  currentUserId: number | null;
  loading: boolean;
  onSelect: (conversation: ChatConversation) => void;
};

// Wrapper recruiter cho shared conversation list component.
export function ConversationList({
  conversations,
  selectedConversationId,
  currentUserId,
  loading,
  onSelect,
}: ConversationListProps) {
  return (
    <ChatConversationListBase
      conversations={conversations}
      selectedConversationId={selectedConversationId}
      currentUserId={currentUserId}
      loading={loading}
      emptyStateText="Chưa có cuộc trò chuyện nào."
      candidateFallbackLabel="Ứng viên"
      recruiterFallbackLabel="Nhà tuyển dụng"
      onSelect={onSelect}
    />
  );
}
