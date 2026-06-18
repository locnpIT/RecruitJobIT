# Recruit Frontend

Frontend cho hệ thống tuyển dụng, xây bằng Next.js App Router + TypeScript.

## 1) Công nghệ

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Axios
- React Hook Form + Zod
- Sonner (toast)

## 2) Yêu cầu môi trường

- Node.js 20+
- npm 10+
- Backend đang chạy ở `http://localhost:8080`

## 3) Cấu hình môi trường

Tạo file `.env.local` trong thư mục `recruit_frontend`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

Ghi chú:
- Nếu không khai báo biến này, frontend sẽ fallback về `http://localhost:8080/api/v1`.
- Chat websocket cũng suy ra URL từ `NEXT_PUBLIC_API_URL`.

## 4) Chạy dự án

```bash
cd recruit_frontend
npm install
npm run dev
```

Mở: `http://localhost:3000`

Build production:

```bash
npm run build
npm run start
```

Lint:

```bash
npm run lint
```

Lint theo file:

```bash
npm run lint -- app/messages/page.tsx
```

## 5) Cấu trúc chính

```text
recruit_frontend/
  app/
    auth/
    admin/
    company-admin/
    jobs/
    messages/
    profile/
  services/               # API service theo domain
    company-admin/        # tách nhỏ theo module: jobs/applications/settings/packages/hr
    company-admin.service.ts  # facade re-export tạm để không break import cũ
    admin/                # tách nhỏ theo module: stats/users/companies/jobs/packages/catalogs/proofs
    admin.service.ts      # facade re-export tạm để không break import cũ
  lib/
    api-client.ts         # axios instance + auth interceptor
    api-error.ts          # chuẩn hoá message lỗi API cho hooks/UI
    chat-websocket.ts     # websocket connector + fallback URL strategy
```

## 6) Quy ước frontend trong dự án

- `page.tsx` chỉ giữ orchestration (state screen-level + phối hợp component).
- UI tách vào `components/` theo route.
- Logic phức tạp (session, realtime, fetch flow) tách vào `hooks/`.
- Gọi API qua `services/*.service.ts`, không gọi thẳng `fetch` trong component.
- Type/interface import trực tiếp từ `services/<domain>/types` (không import type qua facade `*.service.ts`).
- Không dùng fallback mock data cho luồng production; lỗi/empty hiển thị state rõ ràng.

## 7) Các refactor đáng chú ý

### Pattern chuẩn mới (2026)

- Chuẩn hóa theo mô hình:
  - `page.tsx` mỏng (wrapper/compose)
  - `*Client.tsx` giữ render + wiring props
  - `hooks/*` giữ data flow và actions
- Áp dụng cho các cụm:
  - `app/admin/users`, `app/admin/candidate-proofs`
  - `app/admin/catalogs`, `app/admin/plans`
  - `app/company-admin/hr`, `app/company-admin/branches`, `app/company-admin/packages`, `app/company-admin` (home)
  - `app/company-admin/applications` gồm section AI Matching gọi Qdrant candidate matches, fallback preview khi Qdrant chưa sẵn sàng
  - `app/jobs`, `app/favorite-jobs`
  - `app/auth/register/owner`, `app/auth/register/candidate`
  - `app/profile`
  - `app/components/home` (header/top companies/featured jobs)
  - `app/auth/login`
  - `app/companies/[id]`

- Chuẩn bổ sung sau vòng refactor cuối:
  - Component UI (`*.tsx`) không gọi API service trực tiếp.
  - API call và side-effect mạng nằm trong `hooks/*`.

### Chat inbox (candidate + recruiter)

- Tách logic realtime khỏi page:
  - `app/messages/hooks/useCandidateInbox.ts`
  - `app/company-admin/messages/hooks/useRecruiterInbox.ts`
- `page.tsx` còn lại phần render list/thread + bind action.

### Profile candidate

- Tách session/data/location thành hooks:
  - `app/profile/hooks/useCandidateProfileSession.ts`
  - `app/profile/hooks/useCandidateProfileData.ts`
  - `app/profile/hooks/useProfileLocationForm.ts`
- Tách toàn bộ mutation/action thành hook riêng:
  - `app/profile/hooks/useCandidateProfileActions.ts`
- UX thêm/sửa học vấn, kinh nghiệm, chứng chỉ theo hướng modal-driven:
  - Bấm `Thêm ...` mới mở modal
  - Modal có 2 tab: `Tạo mới` và `Chọn có sẵn` (tái sử dụng data người dùng cho nhiều hồ sơ)
  - Component modal đặt tại `app/profile/components/modals/*`
- Kỹ năng và ngành nghề quan tâm chỉ hiển thị mục đã chọn trên trang; danh sách đầy đủ mở trong modal chọn có tìm kiếm.
- Tách loading state riêng:
  - `app/profile/components/ProfileLoadingState.tsx`
- Candidate mới đăng ký chưa có hồ sơ sẽ thấy empty state:
  - `app/profile/components/ProfileEmptyState.tsx`
  - bấm `Tạo hồ sơ đầu tiên` mới gọi `candidateProfileService.createProfile()`

### Owner register

- Tách form thành section component + hook submit/data:
  - `app/auth/register/owner/hooks/useOwnerRegister.ts`
  - personal info
  - company info
  - branches
  - proof upload
  - submit bar

### Public jobs + favorite jobs

- `app/jobs` tách:
  - `components/JobsPageClient.tsx`
  - `hooks/useJobsSearch.ts`
- `app/favorite-jobs` tách:
  - `components/FavoriteJobsPageClient.tsx`
  - `hooks/useFavoriteJobs.ts`

### Company admin settings

- Tách proof rows state và section UI riêng:
  - `useCompanyProofRows.ts`
  - `CompanyProofsSection.tsx`
  - `CompanyResubmitSection.tsx`

## 8) Auth/session flow

- Token lưu ở `localStorage` key `token`.
- User lưu ở `localStorage` key `user`.
- `auth_token` cookie dùng cho middleware route `/company-admin/*`.
- `lib/api-client.ts` tự gắn `Authorization: Bearer <token>` cho API private.

## 9) Realtime chat flow

- Websocket endpoint chuẩn: `/ws/chat?token=...`
- Frontend tự thử nhiều URL candidate dựa trên `NEXT_PUBLIC_API_URL`.
- Khi websocket lỗi/ngắt:
  - tự reconnect
  - fallback polling để không mất dữ liệu UI

## 10) Troubleshooting nhanh

### Không gọi được API

- Kiểm tra `NEXT_PUBLIC_API_URL`.
- Kiểm tra backend có chạy và CORS cho `http://localhost:3000`.

### 401/403 liên tục

- Token hết hạn trong `localStorage`.
- Xóa session local rồi login lại.

### Chat không realtime

- Kiểm tra tab Network có kết nối websocket.
- Kiểm tra backend có expose `/ws/chat`.
- Kiểm tra token truyền qua query websocket còn hạn.

---
Nếu cần tài liệu chi tiết flow từng module, xem thêm thư mục docs của backend (`recruit/docs/*`) và map ngược sang `services`/`app` ở frontend.
