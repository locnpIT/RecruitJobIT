import type { ChatConversation } from "@/services/chat/chat.service";
import { ChatConversationListBase } from "@/app/chat/components/ChatConversationListBase";

type CandidateConversationListProps = {
  conversations: ChatConversation[];
  selectedConversationId: number | null;
  currentUserId: number | null;
  loading: boolean;
  onSelect: (conversation: ChatConversation) => void;
};

// Wrapper candidate cho shared conversation list component.
export function CandidateConversationList({
  conversations,
  selectedConversationId,
  currentUserId,
  loading,
  onSelect,
}: CandidateConversationListProps) {
  return (
    <ChatConversationListBase
      conversations={conversations}
      selectedConversationId={selectedConversationId}
      currentUserId={currentUserId}
      loading={loading}
      emptyStateText="Bạn chưa có cuộc trò chuyện nào với nhà tuyển dụng."
      candidateFallbackLabel="Người dùng"
      recruiterFallbackLabel="Nhà tuyển dụng"
      onSelect={onSelect}
    />
  );
}
