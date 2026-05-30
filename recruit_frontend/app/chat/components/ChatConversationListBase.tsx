import Image from "next/image";
import { useMemo, useState } from "react";
import type { ChatConversation } from "@/services/chat/chat.service";
import { buildRecruiterLabel } from "@/app/chat/utils/chat-partner-label";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type ChatConversationListBaseProps = {
  conversations: ChatConversation[];
  selectedConversationId: number | null;
  currentUserId: number | null;
  loading: boolean;
  emptyStateText: string;
  candidateFallbackLabel?: string;
  recruiterFallbackLabel?: string;
  onSelect: (conversation: ChatConversation) => void;
};

function resolvePartnerName(
  conversation: ChatConversation,
  currentUserId: number | null,
  candidateFallbackLabel: string,
  recruiterFallbackLabel: string
) {
  const isCandidateView = currentUserId != null && currentUserId === conversation.ungVienId;
  return isCandidateView
    ? buildRecruiterLabel(
        conversation.nhaTuyenDungHienThiTen,
        conversation.nhaTuyenDungCongTyTen,
        recruiterFallbackLabel
      )
    : conversation.ungVienHienThiTen || candidateFallbackLabel;
}

function resolvePartnerAvatarUrl(conversation: ChatConversation, currentUserId: number | null) {
  const isCandidateView = currentUserId != null && currentUserId === conversation.ungVienId;
  // Candidate view => partner is recruiter; recruiter view => partner is candidate.
  return isCandidateView ? conversation.nhaTuyenDungAnhDaiDienUrl : conversation.ungVienAnhDaiDienUrl;
}

function resolvePartnerInitial(partnerName: string) {
  const trimmed = partnerName.trim();
  if (!trimmed) {
    return "?";
  }
  // Prefer last "word" initial for Vietnamese names.
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const last = parts[parts.length - 1] ?? trimmed;
  return (last.charAt(0) || "?").toUpperCase();
}

function formatConversationTime(raw: string | null | undefined) {
  if (!raw) {
    return "";
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const now = new Date();
  const isSameDay =
    parsed.getFullYear() === now.getFullYear() &&
    parsed.getMonth() === now.getMonth() &&
    parsed.getDate() === now.getDate();

  const two = (value: number) => String(value).padStart(2, "0");
  if (isSameDay) {
    return `${two(parsed.getHours())}:${two(parsed.getMinutes())}`;
  }
  return `${two(parsed.getDate())}/${two(parsed.getMonth() + 1)}`;
}

// Shared conversation list UI cho cả candidate và recruiter inbox.
export function ChatConversationListBase({
  conversations,
  selectedConversationId,
  currentUserId,
  loading,
  emptyStateText,
  candidateFallbackLabel = "Ứng viên",
  recruiterFallbackLabel = "Nhà tuyển dụng",
  onSelect,
}: ChatConversationListBaseProps) {
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const filteredConversations = useMemo(() => {
    if (!normalizedQuery) {
      return conversations;
    }
    return conversations.filter((conversation) => {
      const name = resolvePartnerName(
        conversation,
        currentUserId,
        candidateFallbackLabel,
        recruiterFallbackLabel
      );
      const preview = conversation.tinNhanGanNhat || "";
      return `${name} ${preview}`.toLowerCase().includes(normalizedQuery);
    });
  }, [candidateFallbackLabel, conversations, currentUserId, normalizedQuery, recruiterFallbackLabel]);

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
        {emptyStateText}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm kiếm cuộc trò chuyện..."
          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400"
        />
      </div>

      {filteredConversations.length === 0 ? (
        <div className="p-4 text-sm text-slate-500">Không tìm thấy cuộc trò chuyện phù hợp.</div>
      ) : null}

      <ul className="divide-y divide-slate-100">
        {filteredConversations.map((conversation) => {
          const active = conversation.id === selectedConversationId;
          const unread = Number(conversation.soTinChuaDoc || 0);
          const partnerName = resolvePartnerName(
            conversation,
            currentUserId,
            candidateFallbackLabel,
            recruiterFallbackLabel
          );
          const partnerInitial = resolvePartnerInitial(partnerName);
          const partnerAvatarUrl = resolvePartnerAvatarUrl(conversation, currentUserId);
          const lastMessageAt = formatConversationTime(conversation.tinNhanGanNhatLuc);
          return (
            <li key={conversation.id}>
              <Button variant="unstyled"
                type="button"
                onClick={() => onSelect(conversation)}
                className={cn(
                  "relative flex h-auto min-h-[76px] w-full items-start gap-3 px-4 py-4 text-left transition",
                  active ? "bg-teal-50/60" : "hover:bg-slate-50"
                )}
              >
                {active ? <span className="absolute left-0 top-0 h-full w-1 bg-[#008080]" /> : null}

                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                  {partnerAvatarUrl ? (
                    <Image src={partnerAvatarUrl} alt={`Avatar ${partnerName}`} fill className="object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-sm font-semibold text-slate-700">
                      {partnerInitial}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-semibold text-slate-900">{partnerName}</p>
                    <div className="flex shrink-0 items-center gap-2">
                      {lastMessageAt ? <span className="text-[11px] font-medium text-slate-500">{lastMessageAt}</span> : null}
                      {unread > 0 ? (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[11px] font-semibold text-white">
                          {unread}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-1 text-xs leading-5 text-slate-500">
                    {conversation.tinNhanGanNhat || "Bắt đầu cuộc trò chuyện"}
                  </p>
                </div>
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
