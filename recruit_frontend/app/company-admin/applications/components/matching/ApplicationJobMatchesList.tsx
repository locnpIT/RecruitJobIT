import { BriefcaseBusiness, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ApplicationStatusBadge } from "../ApplicationStatusBadge";
import type { ApplicationJobMatch } from "./types";
import { MatchScoreBadge } from "./MatchScoreBadge";
import { SignalChips } from "./SignalChips";

type ApplicationJobMatchesListProps = {
  matches: ApplicationJobMatch[];
  selectedApplicationId?: number | null;
  onSelectApplication: (applicationId: number) => void;
  onOpenDetail: (applicationId: number | null) => void;
};

export function ApplicationJobMatchesList({
  matches,
  selectedApplicationId,
  onSelectApplication,
  onOpenDetail,
}: ApplicationJobMatchesListProps) {
  if (!matches.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        Chưa có tin tuyển dụng đạt ngưỡng matching đang chọn.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => {
        const selected = selectedApplicationId === match.applicationId;

        return (
          <article
            key={match.applicationId}
            className={`rounded-lg border bg-white p-4 transition ${
              selected ? "border-teal-300 bg-teal-50/60" : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <button type="button" onClick={() => onSelectApplication(match.applicationId)} className="min-w-0 text-left">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-600">
                    <BriefcaseBusiness className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-base font-semibold text-slate-950">{match.jobTitle}</span>
                    <span className="mt-1 block text-sm text-slate-500">Ứng viên: {match.candidateName}</span>
                    <span className="mt-2 inline-block">
                      <ApplicationStatusBadge status={match.status} />
                    </span>
                  </span>
                </div>
              </button>

              <div className="flex shrink-0 items-center gap-2">
                <MatchScoreBadge score={match.score} />
                <Button type="button" variant="outline" size="sm" onClick={() => onOpenDetail(match.applicationId)}>
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  Hồ sơ
                </Button>
              </div>
            </div>

            <div className="mt-4">
              <SignalChips items={match.matchedSignals} />
            </div>
          </article>
        );
      })}
    </div>
  );
}
