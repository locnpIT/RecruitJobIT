import type { ChatConversation } from "@/services/chat.service";

type CandidateConversationListProps = {
  conversations: ChatConversation[];
  selectedConversationId: number | null;
  currentUserId: number | null;
  loading: boolean;
  onSelect: (conversation: ChatConversation) => void;
};

function resolveRecruiterName(conversation: ChatConversation, currentUserId: number | null) {
  const isCandidateView = currentUserId != null && currentUserId === conversation.ungVienId;
  return isCandidateView
    ? conversation.nhaTuyenDungDisplayName || "Nhà tuyển dụng"
    : conversation.ungVienDisplayName || "Người dùng";
}

// Danh sách conversation cho candidate inbox.
// Candidate tập trung vào recruiter/HR ở đầu bên kia nên label chính là tên nhà tuyển dụng.
export function CandidateConversationList({
  conversations,
  selectedConversationId,
  currentUserId,
  loading,
  onSelect,
}: CandidateConversationListProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Đang tải cuộc trò chuyện...
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Bạn chưa có cuộc trò chuyện nào với nhà tuyển dụng.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <ul className="divide-y divide-slate-100">
        {conversations.map((conversation) => {
          const active = conversation.id === selectedConversationId;
          const unread = Number(conversation.soTinChuaDoc || 0);
          return (
            <li key={conversation.id}>
              <button
                type="button"
                onClick={() => onSelect(conversation)}
                className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left ${
                  active ? "bg-slate-100" : "hover:bg-slate-50"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {resolveRecruiterName(conversation, currentUserId)}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {conversation.tinNhanGanNhat || "Bắt đầu cuộc trò chuyện"}
                  </p>
                </div>
                {unread > 0 ? (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[11px] font-semibold text-white">
                    {unread}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
