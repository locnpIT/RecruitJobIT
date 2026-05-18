// Note dùng lại ở cuối form owner register để nhấn mạnh quy trình duyệt.
export function OwnerRegisterNotice() {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
      <p className="text-xs leading-relaxed text-blue-800">
        Tài khoản công ty cần được quản trị viên phê duyệt dựa trên tài liệu minh chứng bạn cung cấp trước khi có thể đăng tin.
      </p>
    </div>
  );
}
