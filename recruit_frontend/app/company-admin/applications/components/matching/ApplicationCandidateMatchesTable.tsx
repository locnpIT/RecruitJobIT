import { Eye, MessageSquare, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ApplicationStatusBadge } from "../ApplicationStatusBadge";
import type { ApplicationCandidateMatch } from "./types";
import { MatchScoreBadge } from "./MatchScoreBadge";
import { SignalChips } from "./SignalChips";

type ApplicationCandidateMatchesTableProps = {
  matches: ApplicationCandidateMatch[];
  selectedMatchKey?: string | null;
  openingChatApplicationId: number | null;
  onSelectMatch: (matchKey: string) => void;
  onOpenChat: (applicationId: number | null) => void;
  onOpenDetail: (applicationId: number | null) => void;
};

export function ApplicationCandidateMatchesTable({
  matches,
  selectedMatchKey,
  openingChatApplicationId,
  onSelectMatch,
  onOpenChat,
  onOpenDetail,
}: ApplicationCandidateMatchesTableProps) {
  if (!matches.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        Chưa có ứng viên đạt ngưỡng matching đang chọn.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Ứng viên</th>
            <th className="px-4 py-3 font-medium">Điểm</th>
            <th className="px-4 py-3 font-medium">Tín hiệu khớp</th>
            <th className="px-4 py-3 font-medium">Trạng thái</th>
            <th className="px-4 py-3 text-right font-medium">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((match) => {
            const selected = selectedMatchKey === match.matchKey;
            const hasApplication = match.applicationId != null;
            const chatLoading = hasApplication && openingChatApplicationId === match.applicationId;

            return (
              <tr key={match.matchKey} className={`border-b border-slate-200 last:border-0 ${selected ? "bg-teal-50/60" : "bg-white"}`}>
                <td className="px-4 py-4">
                  <button type="button" onClick={() => onSelectMatch(match.matchKey)} className="text-left">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600">
                        <UserRound className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block font-semibold text-slate-950">{match.candidateName}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">{match.candidateEmail}</span>
                      </span>
                    </div>
                  </button>
                </td>
                <td className="px-4 py-4">
                  <MatchScoreBadge score={match.score} />
                </td>
                <td className="px-4 py-4">
                  <SignalChips items={match.matchedSignals} />
                </td>
                <td className="px-4 py-4">
                  {match.status ? <ApplicationStatusBadge status={match.status} /> : <span className="text-xs text-slate-500">Gợi ý Qdrant</span>}
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!hasApplication}
                      title={hasApplication ? undefined : "Chưa có đơn ứng tuyển tương ứng để mở hồ sơ trong màn này."}
                      onClick={() => onOpenDetail(match.applicationId)}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      Hồ sơ
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={!hasApplication || chatLoading}
                      title={hasApplication ? undefined : "Chưa có đơn ứng tuyển tương ứng để mở chat."}
                      onClick={() => onOpenChat(match.applicationId)}
                    >
                      <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                      {chatLoading ? "Đang mở..." : "Nhắn"}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
