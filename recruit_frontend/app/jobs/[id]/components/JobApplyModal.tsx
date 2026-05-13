import Link from "next/link";
import { FileUp, X } from "lucide-react";
import type { CandidateProfileListItem } from "@/services/candidate-profile.service";
import type { PublicJobDetail } from "@/services/public-job.service";

type JobApplyModalProps = {
  open: boolean;
  job: PublicJobDetail;
  profiles: CandidateProfileListItem[];
  selectedProfileId: string;
  cvFile: File | null;
  submitting: boolean;
  error: string;
  onSelectedProfileIdChange: (value: string) => void;
  onCvFileChange: (file: File | null) => void;
  onClose: () => void;
  onSubmit: () => void;
};

// Modal ứng tuyển cho candidate.
// Rule UI bám backend: luôn chọn hồ sơ; nếu job.batBuocCv=true thì bắt chọn file CV để upload Cloudinary.
export function JobApplyModal({
  open,
  job,
  profiles,
  selectedProfileId,
  cvFile,
  submitting,
  error,
  onSelectedProfileIdChange,
  onCvFileChange,
  onClose,
  onSubmit,
}: JobApplyModalProps) {
  if (!open) {
    return null;
  }

  const requiresCv = Boolean(job.batBuocCv);
  const canSubmit = profiles.length > 0 && !submitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
      <section className="w-full max-w-xl rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Ứng tuyển
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">{job.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{job.company}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="Đóng modal ứng tuyển"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div>
            <label className="text-sm font-semibold text-slate-900" htmlFor="candidate-profile">
              Hồ sơ ứng viên
            </label>
            <p className="mt-1 text-sm text-slate-500">
              Chọn hồ sơ bạn muốn gửi cho nhà tuyển dụng.
            </p>

            {profiles.length > 0 ? (
              <select
                id="candidate-profile"
                value={selectedProfileId}
                onChange={(event) => onSelectedProfileIdChange(event.target.value)}
                className="mt-3 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-500"
              >
                <option value="">Chọn hồ sơ</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.title}
                  </option>
                ))}
              </select>
            ) : (
              <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Bạn chưa có hồ sơ ứng viên. Hãy tạo hồ sơ trước khi ứng tuyển.
                <div className="mt-3">
                  <Link href="/profile" className="font-semibold text-slate-950 hover:underline">
                    Tạo hồ sơ ứng viên
                  </Link>
                </div>
              </div>
            )}
          </div>

          {requiresCv ? (
            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <label className="text-sm font-semibold text-slate-900" htmlFor="candidate-cv">
                    File CV bắt buộc
                  </label>
                  <p className="mt-1 text-sm text-slate-500">
                    Tin này yêu cầu nộp CV theo file riêng.
                  </p>
                </div>
                {job.mauCvUrl ? (
                  <a
                    href={job.mauCvUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-sm font-semibold text-slate-900 hover:underline"
                  >
                    Tải mẫu CV
                  </a>
                ) : null}
              </div>

              <label
                htmlFor="candidate-cv"
                className="mt-3 flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-700 hover:bg-slate-100"
              >
                <FileUp className="h-5 w-5 text-slate-600" />
                <span>{cvFile ? cvFile.name : "Chọn file CV để upload"}</span>
              </label>
              <input
                id="candidate-cv"
                type="file"
                accept="application/pdf,.doc,.docx,image/*"
                className="sr-only"
                onChange={(event) => onCvFileChange(event.target.files?.[0] ?? null)}
              />
            </div>
          ) : (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              Tin này không bắt buộc file CV. Hệ thống sẽ gửi hồ sơ ứng viên bạn đã chọn cho nhà tuyển dụng.
            </div>
          )}

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="h-10 rounded-md bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {submitting ? "Đang gửi..." : "Gửi ứng tuyển"}
          </button>
        </div>
      </section>
    </div>
  );
}
