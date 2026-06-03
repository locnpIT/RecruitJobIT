import { Download, Eye, Loader2 } from "lucide-react";
import type { CompanyAdminApplication } from "@/services/company-admin/types";
import { ApplicationStatusBadge, InterviewInviteBadge } from "./ApplicationStatusBadge";
import { Button } from "@/components/ui/Button";
import type { ApplicationCandidateMatch } from "./matching/types";
import { MatchScoreBadge } from "./matching/MatchScoreBadge";

type ApplicationsTableProps = {
  applications: CompanyAdminApplication[];
  loading: boolean;
  semanticMatches?: ApplicationCandidateMatch[];
  selectedMatchKey?: string | null;
  showSemanticScore?: boolean;
  showCvColumn?: boolean;
  openingChatApplicationId: number | null;
  onSelectSemanticMatch?: (matchKey: string) => void;
  onOpenSemanticInsight?: () => void;
  onOpenChat: (applicationId: number | null) => void;
  onOpenDetail: (applicationId: number | null) => void;
};

// Bảng danh sách đơn ứng tuyển đã lọc.
export function ApplicationsTable({
  applications,
  loading,
  semanticMatches = [],
  selectedMatchKey,
  showSemanticScore = false,
  showCvColumn = true,
  openingChatApplicationId,
  onSelectSemanticMatch,
  onOpenSemanticInsight,
  onOpenChat,
  onOpenDetail,
}: ApplicationsTableProps) {
  const matchByApplicationId = new Map(
    semanticMatches
      .filter((match) => match.applicationId != null)
      .map((match) => [match.applicationId, match])
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-8 text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Đang tải ứng tuyển...
      </div>
    );
  }

  if (!applications.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Chưa có đơn ứng tuyển phù hợp với bộ lọc hiện tại.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
          <tr>
            <th className="py-3 pl-4 font-medium">Ứng viên</th>
            <th className="py-3 font-medium">Tin tuyển dụng</th>
            {showCvColumn ? <th className="py-3 font-medium">CV</th> : null}
            <th className="py-3 font-medium">Trạng thái</th>
            {showSemanticScore ? <th className="py-3 font-medium">AI Matching</th> : null}
            <th className="py-3 font-medium">Thời gian</th>
            <th className="py-3 pr-4 text-right font-medium">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => {
            const semanticMatch = application.id == null ? null : matchByApplicationId.get(application.id);
            const selected = semanticMatch?.matchKey === selectedMatchKey;

            return (
              <tr
                key={application.id ?? `${application.tinTuyenDungId}-${application.nguoiDungId}`}
                className={`border-b border-slate-200 last:border-0 ${selected ? "bg-teal-50/60" : "bg-white"}`}
              >
                <td className="py-3 pl-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (semanticMatch) {
                        onSelectSemanticMatch?.(semanticMatch.matchKey);
                        onOpenSemanticInsight?.();
                      }
                    }}
                    className={`text-left ${semanticMatch ? "hover:underline" : ""}`}
                  >
                    <p className="font-medium text-slate-900">{application.ungVienHoTen ?? "--"}</p>
                    <p className="text-xs text-slate-500">{application.ungVienEmail ?? "--"}</p>
                  </button>
                </td>
                <td className="max-w-xs py-3 text-slate-600">{application.tieuDeTinTuyenDung ?? "--"}</td>
                {showCvColumn ? <ApplicationCvCell cvUrl={application.cvUrl} /> : null}
                <td className="py-3">
                  <div className="flex flex-col gap-2">
                    <ApplicationStatusBadge status={application.trangThai} />
                    <InterviewInviteBadge sentAt={application.thoiGianGuiThuMoi} />
                  </div>
                </td>
                {showSemanticScore ? (
                  <ApplicationSemanticScoreCell match={semanticMatch} onSelectSemanticMatch={onSelectSemanticMatch} />
                ) : null}
                <td className="py-3 text-slate-600">{formatDateTime(application.ngayTao)}</td>
                <td className="py-3 pr-4 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Button variant="unstyled"
                      type="button"
                      disabled={openingChatApplicationId === application.id}
                      onClick={() => onOpenChat(application.id)}
                      className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      {openingChatApplicationId === application.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang mở chat...
                        </>
                      ) : (
                        "Gửi tin nhắn"
                      )}
                    </Button>
                    <Button variant="unstyled"
                      type="button"
                      onClick={() => onOpenDetail(application.id)}
                      className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      <Eye className="h-4 w-4" />
                      Xem hồ sơ
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

function ApplicationCvCell({ cvUrl }: { cvUrl: string | null }) {
  return (
    <td className="py-3 text-slate-600">
      {cvUrl ? (
        <a
          href={cvUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-medium text-slate-800 hover:underline"
        >
          <Download className="h-4 w-4" />
          Tải CV
        </a>
      ) : (
        <span className="text-slate-400">Không có</span>
      )}
    </td>
  );
}

function ApplicationSemanticScoreCell({
  match,
  onSelectSemanticMatch,
}: {
  match?: ApplicationCandidateMatch | null;
  onSelectSemanticMatch?: (matchKey: string) => void;
}) {
  return (
    <td className="py-3">
      {match ? (
        <button type="button" onClick={() => onSelectSemanticMatch?.(match.matchKey)} className="text-left">
          <MatchScoreBadge score={match.score} />
        </button>
      ) : (
        <span className="text-xs text-slate-400">Chưa có điểm</span>
      )}
    </td>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "--";
  }
  return new Date(value).toLocaleString("vi-VN");
}
