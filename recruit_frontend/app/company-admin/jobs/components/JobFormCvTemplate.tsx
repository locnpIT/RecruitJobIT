type JobFormCvTemplateProps = {
  mauCvUrlValue?: string;
  isUploadingCvTemplate: boolean;
  cvTemplateFileName: string | null;
  onUploadCvTemplate: (file: File | null) => void;
};

export function JobFormCvTemplate({
  mauCvUrlValue,
  isUploadingCvTemplate,
  cvTemplateFileName,
  onUploadCvTemplate,
}: JobFormCvTemplateProps) {
  return (
    <div className="space-y-2 rounded-md border border-slate-200 p-3">
      <p className="text-sm font-medium text-slate-800">Mẫu CV bắt buộc</p>
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={(event) => onUploadCvTemplate(event.target.files?.[0] ?? null)}
        className="block w-full text-sm text-slate-600 file:mr-4 file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700"
      />
      {isUploadingCvTemplate ? <p className="text-xs text-slate-500">Đang upload mẫu CV...</p> : null}
      {cvTemplateFileName ? <p className="text-xs text-slate-600">Đã tải: {cvTemplateFileName}</p> : null}
      {mauCvUrlValue ? (
        <a href={mauCvUrlValue} target="_blank" rel="noreferrer" className="text-xs text-blue-700 underline">
          Xem mẫu CV đã upload
        </a>
      ) : (
        <p className="text-xs text-amber-700">Chưa có mẫu CV, ứng viên sẽ không thấy file mẫu.</p>
      )}
    </div>
  );
}
