# BUSINESS FLOW - RecruitJobIT

Tài liệu này mô tả luồng nghiệp vụ thực tế của hệ thống tuyển dụng IT trong source code hiện tại.

Stack chính:

- Frontend: Next.js App Router, TypeScript, Tailwind, service layer trong `recruit_frontend/services`.
- Backend: Spring Boot 3, Java, Spring Security JWT, JPA Repository.
- Search/AI: Elasticsearch cho full-text job search, Qdrant cho semantic matching.
- File: Cloudinary signed upload.
- Thanh toán: SePay checkout + webhook.
- Realtime: WebSocket chat.

Nguyên tắc đọc flow:

- UI page/component: nằm trong `recruit_frontend/app/...`.
- Hook màn hình: thường là `use...Data`, `use...Actions`.
- Frontend API service: nằm trong `recruit_frontend/services/{domain}`.
- Backend controller: nhận request, kiểm quyền, trả `SuccessResponse`.
- Backend service: xử lý business rule, transaction, mapping DTO.
- Repository/entity: truy vấn/lưu dữ liệu DB.

## 1. Cấu Trúc Tổng Quan

### 1.1. Actors

Hệ thống có 4 nhóm người dùng chính:

| Actor | Vai trò | Khu vực UI | Backend guard chính |
| --- | --- | --- | --- |
| Guest | Xem trang chủ, tìm việc, xem công ty/job | `/`, `/jobs`, `/companies/[id]` | Public endpoint |
| Candidate | Quản lý hồ sơ, ứng tuyển, yêu thích, chat | `/profile`, `/favorite-jobs`, `/messages`, `/jobs/[id]` | JWT + candidate principal |
| Company Owner | Quản trị công ty, chi nhánh, HR, gói, jobs, applications | `/company-admin/*` | `CompanyAdminAccessService` |
| Company HR | Quản lý jobs/applications theo chi nhánh được gán | `/company-admin/*` giới hạn quyền | `CompanyAdminAccessService` |
| Super Admin | Duyệt công ty/job/minh chứng, quản trị catalog/gói/user | `/admin/*` | `AbstractAdminController.requireAdmin()` |

### 1.2. Backend Request Pattern

Pattern chung:

```text
Frontend component
  -> hook
    -> services/{domain}/*.service.ts
      -> apiClient
        -> Spring Controller
          -> Service facade/domain service
            -> Repository/External service
              -> DTO response
```

Ví dụ với admin duyệt công ty:

```text
CompaniesAdminClient
  -> useAdminCompaniesActions.approveCompany()
    -> adminCompaniesService.approveCompany(companyId)
      -> PATCH /api/v1/admin/companies/{companyId}/approve
        -> AdminCompanyController.approveCompany()
          -> AdminService.approveCompany()
            -> AdminCompanyService.approveCompany()
              -> CompanyRepository.save()
              -> NotificationService.createForUser()
```

### 1.3. Frontend Services Structure

Service đã được chuẩn hóa theo domain:

```text
recruit_frontend/services
├── admin/
│   ├── admin.service.ts              # facade admin
│   ├── candidate-proofs.service.ts
│   ├── catalogs.service.ts
│   ├── companies.service.ts
│   ├── jobs.service.ts
│   ├── packages.service.ts
│   ├── stats.service.ts
│   ├── types.ts
│   └── users.service.ts
├── auth/auth.service.ts
├── candidate/
│   ├── candidate-application.service.ts
│   └── candidate-profile.service.ts
├── chat/chat.service.ts
├── common/
│   ├── location.service.ts
│   └── notification.service.ts
├── company-admin/
│   ├── applications.service.ts
│   ├── company-admin.service.ts      # facade company-admin
│   ├── hr.service.ts
│   ├── jobs.service.ts
│   ├── packages.service.ts
│   ├── settings.service.ts
│   └── types.ts
├── public/
│   ├── public-company.service.ts
│   └── public-job.service.ts
└── _shared/path-param.ts
```

Không còn service root-level kiểu `services/auth.service.ts`.

### 1.4. Backend Service Split Hiện Tại

Một số service lớn đã được tách theo domain:

```text
AdminXxxController (8 controller chuyên biệt, đều extend AbstractAdminController)
  ├── AdminStatsController        /api/v1/admin              → AdminService → AdminStatsService
  ├── AdminUserController         /api/v1/admin/users        → AdminService → AdminUserService
  ├── AdminCompanyController      /api/v1/admin/companies    → AdminService → AdminCompanyService
  ├── AdminPackageController      /api/v1/admin/packages     → AdminService → AdminPackageService
  ├── AdminJobController          /api/v1/admin/jobs         → AdminService → AdminJobService
  ├── AdminCandidateProofController /api/v1/admin/candidate-proofs → AdminService → AdminCandidateProofService
  ├── AdminCatalogController      /api/v1/admin              → AdminService → AdminCatalogService
  └── AdminSearchIndexController  /api/v1/admin              → AdminService → AdminSearchIndexService

AbstractAdminController           # class abstract, package-private, không phải Spring bean
  └── requireAdmin()              # dùng chung cho cả 8 controller trên
```

```text
AuthController
  -> AuthService                        # login + register candidate
  -> OwnerRegistrationService           # register owner + proof types + create employer
  -> AuthUserProfileService             # getMe + updateMe + updateAvatar
```

```text
Candidate profile API
  -> CandidateProfileController         # profile, summary, skills, industries, matching jobs
  -> CandidateEducationController       # education CRUD + selection
  -> CandidateExperienceController      # work experience CRUD + selection
  -> CandidateCertificateController     # certificate CRUD + selection
```

## 2. Authentication

### 2.1. Login

Frontend:

- Page: `recruit_frontend/app/auth/login/page.tsx`
- Client: `app/auth/login/LoginClient.tsx`
- Hook: `app/auth/login/hooks/useLoginFlow.ts`
- Service: `services/auth/auth.service.ts`
- Method: `authService.login(data)`

Endpoint:

```http
POST /api/v1/auth/login
```

Backend:

- Controller: `recruit/src/main/java/.../auth/controller/AuthController.java`
- Method: `login(@Valid @RequestBody LoginRequest request)`
- Service: `auth/service/AuthService.java`
- Method: `login(LoginRequest request)`

Code xử lý chính trong `AuthService.login`:

```java
String normalizedEmail = normalizeEmail(request.getEmail());
NguoiDung user = usersRepository.findByEmail(normalizedEmail)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sai email hoặc mật khẩu"));

if (!Boolean.TRUE.equals(user.getDangHoatDong())) {
    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản chưa được kích hoạt");
}

authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(normalizedEmail, request.getMatKhau())
);

String accessToken = jwtService.generateAccessToken(user);
return buildAuthResponse(user, accessToken);
```

Business rule:

- Email được normalize lowercase.
- Nếu user không tồn tại hoặc password sai: trả `401`.
- Nếu user bị khóa: trả `403`.
- Response trả `AuthResponse` gồm user info và access token.
- Frontend lưu token rồi redirect theo role:
  - Admin -> `/admin`
  - Company user -> `/company-admin`
  - Candidate -> public/home hoặc route trước đó.

### 2.2. Register Candidate

Frontend:

- Page: `app/auth/register/candidate/page.tsx`
- Client: `CandidateRegisterClient.tsx`
- Hook: `useCandidateRegister.ts`
- Service: `services/auth/auth.service.ts`
- Method: `authService.registerCandidate(data)`

Endpoint:

```http
POST /api/v1/auth/register
```

Backend:

- Controller: `AuthController.registerCandidate`
- Service: `AuthService.registerCandidate`

Code xử lý chính:

```java
String normalizedEmail = normalizeEmail(request.getEmail());
ensureEmailNotExists(normalizedEmail);
VaiTroHeThong candidateRole = requireRole(RoleName.CANDIDATE);

NguoiDung user = new NguoiDung();
user.setEmail(normalizedEmail);
user.setMatKhauBam(passwordEncoder.encode(request.getMatKhau()));
user.setTen(request.getTen().trim());
user.setHo(request.getHo().trim());
user.setSoDienThoai(trimToNull(request.getSoDienThoai()));
user.setDangHoatDong(true);
user.setVaiTroHeThong(candidateRole);
user = usersRepository.save(user);
```

Business rule:

- Email không được trùng.
- Candidate nhận role hệ thống `CANDIDATE`.
- Hệ thống trả token ngay sau đăng ký.
- Hồ sơ ứng viên được quản lý qua candidate profile API. Khi frontend vào `/profile`, hook sẽ load user và profile hiện hành.

### 2.3. Register Company Owner

Frontend:

- Page: `app/auth/register/owner/page.tsx`
- Client: `OwnerRegisterClient.tsx`
- Hook: `useOwnerRegister.ts`
- Proof upload component: `OwnerProofUploadSection.tsx`
- Service: `services/auth/auth.service.ts`

Endpoints:

```http
GET  /api/v1/auth/proof-types
GET  /api/v1/auth/cloudinary-signature?purpose=proof
POST /api/v1/auth/register-owner
```

Backend:

- Controller: `AuthController.getOwnerProofTypes`
- Controller: `AuthController.registerOwner`
- Service: `OwnerRegistrationService`
- Methods:
  - `listOwnerProofTypes()`
  - `registerOwner(CreateOwnerRequest request)`

Flow chi tiết:

```text
OwnerRegisterClient
  -> useOwnerRegister
    -> authService.getOwnerProofTypes()
    -> authService.getCloudinarySignature("proof")
    -> authService.uploadToCloudinary(file, signature)
    -> authService.registerOwner(payload)
      -> POST /auth/register-owner
        -> AuthController.registerOwner
          -> OwnerRegistrationService.registerOwner
```

Code xử lý chính trong `OwnerRegistrationService.registerOwner`:

```java
NguoiDung owner = new NguoiDung();
owner.setEmail(normalizedEmail);
owner.setMatKhauBam(passwordEncoder.encode(request.getMatKhau()));
owner.setVaiTroHeThong(candidateRole);
owner = usersRepository.save(owner);

CongTy congTy = new CongTy();
congTy.setTen(request.getTenCongTy().trim());
congTy.setMaSoThue(request.getMaSoThue().trim());
congTy.setTrangThai(CompanyStatus.PENDING.name());
congTy.setChuCongTy(owner);
congTy = companyRepository.save(congTy);

List<ChiNhanhCongTy> chiNhanhs = createBranches(congTy, request.getChiNhanhs());
```

Điểm quan trọng:

- Owner hiện dùng role hệ thống `CANDIDATE`, quyền công ty nằm ở membership `ThanhVienCongTy` với `VaiTroCongTy = OWNER`.
- Công ty mới có `trangThai = PENDING`.
- Minh chứng công ty được lưu vào `TepMinhChungCongTy`, trạng thái `PENDING`.
- Sau khi admin duyệt công ty, owner mới mở đầy đủ tính năng company-admin.

### 2.4. Get/Update Current User

Frontend:

- Service: `services/auth/auth.service.ts`
- `authService.getMe()`
- `authService.updateMe(payload)`
- `authService.updateAvatar(url)`

Endpoints:

```http
GET   /api/v1/auth/me
PATCH /api/v1/auth/me
PATCH /api/v1/auth/me/avatar
```

Backend:

- Controller: `AuthController.getMe`
- Controller: `AuthController.updateMe`
- Controller: `AuthController.updateAvatar`
- Service: `AuthUserProfileService`

Business rule:

- `updateMe` chỉ cập nhật field được gửi lên.
- `xaPhuongId = null` được hiểu là clear địa chỉ xã/phường.
- Avatar chỉ lưu URL đã upload, backend không nhận binary file.

## 3. Public Job & Company

### 3.1. Trang Chủ

Frontend:

- Page: `recruit_frontend/app/page.tsx`
- Components:
  - `app/components/home/HomeHeader.tsx`
  - `FeaturedJobsSection`
  - `RecommendedJobsSection`
  - `TopCompaniesSection`
- Hooks:
  - `useFeaturedJobs.ts`
  - `useRecommendedJobs.ts`
  - `useTopCompanies.ts`
  - `useHomeHeaderData.ts`

Services:

- `services/public/public-job.service.ts`
- `services/public/public-company.service.ts`
- `services/candidate/candidate-profile.service.ts`
- `services/common/notification.service.ts`

Flow job nổi bật:

```text
Home page
  -> useFeaturedJobs
    -> publicJobService.listJobs({ gioiHan })
      -> GET /api/v1/public/jobs
        -> PublicJobController.listJobs
          -> PublicJobService.listJobs
```

Flow công ty nổi bật:

```text
TopCompaniesSection
  -> useTopCompanies
    -> publicCompanyService.listTopCompanies()
      -> GET /api/v1/public/companies/top
        -> PublicCompanyController.listTopCompanies
          -> PublicCompanyService.listTopCompanies
```

Business rule public job:

- Chỉ trả tin tuyển dụng public hợp lệ:
  - Job chưa xóa mềm.
  - Job đã duyệt/active theo rule trong service.
  - Công ty đã được duyệt.
  - Job chưa hết hạn nếu có deadline.

### 3.2. Tìm Kiếm Việc Làm

Frontend:

- Page: `app/jobs/page.tsx`
- Client: `app/jobs/components/JobsPageClient.tsx`
- Hook: `app/jobs/hooks/useJobsSearch.ts`
- Components:
  - `JobsSearchFilters.tsx`
  - `PublicJobCard.tsx`
  - `JobsPagination.tsx`

Endpoints:

```http
GET /api/v1/public/jobs/search/metadata
GET /api/v1/public/jobs/search
```

Frontend service:

- File: `services/public/public-job.service.ts`
- Methods:
  - `getSearchMetadata()`
  - `searchJobs(params)`

Backend:

- Controller: `PublicJobController`
- Service: `PublicJobService` (orchestration — 264 dòng sau refactor)
- Elasticsearch helper: `PublicJobElasticsearchSearchService`
- Mapping helper: `PublicJobMapper` (entity→DTO + JPA fallback predicates)
- Text util: `JobSearchTextAnalyzer` (normalize, tokenize, alias expansion)

Flow:

```text
JobsPageClient
  -> useJobsSearch
    -> publicJobService.getSearchMetadata()
    -> publicJobService.searchJobs(params)
      -> PublicJobController.searchJobs
        -> PublicJobService.searchJobs
          -> Elasticsearch nếu enabled/index sẵn
          -> fallback JPA nếu Elasticsearch không khả dụng
```

Các filter chính:

- `tuKhoa`
- `diaDiem`
- `nganhNgheId`
- `loaiHinhLamViecId`
- `capDoKinhNghiemId`
- `trang`
- `kichThuoc`

### 3.3. Chi Tiết Job

Frontend:

- Page: `app/jobs/[id]/page.tsx`
- Client: `JobDetailClient.tsx`
- Hook: `useJobDetail.ts`
- Components:
  - `JobDetailHero.tsx`
  - `JobDescriptionPanel.tsx`
  - `JobSidebar.tsx`
  - `JobApplyModal.tsx`
  - `JobChatModal.tsx`

Endpoint:

```http
GET /api/v1/public/jobs/{jobId}
```

Backend:

- Controller: `PublicJobController.getJobDetail`
- Service: `PublicJobService.getJobDetail`

Business rule:

- Guest xem được job public.
- Candidate đăng nhập thì frontend gọi thêm:
  - trạng thái ứng tuyển
  - trạng thái yêu thích
  - danh sách hồ sơ để chọn khi nộp đơn.

### 3.4. Trang Công Ty Công Khai

Frontend:

- Page: `app/companies/[id]/page.tsx`
- Hook: `usePublicCompanyData.ts`
- Component: `PublicCompanyHeader.tsx`

Endpoints:

```http
GET /api/v1/public/companies/{companyId}
GET /api/v1/public/companies/{companyId}/jobs
```

Backend:

- Controller: `PublicCompanyController`
- Service: `PublicCompanyService`

Business rule:

- Chỉ hiển thị công ty đã duyệt.
- Job list chỉ gồm job public hợp lệ của công ty đó.

## 4. Candidate Profile

### 4.1. Màn Hồ Sơ Ứng Viên

Frontend:

- Page: `app/profile/page.tsx`
- Main hooks:
  - `useCandidateProfileData.ts`
  - `useCandidateProfileActions.ts`
  - `useCandidateProfileMediaActions.ts`
  - `useCandidateProfileContentActions.ts`
  - `useCandidateProfilePreferenceActions.ts`
  - `useCandidateProfileSummaryActions.ts`
- Panels:
  - `ProfileHero.tsx`
  - `PersonalInfoPanel.tsx`
  - `EducationPanel.tsx`
  - `WorkExperiencePanel.tsx`
  - `CertificatePanel.tsx`
  - `SkillsPanel.tsx`
  - `IndustriesPanel.tsx`

Service:

- `services/candidate/candidate-profile.service.ts`

Backend controllers:

- `CandidateProfileController`
- `CandidateEducationController`
- `CandidateExperienceController`
- `CandidateCertificateController`

Backend services:

- `CandidateProfileService`
- `CandidateProfileContentService`
- `CandidateProfileAttachmentService`
- `CandidateProfileAccessService`
- `CandidateProfileResponseAssembler`
- `CandidateProfileMapper`

### 4.2. Load Hồ Sơ

Endpoints:

```http
GET  /api/v1/candidate/profile
GET  /api/v1/candidate/profile/all
GET  /api/v1/candidate/profile/{profileId}
POST /api/v1/candidate/profile/all
GET  /api/v1/candidate/profile/metadata
```

Flow:

```text
/profile
  -> useCandidateProfileData
    -> authService.getMe()
    -> candidateProfileService.listProfiles()
    -> candidateProfileService.getProfileById(activeProfileId)
      -> CandidateProfileController
        -> CandidateProfileService
          -> CandidateProfileResponseAssembler
```

Business rule:

- Candidate có thể có nhiều hồ sơ.
- UI có selector hồ sơ.
- Khi tạo profile mới, service attach nội dung có sẵn theo rule hiện tại.
- `CandidateProfileAttachmentService` cũng có hook index kinh nghiệm làm việc khi attach kinh nghiệm cũ vào hồ sơ mới.

### 4.3. Summary, Skills, Industries

Endpoints:

```http
PATCH /api/v1/candidate/profile/summary
PATCH /api/v1/candidate/profile/{profileId}/summary
PUT   /api/v1/candidate/profile/skills
PUT   /api/v1/candidate/profile/{profileId}/skills
PUT   /api/v1/candidate/profile/industries
PUT   /api/v1/candidate/profile/{profileId}/industries
```

Frontend:

- Summary: `useCandidateProfileSummaryActions.ts`
- Skills/industries: `useCandidateProfilePreferenceActions.ts`

Backend:

- Controller: `CandidateProfileController`
- Service: `CandidateProfileService`

Business rule:

- Skills và industries là replace-all theo danh sách ID gửi lên.
- Summary cập nhật giới thiệu/mục tiêu nghề nghiệp.
- Sau khi lưu, frontend có thể gọi sync index để Qdrant cập nhật vector hồ sơ.

### 4.4. Học Vấn

Frontend:

- Panel: `EducationPanel.tsx`
- Modal: `EducationModal.tsx`
- Upload UI: `ProofUploadBox.tsx`
- Hook: `useCandidateProfileContentActions.ts`

Endpoints:

```http
POST   /api/v1/candidate/profile/educations
POST   /api/v1/candidate/profile/{profileId}/educations
PATCH  /api/v1/candidate/profile/educations/{educationId}
PATCH  /api/v1/candidate/profile/{profileId}/educations/{educationId}
DELETE /api/v1/candidate/profile/educations/{educationId}
DELETE /api/v1/candidate/profile/{profileId}/educations/{educationId}
PUT    /api/v1/candidate/profile/{profileId}/educations/{educationId}/selection
```

Backend:

- Controller: `CandidateEducationController`
- Service: `CandidateProfileService`

Code xử lý controller mẫu:

```java
@PostMapping("/{profileId}/educations")
public ResponseEntity<SuccessResponse<CandidateProfileResponse.HocVanItem>> createEducationByProfile(...) {
    requireCandidate(principal);
    var data = candidateProfileService.createHocVan(principal.getUserId(), profileId, request);
    return ResponseEntity.ok(new SuccessResponse<>("Tạo học vấn thành công", data));
}
```

Business rule:

- Candidate chỉ thao tác dữ liệu thuộc user của mình.
- Học vấn có thể gắn vào hồ sơ cụ thể.
- Selection endpoint quyết định item đó có hiển thị trong hồ sơ đang chọn hay không.
- Minh chứng học vấn được upload lên Cloudinary trước, backend chỉ lưu URL.

### 4.5. Kinh Nghiệm Làm Việc

Frontend:

- Panel: `WorkExperiencePanel.tsx`
- Modal: `WorkExperienceModal.tsx`
- Hook: `useCandidateProfileContentActions.ts`

Endpoints:

```http
POST   /api/v1/candidate/profile/experiences
POST   /api/v1/candidate/profile/{profileId}/experiences
PATCH  /api/v1/candidate/profile/experiences/{experienceId}
PATCH  /api/v1/candidate/profile/{profileId}/experiences/{experienceId}
DELETE /api/v1/candidate/profile/experiences/{experienceId}
DELETE /api/v1/candidate/profile/{profileId}/experiences/{experienceId}
PUT    /api/v1/candidate/profile/{profileId}/experiences/{experienceId}/selection
```

Backend:

- Controller: `CandidateExperienceController`
- Service: `CandidateProfileService`
- Index riêng: `KinhNghiemEmbeddingIndexService`

Business rule:

- Kinh nghiệm gốc thuộc người dùng.
- Hồ sơ có thể chọn kinh nghiệm nào được gắn/hiển thị.
- Khi tạo hồ sơ mới và attach kinh nghiệm có sẵn, hệ thống gọi index kinh nghiệm để phục vụ explanation matching.
- Selection giúp tránh case hồ sơ C chỉ chọn kinh nghiệm A nhưng explanation lại lôi kinh nghiệm B.

### 4.6. Chứng Chỉ

Frontend:

- Panel: `CertificatePanel.tsx`
- Modal: `CertificateModal.tsx`
- Upload UI: `ProofUploadBox.tsx`
- Hook: `useCandidateProfileContentActions.ts`

Endpoints:

```http
POST   /api/v1/candidate/profile/certificates
POST   /api/v1/candidate/profile/{profileId}/certificates
PATCH  /api/v1/candidate/profile/certificates/{certificateId}
PATCH  /api/v1/candidate/profile/{profileId}/certificates/{certificateId}
DELETE /api/v1/candidate/profile/certificates/{certificateId}
DELETE /api/v1/candidate/profile/{profileId}/certificates/{certificateId}
PUT    /api/v1/candidate/profile/{profileId}/certificates/{certificateId}/selection
```

Backend:

- Controller: `CandidateCertificateController`
- Service: `CandidateProfileService`

Business rule:

- Chứng chỉ có `loaiChungChiId`.
- Minh chứng chứng chỉ bắt buộc ở UI theo QA hiện tại.
- Trạng thái minh chứng được admin duyệt qua admin candidate proofs.

### 4.7. Upload Minh Chứng / Avatar

Upload không đi qua backend binary. Pattern:

```text
Frontend
  -> authService.getCloudinarySignature(purpose)
    -> GET /api/v1/auth/cloudinary-signature?purpose=proof|avatar|logo
      -> AuthController.getCloudinarySignature
        -> CloudinaryStorageService.generateSignature

Frontend
  -> authService.uploadToCloudinary(file, signature)
    -> POST Cloudinary API
    -> secure_url

Frontend
  -> lưu secure_url qua API domain tương ứng
```

Các nơi dùng:

- Avatar: `useCandidateProfileMediaActions.ts`
- Minh chứng học vấn/chứng chỉ: `ProofUploadBox.tsx` + content action hook.
- Logo công ty: `useCompanyAdminSettingsActions.ts`
- Minh chứng công ty: `CompanyProofsSection.tsx`.

### 4.8. Sync Hồ Sơ Vào Qdrant

Endpoints:

```http
POST /api/v1/candidate/profile/sync-index
POST /api/v1/candidate/profile/{profileId}/sync-index
```

Backend:

- Controller: `CandidateProfileController`
- Service: `CandidateProfileService.syncProfileIndex`
- Index service: `CandidateProfileEmbeddingIndexService`

Business rule:

- Vector hồ sơ gom thông tin summary, skills, industries, education, certificates, experiences.
- Matching job phù hợp với tôi dùng vector hồ sơ để search collection job.

## 5. Candidate Applications

### 5.1. Kiểm Tra Trạng Thái Ứng Tuyển

Frontend:

- Hook: `app/jobs/[id]/hooks/useJobDetail.ts`
- Service: `services/candidate/candidate-application.service.ts`

Endpoint:

```http
GET /api/v1/candidate/applications/jobs/{jobId}/status
```

Backend:

- Controller: `CandidateJobApplicationController.getApplicationStatus`
- Service: `CandidateJobApplicationService`

### 5.2. Nộp Đơn

Frontend:

- Modal: `JobApplyModal.tsx`
- Hook: `useJobDetail.ts`
- Service: `candidateApplicationService.apply(jobId, payload)`

Endpoint:

```http
POST /api/v1/candidate/applications/jobs/{jobId}
```

Backend:

- Controller: `CandidateJobApplicationController.apply`
- Service: `CandidateJobApplicationService.apply`
- Application index: `ApplicationEmbeddingIndexService`

Business rule:

- Candidate phải chọn hồ sơ ứng viên (`hoSoUngVienId`) theo logic mới.
- Không cho nộp trùng vào cùng job.
- Nếu job yêu cầu CV, payload phải có CV URL.
- Sau khi tạo `DonUngTuyen`, hệ thống chỉ sync embedding đơn ứng tuyển nếu tin không bắt buộc CV.
- Với tin bắt buộc CV, backend giữ `cvUrl` cho HR tải xem thủ công, ghi trạng thái index `SKIPPED` và không đưa đơn vào Qdrant ranking.
- HR/Owner sẽ thấy đơn trong company-admin applications.

### 5.3. Danh Sách Đơn Của Candidate

Endpoint:

```http
GET /api/v1/candidate/applications
```

Backend:

- Controller: `CandidateJobApplicationController.listMyApplications`
- Service: `CandidateJobApplicationService.listMyApplications`

Ghi chú:

- Service frontend đã có sẵn.
- UI hiện tập trung ở job detail/favorite/messages, không phải màn applications riêng lớn.

### 5.4. Huỷ Đơn Ứng Tuyển (Withdraw)

Frontend:

- Service: `services/candidate/candidate-application.service.ts`
- Method: `candidateApplicationService.withdrawApplication(applicationId)`

Endpoint:

```http
DELETE /api/v1/candidate/applications/{applicationId}
```

Backend:

- Controller: `CandidateJobApplicationController.withdraw`
- Service: `CandidateJobApplicationService.withdraw`

Flow:

```text
Candidate bấm huỷ đơn
  -> candidateApplicationService.withdrawApplication(applicationId)
    -> DELETE /api/v1/candidate/applications/{applicationId}
      -> CandidateJobApplicationController.withdraw
        -> CandidateJobApplicationService.withdraw
          -> donUngTuyenRepository.findByIdAndNgayXoaIsNull
          -> kiểm tra ownership (isOwner)
          -> kiểm tra trạng thái WITHDRAWABLE_STATUSES
          -> application.setNgayXoa(now)
          -> donUngTuyenRepository.save
          -> ApplicationEmbeddingIndexService.removeFromIndex
```

Business rule:

- Chỉ candidate sở hữu đơn mới được huỷ (ownership check qua `hoSoUngVien.nguoiDung.id`).
- Chỉ được huỷ khi đơn ở trạng thái `PENDING` hoặc `REVIEWING`.
- Trạng thái `ACCEPTED`, `REJECTED`, ... không thể huỷ — trả `409 CONFLICT`.
- Huỷ = soft delete: set `ngayXoa`, đơn không còn hiển thị phía HR/Owner.
- Sau khi huỷ, hệ thống xóa vector đơn khỏi Qdrant collection `khoDonUngTuyen`.
- Response: `204 No Content`.

## 6. Favorite Jobs

Frontend:

- Page: `app/favorite-jobs/page.tsx`
- Hook: `useFavoriteJobs.ts`
- Service: `services/public/public-job.service.ts`

Endpoints:

```http
GET    /api/v1/candidate/favorite-jobs
GET    /api/v1/candidate/favorite-jobs/{jobId}/status
POST   /api/v1/candidate/favorite-jobs/{jobId}
DELETE /api/v1/candidate/favorite-jobs/{jobId}
```

Backend:

- Controller: `CandidateFavoriteJobController`
- Service: `CandidateFavoriteJobService`

Business rule:

- Candidate đăng nhập mới yêu thích được.
- Favorite là toggle theo user/job.
- Public job card/detail dùng status để render nút yêu thích.

## 7. Recommended Jobs For Candidate

Frontend:

- Home section: `RecommendedJobsSection.tsx`
- Hook: `useRecommendedJobs.ts`
- Service: `candidateProfileService.listRecommendedJobs(limit)`

Endpoint:

```http
GET /api/v1/candidate/profile/recommended-jobs?limit=6
```

Backend:

- Controller: `CandidateProfileController.getRecommendedJobs`
- Service: `SemanticMatchingService.findMatchingJobsForProfile`

Flow:

```text
Candidate logged in
  -> latest profile id
  -> CandidateProfileEmbeddingIndexService.getOrCreateIndexVectorForMatching(profile)
  -> Qdrant search collection khoTinTuyenDung
  -> filter public approved active jobs
  -> map JobSemanticMatchResponse
```

Business rule:

- Nếu chưa đăng nhập: frontend không render section.
- Nếu chưa có hồ sơ: backend trả `[]`, frontend không render section.
- Matching không chỉ dựa keyword; nó dùng vector hồ sơ search Qdrant job collection.

## 8. Chat / Realtime Messages

### 8.1. Candidate Chat

Frontend:

- Candidate inbox: `app/messages`
- Hook: `useCandidateInbox.ts`
- Job detail modal: `JobChatModal.tsx`
- WebSocket helper: `lib/chat-websocket.ts`
- Service: `services/chat/chat.service.ts`

Endpoints:

```http
POST /api/v1/chats/jobs/{jobId}/open
GET  /api/v1/chats/conversations
GET  /api/v1/chats/conversations/{conversationId}/messages
POST /api/v1/chats/conversations/{conversationId}/messages
```

Backend:

- Controller: `ChatController`
- Service: `ChatService`
- Mapper: `ChatResponseMapper`
- WebSocket:
  - `ChatWebSocketHandshakeInterceptor`
  - `ChatWebSocketHandler`
  - `ChatWebSocketSessionRegistry`
  - `ChatRealtimePublisher`

### 8.2. Recruiter Chat

Frontend:

- Company inbox: `app/company-admin/messages`
- Hook: `useRecruiterInbox.ts`
- Open from applications: `useCompanyAdminApplicationsActions.ts`
- Open from matching: `ApplicationCandidateMatchesTable.tsx`

Endpoints:

```http
POST /api/v1/chats/applications/{applicationId}/open
POST /api/v1/chats/jobs/{jobId}/candidate-profiles/{profileId}/open
```

Business rule:

- Chat theo job/application/profile giúp HR trao đổi với ứng viên.
- Khi gửi message, backend lưu DB rồi publish realtime event tới user còn lại.
- Frontend vừa optimistic update vừa reload conversation khi cần.

## 9. Notifications

Frontend:

- Hook: `app/components/home/hooks/useHomeHeaderData.ts`
- Service: `services/common/notification.service.ts`

Endpoints:

```http
GET    /api/v1/notifications?trang=&kichThuoc=
GET    /api/v1/notifications/unread-count
PATCH  /api/v1/notifications/{notificationId}/read
PATCH  /api/v1/notifications/read-all
DELETE /api/v1/notifications/{notificationId}
```

Backend:

- Controller: `NotificationController`
- Service: `NotificationService`
- Repository: `ThongBaoRepository`

Code xử lý list:

```java
Pageable pageable = PageRequest.of(safePage, safeSize);
Page<ThongBao> notificationPage =
    thongBaoRepository.findByNguoiDung_IdAndNgayXoaIsNullOrderByNgayTaoDesc(userId, pageable);
```

Các nơi tạo notification:

- Candidate nộp đơn.
- Admin duyệt/từ chối công ty.
- Admin duyệt/từ chối job.
- Company admin đổi trạng thái đơn ứng tuyển.
- Thanh toán/gói được kích hoạt.

## 10. Company Admin

### 10.1. Company Admin Shell

Frontend:

- Shell: `app/company-admin/components/CompanyAdminShell.tsx`
- Sidebar: `CompanyAdminSidebar.tsx`
- Hook: `useCompanyAdminShellData.ts`
- Nav config: `company-admin-nav.ts`

Service:

- `services/company-admin/company-admin.service.ts`

Backend:

- Controller: `CompanySubAdminController`
- Service facade: `CompanyAdminService`
- Access service: `CompanyAdminAccessService`

Business rule:

- Shell gọi `/company-admin/me` để lấy công ty, role cao nhất, chi nhánh.
- Nếu công ty chưa approved thì nhiều route bị disable.
- Nếu không phải OWNER thì ẩn route owner-only như settings/hr/packages theo rule UI hiện tại.
- Sidebar mục `Ứng viên` có badge đỏ khi có đơn ứng tuyển trong chi nhánh user được xem.

### 10.2. Company Dashboard

Frontend:

- Page: `app/company-admin/page.tsx`
- Client: `CompanyAdminHomeClient.tsx`
- Hook: `useCompanyAdminHomeData.ts`
- Charts: `components/charts/SimpleChartCard.tsx`

Data:

- `/company-admin/me`
- `/company-admin/branches`
- `/company-admin/jobs?chiNhanhId=...`
- `/company-admin/applications?chiNhanhId=...`

Business rule:

- Dashboard tổng hợp jobs/applications theo chi nhánh.
- Có filter theo chi nhánh và khoảng thời gian.
- Không thêm backend mới; dữ liệu aggregate từ API hiện có.

### 10.3. Company Profile / Settings / Proofs

Frontend:

- Page: `app/company-admin/settings/page.tsx`
- Client: `CompanyAdminSettingsClient.tsx`
- Hooks:
  - `useCompanyAdminSettingsData.ts`
  - `useCompanyAdminSettingsActions.ts`
- Components:
  - `CompanyProofsSection.tsx`
  - `CompanyLogoSection`

Endpoints:

```http
GET   /api/v1/company-admin/me
GET   /api/v1/company-admin/company/proof-types
PATCH /api/v1/company-admin/company/logo
PATCH /api/v1/company-admin/company/info
PATCH /api/v1/company-admin/company/resubmit
POST  /api/v1/company-admin/company/proofs
POST  /api/v1/company-admin/company/proofs/batch
```

Backend:

- Controller: `CompanySubAdminController`
- Facade: `CompanyAdminService`
- Services:
  - `CompanyAdminProfileService`
  - `CompanyAdminProofService`

Business rule:

- Công ty chưa duyệt chỉ có thể cập nhật logo/minh chứng/resubmit theo rule service.
- Upload proof là Cloudinary trước, backend lưu URL và trạng thái proof.
- Resubmit chuyển công ty bị reject về trạng thái chờ duyệt.

### 10.4. Branches

Frontend:

- Page: `app/company-admin/branches/page.tsx`
- Client: `CompanyAdminBranchesClient.tsx`
- Hook: `useCompanyAdminBranchesData.ts`

Endpoint:

```http
GET /api/v1/company-admin/branches
```

Backend:

- Controller: `CompanySubAdminController.getBranches`
- Service: `CompanyAdminProfileService.getBranches`

Business rule:

- OWNER xem được toàn bộ chi nhánh công ty.
- HR xem các chi nhánh được gán membership.

### 10.5. Company Jobs

Frontend:

- Page: `app/company-admin/jobs/page.tsx`
- Client: `CompanyAdminJobsClient.tsx`
- Hooks:
  - `useCompanyAdminJobsData.ts`
  - `useCompanyAdminJobActions.ts`
- Components:
  - `JobFormModal.tsx`
  - `JobsTable.tsx`
  - `JobPreviewModal.tsx`

Endpoints:

```http
GET    /api/v1/company-admin/jobs?chiNhanhId=
GET    /api/v1/company-admin/jobs/metadata
POST   /api/v1/company-admin/jobs
PATCH  /api/v1/company-admin/jobs/{jobId}
DELETE /api/v1/company-admin/jobs/{jobId}
```

Backend:

- Controller: `CompanySubAdminController`
- Facade: `CompanyAdminService`
- Service: `CompanyAdminJobService`

Code xử lý tạo job:

```java
CongTy congTy = profileService.resolveApprovedManagedCompany(principal.getUserId().intValue());
ensureActivePostingPackage(congTy);
ThanhVienCongTy membership = accessService.requireMembership(...);

TinTuyenDung tinTuyenDung = new TinTuyenDung();
tinTuyenDung.setNguoiDang(membership.getNguoiDung());
tinTuyenDung.setChiNhanh(membership.getChiNhanh());
applyJobPayload(tinTuyenDung, request);
tinTuyenDung.setTrangThai("DRAFT");
tinTuyenDung = tinTuyenDungRepository.save(tinTuyenDung);

replaceJobSkills(tinTuyenDung, request.getKyNangIds());
syncJobIndexes(tinTuyenDung);
```

Business rule:

- Công ty phải approved.
- User phải có quyền ở chi nhánh.
- Công ty phải có gói đăng bài active.
- Skill mapping được lưu rồi mới sync index để search/matching có dữ liệu mới.
- Khi update/delete job, service sync lại Elasticsearch/Qdrant.

### 10.6. Company Applications

Frontend:

- Page: `app/company-admin/applications/page.tsx`
- Client: `CompanyAdminApplicationsClient.tsx`
- Hooks:
  - `useCompanyAdminApplicationsData.ts`
  - `useCompanyAdminApplicationsActions.ts`
  - `useApplicationsMatchingPreview.ts`
- Components:
  - `ApplicationFilters.tsx`
  - `ApplicationsTable.tsx`
  - `ApplicationDetailModal.tsx`
  - `ApplicationDetailSummary.tsx`
  - `ApplicationProfileSections.tsx`
  - `ApplicationStatusBadge.tsx`
  - `InterviewEmailModal.tsx`
  - `ApplicationsMatchingSection.tsx`
  - `matching/SubmittedApplicationsPanel.tsx`
  - `matching/CandidateMatchingPanel.tsx`
  - `matching/ApplicationMatchInsightPanel.tsx`

Ghi chú UI hiện tại:

- `ApplicationsMatchingSection` giữ layout tab `Danh sách đơn` và `AI theo tin`.
- `SubmittedApplicationsPanel` chỉ phụ trách danh sách đơn đã nộp.
- `CandidateMatchingPanel` chỉ phụ trách tìm ứng viên phù hợp theo tin.
- `ApplicationsTable` tách cell `CV` và cell `AI Matching` để dễ đọc code.
- Cột `AI Matching` trong danh sách đơn chỉ hiển thị phần trăm.
- Cột `CV` chỉ hiển thị khi job đang chọn có `batBuocCV=true`; job không yêu cầu CV thì ẩn cột này để bảng gọn hơn.
- `ApplicationDetailModal` chỉ giữ vai trò modal khung; phần tóm tắt/action nằm ở `ApplicationDetailSummary`, phần hồ sơ nằm ở `ApplicationProfileSections`.
- `InterviewEmailModal` chỉ mở khi HR/Owner bấm gửi thư mời trên đơn đã `ACCEPTED`, có confirm trước khi gọi API.
- `ApplicationStatusBadge` render trạng thái chính và `InterviewInviteBadge`; badge `Đã gửi mail` dựa vào `thoiGianGuiThuMoi`.
- `ApplicationMatchInsightPanel` là modal lý do gợi ý. Với job bắt buộc CV, không mở modal lý do match vì hệ thống không đọc PDF/CV để giải thích.

Endpoints:

```http
GET   /api/v1/company-admin/applications?chiNhanhId=
GET   /api/v1/company-admin/applications/{applicationId}
PATCH /api/v1/company-admin/applications/{applicationId}/status
POST  /api/v1/company-admin/applications/{applicationId}/interview-email
GET   /api/v1/company-admin/jobs/{jobId}/candidate-profiles/{profileId}
```

Backend:

- Controller: `CompanySubAdminController`
- Facade: `CompanyAdminService`
- Service: `CompanyAdminApplicationService`
- Mapper: `CompanyAdminApplicationMapper`

Business rule:

- Danh sách applications lấy theo chi nhánh.
- Dropdown job trong filter lấy jobs của chi nhánh, kể cả job chưa có ai apply để HR có thể chạy semantic search.
- Detail trả hồ sơ ứng viên đầy đủ: profile, skills, education, certificates, experiences.
- Update status gửi notification cho candidate.
- Gửi thư mời phỏng vấn chỉ cho đơn `ACCEPTED`; gửi thành công thì lưu `DonUngTuyen.thoiGianGuiThuMoi` để UI hiện badge phụ.

### 10.7. AI Matching Cho HR/Owner

Frontend:

- Component: `ApplicationsMatchingSection.tsx`
- Hook: `useApplicationsMatchingPreview.ts`
- Insight panel: `ApplicationMatchInsightPanel.tsx`

Endpoints:

```http
GET /api/v1/company-admin/jobs/{jobId}/candidate-matches
GET /api/v1/company-admin/jobs/{jobId}/application-matches
GET /api/v1/company-admin/jobs/{jobId}/candidate-profiles/{profileId}
```

Backend:

- Controller: `CompanySubAdminController`
- Service: `SemanticMatchingService`
- Explanation:
  - `SemanticCandidateExplanationService`
  - `SemanticMatchSignalService`
  - `SemanticMatchScoringService`
  - `KinhNghiemEmbeddingIndexService`

Flow candidate matches toàn hệ thống:

```text
jobId
  -> JobEmbeddingIndexService.getOrCreateIndexVectorForMatching(job)
  -> Qdrant search khoHoSoUngVien
  -> load HoSoUngVien theo payload hoSoUngVienId
  -> map CandidateSemanticMatchResponse
```

Flow application matches theo đơn đã nộp:

```text
jobId
  -> DonUngTuyenRepository.findByTinTuyenDung
  -> ApplicationEmbeddingIndexService.ensureIndexedForMatching(each application)
  -> JobEmbeddingIndexService.getOrCreateIndexVectorForMatching(job)
  -> Qdrant search khoDonUngTuyen filter tinTuyenDungId
  -> mapSubmittedApplicationMatch
  -> explanation
```

Business rule:

- Candidate matches: tìm hồ sơ phù hợp trong toàn hệ thống.
- Application matches: chỉ xếp hạng các đơn đã nộp vào job đang chọn.
- Explanation chỉ dùng kinh nghiệm được gắn vào hồ sơ đang xét, tránh lẫn kinh nghiệm khác của cùng user.
- Nếu collection Qdrant chưa có index, các service `getOrCreateIndexVectorForMatching` hoặc `ensureIndexedForMatching` sẽ tạo khi cần.

### 10.8. HR Management

Frontend:

- Page: `app/company-admin/hr/page.tsx`
- Client: `CompanyAdminHrClient.tsx`
- Hooks:
  - `useCompanyAdminHrData.ts`
  - `useCompanyAdminHrActions.ts`
- Components:
  - `HrCreateForm.tsx`
  - `HrListTable.tsx`

Endpoints:

```http
GET    /api/v1/company-admin/hrs
POST   /api/v1/company-admin/hrs
PATCH  /api/v1/company-admin/hrs/{hrUserId}
DELETE /api/v1/company-admin/hrs/{hrUserId}
```

Backend:

- Controller: `CompanySubAdminController`
- Service: company HR management service behind `CompanyAdminService`

Business rule:

- OWNER mới quản lý HR.
- HR có thể được gán nhiều chi nhánh.
- UI dùng checkboxes để chọn chi nhánh.
- Delete thường là vô hiệu hóa/xóa mềm membership theo service, không xóa dữ liệu lịch sử.

### 10.9. Packages & SePay

Frontend:

- Page: `app/company-admin/packages/page.tsx`
- Client: `CompanyAdminPackagesClient.tsx`
- Hooks:
  - `useCompanyAdminPackagesData.ts`
  - `useCompanyAdminPackagesActions.ts`
- Components:
  - `PackageCardsSection.tsx`
  - `CurrentPlanSection.tsx`
  - `SepayPaymentSection.tsx`

Endpoints:

```http
GET  /api/v1/company-admin/packages
POST /api/v1/company-admin/packages
POST /api/v1/payments/sepay/webhook
```

Backend:

- Company package service: `CompanyAdminPackageService`
- SePay checkout: `SepayPaymentService`
- Webhook controller: `SepayWebhookController`
- Webhook service: `SepayWebhookService`

Code xử lý đăng ký gói:

```java
DangKyGoiCongTy registration = new DangKyGoiCongTy();
registration.setCongTy(congTy);
registration.setDanhMucGoi(danhMucGoi);
registration.setTrangThai("PENDING");
registration.setTrangThaiThanhToan("UNPAID");
registration.setGiaTaiThoiDiemDangKy(danhMucGoi.getGiaNiemYet());
registration = dangKyGoiCongTyRepository.save(registration);

String paymentCode = sepayPaymentService.buildPaymentCodeForRegistration(registration.getId());
String transferContent = sepayPaymentService.buildTransferContent(paymentCode);
String qrImageUrl = sepayPaymentService.buildQrImageUrl(amount, paymentCode);
```

Webhook flow:

```text
SePay
  -> POST /api/v1/payments/sepay/webhook
    -> SepayWebhookController.handleWebhook
      -> verifyWebhookSecret
      -> SepayWebhookService.handleWebhook
        -> extractRegistrationId
        -> verify amount
        -> mark registration ACTIVE/PAID
        -> update package validity
```

Business rule:

- Company phải approved mới xem/đăng ký gói.
- Registration mới là `PENDING` + `UNPAID`.
- Webhook phải có secret hợp lệ.
- Webhook xử lý idempotent để tránh thanh toán bị ghi nhận nhiều lần.

## 11. Super Admin

### 11.1. Admin Shell

Frontend:

- Shell: `app/admin/components/AdminShell.tsx`
- Sidebar: `AdminSidebar.tsx`
- Nav config: `admin-nav.ts`
- Service: `services/admin/admin.service.ts`

Business rule:

- Shell validate token định kỳ bằng `adminService.validateSession()`.
- Nếu backend trả 401/403 hoặc JWT hết hạn thì clear session và redirect login.

### 11.2. Dashboard

Frontend:

- Page: `app/admin/page.tsx`
- Client: `AdminDashboardClient.tsx`
- Hook: `useAdminDashboardData.ts`
- Chart helper: `components/charts/chartTimeSeries.ts`

Endpoint:

```http
GET /api/v1/admin/stats
```

Backend:

- Controller: `AdminStatsController.stats`
- Facade: `AdminService.getStats`
- Service: `AdminStatsService.getStats`

Code:

```java
return AdminDashboardStatsResponse.builder()
        .tongNguoiDung(usersRepository.countByNgayXoaIsNull())
        .nguoiDungHoatDong(usersRepository.countByNgayXoaIsNullAndDangHoatDongTrue())
        .tongCongTy(companyRepository.countByNgayXoaIsNull())
        .congTyChoDuyet(companyRepository.countByNgayXoaIsNullAndTrangThai("PENDING"))
        .congTyDaDuyet(companyRepository.countByNgayXoaIsNullAndTrangThai("APPROVED"))
        .congTyBiTuChoi(companyRepository.countByNgayXoaIsNullAndTrangThai("REJECTED"))
        .build();
```

### 11.3. Users

Frontend:

- Page: `app/admin/users/page.tsx`
- Client: `UsersAdminClient.tsx`
- Hooks:
  - `useAdminUsersData.ts`
  - `useAdminUsersActions.ts`
- Service: `services/admin/users.service.ts`

Endpoints:

```http
GET    /api/v1/admin/users?keyword=&role=&status=
PATCH  /api/v1/admin/users/{userId}/status
DELETE /api/v1/admin/users/{userId}
```

Backend:

- Controller: `AdminUserController`
- Facade: `AdminService`
- Service: `AdminUserService`

Business rule:

- List hỗ trợ filter keyword, role, status.
- Delete là soft delete: set `ngayXoa`, set `dangHoatDong=false`.
- Status update chỉ đổi trạng thái hoạt động.

### 11.4. Companies Approval

Frontend:

- Page: `app/admin/companies/page.tsx`
- Client: `CompaniesAdminClient.tsx`
- Hooks:
  - `useAdminCompaniesData.ts`
  - `useAdminCompaniesActions.ts`
- Service: `services/admin/companies.service.ts`

Endpoints:

```http
GET   /api/v1/admin/companies?status=
GET   /api/v1/admin/companies/{companyId}
PATCH /api/v1/admin/companies/{companyId}/approve
PATCH /api/v1/admin/companies/{companyId}/reject
```

Backend:

- Controller: `AdminCompanyController`
- Facade: `AdminService`
- Service: `AdminCompanyService`

Business rule:

- Detail gồm công ty, owner, chi nhánh, minh chứng.
- Approve chuyển trạng thái công ty sang approved.
- Reject lưu lý do từ chối vào công ty.
- Owner nhận notification.

### 11.5. Jobs Approval

Frontend:

- Page: `app/admin/jobs/page.tsx`
- Client: `JobsAdminClient.tsx`
- Hooks:
  - `useAdminJobsData.ts`
  - `useAdminJobsActions.ts`
- Service: `services/admin/jobs.service.ts`

Endpoints:

```http
GET   /api/v1/admin/jobs?keyword=&company=&status=&industry=&location=
GET   /api/v1/admin/jobs/{jobId}
PATCH /api/v1/admin/jobs/{jobId}/approve
PATCH /api/v1/admin/jobs/{jobId}/reject
PATCH /api/v1/admin/jobs/{jobId}/hide
```

Backend:

- Controller: `AdminJobController`
- Facade: `AdminService`
- Service: `AdminJobService`
- Index services:
  - `PublicJobElasticsearchIndexService`
  - `JobEmbeddingIndexService`

Business rule:

- Approve job làm job public/searchable.
- Reject lưu lý do từ chối.
- Hide ẩn job khỏi public.
- Sau approve/reject/hide, service sync/delete index tương ứng.

### 11.6. Packages Admin

Frontend:

- Page: `app/admin/plans/page.tsx`
- Client: `PlansAdminClient.tsx`
- Hooks:
  - `useAdminPlansData.ts`
  - `useAdminPlansActions.ts`
- Service: `services/admin/packages.service.ts`

Endpoints:

```http
GET    /api/v1/admin/packages
GET    /api/v1/admin/packages/subscriptions
POST   /api/v1/admin/packages
PATCH  /api/v1/admin/packages/{packageId}
DELETE /api/v1/admin/packages/{packageId}
```

Backend:

- Controller: `AdminPackageController`
- Facade: `AdminService`
- Service: `AdminPackageService`

Business rule:

- Admin tạo/sửa/xóa danh mục gói.
- Company admin chỉ đăng ký những gói admin tạo.
- Subscriptions dùng để admin theo dõi các đăng ký gói của công ty.

### 11.7. Candidate Proof Review

Frontend:

- Page: `app/admin/candidate-proofs/page.tsx`
- Client: `CandidateProofsAdminClient.tsx`
- Hooks:
  - `useAdminCandidateProofsData.ts`
  - `useAdminCandidateProofsActions.ts`
- Service: `services/admin/candidate-proofs.service.ts`

Endpoints:

```http
GET   /api/v1/admin/candidate-proofs?status=
PATCH /api/v1/admin/candidate-proofs/{type}/{proofId}/approve
PATCH /api/v1/admin/candidate-proofs/{type}/{proofId}/reject
```

Backend:

- Controller: `AdminCandidateProofController`
- Facade: `AdminService`
- Service: `AdminCandidateProofService`

Business rule:

- `type` phân biệt học vấn/chứng chỉ.
- Approve/Reject cập nhật trạng thái minh chứng.
- Hiện schema không lưu lý do reject riêng cho học vấn/chứng chỉ.

### 11.8. Catalogs

Frontend:

- Page: `app/admin/catalogs/page.tsx`
- Client: `CatalogsAdminClient.tsx`
- Hooks:
  - `useAdminCatalogsData.ts`
  - `useAdminCatalogsActions.ts`
- Service: `services/admin/catalogs.service.ts`

Endpoints:

```http
GET/POST/PATCH/DELETE /api/v1/admin/system-roles
GET/POST/PATCH/DELETE /api/v1/admin/company-roles
GET/POST/PATCH/DELETE /api/v1/admin/proof-types
GET/POST/PATCH/DELETE /api/v1/admin/certificate-types
```

Backend:

- Controller: `AdminCatalogController`
- Facade: `AdminService`
- Service: `AdminCatalogService`

Business rule:

- Catalog CRUD dùng chung DTO `AdminCatalogItemResponse`.
- Không đổi schema; chỉ thao tác dữ liệu danh mục.

### 11.9. Admin Search/Index Operations

Endpoints:

```http
GET  /api/v1/admin/elasticsearch/health
POST /api/v1/admin/elasticsearch/reindex/jobs
POST /api/v1/admin/qdrant/reindex/jobs-profiles
POST /api/v1/admin/qdrant/reindex/experiences
```

Backend:

- Controller: `AdminSearchIndexController`
- Facade: `AdminService`
- Service: `AdminSearchIndexService`

Business rule:

- Elasticsearch health kiểm tra kết nối và index job.
- Reindex jobs rebuild full-text search public jobs.
- Reindex jobs-profiles rebuild Qdrant job/profile vectors.
- Reindex experiences rebuild Qdrant collection kinh nghiệm làm việc.

## 12. Search & AI Infrastructure

### 12.1. Elasticsearch

Backend files:

- `PublicJobElasticsearchIndexService`
- `PublicJobElasticsearchSearchService`
- `ElasticsearchClientService`
- `ElasticsearchProperties`

Dùng cho:

- Public job search.
- Admin reindex jobs.
- Sync khi admin approve/reject/hide job hoặc company admin create/update/delete job.

Flow:

```text
Job changed
  -> syncJobIndexes
    -> PublicJobElasticsearchIndexService.syncOrDelete
    -> JobEmbeddingIndexService.syncOrDelete
```

### 12.2. Qdrant Collections

Các collection chính:

- `khoTinTuyenDung`: vector tin tuyển dụng.
- `khoHoSoUngVien`: vector hồ sơ ứng viên.
- `khoDonUngTuyen`: vector đơn ứng tuyển.
- `khoKinhNghiem`: vector kinh nghiệm làm việc.

Service liên quan:

- `JobEmbeddingIndexService`
- `CandidateProfileEmbeddingIndexService`
- `ApplicationEmbeddingIndexService`
- `KinhNghiemEmbeddingIndexService`
- `SemanticMatchingService`

Business rule:

- Job/profile/application/experience có thể upsert vector, không tạo duplicate nếu point id cùng logic.
- Một số flow dùng lazy indexing khi matching chạy.
- Experience collection dùng cho explanation chi tiết, không thay thế profile vector tổng hợp.

### 12.3. Explanation Matching

Backend files:

- `SemanticCandidateExplanationService`
- `SemanticMatchSignalService`
- `SemanticMatchScoringService`
- `KinhNghiemEmbeddingIndexService`

Output explanation gồm:

- `lyDoPhuHop`
- `tinHieuKhop`
- `diemManh`
- `kinhNghiemLienQuan`
- `canKiemTraThem`
- `goiYHanhDong`

Điểm quan trọng:

- Semantic score đến từ Qdrant.
- Skill/industry/status signal đến từ DB và signal service.
- Kinh nghiệm liên quan được lọc theo kinh nghiệm nằm trong hồ sơ hiện tại.

## 13. Location

Frontend:

- `app/hooks/useProvinces.ts`
- `app/profile/hooks/useProfileLocationForm.ts`
- `app/auth/register/owner/hooks/useOwnerRegister.ts`
- Service: `services/common/location.service.ts`

Endpoints:

```http
GET /api/v1/locations/tinh-thanh
GET /api/v1/locations/xa-phuong?tinhThanhId=
```

Backend:

- Controller: `LocationController`
- Repository/service location domain.

Dùng cho:

- Candidate personal profile.
- Owner registration branch address.

## 14. Code Trace Cheat Sheet

Khi cần tìm một chức năng trong source, dùng các điểm vào sau:

| Chức năng | Frontend | Frontend service | Backend controller | Backend service |
| --- | --- | --- | --- | --- |
| Login | `app/auth/login` | `services/auth/auth.service.ts` | `AuthController` | `AuthService` |
| Register owner | `app/auth/register/owner` | `services/auth/auth.service.ts` | `AuthController` | `OwnerRegistrationService` |
| Profile candidate | `app/profile` | `services/candidate/candidate-profile.service.ts` | `CandidateProfileController` + split controllers | `CandidateProfileService` |
| Apply job | `app/jobs/[id]` | `services/candidate/candidate-application.service.ts` | `CandidateJobApplicationController` | `CandidateJobApplicationService` |
| Withdraw application | `app/jobs/[id]` hoặc ứng dụng của tôi | `services/candidate/candidate-application.service.ts` | `CandidateJobApplicationController` | `CandidateJobApplicationService.withdraw` |
| Favorite jobs | `app/favorite-jobs` | `services/public/public-job.service.ts` | `CandidateFavoriteJobController` | `CandidateFavoriteJobService` |
| Public search | `app/jobs` | `services/public/public-job.service.ts` | `PublicJobController` | `PublicJobService` |
| Chat | `app/messages`, `app/company-admin/messages` | `services/chat/chat.service.ts` | `ChatController` | `ChatService` |
| Company dashboard | `app/company-admin` | `services/company-admin/*` | `CompanySubAdminController` | `CompanyAdminService` |
| Company jobs | `app/company-admin/jobs` | `services/company-admin/jobs.service.ts` | `CompanySubAdminController` | `CompanyAdminJobService` |
| Company applications | `app/company-admin/applications` | `services/company-admin/applications.service.ts` | `CompanySubAdminController` | `CompanyAdminApplicationService` |
| AI matching | `ApplicationsMatchingSection.tsx` | `services/company-admin/jobs.service.ts` | `CompanySubAdminController` | `SemanticMatchingService` |
| Company packages | `app/company-admin/packages` | `services/company-admin/packages.service.ts` | `CompanySubAdminController` | `CompanyAdminPackageService` |
| Admin users | `app/admin/users` | `services/admin/users.service.ts` | `AdminUserController` | `AdminUserService` |
| Admin companies | `app/admin/companies` | `services/admin/companies.service.ts` | `AdminCompanyController` | `AdminCompanyService` |
| Admin jobs | `app/admin/jobs` | `services/admin/jobs.service.ts` | `AdminJobController` | `AdminJobService` |
| Admin proofs | `app/admin/candidate-proofs` | `services/admin/candidate-proofs.service.ts` | `AdminCandidateProofController` | `AdminCandidateProofService` |
| Admin catalogs | `app/admin/catalogs` | `services/admin/catalogs.service.ts` | `AdminCatalogController` | `AdminCatalogService` |
| Admin index ops | admin API only | `services/admin/admin.service.ts` | `AdminSearchIndexController` | `AdminSearchIndexService` |

## 15. Status Cheat Sheet

Các trạng thái quan trọng hay gặp khi QA:

| Domain | Field | Giá trị thường gặp | Ý nghĩa |
| --- | --- | --- | --- |
| Công ty | `CongTy.trangThai` | `PENDING`, `APPROVED`, `REJECTED` | Admin duyệt công ty |
| Minh chứng công ty | `TepMinhChungCongTy.trangThai` | `PENDING`, `APPROVED`, `REJECTED` | Admin xét minh chứng công ty |
| Tin tuyển dụng | `TinTuyenDung.trangThai` | `DRAFT`, `APPROVED`, `REJECTED`, hidden/deleted | Company tạo, admin duyệt |
| Đơn ứng tuyển | `DonUngTuyen.trangThai` | Theo pipeline application | HR cập nhật trạng thái |
| Học vấn/chứng chỉ | `trangThai` | `UNVERIFIED`, `PENDING`, `APPROVED`, `REJECTED` | Admin duyệt minh chứng ứng viên |
| Gói công ty | `DangKyGoiCongTy.trangThai` | `PENDING`, `ACTIVE` | Thanh toán/gói active |
| Thanh toán gói | `trangThaiThanhToan` | `UNPAID`, `PAID` | SePay webhook cập nhật |

## 16. Những Flow Dễ Nhầm Khi Báo Cáo

### 16.1. Owner không phải role hệ thống riêng

Trong `OwnerRegistrationService`, owner vẫn được tạo với role hệ thống `CANDIDATE`.
Quyền owner nằm ở bảng membership công ty:

```text
NguoiDung
  -> ThanhVienCongTy
    -> VaiTroCongTy = OWNER
    -> ChiNhanhCongTy
      -> CongTy
```

### 16.2. Reindex profile không tạo collection kinh nghiệm riêng

`POST /admin/qdrant/reindex/jobs-profiles`:

- Reindex job.
- Reindex profile.
- Kinh nghiệm được gom vào vector profile.
- Không tự tạo point riêng cho collection kinh nghiệm.

Muốn reindex riêng kinh nghiệm:

```http
POST /api/v1/admin/qdrant/reindex/experiences
```

### 16.3. Explanation dùng kinh nghiệm được gắn vào hồ sơ

Nếu user có kinh nghiệm A và B nhưng hồ sơ C chỉ chọn A:

- Explanation của hồ sơ C chỉ dùng A.
- B không đi vào explanation nếu không nằm trong profile item selection.

### 16.4. Job filter ở applications lấy theo chi nhánh

Trong company-admin applications:

- Dropdown chi nhánh quyết định scope.
- Dropdown job lấy danh sách job của chi nhánh, kể cả job chưa có application.
- Mục đích: HR có thể chọn job để semantic search ứng viên phù hợp.

### 16.5. Upload file là signed direct upload

Backend không nhận file binary cho đa số flow upload.

```text
Backend cấp signature
Frontend upload Cloudinary
Frontend lưu secure_url về backend
```

## 17. Kiểm Tra Build / Compile

Sau khi sửa flow/code liên quan:

Backend:

```bash
cd /Users/loc/Desktop/DoAnTotNghiep/recruit
./mvnw -q -DskipTests compile
```

Frontend:

```bash
cd /Users/loc/Desktop/DoAnTotNghiep/recruit_frontend
npm run lint
npm run build
```

Ghi chú: `npm run build` có thể cần network để Next tải Google Fonts.

## 18. API Catalog Chi Tiết Theo Module

Mục này dùng để báo cáo nhanh: một chức năng đi qua endpoint nào, controller nào và service nào.

### 18.1. Auth API

| Method | Endpoint | Frontend service | Controller method | Service method | Ghi chú nghiệp vụ |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/v1/auth/cloudinary-signature` | `authService.getCloudinarySignature` | `AuthController.getCloudinarySignature` | `CloudinaryStorageService.generateSignature` | Cấp chữ ký upload Cloudinary theo `purpose`. |
| `POST` | `/api/v1/auth/register` | `authService.registerCandidate` | `AuthController.registerCandidate` | `AuthService.registerCandidate` | Tạo user candidate, mã hóa mật khẩu, trả token. |
| `POST` | `/api/v1/auth/register-owner` | `authService.registerOwner` | `AuthController.registerOwner` | `OwnerRegistrationService.registerOwner` | Tạo user owner, công ty, chi nhánh, minh chứng công ty. |
| `GET` | `/api/v1/auth/proof-types` | `authService.getOwnerProofTypes` | `AuthController.getOwnerProofTypes` | `OwnerRegistrationService.listOwnerProofTypes` | Danh mục loại tài liệu công ty. |
| `POST` | `/api/v1/auth/login` | `authService.login` | `AuthController.login` | `AuthService.login` | Xác thực email/password, sinh JWT. |
| `GET` | `/api/v1/auth/me` | `authService.getMe` | `AuthController.getMe` | `AuthUserProfileService.getCurrentUserProfile` | Hydrate user hiện tại. |
| `PATCH` | `/api/v1/auth/me/avatar` | `authService.updateAvatar` | `AuthController.updateAvatar` | `AuthUserProfileService.updateAvatar` | Lưu URL avatar sau khi upload. |
| `PATCH` | `/api/v1/auth/me` | `authService.updateMe` | `AuthController.updateMe` | `AuthUserProfileService.updateCurrentUserProfile` | Cập nhật thông tin cá nhân mở rộng. |

### 18.2. Candidate Profile API

| Method | Endpoint | Controller | Service | UI chính |
| --- | --- | --- | --- | --- |
| `GET` | `/candidate/profile` | `CandidateProfileController.getProfile` | `CandidateProfileService.getProfile` | `/profile` |
| `GET` | `/candidate/profile/all` | `CandidateProfileController.listProfiles` | `CandidateProfileService.listProfiles` | Profile selector |
| `POST` | `/candidate/profile/all` | `CandidateProfileController.createProfile` | `CandidateProfileService.createProfile` | Tạo hồ sơ mới |
| `GET` | `/candidate/profile/{profileId}` | `CandidateProfileController.getProfileById` | `CandidateProfileService.getProfileById` | Chọn hồ sơ |
| `GET` | `/candidate/profile/metadata` | `CandidateProfileController.getMetadata` | `CandidateProfileService.getMetadata` | Skill/industry/certificate select |
| `PATCH` | `/candidate/profile/summary` | `CandidateProfileController.updateSummary` | `CandidateProfileService.updateSummary` | Summary panel |
| `PATCH` | `/candidate/profile/{profileId}/summary` | `CandidateProfileController.updateSummaryByProfile` | `CandidateProfileService.updateSummary` | Multi-profile summary |
| `PUT` | `/candidate/profile/skills` | `CandidateProfileController.updateSkills` | `CandidateProfileService.updateSkills` | Skills panel |
| `PUT` | `/candidate/profile/{profileId}/skills` | `CandidateProfileController.updateSkillsByProfile` | `CandidateProfileService.updateSkills` | Skills theo hồ sơ |
| `PUT` | `/candidate/profile/industries` | `CandidateProfileController.updateIndustries` | `CandidateProfileService.updateIndustries` | Industries panel |
| `PUT` | `/candidate/profile/{profileId}/industries` | `CandidateProfileController.updateIndustriesByProfile` | `CandidateProfileService.updateIndustries` | Industries theo hồ sơ |
| `POST` | `/candidate/profile/sync-index` | `CandidateProfileController.syncDefaultProfileIndex` | `CandidateProfileService.syncProfileIndex` | Sync hồ sơ mặc định |
| `POST` | `/candidate/profile/{profileId}/sync-index` | `CandidateProfileController.syncProfileIndex` | `CandidateProfileService.syncProfileIndex` | Sync hồ sơ cụ thể |
| `GET` | `/candidate/profile/recommended-jobs` | `CandidateProfileController.getRecommendedJobs` | `SemanticMatchingService.findMatchingJobsForProfile` | Home recommended jobs |
| `GET` | `/candidate/profile/{profileId}/job-matches` | `CandidateProfileController.getJobMatchesByProfile` | `SemanticMatchingService.findMatchingJobsForProfile` | Matching theo hồ sơ |

### 18.3. Candidate Education / Experience / Certificate API

| Nhóm | Method | Endpoint | Controller | Mục đích |
| --- | --- | --- | --- | --- |
| Học vấn | `POST` | `/candidate/profile/educations` | `CandidateEducationController` | Tạo học vấn ở hồ sơ mặc định |
| Học vấn | `POST` | `/candidate/profile/{profileId}/educations` | `CandidateEducationController` | Tạo học vấn trong hồ sơ đang chọn |
| Học vấn | `PATCH` | `/candidate/profile/educations/{educationId}` | `CandidateEducationController` | Sửa học vấn |
| Học vấn | `PATCH` | `/candidate/profile/{profileId}/educations/{educationId}` | `CandidateEducationController` | Sửa học vấn theo hồ sơ |
| Học vấn | `DELETE` | `/candidate/profile/educations/{educationId}` | `CandidateEducationController` | Xóa học vấn |
| Học vấn | `DELETE` | `/candidate/profile/{profileId}/educations/{educationId}` | `CandidateEducationController` | Xóa học vấn khỏi hồ sơ |
| Học vấn | `PUT` | `/candidate/profile/{profileId}/educations/{educationId}/selection` | `CandidateEducationController` | Bật/tắt hiển thị trong hồ sơ |
| Kinh nghiệm | `POST` | `/candidate/profile/experiences` | `CandidateExperienceController` | Tạo kinh nghiệm |
| Kinh nghiệm | `POST` | `/candidate/profile/{profileId}/experiences` | `CandidateExperienceController` | Gắn kinh nghiệm vào hồ sơ |
| Kinh nghiệm | `PATCH` | `/candidate/profile/experiences/{experienceId}` | `CandidateExperienceController` | Sửa kinh nghiệm |
| Kinh nghiệm | `PATCH` | `/candidate/profile/{profileId}/experiences/{experienceId}` | `CandidateExperienceController` | Sửa kinh nghiệm theo hồ sơ |
| Kinh nghiệm | `DELETE` | `/candidate/profile/experiences/{experienceId}` | `CandidateExperienceController` | Xóa kinh nghiệm |
| Kinh nghiệm | `DELETE` | `/candidate/profile/{profileId}/experiences/{experienceId}` | `CandidateExperienceController` | Xóa kinh nghiệm khỏi hồ sơ |
| Kinh nghiệm | `PUT` | `/candidate/profile/{profileId}/experiences/{experienceId}/selection` | `CandidateExperienceController` | Bật/tắt kinh nghiệm trong hồ sơ |
| Chứng chỉ | `POST` | `/candidate/profile/certificates` | `CandidateCertificateController` | Tạo chứng chỉ |
| Chứng chỉ | `POST` | `/candidate/profile/{profileId}/certificates` | `CandidateCertificateController` | Tạo chứng chỉ trong hồ sơ |
| Chứng chỉ | `PATCH` | `/candidate/profile/certificates/{certificateId}` | `CandidateCertificateController` | Sửa chứng chỉ |
| Chứng chỉ | `PATCH` | `/candidate/profile/{profileId}/certificates/{certificateId}` | `CandidateCertificateController` | Sửa chứng chỉ theo hồ sơ |
| Chứng chỉ | `DELETE` | `/candidate/profile/certificates/{certificateId}` | `CandidateCertificateController` | Xóa chứng chỉ |
| Chứng chỉ | `DELETE` | `/candidate/profile/{profileId}/certificates/{certificateId}` | `CandidateCertificateController` | Xóa chứng chỉ khỏi hồ sơ |
| Chứng chỉ | `PUT` | `/candidate/profile/{profileId}/certificates/{certificateId}/selection` | `CandidateCertificateController` | Bật/tắt chứng chỉ trong hồ sơ |

### 18.4. Public Job / Public Company API

| Method | Endpoint | Controller | Service | Ghi chú |
| --- | --- | --- | --- | --- |
| `GET` | `/api/v1/public/jobs` | `PublicJobController.listJobs` | `PublicJobService.listJobs` | Job nổi bật/trang chủ. |
| `GET` | `/api/v1/public/jobs/{jobId}` | `PublicJobController.getJobDetail` | `PublicJobService.getJobDetail` | Chi tiết job public. |
| `GET` | `/api/v1/public/jobs/search` | `PublicJobController.searchJobs` | `PublicJobService.searchJobs` | Search có filter, Elasticsearch/fallback. |
| `GET` | `/api/v1/public/jobs/search/metadata` | `PublicJobController.getSearchMetadata` | `PublicJobService.getSearchMetadata` | Metadata filter. |
| `GET` | `/api/v1/public/companies/top` | `PublicCompanyController.listTopCompanies` | `PublicCompanyService.listTopCompanies` | Công ty nổi bật. |
| `GET` | `/api/v1/public/companies/{companyId}` | `PublicCompanyController.getCompanyDetail` | `PublicCompanyService.getCompanyDetail` | Trang công ty public. |
| `GET` | `/api/v1/public/companies/{companyId}/jobs` | `PublicCompanyController.listCompanyJobs` | `PublicCompanyService.listCompanyJobs` | Job public của công ty. |

### 18.5. Company Admin API

| Nhóm | Method | Endpoint | Backend service chính | UI |
| --- | --- | --- | --- | --- |
| Me | `GET` | `/api/v1/company-admin/me` | `CompanyAdminProfileService.getMe` | Shell/dashboard/settings |
| Branch | `GET` | `/api/v1/company-admin/branches` | `CompanyAdminProfileService.getBranches` | Jobs/applications/branches |
| Company | `PATCH` | `/company-admin/company/logo` | `CompanyAdminProfileService.updateLogo` | Settings |
| Company | `PATCH` | `/company-admin/company/info` | `CompanyAdminProfileService.updateCompanyInfo` | Settings |
| Company | `PATCH` | `/company-admin/company/resubmit` | `CompanyAdminProfileService.resubmitCompany` | Settings |
| Proof | `GET` | `/company-admin/company/proof-types` | `CompanyAdminProofService.listProofTypes` | Settings |
| Proof | `POST` | `/company-admin/company/proofs` | `CompanyAdminProofService.uploadProofDocument` | Settings |
| Proof | `POST` | `/company-admin/company/proofs/batch` | `CompanyAdminProofService.uploadProofDocuments` | Settings |
| Packages | `GET` | `/company-admin/packages` | `CompanyAdminPackageService.listPackages` | Packages |
| Packages | `POST` | `/company-admin/packages` | `CompanyAdminPackageService.registerPackage` | Packages |
| Jobs | `GET` | `/company-admin/jobs?chiNhanhId=` | `CompanyAdminJobService.listJobs` | Jobs |
| Jobs | `GET` | `/company-admin/jobs/metadata` | `CompanyAdminJobService.getJobMetadata` | Job form |
| Jobs | `POST` | `/company-admin/jobs` | `CompanyAdminJobService.createJob` | Job form |
| Jobs | `PATCH` | `/company-admin/jobs/{jobId}` | `CompanyAdminJobService.updateJob` | Job edit |
| Jobs | `DELETE` | `/company-admin/jobs/{jobId}` | `CompanyAdminJobService.deleteJob` | Jobs table |
| Applications | `GET` | `/company-admin/applications?chiNhanhId=` | `CompanyAdminApplicationService.listApplications` | Applications |
| Applications | `GET` | `/company-admin/applications/{applicationId}` | `CompanyAdminApplicationService.getApplicationDetail` | Application modal |
| Applications | `PATCH` | `/company-admin/applications/{applicationId}/status` | `CompanyAdminApplicationService.updateApplicationStatus` | Application modal |
| Matching | `GET` | `/company-admin/jobs/{jobId}/candidate-matches` | `SemanticMatchingService.findMatchingCandidatesForJob` | AI matching |
| Matching | `GET` | `/company-admin/jobs/{jobId}/application-matches` | `SemanticMatchingService.findSubmittedApplicationMatchesForJob` | AI matching |
| Matching | `GET` | `/company-admin/jobs/{jobId}/candidate-profiles/{profileId}` | `CompanyAdminApplicationService.getCandidateProfileForJob` | AI matching detail |
| HR | `GET` | `/company-admin/hrs` | HR management service | HR page |
| HR | `POST` | `/company-admin/hrs` | HR management service | HR create |
| HR | `PATCH` | `/company-admin/hrs/{hrUserId}` | HR management service | HR edit |
| HR | `DELETE` | `/company-admin/hrs/{hrUserId}` | HR management service | HR delete |

### 18.6. Admin API

| Nhóm | Method | Endpoint | Service | Ghi chú |
| --- | --- | --- | --- | --- |
| Dashboard | `GET` | `/api/v1/admin/stats` | `AdminStatsService` | Tổng số user/công ty/trạng thái. |
| Users | `GET` | `/admin/users` | `AdminUserService.listUsers` | Filter keyword/role/status. |
| Users | `PATCH` | `/admin/users/{userId}/status` | `AdminUserService.updateUserStatus` | Khóa/mở user. |
| Users | `DELETE` | `/admin/users/{userId}` | `AdminUserService.deleteUser` | Xóa mềm user. |
| Companies | `GET` | `/admin/companies` | `AdminCompanyService.listCompanies` | Filter status. |
| Companies | `GET` | `/admin/companies/{companyId}` | `AdminCompanyService.getCompanyDetail` | Detail + proofs. |
| Companies | `PATCH` | `/admin/companies/{companyId}/approve` | `AdminCompanyService.approveCompany` | Duyệt công ty + proof. |
| Companies | `PATCH` | `/admin/companies/{companyId}/reject` | `AdminCompanyService.rejectCompany` | Từ chối + lý do. |
| Packages | `GET` | `/admin/packages` | `AdminPackageService.listPackages` | Gói dịch vụ. |
| Packages | `GET` | `/admin/packages/subscriptions` | `AdminPackageService.listPackageSubscriptions` | Lịch sử đăng ký. |
| Packages | `POST` | `/admin/packages` | `AdminPackageService.createPackage` | Tạo gói. |
| Packages | `PATCH` | `/admin/packages/{packageId}` | `AdminPackageService.updatePackage` | Sửa gói. |
| Packages | `DELETE` | `/admin/packages/{packageId}` | `AdminPackageService.deletePackage` | Xóa gói. |
| Jobs | `GET` | `/admin/jobs` | `AdminJobService.listJobs` | Filter job. |
| Jobs | `GET` | `/admin/jobs/{jobId}` | `AdminJobService.getJobDetail` | Detail job. |
| Jobs | `PATCH` | `/admin/jobs/{jobId}/approve` | `AdminJobService.approveJob` | Duyệt + index. |
| Jobs | `PATCH` | `/admin/jobs/{jobId}/reject` | `AdminJobService.rejectJob` | Reject + sync index. |
| Jobs | `PATCH` | `/admin/jobs/{jobId}/hide` | `AdminJobService.hideJob` | Ẩn khỏi public. |
| Candidate proofs | `GET` | `/admin/candidate-proofs` | `AdminCandidateProofService.listProofs` | Duyệt học vấn/chứng chỉ. |
| Candidate proofs | `PATCH` | `/admin/candidate-proofs/{type}/{proofId}/approve` | `AdminCandidateProofService.approve` | Approve proof. |
| Candidate proofs | `PATCH` | `/admin/candidate-proofs/{type}/{proofId}/reject` | `AdminCandidateProofService.reject` | Reject proof. |
| Reports | `GET` | `/admin/reports` | `AdminReportService.getReport` | Báo cáo admin. |
| Settings | `GET` | `/admin/settings` | `AdminSettingsService.getSettings` | Cấu hình admin. |
| Settings | `PATCH` | `/admin/settings` | `AdminSettingsService.updateSettings` | Cập nhật settings. |
| Index | `GET` | `/admin/elasticsearch/health` | `AdminSearchIndexService.getElasticsearchHealth` | Kiểm tra ES. |
| Index | `POST` | `/admin/elasticsearch/reindex/jobs` | `AdminSearchIndexService.reindexPublicJobs` | Reindex public jobs. |
| Index | `POST` | `/admin/qdrant/reindex/jobs-profiles` | `AdminSearchIndexService.reindexQdrantJobsAndProfiles` | Reindex job/profile vectors. |
| Index | `POST` | `/admin/qdrant/reindex/experiences` | `AdminSearchIndexService.reindexWorkExperiences` | Reindex experience vectors. |
| Catalog | `GET/POST/PATCH/DELETE` | `/admin/system-roles` | `AdminCatalogService` | Vai trò hệ thống. |
| Catalog | `GET/POST/PATCH/DELETE` | `/admin/company-roles` | `AdminCatalogService` | Vai trò công ty. |
| Catalog | `GET/POST/PATCH/DELETE` | `/admin/proof-types` | `AdminCatalogService` | Loại tài liệu công ty. |
| Catalog | `GET/POST/PATCH/DELETE` | `/admin/certificate-types` | `AdminCatalogService` | Loại chứng chỉ. |

## 19. Data Relationship Chi Tiết

### 19.1. User / Candidate / Company Role

```text
NguoiDung
  ├── vaiTroHeThong -> VaiTroHeThong
  ├── HoSoUngVien[]                      # candidate profiles
  ├── KinhNghiemLamViecUngVien[]         # kinh nghiệm gốc của user
  ├── HocVanUngVien[]                    # học vấn gốc hoặc theo profile tùy service mapping
  ├── ChungChiUngVien[]                  # chứng chỉ
  ├── DonUngTuyen[]                      # các đơn đã nộp
  └── ThanhVienCongTy[]                  # quyền trong công ty/chi nhánh

ThanhVienCongTy
  ├── nguoiDung -> NguoiDung
  ├── chiNhanh -> ChiNhanhCongTy
  ├── vaiTroCongTy -> VaiTroCongTy       # OWNER, HR
  └── trangThai

ChiNhanhCongTy
  ├── congTy -> CongTy
  ├── xaPhuong -> XaPhuong
  └── TinTuyenDung[]

CongTy
  ├── chuCongTy -> NguoiDung
  ├── TepMinhChungCongTy[]
  ├── DangKyGoiCongTy[]
  └── ChiNhanhCongTy[]
```

Điểm quan trọng:

- Role hệ thống không đủ để biết user có phải owner/HR hay không.
- Quyền company-admin luôn phải đi qua `ThanhVienCongTy` + `VaiTroCongTy` + `ChiNhanhCongTy`.
- OWNER thường xem được toàn bộ chi nhánh công ty.
- HR chỉ xem được chi nhánh được gán.

### 19.2. Job / Application

```text
TinTuyenDung
  ├── chiNhanh -> ChiNhanhCongTy
  ├── nguoiDang -> NguoiDung
  ├── nganhNghe -> NganhNghe
  ├── loaiHinhLamViec -> LoaiHinhLamViec
  ├── capDoKinhNghiem -> CapDoKinhNghiem
  ├── KyNangTinTuyenDung[] -> KyNang
  └── DonUngTuyen[]

DonUngTuyen
  ├── tinTuyenDung -> TinTuyenDung
  ├── nguoiDung -> NguoiDung
  ├── hoSoUngVien -> HoSoUngVien
  ├── cvUrl
  └── trangThai
```

Business implication:

- Company applications list luôn phải lọc theo chi nhánh của job.
- Khi candidate nộp đơn, đơn gắn trực tiếp với `TinTuyenDung` và `HoSoUngVien`.
- Semantic application matching dùng vector của `DonUngTuyen`, không chỉ vector hồ sơ.

### 19.3. Candidate Profile Item Selection

```text
HoSoUngVien
  ├── selected HocVan
  ├── selected KinhNghiem
  ├── selected ChungChi
  ├── KyNangUngVien[]
  └── NganhNgheUngVien[]
```

Ý nghĩa:

- Một user có thể có nhiều kinh nghiệm, nhưng mỗi hồ sơ chỉ chọn một phần.
- Explanation matching phải tôn trọng selection này.
- Khi HR xem hồ sơ từ matching, detail phải bám vào profile đang được match.

### 19.4. Payment / Package

```text
DanhMucGoi
  ├── maGoi
  ├── tenGoi
  ├── giaNiemYet
  └── soNgayHieuLuc

DangKyGoiCongTy
  ├── congTy -> CongTy
  ├── danhMucGoi -> DanhMucGoi
  ├── trangThai
  ├── trangThaiThanhToan
  ├── batDauLuc
  ├── hetHanLuc
  └── giaTaiThoiDiemDangKy
```

Flow data:

```text
CompanyAdminPackageService.registerPackage
  -> tạo DangKyGoiCongTy PENDING/UNPAID
  -> SepayPaymentService sinh paymentCode/QR
  -> SePay webhook
  -> SepayWebhookService xác nhận tiền
  -> cập nhật DangKyGoiCongTy ACTIVE/PAID
```

## 20. Frontend Route Map Chi Tiết

### 20.1. Public Routes

| Route | Page/Client | Hook | Service | Mục đích |
| --- | --- | --- | --- | --- |
| `/` | `app/page.tsx` | `useFeaturedJobs`, `useRecommendedJobs`, `useTopCompanies`, `useHomeHeaderData` | public/candidate/notification services | Trang chủ, job nổi bật, job phù hợp, công ty nổi bật. |
| `/jobs` | `JobsPageClient.tsx` | `useJobsSearch` | `publicJobService` | Search/filter/pagination job. |
| `/jobs/[id]` | `JobDetailClient.tsx` | `useJobDetail` | `publicJobService`, `candidateApplicationService`, `chatService` | Chi tiết job, apply, favorite, chat. |
| `/companies/[id]` | public company components | `usePublicCompanyData` | `publicCompanyService` | Hồ sơ công ty public + job của công ty. |

### 20.2. Candidate Routes

| Route | Page/Client | Hook | Service | Mục đích |
| --- | --- | --- | --- | --- |
| `/profile` | `app/profile/page.tsx` | `useCandidateProfileData`, `useCandidateProfileActions` | `candidateProfileService`, `authService`, `locationService` | Quản lý hồ sơ ứng viên. |
| `/favorite-jobs` | Favorite page | `useFavoriteJobs` | `publicJobService` | Danh sách job đã lưu. |
| `/messages` | Candidate messages page | `useCandidateInbox` | `chatService` | Chat với nhà tuyển dụng. |

### 20.3. Auth Routes

| Route | Client | Hook | Service | Mục đích |
| --- | --- | --- | --- | --- |
| `/auth/login` | Login client | `useLoginFlow` | `authService`, `companyAdminService` | Login và redirect theo role/company status. |
| `/auth/register/candidate` | Candidate register client | `useCandidateRegister` | `authService` | Đăng ký ứng viên. |
| `/auth/register/owner` | Owner register client | `useOwnerRegister` | `authService`, `locationService` | Đăng ký doanh nghiệp/owner. |

### 20.4. Company Admin Routes

| Route | Client | Hook | Service | Mục đích |
| --- | --- | --- | --- | --- |
| `/company-admin` | `CompanyAdminHomeClient` | `useCompanyAdminHomeData` | `companyAdminService`, jobs/applications services | Dashboard công ty, chart theo chi nhánh/thời gian. |
| `/company-admin/branches` | `CompanyAdminBranchesClient` | `useCompanyAdminBranchesData` | `companyAdminService` | Danh sách chi nhánh có quyền xem. |
| `/company-admin/jobs` | `CompanyAdminJobsClient` | `useCompanyAdminJobsData`, `useCompanyAdminJobActions` | `companyAdminJobsService`, `companyAdminSettingsService` | CRUD jobs theo chi nhánh. |
| `/company-admin/applications` | `CompanyAdminApplicationsClient` | `useCompanyAdminApplicationsData`, `useCompanyAdminApplicationsActions`, `useApplicationsMatchingPreview` | applications/jobs/chat services | Quản lý applications + AI matching. |
| `/company-admin/messages` | messages client | `useRecruiterInbox` | `chatService` | Chat recruiter. |
| `/company-admin/hr` | `CompanyAdminHrClient` | `useCompanyAdminHrData`, `useCompanyAdminHrActions` | `companyAdminService` | Quản lý HR. |
| `/company-admin/packages` | `CompanyAdminPackagesClient` | `useCompanyAdminPackagesData`, `useCompanyAdminPackagesActions` | `companyAdminService` | Đăng ký gói + QR SePay. |
| `/company-admin/settings` | `CompanyAdminSettingsClient` | `useCompanyAdminSettingsData`, `useCompanyAdminSettingsActions` | `companyAdminSettingsService`, `authService` | Logo, thông tin công ty, minh chứng, resubmit. |

### 20.5. Admin Routes

| Route | Client | Hook | Service | Mục đích |
| --- | --- | --- | --- | --- |
| `/admin` | `AdminDashboardClient` | `useAdminDashboardData` | `adminService`, `adminStatsService` | Dashboard admin. |
| `/admin/users` | `UsersAdminClient` | `useAdminUsersData`, `useAdminUsersActions` | `adminUsersService` | Quản lý user. |
| `/admin/companies` | `CompaniesAdminClient` | `useAdminCompaniesData`, `useAdminCompaniesActions` | `adminCompaniesService` | Duyệt công ty. |
| `/admin/jobs` | `JobsAdminClient` | `useAdminJobsData`, `useAdminJobsActions` | `adminJobsService` | Duyệt job. |
| `/admin/plans` | `PlansAdminClient` | `useAdminPlansData`, `useAdminPlansActions` | `adminPackagesService` | Quản lý gói. |
| `/admin/candidate-proofs` | `CandidateProofsAdminClient` | `useAdminCandidateProofsData`, `useAdminCandidateProofsActions` | `adminCandidateProofsService` | Duyệt minh chứng ứng viên. |
| `/admin/catalogs` | `CatalogsAdminClient` | `useAdminCatalogsData`, `useAdminCatalogsActions` | `adminCatalogsService` | CRUD danh mục. |

## 21. Service Responsibility Matrix

### 21.1. Backend Services

| Service | Trách nhiệm | Không nên làm |
| --- | --- | --- |
| `AuthService` | Login, register candidate, build auth response. | Không xử lý company owner/profile update. |
| `OwnerRegistrationService` | Register owner, proof types, tạo employer từ owner. | Không xử lý login. |
| `AuthUserProfileService` | `getMe`, `updateMe`, `updateAvatar`. | Không sinh token. |
| `CandidateProfileService` | Facade hồ sơ ứng viên, multi-profile, summary/skills/industries/content. | Không chứa logic mapping response quá chi tiết nếu đã có assembler/mapper. |
| `CandidateProfileContentService` | Logic nội dung học vấn/chứng chỉ/kinh nghiệm. | Không xử lý auth HTTP. |
| `CandidateProfileAttachmentService` | Attach content có sẵn vào hồ sơ mới. | Không xử lý UI selection. |
| `CandidateJobApplicationService` | Ứng tuyển, trạng thái ứng tuyển, list đơn candidate, sync application embedding. | Không quản lý application của HR. |
| `CompanyAdminAccessService` | Kiểm quyền company/branch/role. | Không map DTO UI. |
| `CompanyAdminProfileService` | `me`, branches, logo, company info, resubmit. | Không tạo job/application. |
| `CompanyAdminJobService` | CRUD job, job metadata, skill mapping, sync index. | Không xử lý application status. |
| `CompanyAdminApplicationService` | List/detail/update application, candidate profile for job. | Không tạo job. |
| `CompanyAdminPackageService` | List/register package, tạo thông tin thanh toán SePay. | Không nhận webhook. |
| `AdminService` | Facade admin mỏng. | Không chứa repository/business logic mới. |
| `AdminStatsService` | Stats dashboard. | Không xử lý approve/reject. |
| `AdminCompanyService` | Duyệt/từ chối/list/detail công ty. | Không quản lý user/job. |
| `AdminJobService` | Duyệt/từ chối/ẩn/list/detail job. | Không tạo company job từ phía HR. |
| `AdminSearchIndexService` | Health/reindex Elasticsearch/Qdrant. | Không xử lý CRUD admin khác. |
| `SemanticMatchingService` | Matching jobs/candidates/applications. | Không tự render text UI. |
| `SemanticCandidateExplanationService` | Sinh explanation signals/strengths/gaps. | Không truy cập controller. |
| `NotificationService` | List/count/read/delete/create notification. | Không quyết định business event. |
| `ChatService` | Open conversation, list/send messages. | Không quản lý WebSocket session trực tiếp. |
| `SepayWebhookService` | Verify webhook, xác nhận thanh toán, active gói. | Không tạo checkout UI. |
| `SepayPaymentService` | Sinh payment code/QR/checkout form. | Không cập nhật trạng thái gói. |

### 21.2. Frontend Hooks

| Hook | Vai trò | Gọi service |
| --- | --- | --- |
| `useLoginFlow` | Submit login, lưu token, redirect. | `authService`, `companyAdminService` |
| `useOwnerRegister` | Form owner, upload proof, submit owner. | `authService`, `locationService` |
| `useCandidateProfileData` | Load `me`, profiles, metadata, active profile. | `authService`, `candidateProfileService` |
| `useCandidateProfileActions` | Facade action profile. | Các hook con profile |
| `useCandidateProfileMediaActions` | Avatar/proof upload. | `authService` |
| `useCandidateProfileContentActions` | CRUD education/experience/certificate. | `candidateProfileService` |
| `useJobsSearch` | Public job search/filter/page. | `publicJobService` |
| `useJobDetail` | Job detail, apply, favorite, chat open. | public/candidate/chat services |
| `useCompanyAdminShellData` | Load company shell, role, badge applications. | `companyAdminService` |
| `useCompanyAdminHomeData` | Dashboard aggregate company. | company-admin services |
| `useCompanyAdminJobsData` | Load branch/job metadata/jobs. | settings/jobs services |
| `useCompanyAdminJobActions` | Create/update/delete job, upload CV template. | `companyAdminJobsService`, `authService` |
| `useCompanyAdminApplicationsData` | Load applications, jobs, filters. | applications/jobs/settings services |
| `useApplicationsMatchingPreview` | Gọi semantic matching, ranking UI. | `companyAdminJobsService` |
| `useRecruiterInbox` | Recruiter chat inbox realtime. | `chatService` |
| `useAdminDashboardData` | Admin stats/companies/chart. | `adminService` |
| `useAdminCompaniesData` | Load companies/stats. | `adminCompaniesService`, `adminStatsService` |
| `useAdminCompaniesActions` | Detail/approve/reject company. | `adminCompaniesService` |
| `useAdminJobsData` | Load jobs với filter. | `adminJobsService` |
| `useAdminJobsActions` | Detail/approve/reject/hide job. | `adminJobsService` |

## 22. Sequence Diagram Dạng Text Cho Các Luồng Chính

### 22.1. Candidate Nộp Đơn

```text
Candidate
  -> /jobs/[id]
  -> useJobDetail.load()
  -> GET public job detail
  -> GET application status
  -> GET candidate profiles
  -> mở JobApplyModal
  -> chọn HoSoUngVien + CV nếu cần
  -> POST /candidate/applications/jobs/{jobId}
  -> CandidateJobApplicationController.apply
  -> CandidateJobApplicationService.apply
       validate job public
       validate profile belongs to candidate
       validate duplicate application
       save DonUngTuyen
       ApplicationEmbeddingIndexService.syncIndex
       NotificationService notify company users
  -> response application
  -> UI cập nhật trạng thái đã ứng tuyển
```

### 22.2. HR Xem Và Xử Lý Đơn

```text
HR/Owner
  -> /company-admin/applications
  -> useCompanyAdminApplicationsData
  -> GET /company-admin/branches
  -> chọn chi nhánh
  -> GET /company-admin/jobs?chiNhanhId
  -> GET /company-admin/applications?chiNhanhId
  -> ApplicationFilters lọc status/job/date local
  -> ApplicationsTable render
  -> mở ApplicationDetailModal
  -> GET /company-admin/applications/{applicationId}
  -> update status
  -> PATCH /company-admin/applications/{applicationId}/status
  -> CompanyAdminApplicationService.updateApplicationStatus
       validate membership branch
       save status
       notify candidate
  -> UI update row
```

Nếu trạng thái đã là `ACCEPTED`:

```text
HR/Owner
  -> mở ApplicationDetailModal
  -> ApplicationDetailSummary hiện action gửi mail mời phỏng vấn
  -> mở InterviewEmailModal
  -> nhập thời gian phỏng vấn, địa điểm, ghi chú
  -> xác nhận bằng confirm dialog
  -> POST /company-admin/applications/{applicationId}/interview-email
  -> CompanyAdminApplicationService.sendInterviewEmail
       validate application thuộc chi nhánh đang quản lý
       validate DonUngTuyen.trangThai = ACCEPTED
       gửi email HTML cho ứng viên
       set DonUngTuyen.thoiGianGuiThuMoi = now()
  -> response application mới
  -> ApplicationsTable và modal hiện badge phụ "Đã gửi mail"
```

### 22.3. HR Chạy Semantic Matching Theo Job

```text
HR/Owner
  -> /company-admin/applications
  -> chọn chi nhánh
  -> chọn tin tuyển dụng
  -> ApplicationsMatchingSection
  -> mode application matches hoặc candidate matches

Application matches:
  -> GET /company-admin/jobs/{jobId}/application-matches
  -> SemanticMatchingService.findSubmittedApplicationMatchesForJob
       validate Qdrant enabled
       validate user has branch membership
       load applications of job
       ensure each application indexed
       get job vector
       Qdrant search khoDonUngTuyen filter tinTuyenDungId
       map score + explanation

Candidate matches:
  -> GET /company-admin/jobs/{jobId}/candidate-matches
  -> SemanticMatchingService.findMatchingCandidatesForJob
       get job vector
       Qdrant search khoHoSoUngVien
       load profiles
       map score + explanation
```

### 22.4. Company Đăng Tin Tuyển Dụng

```text
Owner/HR
  -> /company-admin/jobs
  -> useCompanyAdminJobsData
       GET company-admin/me
       GET branches
       GET job metadata
       GET jobs by selected branch
  -> click Tạo tin tuyển dụng
  -> JobFormModal
  -> optional upload CV template via Cloudinary
  -> submit
  -> POST /company-admin/jobs
  -> CompanyAdminJobService.createJob
       resolveApprovedManagedCompany
       ensureActivePostingPackage
       requireMembership for chiNhanhId
       applyJobPayload
       save TinTuyenDung
       replaceJobSkills
       sync Elasticsearch
       sync Qdrant job vector
  -> UI prepend job
```

### 22.5. Admin Duyệt Công Ty

```text
Admin
  -> /admin/companies
  -> useAdminCompaniesData
  -> GET /admin/companies
  -> open CompanyDetailModal
  -> GET /admin/companies/{companyId}
  -> click approve
  -> PATCH /admin/companies/{companyId}/approve
  -> AdminCompanyService.approveCompany
       require company
       set trangThai APPROVED
       clear lyDoTuChoi
       update proof documents APPROVED
       NotificationService notify owner
  -> UI reload list/stats
```

### 22.6. Admin Duyệt Job

```text
Admin
  -> /admin/jobs
  -> useAdminJobsData
  -> GET /admin/jobs with filters
  -> open detail
  -> approve
  -> PATCH /admin/jobs/{jobId}/approve
  -> AdminJobService.approveJob
       require job
       set status APPROVED
       save
       sync public Elasticsearch index
       sync Qdrant job embedding
       notify company users
  -> job visible in public search/home
```

### 22.7. Company Đăng Ký Gói Và SePay Xác Nhận

```text
Owner
  -> /company-admin/packages
  -> GET /company-admin/packages
  -> chọn gói
  -> POST /company-admin/packages
  -> CompanyAdminPackageService.registerPackage
       create DangKyGoiCongTy PENDING/UNPAID
       SepayPaymentService.buildPaymentCodeForRegistration
       buildTransferContent
       buildQrImageUrl
       buildCheckoutForm
  -> UI hiển thị QR/checkout

SePay
  -> POST /payments/sepay/webhook
  -> SepayWebhookController.handleWebhook
       verifyWebhookSecret
       SepayWebhookService.handleWebhook
       extract registration id from content/payment code
       verify amount
       mark PAID/ACTIVE
       set active date range
       notify owner/company
```

## 23. Error Handling Và Guard Logic

### 23.1. Auth Errors

| Tình huống | Nơi xử lý | HTTP | Message |
| --- | --- | --- | --- |
| Email trống | `AuthService.normalizeEmail` | `400` | `Email không được để trống` |
| Email đã tồn tại | `ensureEmailNotExists` | `409` | `Email đã tồn tại` |
| Sai email/password | `AuthService.login` | `401` | `Sai email hoặc mật khẩu` |
| Tài khoản bị khóa | `AuthService.login` | `403` | `Tài khoản chưa được kích hoạt` |
| Principal null | candidate/company/admin controllers | `403` | `Chưa đăng nhập` hoặc forbidden message |

### 23.2. Company Admin Guard

Các guard chính:

- `CompanyAdminAccessService.requireMembership(userId, branchId, roles)`
- `CompanyAdminProfileService.resolveApprovedManagedCompany`
- `CompanyAdminPackageService.ensureCompanyApproved`
- `CompanyAdminJobService.ensureActivePostingPackage`

Ý nghĩa:

- User phải thuộc chi nhánh.
- Role phải nằm trong tập cho phép.
- Công ty phải approved cho các chức năng vận hành.
- Có gói active mới được đăng bài.

### 23.3. Admin Guard

Admin controller gọi `requireAdmin()` trước mỗi endpoint.

Ý nghĩa:

- Không tin frontend sidebar.
- Dù route admin bị gọi trực tiếp, backend vẫn check role.
- AdminShell chỉ validate session để UX tốt hơn, không thay thế backend guard.

## 24. QA Checklist Theo Chức Năng

### 24.1. Auth

- Login candidate đúng email/password -> về public/home hoặc route trước đó.
- Login admin -> về `/admin`.
- Login owner/HR -> về `/company-admin`.
- Login sai password -> báo lỗi.
- User bị khóa -> không login được.
- Register candidate email trùng -> lỗi `409`.
- Register owner thiếu proof -> frontend không cho submit hoặc backend reject theo payload.

### 24.2. Candidate Profile

- Candidate chưa có hồ sơ -> vào `/profile` tạo/hiển thị đúng flow.
- Tạo hồ sơ mới -> selector có thêm hồ sơ.
- Sửa summary -> reload vẫn giữ dữ liệu.
- Thêm học vấn không upload minh chứng -> frontend cảnh báo đỏ, không lưu.
- Thêm chứng chỉ không upload minh chứng -> frontend cảnh báo đỏ, không lưu.
- Thêm kinh nghiệm -> hiện trong panel.
- Bật/tắt selection item -> matching/detail chỉ dùng item được chọn.
- Sync profile index -> không lỗi khi Qdrant enabled.

### 24.3. Apply Job

- Guest click apply -> yêu cầu login.
- Candidate chưa có hồ sơ -> không nộp được hoặc phải tạo hồ sơ.
- Job yêu cầu CV -> thiếu CV không nộp.
- Nộp đơn thành công -> status đổi đã ứng tuyển.
- Nộp trùng -> backend chặn.
- HR/Owner thấy đơn ở đúng chi nhánh.

### 24.4. Company Admin Jobs

- Công ty PENDING -> bị hạn chế chức năng.
- Công ty APPROVED nhưng chưa có gói -> không tạo job.
- Có gói -> tạo job được.
- Job tạo xong -> xuất hiện theo chi nhánh.
- Edit job -> dữ liệu update đúng.
- Delete job -> không còn trong list.
- Skill mapping update -> matching/search dùng kỹ năng mới.

### 24.5. Company Applications

- Chọn chi nhánh A -> chỉ thấy đơn/job của chi nhánh A.
- Chi nhánh có job chưa ai apply -> dropdown job vẫn hiện job đó.
- Chọn job -> filter applications đúng.
- Chạy application matching khi có đơn -> có ranking.
- Chạy candidate matching khi chưa có đơn -> vẫn tìm candidate phù hợp toàn hệ thống.
- Update application status -> candidate nhận notification.
- Open chat từ application -> conversation được tạo/mở.

### 24.6. Admin

- Admin dashboard load stats.
- Duyệt công ty -> status `APPROVED`, owner thấy full company-admin.
- Từ chối công ty -> status `REJECTED`, lý do hiển thị.
- Duyệt job -> job public search thấy.
- Từ chối/hide job -> public không thấy.
- Duyệt học vấn/chứng chỉ -> status proof update.
- CRUD catalog -> list reload đúng.
- Reindex jobs/profiles/experiences -> response thống kê đúng.

### 24.7. SePay

- Register package -> tạo pending registration.
- QR/payment content có payment code.
- Webhook thiếu secret -> reject.
- Webhook amount sai -> reject.
- Webhook hợp lệ -> gói active/paid.
- Gọi webhook lại -> không nhân đôi hiệu lực.

## 25. Report Talking Points

Khi trình bày đồ án, có thể nói theo thứ tự:

1. Hệ thống chia 3 vùng nghiệp vụ: public/candidate, company-admin, super-admin.
2. Backend dùng controller mỏng, service domain xử lý business rule.
3. Frontend dùng App Router, hook theo màn hình và service layer theo domain.
4. Phân quyền công ty không dựa vào role hệ thống, mà dựa vào membership `ThanhVienCongTy`.
5. Job search kết hợp Elasticsearch cho full-text và JPA fallback.
6. Matching dùng Qdrant vector search, sau đó enrich bằng DB signals để giải thích lý do.
7. Upload file dùng signed direct upload Cloudinary, backend chỉ lưu URL.
8. Thanh toán gói dùng SePay: frontend tạo đăng ký, SePay webhook xác nhận và active gói.
9. Notification và chat realtime giúp đóng vòng giao tiếp candidate/recruiter.
10. Admin có quyền duyệt các điểm rủi ro: công ty, job, minh chứng candidate, catalog/gói.

## 26. Khi Có Bug Thì Trace Từ Đâu

| Bug | Bắt đầu đọc ở frontend | Bắt đầu đọc ở backend |
| --- | --- | --- |
| Login sai redirect | `useLoginFlow.ts` | `AuthController`, `AuthService`, `JwtService` |
| Owner không thấy menu | `useCompanyAdminShellData.ts`, `CompanyAdminSidebar.tsx` | `CompanyAdminProfileService.getMe`, `CompanyAdminAccessService` |
| HR không thấy job chi nhánh | `useCompanyAdminJobsData.ts` | `CompanyAdminJobService.listJobs`, `CompanyAdminAccessService` |
| Dropdown job trong applications thiếu job | `useCompanyAdminApplicationsData.ts` | `CompanyAdminJobService.listJobs` |
| Candidate apply không hiện bên HR | `useJobDetail.ts`, `company-admin/applications` hooks | `CandidateJobApplicationService.apply`, `CompanyAdminApplicationService.listApplications` |
| Matching không có kết quả | `useApplicationsMatchingPreview.ts` | `SemanticMatchingService`, Qdrant properties, embedding index services |
| Explanation thiếu kinh nghiệm | `ApplicationMatchInsightPanel.tsx` | `SemanticCandidateExplanationService`, `KinhNghiemEmbeddingIndexService`, profile selection |
| Reindex kinh nghiệm không tạo collection | admin API caller | `AdminSearchIndexService.reindexWorkExperiences` |
| Job public không search thấy | `useJobsSearch.ts` | `PublicJobService`, `PublicJobElasticsearchSearchService`, `AdminJobService.approveJob` |
| Gói không active sau thanh toán | `CompanyAdminPackagesClient.tsx` | `SepayWebhookController`, `SepayWebhookService`, `DangKyGoiCongTyRepository` |
| Notification không tăng số | `useHomeHeaderData.ts` | `NotificationService`, nơi tạo notification theo event |
| Chat không realtime | `useCandidateInbox.ts`/`useRecruiterInbox.ts` | `ChatService`, `ChatRealtimePublisher`, WebSocket handler |

## 27. Quy Ước Không Nên Phá Khi Phát Triển Tiếp

- Không gọi `apiClient` trực tiếp trong page/hook nếu đã có service domain phù hợp.
- Không thêm business logic vào controller; controller chỉ nhận request, check principal/role, gọi service.
- Không thêm repository logic mới vào `AdminService` hoặc `CompanyAdminService`; hai service này nên giữ vai trò facade.
- Không thay endpoint nếu frontend đã dùng ổn; nếu thêm endpoint mới thì giữ endpoint cũ để không break UI.
- Không sửa entity/schema nếu chỉ refactor flow.
- Khi thêm status mới, phải kiểm tra cả backend enum/string rule, frontend badge, filter và tài liệu QA.
- Khi sửa matching, phải kiểm tra cả vector index, payload Qdrant, DB signal và explanation.
- Khi sửa upload, phải giữ pattern: signature -> Cloudinary -> lưu URL.

## 28. Catalog Endpoint Theo Màn Hình

Phần này dùng để khi báo cáo hoặc debug có thể nhìn một màn hình frontend và biết ngay nó đi qua API, controller, service nào.

### 28.1. Home Public

| UI | Hook/Component | Service FE | API | Backend |
| --- | --- | --- | --- | --- |
| Việc làm nổi bật | `useFeaturedJobs` | `publicJobService.listJobs` | `GET /api/v1/public/jobs` | `PublicJobController.listJobs` -> `PublicJobService.listJobs` |
| Việc làm phù hợp với tôi | `useRecommendedJobs` | `candidateProfileService.getRecommendedJobs` | `GET /api/v1/candidate/profile/recommended-jobs` | `CandidateProfileController.recommendedJobs` -> semantic profile/job matching |
| Công ty hàng đầu | `useTopCompanies` | `publicCompanyService.getTopCompanies` | `GET /api/v1/public/companies/top` | `PublicCompanyController.topCompanies` -> `PublicCompanyService` |
| Header user state | `useHomeHeaderData` | `authService.getMe`, `notificationService.getUnreadCount` | `GET /auth/me`, `GET /notifications/unread-count` | `AuthController`, `NotificationController` |

Điểm quan trọng:

- Mục recommended jobs chỉ nên render khi đã đăng nhập và có hồ sơ ứng viên.
- Nếu chưa đăng nhập, frontend không gọi API recommended jobs hoặc gọi nhưng phải xử lý 401 nhẹ nhàng.
- Nếu ứng viên chưa có hồ sơ, UI không render block này để tránh hiểu nhầm là hệ thống không có job phù hợp.
- Job public chỉ nên hiện các tin đã duyệt và còn public theo rule backend.

### 28.2. Public Job Search

| UI | Hook/Component | Service FE | API | Backend |
| --- | --- | --- | --- | --- |
| Trang `/jobs` | `useJobsSearch` | `publicJobService.searchJobs` | `GET /api/v1/public/jobs/search` | `PublicJobController.searchJobs` -> `PublicJobService.searchJobs` |
| Metadata filter | `useJobsSearch` | `publicJobService.getSearchMetadata` | `GET /api/v1/public/jobs/search/metadata` | `PublicJobController.searchMetadata` |
| Card job | `PublicJobCard` | không gọi trực tiếp | dữ liệu từ search/list | `PublicJobSummaryResponse` |
| Pagination | `JobsPagination` | gọi lại search | query params | service search |

Luồng search:

```text
User nhập keyword/filter
-> useJobsSearch cập nhật URL/search params
-> publicJobService.searchJobs gọi API
-> PublicJobService ưu tiên Elasticsearch nếu khả dụng
-> Nếu Elasticsearch lỗi/không bật thì fallback JPA
-> Frontend nhận danh sách + metadata phân trang
```

Khi báo cáo:

- Elasticsearch phục vụ full-text search job public.
- JPA fallback giúp hệ thống vẫn chạy khi Elasticsearch chưa sẵn sàng.
- Metadata filter giúp frontend không hard-code ngành nghề, kỹ năng, địa điểm.

### 28.3. Public Job Detail

| UI | Hook/Component | Service FE | API | Backend |
| --- | --- | --- | --- | --- |
| Chi tiết job | `useJobDetail` | `publicJobService.getJobDetail` | `GET /api/v1/public/jobs/{jobId}` | `PublicJobController.getJobDetail` -> `PublicJobService.getJobDetail` |
| Trạng thái đã apply | `useJobDetail` | `candidateApplicationService.getStatus` | `GET /api/v1/candidate/applications/jobs/{jobId}/status` | `CandidateJobApplicationController.status` |
| Nộp đơn | `JobApplyModal` -> `useJobDetail` | `candidateApplicationService.apply` | `POST /api/v1/candidate/applications/jobs/{jobId}` | `CandidateJobApplicationController.apply` -> `CandidateJobApplicationService.apply` |
| Yêu thích | `useJobDetail` | `publicJobService.toggleFavorite` | `/candidate/favorite-jobs/{jobId}` | `CandidateFavoriteJobController` |
| Mở chat theo job | `JobChatModal` | `chatService.openJobConversation` | `POST /api/v1/chats/jobs/{jobId}/open` | `ChatController.openJobConversation` -> `ChatService` |

Business rule cần nhớ:

- Candidate phải đăng nhập để apply, favorite, chat.
- Apply nên gắn với hồ sơ ứng viên được chọn.
- Một đơn ứng tuyển sẽ được HR/company-admin nhìn thấy ở màn hình applications theo chi nhánh/tin tuyển dụng.
- Khi apply thành công, backend có thể index đơn ứng tuyển vào Qdrant để phục vụ ranking đơn.

### 28.4. Candidate Profile

| UI | Hook/Component | Service FE | API | Backend |
| --- | --- | --- | --- | --- |
| Load hồ sơ mặc định | `useCandidateProfileData` | `candidateProfileService.getProfile` | `GET /api/v1/candidate/profile` | `CandidateProfileController.getCurrentProfile` |
| Danh sách hồ sơ | `useCandidateProfileData` | `candidateProfileService.getProfiles` | `GET /api/v1/candidate/profile/all` | `CandidateProfileController.getAllProfiles` |
| Tạo hồ sơ | `ProfileEmptyState`/modal | `candidateProfileService.createProfile` | `POST /api/v1/candidate/profile/all` | `CandidateProfileController.createProfile` |
| Update summary | `SummaryPanel` | `candidateProfileService.updateSummary` | `PATCH /candidate/profile/{profileId}/summary` | `CandidateProfileController.updateSummary` |
| Update kỹ năng | `SkillsPanel` | `candidateProfileService.updateSkills` | `PUT /candidate/profile/{profileId}/skills` | `CandidateProfileController.updateSkills` |
| Update ngành nghề | `IndustriesPanel` | `candidateProfileService.updateIndustries` | `PUT /candidate/profile/{profileId}/industries` | `CandidateProfileController.updateIndustries` |
| CRUD học vấn | `EducationPanel` | `candidateProfileService.*Education` | `/candidate/profile/{profileId}/educations` | `CandidateEducationController` |
| CRUD kinh nghiệm | `WorkExperiencePanel` | `candidateProfileService.*Experience` | `/candidate/profile/{profileId}/experiences` | `CandidateExperienceController` |
| CRUD chứng chỉ | `CertificatePanel` | `candidateProfileService.*Certificate` | `/candidate/profile/{profileId}/certificates` | `CandidateCertificateController` |
| Sync vector hồ sơ | action trong profile | `candidateProfileService.syncIndex` | `POST /candidate/profile/{profileId}/sync-index` | `CandidateProfileController.syncIndex` |

Quy ước sau khi refactor controller:

- `CandidateProfileController` giữ phần hồ sơ tổng, summary, skills, industries, recommended jobs, sync index.
- `CandidateEducationController` giữ endpoint học vấn.
- `CandidateExperienceController` giữ endpoint kinh nghiệm.
- `CandidateCertificateController` giữ endpoint chứng chỉ.
- Cả ba controller con vẫn giữ prefix `/api/v1/candidate/profile` để không đổi API contract.

### 28.5. Candidate Proof Upload

| Thành phần | Vai trò |
| --- | --- |
| `ProofUploadBox` | UI chọn file minh chứng, hiển thị lỗi đỏ khi thiếu file |
| `authService.getCloudinarySignature` | xin chữ ký upload |
| Cloudinary direct upload | upload file trực tiếp từ browser lên Cloudinary |
| `candidateProfileService.create/updateEducation` | lưu URL minh chứng học vấn |
| `candidateProfileService.create/updateCertificate` | lưu URL minh chứng chứng chỉ |
| Backend education/certificate service | set trạng thái minh chứng theo URL |
| Admin candidate proof screen | duyệt/từ chối minh chứng |

Rule validation:

```text
Người dùng bấm Lưu học vấn/chứng chỉ
-> frontend kiểm tra nếu chưa có file minh chứng
-> show message đỏ: "Vui lòng upload minh chứng nhé"
-> không gọi API lưu
-> nếu đã có file, upload Cloudinary trước
-> lấy secure URL
-> gửi URL xuống backend
-> backend lưu record + trạng thái chờ duyệt phù hợp
```

Điểm cần nhấn khi QA:

- Không upload file thì không được lưu.
- Message nằm ngay vùng upload để user biết lỗi ở đâu.
- Backend không lưu file binary, chỉ lưu URL.
- Admin nhìn minh chứng qua URL đã lưu.

### 28.6. Company Admin Shell

| UI | Hook/Component | Service FE | API | Backend |
| --- | --- | --- | --- | --- |
| Layout company admin | `CompanyAdminShell` | `companyAdminService.validateSession` | `GET /company-admin/me` | `CompanySubAdminController.me` |
| Sidebar | `CompanyAdminSidebar` | dữ liệu từ shell | không gọi trực tiếp | trạng thái công ty + role |
| Home dashboard | `useCompanyAdminHomeData` | company-admin services | nhiều API thống kê | `CompanyAdminService`/các service con |
| Chấm đỏ ứng viên | Sidebar/applications state | applications service/count | `GET /company-admin/applications` | `CompanyAdminApplicationService.listApplications` |

Rule sidebar:

- Logout nằm nối tiếp menu, không ép xuống đáy sidebar.
- Ứng viên có chấm đỏ khi danh sách đơn có ứng viên/applications cần chú ý.
- Menu company-admin phải xét trạng thái công ty và role trong `ThanhVienCongTy`.

### 28.7. Company Admin Jobs

| UI | Hook/Component | Service FE | API | Backend |
| --- | --- | --- | --- | --- |
| List jobs | `useCompanyAdminJobsData` | `companyAdminJobsService.listJobs` | `GET /company-admin/jobs` | `CompanyAdminJobService.listJobs` |
| Metadata form | `useCompanyAdminJobsData` | `companyAdminJobsService.getMetadata` | `GET /company-admin/jobs/metadata` | `CompanyAdminJobService.getMetadata` |
| Create job | `JobFormModal` | `companyAdminJobsService.createJob` | `POST /company-admin/jobs` | `CompanyAdminJobService.createJob` |
| Update job | `JobFormModal` | `companyAdminJobsService.updateJob` | `PATCH /company-admin/jobs/{jobId}` | `CompanyAdminJobService.updateJob` |
| Delete job | `JobsTable` | `companyAdminJobsService.deleteJob` | `DELETE /company-admin/jobs/{jobId}` | `CompanyAdminJobService.deleteJob` |
| Candidate matching | applications matching UI | `getCandidateMatches` | `GET /company-admin/jobs/{jobId}/candidate-matches` | `SemanticMatchingService` |
| Application matching | applications matching UI | `getApplicationMatches` | `GET /company-admin/jobs/{jobId}/application-matches` | `SemanticMatchingService` |

Điểm nghiệp vụ:

- Job thuộc chi nhánh.
- HR lọc theo chi nhánh thì dropdown tin tuyển dụng phải lấy job của chi nhánh, kể cả job chưa có ai apply.
- Tạo job cần kiểm tra công ty đã duyệt và gói tuyển dụng còn hiệu lực.
- Job mới tạo thường cần admin duyệt trước khi public.

### 28.8. Company Admin Applications

| UI | Hook/Component | Service FE | API | Backend |
| --- | --- | --- | --- | --- |
| List applications | `useCompanyAdminApplicationsData` | `companyAdminApplicationsService.listApplications` | `GET /company-admin/applications` | `CompanyAdminApplicationService.listApplications` |
| Detail application | `ApplicationDetailModal` | `getApplication` | `GET /company-admin/applications/{applicationId}` | service detail |
| Update status | `useCompanyAdminApplicationsActions` | `updateStatus` | `PATCH /company-admin/applications/{applicationId}/status` | update status + notification |
| Send interview email | `InterviewEmailModal` | `sendInterviewEmail` | `POST /company-admin/applications/{applicationId}/interview-email` | gửi mail + set `thoiGianGuiThuMoi` |
| Matching controls | `ApplicationsMatchingSection` | jobs service matching APIs | `/jobs/{jobId}/...matches` | semantic matching |
| Mở chat từ đơn | detail/action | `chatService.openApplicationConversation` | `POST /chats/applications/{applicationId}/open` | `ChatService` |

Luồng lọc ứng viên đúng:

```text
Chọn chi nhánh
-> load jobs theo chi nhánh từ CompanyAdminJobService.listJobs
-> dropdown tin tuyển dụng hiển thị tất cả job của chi nhánh
-> chọn job
-> applications list filter theo jobId
-> nếu job chưa có ai apply thì list rỗng nhưng dropdown vẫn có job
-> từ job đó vẫn chạy candidate matching để tìm ứng viên phù hợp
```

Quy tắc UI theo `batBuocCV`:

```text
Nếu job không bắt buộc CV:
-> tab Danh sách đơn có thể hiển thị cột AI Matching
-> cột AI Matching chỉ hiển thị % semantic score
-> cột CV bị ẩn vì không có ý nghĩa nghiệp vụ
-> bấm tên ứng viên trong kết quả AI có thể mở modal lý do gợi ý

Nếu job bắt buộc CV:
-> tab Danh sách đơn vẫn hiển thị đơn và cột CV để HR tải file
-> không xếp hạng AI trên các đơn đã nộp vì đơn CV được ghi SKIPPED và không index Qdrant
-> tab AI theo tin vẫn hiển thị để HR tìm ứng viên phù hợp và nhắn họ chuẩn bị CV
-> không mở modal lý do gợi ý vì backend không đọc nội dung PDF/CV
```

### 28.9. Admin

| UI | Hook/Component | Service FE | API | Backend |
| --- | --- | --- | --- | --- |
| Dashboard | `useAdminDashboardData` | `adminStatsService.getStats` | `GET /admin/stats` | `AdminStatsService` |
| Users | `useAdminUsersData/Actions` | `adminUsersService` | `/admin/users` | `AdminUserService` |
| Companies | `useAdminCompaniesData/Actions` | `adminCompaniesService` | `/admin/companies` | `AdminCompanyService` |
| Jobs | `useAdminJobsData/Actions` | `adminJobsService` | `/admin/jobs` | `AdminJobService` |
| Packages | `useAdminPlansData/Actions` | `adminPackagesService` | `/admin/packages` | `AdminPackageService` |
| Candidate proofs | `useAdminCandidateProofsData/Actions` | `adminCandidateProofsService` | `/admin/candidate-proofs` | `AdminCandidateProofService` |
| Catalogs | `useAdminCatalogsData/Actions` | `adminCatalogsService` | `/admin/system-roles`, `/company-roles`, `/proof-types`, `/certificate-types` | `AdminCatalogService` |
| Search index ops | admin service | admin APIs | `/admin/elasticsearch/*`, `/admin/qdrant/*` | `AdminSearchIndexService` |

Sau refactor:

- `AdminService` chỉ nên là facade mỏng nếu còn được dùng.
- Logic người dùng nằm trong `AdminUserService`.
- Logic công ty nằm trong `AdminCompanyService`.
- Logic thống kê nằm trong `AdminStatsService`.
- Logic search/reindex nằm trong `AdminSearchIndexService`.

## 29. Service Responsibility Sâu Hơn

### 29.1. Auth Backend

| Service | Trách nhiệm chính | Không nên chứa |
| --- | --- | --- |
| `AuthService` | login, register candidate, tạo token auth chính | đăng ký owner, update profile, upload avatar |
| `OwnerRegistrationService` | đăng ký chủ công ty, tạo công ty, chi nhánh, minh chứng, membership owner | login candidate hoặc logic dashboard |
| `AuthUserProfileService` | `getMe`, `updateMe`, `updateAvatar`, map profile user | tạo công ty hoặc tạo HR |
| `JwtService` | generate/validate token | query business domain |
| `AppUserDetailsService` | load user cho Spring Security | logic công ty/candidate |

Tư duy báo cáo:

```text
AuthService = xác thực tài khoản hệ thống
OwnerRegistrationService = onboarding doanh nghiệp
AuthUserProfileService = thông tin user đang đăng nhập
```

### 29.2. Candidate Backend

| Service | Trách nhiệm chính |
| --- | --- |
| `CandidateProfileService` | orchestration hồ sơ ứng viên, gọi content/attachment/mapper/index khi cần |
| `CandidateProfileAccessService` | kiểm tra hồ sơ thuộc user nào, tránh sửa hồ sơ người khác |
| `CandidateProfileContentService` | CRUD học vấn, kinh nghiệm, chứng chỉ, kỹ năng, ngành nghề |
| `CandidateProfileAttachmentService` | xử lý liên kết item vào từng hồ sơ, selection A/B/C |
| `CandidateProfileMapper` | map entity sang DTO |
| `CandidateProfileResponseAssembler` | assemble response đầy đủ cho profile |
| `CandidateJobApplicationService` | ứng tuyển, xem trạng thái ứng tuyển, list đơn của candidate |

Điểm hay của thiết kế:

- Một user có nhiều hồ sơ.
- Một học vấn/chứng chỉ/kinh nghiệm có thể tồn tại ở cấp user.
- Bảng liên kết hồ sơ-item quyết định item nào gắn vào hồ sơ nào.
- Vì vậy explanation matching phải dựa vào item được gắn với hồ sơ, không nên lấy toàn bộ kinh nghiệm của user.

### 29.3. Company Backend

| Service | Trách nhiệm chính |
| --- | --- |
| `CompanyAdminAccessService` | xác định user thuộc công ty nào, role gì, có quyền trên chi nhánh/job không |
| `CompanyAdminProfileService` | thông tin công ty, logo, chi nhánh, resubmit |
| `CompanyAdminProofService` | upload minh chứng công ty |
| `CompanyAdminJobService` | CRUD tin tuyển dụng theo công ty/chi nhánh |
| `CompanyAdminApplicationService` | list/detail/update status đơn ứng tuyển |
| `CompanyAdminPackageService` | gói tuyển dụng, đăng ký gói, payment payload |
| `CompanyHrManagementService` | tạo/sửa/xóa HR nội bộ công ty |
| `CompanyAdminService` | facade mỏng nếu controller cần gom service |

Guard quan trọng:

- Không chỉ check user login.
- Phải check user có membership trong `ThanhVienCongTy`.
- Phải check role owner/hr theo action.
- Phải check công ty đã `APPROVED` với các action bị khóa khi pending/rejected.
- Phải check chi nhánh/job thuộc công ty đang thao tác.

### 29.4. Admin Backend

| Service | Trách nhiệm chính |
| --- | --- |
| `AdminStatsService` | thống kê dashboard admin |
| `AdminUserService` | list user, khóa/mở, delete user |
| `AdminCompanyService` | list/detail/approve/reject công ty |
| `AdminJobService` | list/detail/approve/reject/hide job |
| `AdminCandidateProofService` | duyệt/từ chối học vấn/chứng chỉ candidate |
| `AdminPackageService` | CRUD gói, list đăng ký gói |
| `AdminCatalogService` | CRUD vai trò hệ thống, vai trò công ty, loại tài liệu, loại chứng chỉ |
| `AdminSettingsService` | cấu hình admin |
| `AdminSearchIndexService` | health Elasticsearch, reindex jobs/profiles/experiences |

Khi có bug admin:

- Nếu bug hiển thị dữ liệu: kiểm tra service tương ứng trước.
- Nếu bug quyền: kiểm tra `requireAdmin()` trong controller/service.
- Nếu bug status không đổi: kiểm tra method approve/reject/hide và transaction.
- Nếu bug frontend không reload: kiểm tra hook action có gọi lại `fetchData` không.

## 30. Data Flow Theo Entity

### 30.1. NguoiDung

```text
NguoiDung
-> role hệ thống: CANDIDATE hoặc ADMIN
-> có thể là candidate bình thường
-> cũng có thể là owner/hr của công ty thông qua ThanhVienCongTy
```

Các nơi dùng:

- Auth login/getMe/updateMe.
- Candidate profile lấy hồ sơ theo user.
- Company membership xác định owner/hr.
- Chat xác định người gửi/nhận.
- Notification gắn với user nhận.

Điểm dễ nhầm:

- Owner đăng ký công ty không nhất thiết phải có role hệ thống riêng là `OWNER`.
- Quyền owner/hr nằm ở vai trò công ty, không phải chỉ role hệ thống.

### 30.2. CongTy Và ChiNhanhCongTy

```text
CongTy
-> có nhiều ChiNhanhCongTy
-> có nhiều ThanhVienCongTy
-> có nhiều TepMinhChungCongTy
-> có nhiều DangKyGoiCongTy
-> có nhiều TinTuyenDung thông qua chi nhánh
```

Trạng thái công ty ảnh hưởng:

- `PENDING`: vừa đăng ký, chờ admin duyệt.
- `APPROVED`: được dùng chức năng company-admin đầy đủ.
- `REJECTED`: bị từ chối, có thể resubmit nếu flow hỗ trợ.

Khi báo cáo:

- Công ty là entity trung tâm của phân hệ nhà tuyển dụng.
- Chi nhánh giúp phân quyền/lọc job/applications theo địa điểm tuyển dụng.
- HR có thể bị giới hạn theo công ty và các rule truy cập.

### 30.3. TinTuyenDung

```text
TinTuyenDung
-> thuộc một chi nhánh công ty
-> có kỹ năng yêu cầu qua KyNangTinTuyenDung
-> có đơn ứng tuyển DonUngTuyen
-> có chỉ mục Elasticsearch để search public
-> có chỉ mục Qdrant để semantic matching
```

Vòng đời thường gặp:

```text
Company tạo job
-> job ở trạng thái draft/pending theo rule hiện tại
-> admin duyệt
-> job public search được
-> candidate apply
-> HR xem applications
-> HR update status
```

Điểm debug:

- Job không hiện public: kiểm tra status admin duyệt.
- Job không hiện dropdown chi nhánh: kiểm tra query list jobs theo branch/company.
- Job không có matching: kiểm tra Qdrant job index.
- Job search text không thấy: kiểm tra Elasticsearch index/fallback.

### 30.4. HoSoUngVien

```text
HoSoUngVien
-> thuộc NguoiDung
-> có summary/mục tiêu/ngành nghề/kỹ năng
-> liên kết học vấn qua HoSoHocVan
-> liên kết chứng chỉ qua HoSoChungChi
-> liên kết kinh nghiệm qua HoSoKinhNghiem
-> có chỉ mục Qdrant profile
```

Tư duy multi-profile:

- User có thể có hồ sơ Backend, hồ sơ Data, hồ sơ QA.
- Một kinh nghiệm A có thể gắn vào hồ sơ Backend nhưng không gắn vào hồ sơ Data.
- Matching/explanation đúng phải đọc theo hồ sơ được chọn.
- Nếu lấy toàn bộ kinh nghiệm user thì explanation có thể sai ngữ cảnh.

### 30.5. DonUngTuyen

```text
DonUngTuyen
-> thuộc Candidate/User
-> thuộc TinTuyenDung
-> thường gắn HoSoUngVien đã dùng để apply
-> có status xử lý
-> có thể được index Qdrant cho application matching nếu tin không bắt buộc CV
-> nếu tin bắt buộc CV thì chỉ lưu cvUrl cho HR tải, không đọc PDF và không index vào Qdrant
```

Use case:

- Candidate xem lịch sử ứng tuyển.
- HR/company-admin xem danh sách đơn.
- HR lọc theo chi nhánh/job/status.
- HR chạy application matching để xếp hạng đơn đã nộp.
- HR mở chat từ đơn ứng tuyển.

### 30.6. Notification

```text
Event nghiệp vụ
-> NotificationService tạo ThongBao cho user nhận
-> frontend gọi unread-count
-> header/sidebar hiển thị badge/chấm đỏ
-> user mark read/read all/delete
```

Event thường tạo notification:

- Admin duyệt/từ chối công ty.
- Admin duyệt/từ chối job.
- Admin duyệt/từ chối minh chứng candidate.
- HR cập nhật trạng thái đơn ứng tuyển.
- Tin nhắn mới nếu flow chat có tích hợp notification.

### 30.7. Chat

```text
CuocTroChuyen
-> gắn candidate và recruiter/company context
-> có TinNhan
-> REST API load list/messages/send
-> WebSocket publish realtime event
```

Ba cách mở chat:

- Candidate mở chat từ job detail.
- HR mở chat từ application.
- HR mở chat từ semantic candidate profile chưa apply.

Điểm debug:

- REST gửi được nhưng realtime không thấy: kiểm tra WebSocket config/handler/session.
- Conversation duplicate: kiểm tra logic find-or-create trong `ChatService`.
- Sai người nhận: kiểm tra partner mapping trong response mapper.

## 31. Semantic Matching Và Indexing Chi Tiết

### 31.1. Bốn Loại Chỉ Mục

| Collection/Index | DB tracking entity | Service index | Dùng cho |
| --- | --- | --- | --- |
| Job Qdrant | `ChiMucNhungTinTuyenDung` | `JobEmbeddingIndexService` | tìm candidate/profile/application phù hợp với job |
| Profile Qdrant | `ChiMucNhungHoSoUngVien` | `CandidateProfileEmbeddingIndexService` | recommended jobs, candidate matching |
| Application Qdrant | `ChiMucNhungDonUngTuyen` | `ApplicationEmbeddingIndexService` | xếp hạng các đơn đã nộp |
| Experience Qdrant | `ChiMucNhungKinhNghiem` | `KinhNghiemEmbeddingIndexService` | hỗ trợ giải thích và truy vấn kinh nghiệm |

Ý nghĩa:

- Qdrant giữ vector để search gần nghĩa.
- DB tracking entity giữ thông tin record nào đã được index, thời điểm nào, payload id nào.
- Reindex dùng để tạo lại vector khi logic text embedding thay đổi.

### 31.2. Khi Nào Index Hồ Sơ

Các thời điểm hợp lý:

- Tạo hồ sơ mới.
- Update summary/mục tiêu/ngành nghề/kỹ năng.
- Thêm/sửa/xóa học vấn liên kết với hồ sơ.
- Thêm/sửa/xóa chứng chỉ liên kết với hồ sơ.
- Thêm/sửa/xóa kinh nghiệm liên kết với hồ sơ.
- Chạy admin reindex toàn bộ.
- Candidate bấm sync index thủ công nếu UI có nút.

Điểm đã thống nhất:

- Reindex toàn bộ hồ sơ sẽ nhét phần kinh nghiệm vào vector hồ sơ nếu logic build text hồ sơ đã đọc kinh nghiệm.
- Nếu tính năng kinh nghiệm mới được thêm sau khi hồ sơ đã tồn tại, cần reindex để vector profile cũ cập nhật.
- Index riêng kinh nghiệm chỉ tạo collection kinh nghiệm, nhưng nếu không có luồng sử dụng thì chưa trực tiếp ảnh hưởng ranking.

### 31.3. Khi Nào Index Kinh Nghiệm

Các thời điểm hợp lý:

- Tạo kinh nghiệm mới.
- Cập nhật kinh nghiệm.
- Gắn kinh nghiệm hiện có vào hồ sơ nếu logic explanation/matching cần profile-specific experience.
- Chạy `POST /api/v1/admin/qdrant/reindex/experiences`.

Với dữ liệu cũ:

```text
Hồ sơ đã tồn tại trước khi có index kinh nghiệm
-> chạy reindex experiences để tạo collection kinh nghiệm
-> chạy reindex jobs-profiles để profile vector có text kinh nghiệm mới
-> test lại matching/explanation ở company-admin
```

### 31.4. Matching Candidate Chưa Apply

```text
HR chọn chi nhánh
-> chọn tin tuyển dụng
-> mở tab tìm ứng viên phù hợp
-> frontend gọi GET /company-admin/jobs/{jobId}/candidate-matches
-> backend lấy job, kiểm tra quyền công ty/chi nhánh
-> SemanticMatchingService lấy vector job
-> search Qdrant profile collection
-> enrich kết quả bằng DB: hồ sơ, user, skills, industries, experience
-> scoring service kết hợp semantic score + signals
-> explanation service tạo lý do phù hợp
-> frontend render score, tín hiệu khớp, điểm mạnh, cần kiểm tra, kinh nghiệm liên quan
```

Ý nghĩa nghiệp vụ:

- Dùng được ngay cả khi job chưa có ai nộp đơn.
- Phù hợp với chức năng chủ động tìm ứng viên.
- Không phụ thuộc bảng đơn ứng tuyển.

### 31.5. Matching Application Đã Apply

```text
HR chọn job
-> mở tab xếp hạng đơn
-> frontend gọi GET /company-admin/jobs/{jobId}/application-matches
-> backend lấy các DonUngTuyen của job
-> đơn không bắt buộc CV được đảm bảo có application vector rồi search/rank theo Qdrant
-> đơn của tin bắt buộc CV được ghi `SKIPPED`, không tham gia ranking tự động
-> enrich bằng hồ sơ ứng viên đã nộp
-> trả ranking và explanation
```

Frontend hiện tại không gọi/không hiển thị ranking đơn cho job bắt buộc CV. Tuy nhiên tab `AI theo tin` vẫn gọi candidate matching để tìm ứng viên phù hợp dựa trên hồ sơ ứng viên và tin tuyển dụng.

Ý nghĩa nghiệp vụ:

- Chỉ xếp hạng các ứng viên đã nộp đơn.
- Phù hợp khi HR muốn ưu tiên đơn trong pipeline hiện tại.
- Nếu job chưa ai apply, tab này rỗng là đúng.

### 31.6. Vì Sao Explanation Có Thể Nhắc Đúng Kinh Nghiệm A, Không Nhắc B

Thiết kế đúng cần theo nguyên tắc:

```text
User có kinh nghiệm A và B
Hồ sơ C chỉ gắn kinh nghiệm A
Candidate dùng hồ sơ C để apply hoặc được match theo hồ sơ C
-> explanation chỉ nên lấy kinh nghiệm qua HoSoKinhNghiem của hồ sơ C
-> không lấy toàn bộ KinhNghiemLamViecUngVien của user
```

Nếu explanation nhắc B trong khi hồ sơ C không gắn B, cần kiểm tra:

- Query kinh nghiệm trong `SemanticCandidateExplanationService`.
- Mapper/assembler của profile detail.
- Payload Qdrant profile có build từ toàn bộ user experience hay chỉ selected profile experience.
- Khi update selection có trigger sync/reindex hồ sơ không.

## 32. Frontend State Flow Chi Tiết

### 32.1. Pattern Chuẩn Một Màn Hình Admin

```text
page.tsx
-> render Client component
-> Client component gọi hook data + hook actions
-> hook data gọi service.list/filter
-> hook actions gọi service mutate
-> sau mutate gọi reload hoặc cập nhật state local
-> component table/modal nhận props và render
```

Ví dụ users:

```text
app/admin/users/page.tsx
-> UsersAdminClient
-> useAdminUsersData
-> useAdminUsersActions
-> adminUsersService
-> /api/v1/admin/users
-> AdminUserController
-> AdminUserService
```

Lý do tách như vậy:

- Page không chứa logic API.
- Hook giữ state màn hình.
- Service là nơi duy nhất biết endpoint.
- Component bảng/modal chỉ render và emit event.

### 32.2. Pattern Chuẩn Company Admin Applications

```text
CompanyAdminApplicationsClient
-> useCompanyAdminApplicationsData: filters, branches, jobs, applications
-> useCompanyAdminApplicationsActions: update status, open detail, send interview email
-> useApplicationsMatchingPreview: matching mode, selected job, fetch ranking
-> companyAdminApplicationsService
-> companyAdminJobsService
```

Điểm state cần giữ:

- `selectedBranchId`: chi nhánh đang lọc.
- `selectedJobId`: job đang lọc hoặc dùng để matching.
- `status`: trạng thái đơn.
- `applications`: list đơn đã nộp.
- `jobs`: list tin tuyển dụng lấy theo chi nhánh.
- `matchingMode`: candidate matching hoặc application matching.
- `selectedApplication`: đơn đang mở detail hoặc gửi mail phỏng vấn.
- `thoiGianGuiThuMoi`: timestamp backend trả về để render badge phụ, không phải trạng thái chính.

QA quan trọng:

- Đổi chi nhánh phải reload jobs theo chi nhánh.
- Nếu job mới tạo chưa có ai apply, dropdown vẫn có job.
- Nếu applications rỗng, matching candidate vẫn chạy được khi có job.
- Nếu không chọn job, nút matching nên disabled hoặc báo cần chọn job.

### 32.3. Pattern Chuẩn Candidate Profile

```text
Profile page
-> useCandidateProfileSession: auth/user session
-> useCandidateProfileData: load profile/metadata
-> useCandidateProfileSummaryActions: summary
-> useCandidateProfileContentActions: education/certificate/experience
-> useCandidateProfilePreferenceActions: skills/industries
-> useCandidateProfileMediaActions: avatar/proof upload
-> candidateProfileService + authService
```

Điểm state:

- `selectedProfileId`: hồ sơ đang chỉnh.
- `profile`: dữ liệu hồ sơ hiện tại.
- `metadata`: skills, industries, certificate types.
- `modalState`: đang mở modal nào.
- `saving`: chống double submit.
- `fieldErrors`: lỗi validate tại UI.

Rule upload proof:

- Modal học vấn/chứng chỉ phải validate proof trước khi gọi service save.
- Lỗi đỏ gắn ngay `ProofUploadBox`.
- Khi file upload xong mới có URL để gửi payload.

### 32.4. Pattern Chuẩn Public Job Detail

```text
JobDetailClient
-> useJobDetail(jobId)
-> load job detail public
-> nếu có token: load apply status + favorite status
-> user bấm apply
-> mở JobApplyModal
-> chọn hồ sơ/CV
-> candidateApplicationService.apply
-> reload status
```

Các trạng thái UI:

- Loading job.
- Job not found hoặc không public.
- User chưa đăng nhập: CTA chuyển login.
- User đã apply: disable/đổi label.
- Apply thành công: cập nhật trạng thái và có thể hiện chat.

## 33. Sequence Theo Luồng Báo Cáo

### 33.1. Candidate Đăng Ký Và Hoàn Thiện Hồ Sơ

```text
CandidateRegisterForm
-> authService.registerCandidate
-> POST /api/v1/auth/register
-> AuthController.register
-> AuthService.register
-> NguoiDung + role candidate
-> user login
-> Profile page
-> CandidateProfileController.createProfile
-> CandidateProfileService
-> update summary/skills/industries
-> create education/certificate/experience
-> upload proof qua Cloudinary signature
-> sync profile index
```

Điểm nói khi demo:

- Đăng ký chỉ tạo tài khoản.
- Hồ sơ ứng viên là bước riêng để phục vụ matching.
- Minh chứng học vấn/chứng chỉ phải upload file.
- Hồ sơ có thể được đồng bộ vector để đề xuất việc làm.

### 33.2. Owner Đăng Ký Công Ty

```text
OwnerRegisterClient
-> useOwnerRegister validate form
-> authService.registerOwner
-> POST /api/v1/auth/register-owner
-> AuthController.registerOwner
-> OwnerRegistrationService
-> tạo NguoiDung
-> tạo CongTy
-> tạo ChiNhanhCongTy
-> tạo TepMinhChungCongTy
-> tạo ThanhVienCongTy role OWNER
-> công ty ở PENDING
-> admin duyệt công ty
```

Điểm nói khi demo:

- Owner là membership trong công ty, không chỉ là role hệ thống.
- Công ty pending sẽ bị giới hạn chức năng.
- Admin là điểm kiểm soát rủi ro doanh nghiệp.

### 33.3. Company Tạo Tin Và Admin Duyệt

```text
CompanyAdminJobsClient
-> JobFormModal
-> companyAdminJobsService.createJob
-> POST /api/v1/company-admin/jobs
-> CompanySubAdminController.createJob
-> CompanyAdminJobService.createJob
-> check company approved + package + branch
-> lưu TinTuyenDung + skills
-> admin jobs screen
-> adminJobsService.approveJob
-> PATCH /api/v1/admin/jobs/{jobId}/approve
-> AdminJobService.approveJob
-> index Elasticsearch/Qdrant nếu service có trigger
-> public job search thấy job
```

Điểm QA:

- Không có gói thì không tạo được job.
- Công ty chưa duyệt thì không tạo được job.
- Job tạo ở chi nhánh nào thì filter chi nhánh đó thấy.
- Admin duyệt xong mới public.

### 33.4. Candidate Apply Và HR Xử Lý

```text
JobApplyModal
-> candidateApplicationService.apply
-> POST /api/v1/candidate/applications/jobs/{jobId}
-> CandidateJobApplicationController.apply
-> CandidateJobApplicationService.apply
-> tạo DonUngTuyen
-> index application nếu logic bật
-> HR vào /company-admin/applications
-> companyAdminApplicationsService.listApplications
-> HR xem detail
-> update status
-> NotificationService báo candidate
```

Điểm QA:

- Candidate không thể apply trùng nếu backend có guard.
- HR chỉ thấy đơn thuộc công ty/chi nhánh/job được phép.
- Đổi trạng thái phải phản ánh ở candidate application history.
- Notification unread count tăng cho candidate.

### 33.5. HR Tìm Ứng Viên Phù Hợp Chưa Apply

```text
CompanyAdminApplicationsClient
-> chọn chi nhánh
-> chọn job
-> ApplicationsMatchingSection chọn candidate mode
-> companyAdminJobsService.getCandidateMatches
-> GET /api/v1/company-admin/jobs/{jobId}/candidate-matches
-> SemanticMatchingService
-> Qdrant search profile collection
-> SemanticMatchSignalService lấy skills/industries/experience
-> SemanticCandidateExplanationService tạo lý do
-> render ApplicationCandidateMatchesTable + ApplicationMatchInsightPanel
```

Điểm nói khi báo cáo:

- Đây là tính năng tìm kiếm chủ động.
- Không cần ứng viên đã apply.
- Kết quả gồm điểm, tín hiệu khớp, điểm mạnh, phần cần kiểm tra, kinh nghiệm liên quan.

### 33.6. HR Xếp Hạng Các Đơn Đã Nộp

```text
CompanyAdminApplicationsClient
-> chọn job
-> ApplicationsMatchingSection chọn application mode
-> companyAdminJobsService.getApplicationMatches
-> GET /api/v1/company-admin/jobs/{jobId}/application-matches
-> SemanticMatchingService
-> lấy application vectors hoặc dữ liệu đơn
-> rank các DonUngTuyen của job
-> render ranking
```

Điểm nói khi báo cáo:

- Đây là tính năng hỗ trợ sàng lọc pipeline.
- Nếu job chưa có đơn thì danh sách rỗng là đúng.
- Khác với candidate matching là không quét toàn bộ hồ sơ candidate.

### 33.7. Công Ty Mua Gói Qua SePay

```text
CompanyAdminPackagesClient
-> companyAdminPackagesService.registerPackage
-> POST /api/v1/company-admin/packages
-> CompanyAdminPackageService.registerPackage
-> tạo DangKyGoiCongTy pending + payment code
-> frontend hiển thị QR/thông tin chuyển khoản
-> SePay gọi POST /api/v1/payments/sepay/webhook
-> SepayWebhookController
-> SepayWebhookService verify secret/content/amount
-> cập nhật đăng ký gói paid/active
-> company-admin reload package overview
```

Điểm QA:

- Webhook hợp lệ mới active gói.
- Webhook lặp lại không được nhân đôi thời hạn/gói.
- Chưa active gói thì tạo job bị chặn.

## 34. Debug Guide Theo Triệu Chứng

### 34.1. Home Không Hiện Việc Làm Phù Hợp

Kiểm tra theo thứ tự:

1. User đã đăng nhập chưa.
2. User có hồ sơ ứng viên chưa.
3. Frontend `useRecommendedJobs` có bỏ render khi chưa login/no profile không.
4. API `GET /candidate/profile/recommended-jobs` có trả 401/404/empty không.
5. Profile đã được index Qdrant chưa.
6. Job public đã được index Qdrant chưa.
7. Qdrant properties/collection có đúng không.

Kết luận nghiệp vụ:

- Không login hoặc không có hồ sơ thì không render block là đúng.
- Có hồ sơ nhưng empty thì kiểm tra vector/index/job status.

### 34.2. Admin Không Thấy Minh Chứng Candidate

Kiểm tra:

1. Frontend profile có bắt buộc upload file trước khi lưu không.
2. Payload lưu học vấn/chứng chỉ có URL minh chứng không.
3. Record học vấn/chứng chỉ có status `PENDING` không.
4. `AdminCandidateProofService` query đúng type education/certificate không.
5. Admin filter có đang lọc sai status/type không.
6. URL Cloudinary có lưu được không.

Triệu chứng thường gặp:

- User lưu item không có URL, admin không có gì để duyệt.
- Status vẫn `UNVERIFIED`, admin screen chỉ lọc `PENDING`.
- Frontend upload thành công nhưng save payload không gửi URL.

### 34.3. HR Chỉ Thấy Một Job Trong Dropdown

Kiểm tra:

1. Dropdown đang lấy jobs từ applications hay từ company jobs.
2. API jobs có filter branchId đúng không.
3. Backend `CompanyAdminJobService.listJobs` có trả job chưa có đơn không.
4. UI có lọc lại chỉ các job trong applications không.
5. Job mới tạo có thuộc chi nhánh đang chọn không.
6. User HR có quyền thấy chi nhánh/job đó không.

Rule đúng:

- Dropdown tin tuyển dụng trong applications phải lấy theo chi nhánh.
- Không lấy từ danh sách đơn ứng tuyển.
- Job chưa có ai apply vẫn phải hiện để chạy semantic candidate matching.

### 34.4. Matching Có Điểm Nhưng Explanation Sai

Kiểm tra:

1. Kết quả Qdrant trả đúng profile/application id không.
2. Enrich DB lấy đúng `HoSoUngVien` không.
3. Experience query lấy theo profile selection hay toàn bộ user.
4. Skills/industries map đúng id/name không.
5. Frontend `ApplicationMatchInsightPanel` render đúng field response không.
6. Có cache/vector cũ chưa reindex không.

Hướng xử lý:

- Nếu text explanation nhắc dữ liệu cũ, chạy reindex profile/experience.
- Nếu nhắc kinh nghiệm không gắn profile, sửa query explanation về relation profile-item.
- Nếu score lạ, kiểm tra `SemanticMatchScoringService`.

### 34.5. Reindex Experience Không Thấy Collection

Kiểm tra:

1. Đã gọi đúng `POST /api/v1/admin/qdrant/reindex/experiences` chưa.
2. API cần token admin.
3. Có dữ liệu `KinhNghiemLamViecUngVien` trong DB không.
4. Qdrant URL/API key/collection config đúng không.
5. Log `KinhNghiemEmbeddingIndexService` có lỗi embedding không.
6. Python embedding service có chạy không nếu hệ thống dùng HTTP embedding.

Phân biệt:

- `reindex/jobs-profiles` không thay thế cho `reindex/experiences` nếu muốn collection kinh nghiệm riêng.
- `reindex/experiences` tạo vector kinh nghiệm riêng nhưng không tự đảm bảo profile vector đã chứa kinh nghiệm.
- Muốn profile vector chứa kinh nghiệm mới thì cần reindex profiles.

### 34.6. Job Public Không Search Thấy

Kiểm tra:

1. Job đã được admin approve chưa.
2. Công ty có approved không.
3. Job có bị hide/reject không.
4. Elasticsearch health có OK không.
5. `POST /admin/elasticsearch/reindex/jobs` đã chạy chưa.
6. Public fallback JPA có trả không.
7. Frontend filter có đang loại job ra không.

Nói khi báo cáo:

- Search public là tổ hợp status business + search infrastructure.
- Nếu infra search lỗi, JPA fallback giúp không mất hoàn toàn dữ liệu.

### 34.7. Company Admin Bị Khóa Chức Năng

Kiểm tra:

1. `GET /company-admin/me` trả công ty status gì.
2. User có membership trong `ThanhVienCongTy` không.
3. Role company là owner/hr gì.
4. Công ty có gói active không nếu action là tạo job.
5. Frontend có render `CompanyAdminRestrictedNotice` không.
6. Backend access service throw 403 ở action nào.

Rule:

- Auth token hợp lệ chưa đủ.
- Phải có company membership.
- Một số action cần company approved.
- Một số action cần owner role.
- Tạo job còn cần package.

### 34.8. Notification Badge Không Tăng

Kiểm tra:

1. Event có gọi `NotificationService` không.
2. Notification gắn đúng `nguoiNhan` không.
3. Header/sidebar có gọi `getUnreadCount` sau event không.
4. Mark read có set đúng trạng thái đã đọc không.
5. User đang login đúng tài khoản nhận thông báo không.

Ví dụ:

- HR đổi trạng thái đơn, candidate mới là người nhận.
- Admin duyệt công ty, owner mới là người nhận.
- Admin duyệt job, company owner/HR liên quan là người nhận tùy rule.

## 35. Checklist Bảo Vệ Đồ Án Theo Chức Năng

### 35.1. Khi Giảng Viên Hỏi "Hệ Thống Có Những Actor Nào?"

Trả lời:

- Candidate: tìm việc, lưu việc, nộp đơn, quản lý hồ sơ, nhận thông báo, chat.
- Company Owner: đăng ký công ty, quản lý công ty, mua gói, tạo HR, tạo tin, xem ứng viên.
- HR: quản lý tin/ứng viên theo quyền công ty, chat với ứng viên, dùng matching.
- Admin: duyệt công ty, duyệt tin, duyệt minh chứng, quản lý user, gói, catalog, index.

Code để chỉ:

- Frontend route: `recruit_frontend/app`.
- Backend controller: `recruit/.../controller`.
- Backend service: `recruit/.../service`.
- Entity: `recruit/.../domain`.

### 35.2. Khi Hỏi "Vì Sao Tách Service?"

Trả lời:

- Controller chỉ nhận request và trả response.
- Service chứa business rule và transaction.
- Repository chỉ truy cập DB.
- DTO giữ contract API, tránh trả thẳng entity.
- Những service lớn như admin/auth/candidate profile đã được tách để dễ đọc và dễ báo cáo.

Ví dụ:

- `AuthService` không ôm đăng ký owner nữa, owner registration nằm ở `OwnerRegistrationService`.
- `CandidateProfileController` không ôm toàn bộ 110 symbol nữa, education/experience/certificate có controller riêng.
- `AdminService` không ôm residual logic, các service con xử lý theo domain.

### 35.3. Khi Hỏi "AI Matching Hoạt Động Như Thế Nào?"

Trả lời ngắn:

```text
Hệ thống chuyển job/profile/application/experience thành text có cấu trúc
-> gọi embedding model để biến text thành vector
-> lưu vector vào Qdrant
-> khi HR cần tìm ứng viên, hệ thống search vector gần nhất
-> sau đó enrich bằng dữ liệu DB như kỹ năng, ngành nghề, kinh nghiệm
-> trả điểm và giải thích lý do phù hợp
```

Các class để chỉ:

- `TextEmbeddingService`
- `PythonHttpEmbeddingService`
- `JobEmbeddingIndexService`
- `CandidateProfileEmbeddingIndexService`
- `ApplicationEmbeddingIndexService`
- `KinhNghiemEmbeddingIndexService`
- `SemanticMatchingService`
- `SemanticMatchScoringService`
- `SemanticMatchSignalService`
- `SemanticCandidateExplanationService`

### 35.4. Khi Hỏi "Tại Sao Cần Elasticsearch Và Qdrant?"

Trả lời:

- Elasticsearch dùng cho search text job public: keyword, filter, sort, full-text.
- Qdrant dùng cho semantic matching: so khớp ý nghĩa giữa job và hồ sơ/đơn.
- Hai hệ thống giải quyết hai bài toán khác nhau.

Ví dụ:

- User gõ "Java Backend" ở trang jobs: Elasticsearch phù hợp.
- HR muốn tìm hồ sơ giống yêu cầu job dù candidate không gõ đúng từ khóa: Qdrant phù hợp.

### 35.5. Khi Hỏi "Minh Chứng Được Duyệt Ra Sao?"

Trả lời:

```text
Candidate upload file minh chứng
-> frontend lấy Cloudinary signature
-> upload file lên Cloudinary
-> lưu URL vào học vấn/chứng chỉ
-> trạng thái chờ duyệt
-> admin xem danh sách minh chứng
-> admin approve/reject
-> candidate thấy trạng thái trong hồ sơ
```

Điểm bảo vệ:

- Không lưu file trong DB.
- Backend lưu URL và trạng thái.
- Admin là người xác thực minh chứng.
- UI không cho lưu nếu chưa upload file.

### 35.6. Khi Hỏi "Phân Quyền Công Ty Có Chặt Không?"

Trả lời:

- User login chỉ xác thực danh tính.
- Công ty dùng `ThanhVienCongTy` để biết user thuộc công ty nào.
- `VaiTroCongTy` quyết định owner/hr.
- Service access kiểm tra công ty, role, chi nhánh, job trước khi thao tác.
- Công ty chưa approved hoặc chưa có gói sẽ bị chặn các action nhạy cảm.

Code để chỉ:

- `CompanyAdminAccessService`
- `CompanyRoleAuthorizationAspect`
- `HasCompanyRole`
- `CompanySecurityService`
- `CompanyAdminProfileService.getMe`

### 35.7. Khi Hỏi "Thanh Toán Có Tự Động Không?"

Trả lời:

- Company chọn gói và nhận thông tin chuyển khoản/QR.
- Khi chuyển khoản thành công, SePay gọi webhook về backend.
- Backend verify webhook rồi active gói.
- Frontend reload package overview để thấy gói hiện tại.

Code để chỉ:

- `CompanyAdminPackageService`
- `SepayPaymentService`
- `SepayWebhookController`
- `SepayWebhookService`
- `CompanyAdminPackagesClient`
- `SepayPaymentSection`

## 36. Quy Trình Thêm/Sửa Chức Năng Không Làm Vỡ Hệ Thống

### 36.1. Thêm Một API Backend

Checklist:

1. Xác định actor: public, candidate, company-admin, admin.
2. Đặt endpoint đúng prefix hiện có.
3. Tạo request/response DTO nếu cần.
4. Controller chỉ nhận request, check principal/role cơ bản, gọi service.
5. Service xử lý business rule, transaction, ownership.
6. Repository chỉ query DB.
7. Không đổi entity/schema nếu chưa có yêu cầu rõ.
8. Frontend thêm method vào service domain, không gọi `apiClient` trực tiếp trong page.
9. Hook gọi service và quản lý loading/error.
10. Component chỉ render.

### 36.2. Sửa Một Màn Hình Frontend

Checklist:

1. Đọc `page.tsx` để biết client chính.
2. Đọc hook data/actions của màn hình.
3. Đọc service domain tương ứng.
4. Sửa component nhỏ nhất có thể.
5. Nếu cần API mới, thêm vào service trước.
6. Giữ loading/empty/error state.
7. Kiểm tra mobile nếu màn hình public/profile.
8. Kiểm tra table/filter/modal nếu màn hình admin/company-admin.

### 36.3. Sửa Matching

Checklist:

1. Xác định sửa ranking, signal hay explanation.
2. Ranking: đọc `SemanticMatchingService` và `SemanticMatchScoringService`.
3. Signal: đọc `SemanticMatchSignalService`.
4. Explanation: đọc `SemanticCandidateExplanationService`.
5. Index text: đọc các `*EmbeddingIndexService`.
6. Nếu text index đổi, cần reindex dữ liệu cũ.
7. Frontend matching UI đọc `ApplicationsMatchingSection` và `ApplicationMatchInsightPanel`.

### 36.4. Sửa Candidate Profile

Checklist:

1. Xác định sửa profile tổng, học vấn, kinh nghiệm, chứng chỉ, kỹ năng hay ngành nghề.
2. Profile tổng: `CandidateProfileController`.
3. Học vấn: `CandidateEducationController`.
4. Kinh nghiệm: `CandidateExperienceController`.
5. Chứng chỉ: `CandidateCertificateController`.
6. Service chính: `CandidateProfileService` và `CandidateProfileContentService`.
7. Link item vào hồ sơ: `CandidateProfileAttachmentService`.
8. Frontend: `app/profile/components` và `app/profile/hooks`.
9. Nếu dữ liệu ảnh hưởng matching, kiểm tra sync index.

## 37. Bảng Nhớ Nhanh Khi Đọc Source

| Muốn hiểu | Đọc frontend | Đọc backend |
| --- | --- | --- |
| Login/register | `app/auth` + `services/auth/auth.service.ts` | `AuthController`, `AuthService`, `OwnerRegistrationService` |
| Header/home | `app/components/home` | `PublicJobController`, `PublicCompanyController`, `NotificationController` |
| Search jobs | `app/jobs` | `PublicJobService`, `PublicJobElasticsearchSearchService` |
| Job detail/apply | `app/jobs/[id]` | `CandidateJobApplicationService`, `PublicJobService` |
| Favorite jobs | `app/favorite-jobs` | `CandidateFavoriteJobService` |
| Candidate profile | `app/profile` | candidate controllers/services |
| Company shell | `app/company-admin/components` | `CompanyAdminProfileService`, `CompanyAdminAccessService` |
| Company jobs | `app/company-admin/jobs` | `CompanyAdminJobService` |
| Company applications | `app/company-admin/applications` | `CompanyAdminApplicationService`, semantic services |
| Company packages | `app/company-admin/packages` | `CompanyAdminPackageService`, SePay services |
| Company settings | `app/company-admin/settings` | `CompanyAdminProfileService`, `CompanyAdminProofService` |
| HR management | `app/company-admin/hr` | `CompanyHrManagementService` |
| Admin users | `app/admin/users` | `AdminUserService` |
| Admin companies | `app/admin/companies` | `AdminCompanyService` |
| Admin jobs | `app/admin/jobs` | `AdminJobService` |
| Admin proofs | `app/admin/candidate-proofs` | `AdminCandidateProofService` |
| Admin packages | `app/admin/plans` | `AdminPackageService` |
| Admin catalogs | `app/admin/catalogs` | `AdminCatalogService` |
| Chat | `app/messages`, `app/company-admin/messages`, `components/chat` | `ChatController`, `ChatService`, websocket package |
| Notifications | header/sidebar consumers | `NotificationController`, `NotificationService` |
| Search index admin | admin tools/API caller | `AdminSearchIndexService` |

## 38. Những Câu Nên Nói Khi Báo Cáo Code

- "Em giữ controller mỏng, còn business rule nằm trong service."
- "Frontend không gọi API rải rác trong component, mà gom vào `services` theo domain."
- "Phần company-admin không chỉ dựa vào token mà còn kiểm tra membership công ty."
- "Tin tuyển dụng thuộc chi nhánh, nên lọc ứng viên và matching đều đi từ branch/job context."
- "Hồ sơ ứng viên có thể gắn từng học vấn/chứng chỉ/kinh nghiệm khác nhau, nên matching phải theo hồ sơ được chọn."
- "Elasticsearch phục vụ tìm kiếm từ khóa, còn Qdrant phục vụ so khớp ngữ nghĩa."
- "Reindex dùng khi dữ liệu cũ cần cập nhật lại vector sau khi thay đổi logic embedding."
- "SePay webhook là điểm xác nhận thanh toán, frontend không tự active gói."
- "Minh chứng học vấn/chứng chỉ bắt buộc upload file trước khi lưu để admin có cơ sở duyệt."
- "Các màn hình admin/company-admin đều có loading, empty, filter, action và service layer rõ ràng."

## 39. Source-Level Walkthrough Theo Chức Năng

Phần này ghi theo kiểu cầm source code lên là trace được ngay. Khi báo cáo, nếu giảng viên hỏi "chức năng này code ở đâu?", đọc theo bảng này.

### 39.1. Đăng Nhập

Frontend:

| File | Vai trò |
| --- | --- |
| `recruit_frontend/app/auth/login/page.tsx` | route login theo App Router |
| `recruit_frontend/app/auth/login/components/LoginForm.tsx` | form nhập email/mật khẩu |
| `recruit_frontend/app/auth/login/hooks/useLoginFlow.ts` | xử lý submit, loading, lỗi, redirect sau login |
| `recruit_frontend/services/auth/auth.service.ts` | gọi `POST /api/v1/auth/login`, `GET /api/v1/auth/me` |
| `recruit_frontend/lib/api-client.ts` | axios/fetch client chung, gắn base URL/token |

Backend:

| File | Vai trò |
| --- | --- |
| `AuthController.java` | nhận `POST /api/v1/auth/login` |
| `LoginRequest.java` | DTO request login |
| `AuthService.java` | kiểm tra thông tin đăng nhập và tạo response |
| `JwtService.java` | sinh JWT |
| `AppUserDetailsService.java` | load user cho Spring Security |
| `JwtAuthenticationFilter.java` | đọc token cho các request sau login |
| `UsersRepository.java` | truy vấn `NguoiDung` theo email/tên đăng nhập |

Pseudo flow:

```text
LoginForm.submit
-> useLoginFlow.handleSubmit
-> authService.login({ emailOrUsername, matKhau })
-> POST /api/v1/auth/login
-> AuthController.login
-> AuthService.login
-> AuthenticationManager/UserDetailsService kiểm tra credential
-> JwtService.generateToken
-> AuthResponse trả token + user
-> frontend lưu token
-> redirect theo role/context
```

QA cần có:

- Sai mật khẩu trả lỗi rõ.
- User bị khóa không login được.
- Token được dùng cho request `/auth/me`.
- Admin vào `/admin`, company member vào `/company-admin`, candidate về home/profile theo rule UI.

### 39.2. Đăng Ký Candidate

Frontend:

| File | Vai trò |
| --- | --- |
| `app/auth/register/candidate/page.tsx` | route đăng ký candidate |
| `CandidateRegisterClient.tsx` | client shell |
| `CandidateRegisterForm.tsx` | form nhập thông tin |
| `useCandidateRegister.ts` | validation, submit, lỗi |
| `services/auth/auth.service.ts` | `authService.registerCandidate` |

Backend:

| File | Vai trò |
| --- | --- |
| `AuthController.java` | `POST /api/v1/auth/register` |
| `RegisterRequest.java` | payload đăng ký |
| `AuthService.java` | tạo user candidate |
| `RoleName.java` | role hệ thống |
| `RolesRepository.java` | lấy role candidate |
| `UsersRepository.java` | kiểm tra trùng và lưu user |

Pseudo flow:

```text
CandidateRegisterForm
-> useCandidateRegister
-> authService.registerCandidate
-> AuthController.register
-> AuthService.register
-> check duplicate account/email
-> encode password
-> assign CANDIDATE role
-> save NguoiDung
-> return AuthResponse or success response
```

Điểm nghiệp vụ:

- Đăng ký candidate chỉ tạo tài khoản.
- Hồ sơ ứng viên được tạo ở phân hệ profile.
- Matching chưa hoạt động tốt nếu candidate chưa có hồ sơ và chưa index.

### 39.3. Đăng Ký Owner/Công Ty

Frontend:

| File | Vai trò |
| --- | --- |
| `app/auth/register/owner/page.tsx` | route đăng ký owner |
| `OwnerRegisterClient.tsx` | client form tổng |
| `OwnerPersonalInfoSection.tsx` | thông tin chủ công ty |
| `OwnerCompanyInfoSection.tsx` | thông tin công ty |
| `OwnerBranchesSection.tsx` | danh sách chi nhánh |
| `OwnerProofUploadSection.tsx` | upload minh chứng công ty |
| `OwnerSubmitBar.tsx` | submit/disabled/loading |
| `useOwnerRegister.ts` | state, validation, upload, submit |
| `services/auth/auth.service.ts` | `registerOwner`, `getCloudinarySignature`, `getProofTypes` |

Backend:

| File | Vai trò |
| --- | --- |
| `AuthController.java` | `POST /api/v1/auth/register-owner` |
| `CompanyMemberController.java` | endpoint tạo employer nội bộ nếu có |
| `CreateOwnerRequest.java` | payload đăng ký owner |
| `CreateOwnerResponse.java` | response đăng ký owner |
| `OwnerRegistrationService.java` | business chính tạo owner + company |
| `CompanyRepository.java` | lưu `CongTy` |
| `CompanyBranchRepository.java` | lưu `ChiNhanhCongTy` |
| `CompanyProofDocumentRepository.java` | lưu minh chứng công ty |
| `ThanhVienCongTyRepository.java` | lưu membership owner |
| `VaiTroCongTyRepository.java` | lấy role công ty OWNER |

Pseudo flow:

```text
OwnerRegisterClient
-> validate thông tin owner/company/branch/proof
-> upload proof lên Cloudinary nếu có file
-> authService.registerOwner(payload)
-> AuthController.registerOwner
-> OwnerRegistrationService.registerOwner
-> tạo NguoiDung
-> tạo CongTy status PENDING
-> tạo ChiNhanhCongTy
-> lưu TepMinhChungCongTy
-> tạo ThanhVienCongTy role OWNER
-> trả response
```

Điểm nghiệp vụ:

- Công ty mới không tự động được duyệt.
- Admin duyệt công ty trước khi mở đầy đủ chức năng.
- Owner là vai trò trong công ty, không nên nhầm với role hệ thống.

### 39.4. Candidate Tạo Và Cập Nhật Hồ Sơ

Frontend:

| File | Vai trò |
| --- | --- |
| `app/profile/page.tsx` | route hồ sơ |
| `useCandidateProfileSession.ts` | kiểm tra user/session |
| `useCandidateProfileData.ts` | load hồ sơ và metadata |
| `useCandidateProfileSummaryActions.ts` | update summary/mục tiêu |
| `useCandidateProfilePreferenceActions.ts` | update skills/industries |
| `useCandidateProfileContentActions.ts` | CRUD học vấn/chứng chỉ/kinh nghiệm |
| `useCandidateProfileMediaActions.ts` | avatar/proof upload |
| `ProfileHero.tsx` | phần đầu hồ sơ |
| `EducationPanel.tsx` | danh sách học vấn |
| `CertificatePanel.tsx` | danh sách chứng chỉ |
| `WorkExperiencePanel.tsx` | danh sách kinh nghiệm |
| `ProofUploadBox.tsx` | UI upload minh chứng |
| `services/candidate/candidate-profile.service.ts` | tất cả API profile |

Backend:

| File | Vai trò |
| --- | --- |
| `CandidateProfileController.java` | profile tổng, summary, skills, industries, sync |
| `CandidateEducationController.java` | CRUD học vấn |
| `CandidateExperienceController.java` | CRUD kinh nghiệm |
| `CandidateCertificateController.java` | CRUD chứng chỉ |
| `CandidateProfileService.java` | orchestration hồ sơ |
| `CandidateProfileContentService.java` | business content profile |
| `CandidateProfileAttachmentService.java` | gắn/bỏ gắn item vào hồ sơ |
| `CandidateProfileAccessService.java` | ownership/permission |
| `CandidateProfileResponseAssembler.java` | response đầy đủ |
| `CandidateProfileMapper.java` | map entity -> DTO |
| `CandidateProfileEmbeddingIndexService.java` | index vector hồ sơ |
| `KinhNghiemEmbeddingIndexService.java` | index vector kinh nghiệm |

Pseudo flow update học vấn:

```text
EducationModal submit
-> validate required fields + proof file
-> upload proof nếu file mới
-> candidateProfileService.createEducationForProfile(profileId, payload)
-> CandidateEducationController.createForProfile
-> CandidateProfileService/CandidateProfileContentService
-> CandidateProfileAccessService check owner
-> save HocVanUngVien
-> save HoSoHocVan relation
-> set proof status theo duongDanTep
-> sync/index profile nếu service trigger
-> return CandidateProfileResponse/Profile item response
```

Pseudo flow chọn kinh nghiệm cho hồ sơ:

```text
User có kinh nghiệm A, B
-> profile C bật selection A
-> candidateProfileService.updateExperienceSelection(profileId, experienceId, selected)
-> CandidateExperienceController.updateSelection
-> CandidateProfileAttachmentService update HoSoKinhNghiem
-> sync index hồ sơ C
-> matching profile C chỉ nên dùng A
```

### 39.5. Candidate Apply Job

Frontend:

| File | Vai trò |
| --- | --- |
| `app/jobs/[id]/page.tsx` | route detail |
| `JobDetailClient.tsx` | client detail |
| `useJobDetail.ts` | load job, favorite status, apply status, apply action |
| `JobApplyModal.tsx` | modal chọn hồ sơ/CV và submit |
| `JobApplySection.tsx` | CTA apply |
| `services/candidate/candidate-application.service.ts` | API application |

Backend:

| File | Vai trò |
| --- | --- |
| `CandidateJobApplicationController.java` | endpoint apply/status/list |
| `CreateJobApplicationRequest.java` | payload apply |
| `CandidateJobApplicationService.java` | business ứng tuyển |
| `DonUngTuyenRepository.java` | lưu/truy vấn đơn |
| `TinTuyenDungRepository.java` | kiểm tra job |
| `CandidateProfileRepository.java` | kiểm tra hồ sơ |
| `ApplicationEmbeddingIndexService.java` | index đơn ứng tuyển |
| `NotificationService.java` | thông báo nếu có event liên quan |

Pseudo flow:

```text
Candidate bấm Ứng tuyển
-> JobApplyModal chọn hồ sơ
-> candidateApplicationService.apply(jobId, payload)
-> POST /candidate/applications/jobs/{jobId}
-> CandidateJobApplicationController.apply
-> CandidateJobApplicationService.apply
-> check user candidate
-> check job public/valid
-> check profile belongs to user
-> check duplicate application
-> save DonUngTuyen
-> index application vector
-> return status
```

QA:

- Chưa login không apply được.
- Không có hồ sơ thì không apply hoặc phải tạo hồ sơ trước.
- Apply xong status thay đổi trên job detail.
- HR nhìn thấy đơn ở company-admin applications.

### 39.6. Company Admin Tạo Job

Frontend:

| File | Vai trò |
| --- | --- |
| `app/company-admin/jobs/page.tsx` | route jobs |
| `CompanyAdminJobsClient.tsx` | client chính |
| `useCompanyAdminJobsData.ts` | load jobs/metadata/filter |
| `useCompanyAdminJobActions.ts` | create/update/delete |
| `JobFormModal.tsx` | form tạo/sửa job |
| `JobSkillsMultiSelect.tsx` | chọn kỹ năng |
| `JobsTable.tsx` | bảng job |
| `services/company-admin/jobs.service.ts` | API jobs + matching |

Backend:

| File | Vai trò |
| --- | --- |
| `CompanySubAdminController.java` | `/api/v1/company-admin/jobs` |
| `CreateCompanyJobRequest.java` | payload tạo job |
| `UpdateCompanyJobRequest.java` | payload sửa job |
| `CompanyAdminJobService.java` | business job công ty |
| `CompanyAdminAccessService.java` | check membership/branch/job |
| `CompanyAdminPackageService.java` | kiểm tra gói nếu cần |
| `TinTuyenDungRepository.java` | lưu job |
| `KyNangTinTuyenDungRepository.java` | lưu skills của job |
| `JobEmbeddingIndexService.java` | index vector job |
| `PublicJobElasticsearchIndexService.java` | index Elasticsearch khi job public |

Pseudo flow:

```text
JobFormModal submit
-> useCompanyAdminJobActions.createJob
-> companyAdminJobsService.createJob(payload)
-> POST /company-admin/jobs
-> CompanySubAdminController.createJob
-> CompanyAdminJobService.createJob
-> CompanyAdminAccessService xác định công ty/user
-> check company APPROVED
-> check active package
-> check branch thuộc công ty
-> save TinTuyenDung
-> save skills yêu cầu
-> return CompanyAdminJobResponse
```

QA:

- Công ty pending không tạo được.
- Hết gói không tạo được.
- Chi nhánh không thuộc công ty không tạo được.
- Job mới hiện trong list chi nhánh.
- Admin duyệt xong job mới public.

### 39.7. Company Admin Xem Ứng Viên Và Matching

Frontend:

| File | Vai trò |
| --- | --- |
| `app/company-admin/applications/page.tsx` | route applications |
| `CompanyAdminApplicationsClient.tsx` | client chính |
| `useCompanyAdminApplicationsData.ts` | load branches/jobs/applications/filter |
| `useCompanyAdminApplicationsActions.ts` | detail/update status |
| `useApplicationsMatchingPreview.ts` | state và API matching |
| `ApplicationFilters.tsx` | filter chi nhánh/job/status |
| `ApplicationsTable.tsx` | bảng đơn |
| `ApplicationsMatchingSection.tsx` | section matching |
| `ApplicationMatchingModeTabs.tsx` | tab candidate/application |
| `ApplicationCandidateMatchesTable.tsx` | bảng kết quả ranking |
| `ApplicationMatchInsightPanel.tsx` | giải thích lý do |
| `services/company-admin/applications.service.ts` | API applications |
| `services/company-admin/jobs.service.ts` | API matching theo job |

Backend:

| File | Vai trò |
| --- | --- |
| `CompanySubAdminController.java` | endpoint applications + matching |
| `CompanyAdminApplicationService.java` | list/detail/update status đơn |
| `CompanyAdminApplicationMapper.java` | map đơn sang response |
| `SemanticMatchingService.java` | điều phối matching |
| `SemanticMatchScoringService.java` | tính điểm tổng hợp |
| `SemanticMatchSignalService.java` | lấy tín hiệu skills/industries/experience |
| `SemanticCandidateExplanationService.java` | tạo giải thích |
| `QdrantClientService.java` | search vector |
| `CandidateProfileEmbeddingIndexService.java` | nguồn vector profile |
| `ApplicationEmbeddingIndexService.java` | nguồn vector application |

Pseudo flow filter:

```text
User chọn chi nhánh
-> useCompanyAdminApplicationsData reload jobs theo branch
-> dropdown job lấy từ companyAdminJobsService.listJobs
-> chọn job
-> list applications filter theo jobId
-> nếu chưa có đơn thì bảng rỗng
-> matching candidate vẫn dùng được vì dựa trên jobId
```

Pseudo flow matching:

```text
User chọn job
-> chọn tab "Ứng viên phù hợp"
-> getCandidateMatches(jobId)
-> backend check job thuộc công ty
-> Qdrant search profile collection
-> enrich DB signals
-> explanation
-> frontend render score + reason

User chọn tab "Xếp hạng đơn"
-> getApplicationMatches(jobId)
-> backend lấy/rank các DonUngTuyen của job
-> frontend render ranking đơn đã nộp
```

### 39.8. Admin Duyệt Công Ty

Frontend:

| File | Vai trò |
| --- | --- |
| `app/admin/companies/page.tsx` | route companies |
| `CompaniesAdminClient.tsx` | client chính |
| `useAdminCompaniesData.ts` | load/filter companies |
| `useAdminCompaniesActions.ts` | approve/reject/detail |
| `CompanyTable.tsx` | bảng công ty |
| `CompanyDetailModal.tsx` | xem chi tiết/minh chứng |
| `CompanyFilters.tsx` | filter |
| `services/admin/companies.service.ts` | API companies |

Backend:

| File | Vai trò |
| --- | --- |
| `AdminCompanyController.java` | `/api/v1/admin/companies` |
| `AdminCompanyService.java` | business duyệt/từ chối công ty |
| `AdminCompanyResponse.java` | row response |
| `AdminCompanyDetailResponse.java` | detail response |
| `ReviewCompanyRequest.java` | payload reject/approve nếu cần |
| `CompanyRepository.java` | truy vấn/lưu công ty |
| `CompanyProofDocumentRepository.java` | minh chứng công ty |
| `NotificationService.java` | báo owner |

Pseudo flow:

```text
Admin mở companies
-> adminCompaniesService.listCompanies(filters)
-> AdminCompanyController.companies
-> AdminCompanyService.listCompanies
-> trả list

Admin bấm duyệt
-> adminCompaniesService.approveCompany(companyId)
-> PATCH /admin/companies/{companyId}/approve
-> AdminCompanyService.approveCompany
-> set status APPROVED
-> notify owner
```

### 39.9. Admin Duyệt Job

Frontend:

| File | Vai trò |
| --- | --- |
| `app/admin/jobs/page.tsx` | route jobs admin |
| `JobsAdminClient.tsx` | client chính |
| `useAdminJobsData.ts` | load/filter jobs |
| `useAdminJobsActions.ts` | approve/reject/hide/detail |
| `JobsTable.tsx` | bảng job |
| `JobDetailModal.tsx` | xem detail |
| `RejectJobModal.tsx` | nhập lý do từ chối nếu UI có |
| `services/admin/jobs.service.ts` | API admin jobs |

Backend:

| File | Vai trò |
| --- | --- |
| `AdminJobController.java` | `/api/v1/admin/jobs` |
| `AdminJobService.java` | approve/reject/hide job |
| `AdminJobResponse.java` | row response |
| `AdminJobDetailResponse.java` | detail response |
| `ReviewJobRequest.java` | payload reject |
| `TinTuyenDungRepository.java` | lưu trạng thái job |
| `PublicJobElasticsearchIndexService.java` | sync index public search |
| `JobEmbeddingIndexService.java` | sync vector job nếu cần |
| `NotificationService.java` | báo công ty |

Pseudo flow:

```text
Admin approve job
-> PATCH /admin/jobs/{jobId}/approve
-> AdminJobService.approveJob
-> validate job exists
-> set status approved/public
-> index Elasticsearch
-> index Qdrant job
-> notify company
-> public search có thể thấy job
```

### 39.10. Admin Duyệt Minh Chứng Candidate

Frontend:

| File | Vai trò |
| --- | --- |
| `app/admin/candidate-proofs/page.tsx` | route minh chứng |
| `CandidateProofsAdminClient.tsx` | client chính |
| `useAdminCandidateProofsData.ts` | load/filter proofs |
| `useAdminCandidateProofsActions.ts` | approve/reject |
| `CandidateProofTable.tsx` | bảng minh chứng |
| `CandidateProofToolbar.tsx` | filter/search |
| `CandidateProofSummary.tsx` | thống kê nhanh |
| `services/admin/candidate-proofs.service.ts` | API proof |

Backend:

| File | Vai trò |
| --- | --- |
| `AdminCandidateProofController.java` | `/api/v1/admin/candidate-proofs` |
| `AdminCandidateProofService.java` | list/approve/reject proof |
| `AdminCandidateProofResponse.java` | response |
| `HocVanUngVienRepository.java` | học vấn |
| `ChungChiUngVienRepository.java` | chứng chỉ |
| `NotificationService.java` | báo candidate |

Pseudo flow:

```text
Admin mở candidate proofs
-> GET /admin/candidate-proofs?type=&status=
-> AdminCandidateProofService.listCandidateProofs
-> gom học vấn/chứng chỉ có minh chứng
-> trả response cùng type

Admin duyệt
-> PATCH /admin/candidate-proofs/{type}/{proofId}/approve
-> service tìm record theo type
-> set status APPROVED
-> notify candidate
```

Điểm cần nhớ:

- Học vấn và chứng chỉ dùng chung màn admin proof.
- `type` trong path quyết định service xử lý entity nào.
- Không có file minh chứng thì không nên lọt vào flow duyệt.

### 39.11. Chat

Frontend:

| File | Vai trò |
| --- | --- |
| `app/messages/page.tsx` | inbox candidate |
| `useCandidateInbox.ts` | state hội thoại candidate |
| `CandidateConversationList.tsx` | list hội thoại |
| `CandidateConversationThread.tsx` | khung tin nhắn |
| `app/company-admin/messages/page.tsx` | inbox recruiter |
| `useRecruiterInbox.ts` | state hội thoại recruiter |
| `ConversationList.tsx` | list recruiter |
| `ConversationThread.tsx` | thread recruiter |
| `components/chat/*` | base component dùng chung |
| `services/chat/chat.service.ts` | REST chat APIs |

Backend:

| File | Vai trò |
| --- | --- |
| `ChatController.java` | REST open/list/messages/send |
| `ChatService.java` | find-or-create conversation, send message |
| `ChatResponseMapper.java` | map response |
| `ChatRealtimePublisher.java` | publish realtime event |
| `ChatWebSocketConfig.java` | cấu hình WebSocket |
| `ChatWebSocketHandler.java` | xử lý socket |
| `ChatWebSocketHandshakeInterceptor.java` | xác thực handshake |
| `ChatWebSocketSessionRegistry.java` | quản lý session |
| `CuocTroChuyenRepository.java` | conversation DB |
| `TinNhanRepository.java` | message DB |

Pseudo flow gửi tin:

```text
User nhập message
-> chatService.sendMessage(conversationId, content)
-> POST /chats/conversations/{conversationId}/messages
-> ChatController.sendMessage
-> ChatService.sendMessage
-> save TinNhan
-> ChatRealtimePublisher gửi event tới người nhận
-> frontend append message vào thread
```

### 39.12. Notification

Frontend:

| File | Vai trò |
| --- | --- |
| `services/common/notification.service.ts` | API notification |
| `HomeHeader.tsx`/`useHomeHeaderData.ts` | unread count/header |
| admin/company shell nếu có badge | hiển thị chấm đỏ/số lượng |

Backend:

| File | Vai trò |
| --- | --- |
| `NotificationController.java` | list/count/read/delete |
| `NotificationService.java` | tạo và quản lý thông báo |
| `ThongBaoRepository.java` | DB |
| `NotificationItemResponse.java` | item response |
| `NotificationListResponse.java` | list response |
| `NotificationUnreadCountResponse.java` | unread response |

Pseudo flow:

```text
Business event xảy ra
-> service nghiệp vụ gọi NotificationService
-> tạo ThongBao cho người nhận
-> frontend gọi /notifications/unread-count
-> user mở list thông báo
-> mark read/read all/delete
```

## 40. API Contract Notes Cho Báo Cáo

Phần này không thay thế DTO source code, nhưng giúp trình bày request/response ở mức nghiệp vụ.

### 40.1. Auth APIs

| API | Auth | Request chính | Response chính | Ghi chú |
| --- | --- | --- | --- | --- |
| `POST /api/v1/auth/login` | public | tài khoản/email + mật khẩu | token + user | tạo JWT |
| `POST /api/v1/auth/register` | public | thông tin candidate | user/token hoặc success | tạo user candidate |
| `POST /api/v1/auth/register-owner` | public | owner + company + branches + proofs | owner/company info | công ty pending |
| `GET /api/v1/auth/me` | token | none | profile user + memberships | dùng phân luồng UI |
| `PATCH /api/v1/auth/me` | token | thông tin user | profile mới | cập nhật cá nhân |
| `PATCH /api/v1/auth/me/avatar` | token | avatar URL | profile mới | avatar đã upload Cloudinary |
| `GET /api/v1/auth/cloudinary-signature` | token/public theo config | folder/type | signature | upload trực tiếp Cloudinary |
| `GET /api/v1/auth/proof-types` | public/token | none | loại minh chứng | form owner |

### 40.2. Candidate Profile APIs

| API | Mục đích | Ghi chú |
| --- | --- | --- |
| `GET /api/v1/candidate/profile` | lấy hồ sơ hiện tại/default | cần token candidate |
| `GET /api/v1/candidate/profile/all` | lấy tất cả hồ sơ của user | multi-profile |
| `POST /api/v1/candidate/profile/all` | tạo hồ sơ mới | có thể tạo hồ sơ rỗng ban đầu |
| `GET /api/v1/candidate/profile/{profileId}` | lấy một hồ sơ | check owner |
| `PATCH /api/v1/candidate/profile/{profileId}/summary` | cập nhật summary/mục tiêu | ảnh hưởng matching |
| `PUT /api/v1/candidate/profile/{profileId}/skills` | cập nhật skills | ảnh hưởng matching |
| `PUT /api/v1/candidate/profile/{profileId}/industries` | cập nhật industries | ảnh hưởng matching |
| `POST /api/v1/candidate/profile/{profileId}/educations` | thêm học vấn vào hồ sơ | cần proof theo rule UI |
| `PATCH /api/v1/candidate/profile/{profileId}/educations/{educationId}` | sửa học vấn trong hồ sơ | check relation |
| `DELETE /api/v1/candidate/profile/{profileId}/educations/{educationId}` | xóa/bỏ liên kết học vấn | tùy service xóa record hay relation |
| `POST /api/v1/candidate/profile/{profileId}/experiences` | thêm kinh nghiệm vào hồ sơ | nên index experience/profile |
| `PATCH /api/v1/candidate/profile/{profileId}/experiences/{experienceId}` | sửa kinh nghiệm | ảnh hưởng explanation |
| `PUT /api/v1/candidate/profile/{profileId}/experiences/{experienceId}/selection` | bật/tắt kinh nghiệm trong hồ sơ | dùng cho multi-profile |
| `POST /api/v1/candidate/profile/{profileId}/certificates` | thêm chứng chỉ vào hồ sơ | cần proof theo rule UI |
| `PATCH /api/v1/candidate/profile/{profileId}/certificates/{certificateId}` | sửa chứng chỉ | status proof có thể reset |
| `PUT /api/v1/candidate/profile/{profileId}/certificates/{certificateId}/selection` | bật/tắt chứng chỉ trong hồ sơ | multi-profile |
| `POST /api/v1/candidate/profile/{profileId}/sync-index` | sync vector hồ sơ | chạy lại sau khi đổi dữ liệu |
| `GET /api/v1/candidate/profile/recommended-jobs` | job phù hợp với candidate | chỉ render khi login + có profile |

### 40.3. Company Admin APIs

| API | Mục đích | Guard |
| --- | --- | --- |
| `GET /api/v1/company-admin/me` | lấy thông tin công ty/user/role | membership |
| `GET /api/v1/company-admin/branches` | list chi nhánh | membership |
| `PATCH /api/v1/company-admin/company/logo` | cập nhật logo | owner/company permission |
| `PATCH /api/v1/company-admin/company/info` | cập nhật info | owner |
| `PATCH /api/v1/company-admin/company/resubmit` | gửi duyệt lại | company rejected/pending rule |
| `POST /api/v1/company-admin/company/proofs` | upload một minh chứng | owner |
| `POST /api/v1/company-admin/company/proofs/batch` | upload nhiều minh chứng | owner |
| `GET /api/v1/company-admin/jobs` | list jobs theo filter/branch | membership |
| `POST /api/v1/company-admin/jobs` | tạo job | approved + package + branch |
| `PATCH /api/v1/company-admin/jobs/{jobId}` | sửa job | job thuộc công ty |
| `DELETE /api/v1/company-admin/jobs/{jobId}` | xóa job | job thuộc công ty |
| `GET /api/v1/company-admin/applications` | list đơn | company/branch/job scope |
| `PATCH /api/v1/company-admin/applications/{id}/status` | đổi trạng thái đơn | company scope |
| `GET /api/v1/company-admin/jobs/{jobId}/candidate-matches` | tìm candidate phù hợp | job thuộc công ty |
| `GET /api/v1/company-admin/jobs/{jobId}/application-matches` | xếp hạng đơn đã nộp | job thuộc công ty |
| `GET /api/v1/company-admin/hrs` | list HR | owner |
| `POST /api/v1/company-admin/hrs` | tạo HR | owner |
| `PATCH /api/v1/company-admin/hrs/{hrUserId}` | sửa HR | owner |
| `DELETE /api/v1/company-admin/hrs/{hrUserId}` | xóa HR | owner |
| `GET /api/v1/company-admin/packages` | overview gói | membership |
| `POST /api/v1/company-admin/packages` | đăng ký gói | owner/company permission |

### 40.4. Admin APIs

| API | Mục đích |
| --- | --- |
| `GET /api/v1/admin/stats` | dashboard admin |
| `GET /api/v1/admin/users` | list user |
| `PATCH /api/v1/admin/users/{userId}/status` | khóa/mở user |
| `DELETE /api/v1/admin/users/{userId}` | xóa user |
| `GET /api/v1/admin/companies` | list công ty |
| `GET /api/v1/admin/companies/{companyId}` | detail công ty |
| `PATCH /api/v1/admin/companies/{companyId}/approve` | duyệt công ty |
| `PATCH /api/v1/admin/companies/{companyId}/reject` | từ chối công ty |
| `GET /api/v1/admin/jobs` | list job |
| `GET /api/v1/admin/jobs/{jobId}` | detail job |
| `PATCH /api/v1/admin/jobs/{jobId}/approve` | duyệt job |
| `PATCH /api/v1/admin/jobs/{jobId}/reject` | từ chối job |
| `PATCH /api/v1/admin/jobs/{jobId}/hide` | ẩn job |
| `GET /api/v1/admin/candidate-proofs` | list minh chứng candidate |
| `PATCH /api/v1/admin/candidate-proofs/{type}/{proofId}/approve` | duyệt minh chứng |
| `PATCH /api/v1/admin/candidate-proofs/{type}/{proofId}/reject` | từ chối minh chứng |
| `GET /api/v1/admin/packages` | list gói |
| `POST /api/v1/admin/packages` | tạo gói |
| `PATCH /api/v1/admin/packages/{packageId}` | sửa gói |
| `DELETE /api/v1/admin/packages/{packageId}` | xóa gói |
| `GET /api/v1/admin/elasticsearch/health` | kiểm tra search infra |
| `POST /api/v1/admin/elasticsearch/reindex/jobs` | reindex public jobs |
| `POST /api/v1/admin/qdrant/reindex/jobs-profiles` | reindex vector jobs/profiles |
| `POST /api/v1/admin/qdrant/reindex/experiences` | reindex vector experiences |

## 41. Mapping Database Theo Nghiệp Vụ

Tên bảng vật lý có thể khác tên entity tùy mapping JPA, vì vậy khi thao tác SQL phải kiểm tra schema thật. Phần này ghi theo entity/domain để dễ báo cáo.

### 41.1. Auth/User

| Entity | Ý nghĩa | Liên quan |
| --- | --- | --- |
| `NguoiDung` | tài khoản hệ thống | login, profile, chat, notification |
| `VaiTroHeThong` | role hệ thống | admin/candidate |

Luồng dữ liệu:

```text
NguoiDung
-> có role hệ thống
-> có HoSoUngVien nếu là candidate
-> có ThanhVienCongTy nếu thuộc công ty
-> có ThongBao nếu nhận notification
-> có TinNhan nếu chat
```

### 41.2. Company

| Entity | Ý nghĩa | Liên quan |
| --- | --- | --- |
| `CongTy` | công ty tuyển dụng | owner, HR, chi nhánh, job, gói |
| `ChiNhanhCongTy` | chi nhánh | job thuộc chi nhánh |
| `ThanhVienCongTy` | membership user-company | role owner/hr |
| `VaiTroCongTy` | role trong công ty | OWNER/HR |
| `TepMinhChungCongTy` | minh chứng công ty | admin duyệt công ty |
| `LoaiTaiLieu` | loại minh chứng | form upload |
| `DanhMucGoi` | gói tuyển dụng | admin CRUD |
| `DangKyGoiCongTy` | đăng ký gói | SePay/payment |

Luồng dữ liệu:

```text
OwnerRegistrationService
-> NguoiDung
-> CongTy
-> ChiNhanhCongTy
-> TepMinhChungCongTy
-> ThanhVienCongTy role OWNER
-> AdminCompanyService approve
```

### 41.3. Recruitment

| Entity | Ý nghĩa | Liên quan |
| --- | --- | --- |
| `TinTuyenDung` | tin tuyển dụng | chi nhánh, skills, applications |
| `KyNangTinTuyenDung` | kỹ năng yêu cầu | matching/search |
| `DonUngTuyen` | đơn ứng tuyển | candidate, job, profile |
| `NguoiDungTinTuyenDung` | job yêu thích/lưu job | candidate favorite |

Luồng dữ liệu:

```text
CompanyAdminJobService tạo TinTuyenDung
-> AdminJobService approve
-> PublicJobService search/list
-> CandidateJobApplicationService tạo DonUngTuyen
-> CompanyAdminApplicationService xử lý đơn
```

### 41.4. Candidate Profile

| Entity | Ý nghĩa | Liên quan |
| --- | --- | --- |
| `HoSoUngVien` | hồ sơ ứng viên | user, matching |
| `HocVanUngVien` | học vấn | proof admin |
| `ChungChiUngVien` | chứng chỉ | proof admin |
| `KinhNghiemLamViecUngVien` | kinh nghiệm | explanation/matching |
| `KyNangUngVien` | kỹ năng candidate | matching |
| `NganhNgheUngVien` | ngành nghề quan tâm | recommended/matching |
| `HoSoHocVan` | relation profile-education | multi-profile |
| `HoSoChungChi` | relation profile-certificate | multi-profile |
| `HoSoKinhNghiem` | relation profile-experience | multi-profile |
| `LoaiChungChi` | catalog chứng chỉ | form/admin catalog |

Luồng dữ liệu:

```text
CandidateProfileService tạo HoSoUngVien
-> CandidateProfileContentService tạo item học vấn/chứng chỉ/kinh nghiệm
-> CandidateProfileAttachmentService gắn item vào profile
-> CandidateProfileEmbeddingIndexService build vector theo profile
```

### 41.5. AI Index

| Entity | Ý nghĩa | Collection liên quan |
| --- | --- | --- |
| `ChiMucNhungTinTuyenDung` | tracking vector job | `khoTinTuyenDung` |
| `ChiMucNhungHoSoUngVien` | tracking vector profile | `khoHoSoUngVien` |
| `ChiMucNhungDonUngTuyen` | tracking vector application | `khoDonUngTuyen` |
| `ChiMucNhungKinhNghiem` | tracking vector experience | `khoKinhNghiem` |

Luồng dữ liệu:

```text
Domain record thay đổi
-> *EmbeddingIndexService build text
-> TextEmbeddingService tạo vector
-> QdrantClientService upsert vector
-> ChiMucNhung*Repository lưu tracking
```

## 42. DTO Và Response Khi Báo Cáo

### 42.1. Auth DTO

| DTO | Dùng ở đâu | Ý nghĩa |
| --- | --- | --- |
| `LoginRequest` | login | thông tin đăng nhập |
| `RegisterRequest` | register candidate | dữ liệu tạo candidate |
| `CreateOwnerRequest` | register owner | owner + company + branches + proofs |
| `UpdateUserProfileRequest` | update me | sửa thông tin user |
| `UpdateAvatarRequest` | update avatar | URL avatar |
| `AuthResponse` | login/register | token và user |
| `UserProfileResponse` | getMe/updateMe | thông tin user hiện tại |
| `CreateOwnerResponse` | owner register | kết quả tạo owner/company |

### 42.2. Candidate DTO

| DTO | Dùng ở đâu | Ý nghĩa |
| --- | --- | --- |
| `CreateCandidateProfileRequest` | tạo hồ sơ | dữ liệu ban đầu profile |
| `UpdateCandidateSummaryRequest` | update summary | giới thiệu/mục tiêu |
| `UpdateKyNangUngVienRequest` | update skills | list skill IDs |
| `UpdateNganhNgheUngVienRequest` | update industries | list industry IDs |
| `UpsertHocVanRequest` | học vấn | trường, ngành, thời gian, proof URL |
| `UpsertChungChiRequest` | chứng chỉ | loại chứng chỉ, tên, ngày, proof URL |
| `UpsertKinhNghiemLamViecRequest` | kinh nghiệm | công ty, vị trí, thời gian, mô tả |
| `ToggleProfileItemSelectionRequest` | selection | bật/tắt item trong profile |
| `CreateJobApplicationRequest` | apply | profile/CV/message |
| `CandidateProfileResponse` | profile detail | toàn bộ hồ sơ |
| `CandidateProfileListItemResponse` | list profiles | item ngắn |
| `CandidateProfileMetadataResponse` | metadata | skills, industries, types |
| `CandidateJobApplicationResponse` | application | đơn ứng tuyển |

### 42.3. Company DTO

| DTO | Dùng ở đâu | Ý nghĩa |
| --- | --- | --- |
| `CreateCompanyJobRequest` | tạo job | thông tin tuyển dụng |
| `UpdateCompanyJobRequest` | sửa job | thông tin job cập nhật |
| `UpdateApplicationStatusRequest` | đổi trạng thái đơn | status mới |
| `CreateCompanyHrRequest` | tạo HR | thông tin HR |
| `UpdateCompanyHrRequest` | sửa HR | role/status/branch nếu có |
| `RegisterCompanyPackageRequest` | đăng ký gói | package id |
| `UpdateCompanyInfoRequest` | sửa công ty | info công ty |
| `UpdateCompanyLogoRequest` | logo | URL logo |
| `UpdateCompanyProofRequest` | proof | proof metadata/URL |
| `CompanyAdminMeResponse` | shell | company + role + status |
| `CompanyAdminJobResponse` | jobs | job row |
| `CompanyAdminApplicationResponse` | applications | application row/detail |
| `CompanyPackageOverviewResponse` | packages | gói hiện tại + plans |

### 42.4. Admin DTO

| DTO | Dùng ở đâu | Ý nghĩa |
| --- | --- | --- |
| `AdminDashboardStatsResponse` | dashboard | thống kê |
| `AdminUserResponse` | users | user row |
| `UpdateUserStatusRequest` | users action | khóa/mở |
| `AdminCompanyResponse` | companies | company row |
| `AdminCompanyDetailResponse` | company detail | detail + proofs |
| `ReviewCompanyRequest` | approve/reject | lý do/trạng thái |
| `AdminJobResponse` | jobs | job row |
| `AdminJobDetailResponse` | job detail | detail job |
| `ReviewJobRequest` | reject job | lý do |
| `AdminCandidateProofResponse` | proofs | proof row |
| `AdminPackageResponse` | packages | package row |
| `AdminQdrantReindexResponse` | reindex jobs/profiles | thống kê reindex |
| `AdminQdrantExperienceReindexResponse` | reindex experiences | thống kê experience index |

## 43. Demo Script Theo Thứ Tự Trình Bày

### 43.1. Demo Public Và Candidate

Kịch bản:

1. Mở trang chủ.
2. Chỉ ra `Việc làm nổi bật`, `Công ty hàng đầu`.
3. Nếu chưa login, giải thích `Việc làm phù hợp với tôi` không render.
4. Login candidate.
5. Nếu candidate có hồ sơ, block recommended jobs xuất hiện.
6. Vào trang jobs, search keyword và filter.
7. Vào job detail.
8. Bấm yêu thích.
9. Bấm ứng tuyển, chọn hồ sơ.
10. Vào hồ sơ, thêm học vấn/chứng chỉ/kinh nghiệm.
11. Thử lưu học vấn/chứng chỉ không có file để thấy message đỏ.
12. Upload minh chứng và lưu.

Điểm nói:

- Public search dùng Elasticsearch/JPA fallback.
- Recommended jobs dùng vector profile-job.
- Hồ sơ là dữ liệu đầu vào cho matching.
- Minh chứng cần admin duyệt.

### 43.2. Demo Company Admin

Kịch bản:

1. Login owner hoặc HR.
2. Mở company-admin dashboard.
3. Chỉ ra status công ty và package.
4. Vào settings, xem thông tin công ty/minh chứng.
5. Vào packages, chọn gói và xem QR/SePay.
6. Vào jobs, chọn chi nhánh và tạo job.
7. Vào applications, chọn chi nhánh.
8. Chỉ ra dropdown tin tuyển dụng lấy theo chi nhánh, kể cả job chưa có đơn.
9. Chọn job và chạy candidate matching.
10. Nếu job có đơn, chạy application matching.
11. Mở panel lý do phù hợp.
12. Mở chat với candidate.

Điểm nói:

- Company-admin bị guard theo company status, package, role.
- Job thuộc chi nhánh.
- Candidate matching dùng cho tìm ứng viên chủ động.
- Application matching dùng cho xếp hạng đơn đã nộp.

### 43.3. Demo Admin

Kịch bản:

1. Login admin.
2. Mở dashboard thống kê.
3. Vào companies, duyệt/từ chối công ty.
4. Vào jobs, duyệt/từ chối/ẩn tin.
5. Vào candidate proofs, duyệt học vấn/chứng chỉ.
6. Vào packages, CRUD gói.
7. Vào catalogs, CRUD loại chứng chỉ/loại tài liệu/role.
8. Chạy health Elasticsearch.
9. Chạy reindex jobs.
10. Chạy reindex jobs-profiles.
11. Chạy reindex experiences.

Điểm nói:

- Admin là lớp kiểm duyệt dữ liệu rủi ro.
- Admin có thể rebuild search/vector index.
- Sau khi duyệt job, public search mới thấy.
- Sau khi duyệt minh chứng, candidate profile hiển thị trạng thái verified.

## 44. QA Matrix Chi Tiết Theo Role

### 44.1. Candidate QA

| Case | Bước test | Kỳ vọng |
| --- | --- | --- |
| Register | đăng ký tài khoản mới | tạo user candidate |
| Login | đăng nhập đúng | có token, redirect đúng |
| Login sai | mật khẩu sai | hiện lỗi |
| Home no profile | login user chưa có profile | không render recommended jobs |
| Home with profile | login user có profile/index | render recommended jobs hoặc empty hợp lý |
| Search jobs | nhập keyword/filter | list đúng |
| Job detail | mở job approved | thấy detail |
| Apply no login | mở job chưa login | yêu cầu login |
| Apply with profile | chọn hồ sơ apply | tạo đơn |
| Apply duplicate | apply lại cùng job | bị chặn hoặc status đã apply |
| Favorite | bấm lưu job | status đổi |
| Profile proof missing | lưu học vấn/chứng chỉ không file | báo đỏ và không gọi save |
| Profile proof uploaded | upload file rồi lưu | record có proof URL |
| Sync index | bấm sync | API thành công |
| Messages | gửi tin | thread cập nhật |
| Notifications | mark read | unread count giảm |

### 44.2. Company Owner QA

| Case | Bước test | Kỳ vọng |
| --- | --- | --- |
| Owner register | đăng ký công ty | công ty PENDING |
| Pending access | vào company-admin | thấy hạn chế |
| Approved access | admin duyệt | mở chức năng |
| Update company | sửa info/logo | lưu đúng |
| Upload proof | thêm minh chứng | admin thấy |
| Package register | đăng ký gói | có payment info |
| SePay paid | webhook hợp lệ | gói active |
| Create job no package | chưa có gói | bị chặn |
| Create job with package | có gói | tạo job |
| Create HR | owner tạo HR | HR login được |
| Delete HR | owner xóa HR | HR mất quyền |

### 44.3. HR QA

| Case | Bước test | Kỳ vọng |
| --- | --- | --- |
| HR login | login HR | vào company-admin |
| Branch filter | chọn chi nhánh | jobs/applications theo chi nhánh |
| Job dropdown | chi nhánh có job chưa ai apply | dropdown vẫn hiện job |
| Applications empty | chọn job chưa có đơn | bảng rỗng hợp lý |
| Candidate matching | chọn job chạy matching | có ranking từ profiles |
| Application matching empty | job chưa có đơn | ranking đơn rỗng |
| Application matching | job có đơn | xếp hạng đơn |
| Update status | đổi trạng thái đơn | candidate nhận notification |
| Open chat | chat với candidate | conversation mở |

### 44.4. Admin QA

| Case | Bước test | Kỳ vọng |
| --- | --- | --- |
| Dashboard | mở admin | stats load |
| Users filter | lọc user | list đúng |
| Lock user | khóa user | user không login/action |
| Company approve | duyệt công ty | company status approved |
| Company reject | từ chối | status rejected |
| Job approve | duyệt job | public thấy job |
| Job reject | từ chối job | public không thấy |
| Candidate proof approve | duyệt minh chứng | profile status approved |
| Candidate proof reject | từ chối | profile status rejected |
| Package CRUD | tạo/sửa/xóa gói | list cập nhật |
| Catalog CRUD | tạo/sửa/xóa catalog | form metadata cập nhật |
| ES health | gọi health | thấy trạng thái |
| Reindex jobs | chạy reindex | count thành công |
| Reindex profiles | chạy jobs-profiles | profile/job vector cập nhật |
| Reindex experiences | chạy experiences | experience collection/tracking cập nhật |

## 45. Risk Và Giới Hạn Hiện Tại

### 45.1. Giới Hạn Schema Minh Chứng

Hiện tại học vấn/chứng chỉ có trạng thái minh chứng, nhưng nếu schema không có cột lý do từ chối thì:

- Admin có thể reject.
- Candidate thấy trạng thái reject.
- Không nên hứa có rejection reason chi tiết nếu DB không lưu.
- Muốn có reason thật cần thay đổi schema/API/UI sau này.

### 45.2. Multi-Profile Và Experience Selection

Rủi ro:

- User có nhiều kinh nghiệm ở cấp user.
- Hồ sơ cụ thể chỉ chọn một số kinh nghiệm.
- Nếu index/explanation lấy toàn bộ user experience thì giải thích sai.

Rule cần giữ:

- Ranking/explanation theo hồ sơ nào thì lấy item gắn với hồ sơ đó.
- Khi selection thay đổi, cần sync profile index.
- Reindex dữ liệu cũ sau khi thêm logic kinh nghiệm.

### 45.3. Search Infrastructure Không Sẵn Sàng

Rủi ro:

- Elasticsearch tắt làm public search full-text kém hoặc fallback.
- Qdrant tắt làm matching/recommended jobs lỗi hoặc empty.
- Embedding service tắt làm reindex thất bại.

Ứng xử đúng:

- Public search có JPA fallback.
- Matching nên hiện empty/error state rõ.
- Admin có endpoint health/reindex để vận hành.

### 45.4. Payment Webhook

Rủi ro:

- Webhook giả mạo.
- Chuyển khoản sai nội dung/số tiền.
- Webhook gửi lặp.

Rule:

- Verify secret.
- Verify payment content/code.
- Verify amount.
- Idempotent khi webhook lặp.
- Frontend không tự active gói.

### 45.5. Permission Company

Rủi ro:

- HR công ty A thấy job/đơn công ty B.
- HR thấy chi nhánh không thuộc scope.
- User login thường vào được company-admin.

Rule:

- Mọi action company-admin phải qua `CompanyAdminAccessService` hoặc guard tương đương.
- Không tin vào branchId/jobId từ frontend.
- Backend phải check ownership của job/application.

## 46. Glossary Thuật Ngữ Trong Đồ Án

| Thuật ngữ | Ý nghĩa |
| --- | --- |
| Candidate | ứng viên tìm việc |
| Owner | chủ công ty, người đăng ký doanh nghiệp |
| HR | nhân sự tuyển dụng trong công ty |
| Admin | quản trị hệ thống |
| Public job | tin tuyển dụng đã duyệt và hiển thị cho ứng viên |
| Candidate profile | hồ sơ ứng viên dùng để apply/matching |
| Proof | file minh chứng học vấn/chứng chỉ/công ty |
| Application | đơn ứng tuyển vào một tin |
| Candidate matching | tìm ứng viên phù hợp với job dù chưa apply |
| Application matching | xếp hạng các đơn đã nộp vào job |
| Semantic score | điểm tương đồng vector từ Qdrant |
| Signal | tín hiệu DB như kỹ năng, ngành nghề, kinh nghiệm |
| Explanation | giải thích lý do phù hợp |
| Reindex | tạo lại chỉ mục search/vector từ dữ liệu DB |
| Membership | quan hệ user thuộc công ty |
| Package | gói tuyển dụng công ty mua |
| Webhook | callback từ SePay về backend |

## 47. Cách Đọc Code Nhanh Khi Bị Hỏi Đột Xuất

### 47.1. Nếu Hỏi "Nút Này Gọi API Nào?"

Làm theo:

1. Tìm component chứa nút trong `app/.../components`.
2. Xem prop `onClick` gọi action nào.
3. Mở hook `hooks/use...Actions.ts`.
4. Xem service method được gọi.
5. Mở `services/<domain>/*.service.ts`.
6. Đọc endpoint string.
7. Sang backend controller có mapping tương ứng.
8. Từ controller nhảy sang service.

Ví dụ:

```text
Approve job button
-> JobsTable/JobsAdminClient
-> useAdminJobsActions
-> adminJobsService.approveJob
-> PATCH /admin/jobs/{jobId}/approve
-> AdminJobController.approveJob
-> AdminJobService.approveJob
```

### 47.2. Nếu Hỏi "Dữ Liệu Này Lưu Bảng Nào?"

Làm theo:

1. Từ service backend xem repository được inject.
2. Repository trỏ đến entity nào.
3. Entity nằm trong `domain/.../entity`.
4. Nếu cần tên bảng thật, xem annotation `@Table` hoặc schema DB.
5. Nếu entity có quan hệ, xem `@ManyToOne`, `@OneToMany`, id class.

Ví dụ:

```text
Kinh nghiệm trong hồ sơ
-> CandidateProfileContentService
-> KinhNghiemLamViecUngVienRepository
-> KinhNghiemLamViecUngVien
-> HoSoKinhNghiemRepository
-> HoSoKinhNghiem relation profile-experience
```

### 47.3. Nếu Hỏi "Tại Sao Dữ Liệu Không Hiện UI?"

Trace theo lớp:

```text
UI component có render conditional không?
-> hook data có gọi API không?
-> service endpoint đúng không?
-> network trả status gì?
-> controller có nhận request không?
-> service có filter/guard gì?
-> repository query có trả record không?
-> DB record status/branch/company/profile đúng không?
```

Ví dụ HR không thấy job:

```text
ApplicationFilters dropdown
-> useCompanyAdminApplicationsData
-> companyAdminJobsService.listJobs(branchId)
-> CompanySubAdminController.jobs
-> CompanyAdminJobService.listJobs
-> filter company + branch
-> TinTuyenDungRepository
```

### 47.4. Nếu Hỏi "Tại Sao Matching Sai?"

Trace theo lớp:

```text
Frontend selected job/profile đúng không?
-> gọi candidate-matches hay application-matches?
-> backend check job đúng chưa?
-> Qdrant collection nào được search?
-> vector payload id đúng không?
-> DB enrich đúng profile/application không?
-> signals skills/industries/experience đúng không?
-> explanation lấy đúng selected profile items không?
-> dữ liệu đã reindex chưa?
```

### 47.5. Nếu Hỏi "Sửa Thêm Chức Năng Ở Đâu?"

Nguyên tắc:

- Thêm UI: route/component/hook gần màn hình đó.
- Thêm API call: service domain trong `recruit_frontend/services`.
- Thêm endpoint: controller domain tương ứng.
- Thêm business rule: service domain tương ứng.
- Thêm query: repository.
- Thêm response field: DTO response + mapper + frontend type.
- Không sửa entity/schema nếu yêu cầu chỉ là refactor hoặc UI behavior.

## 48. Lifecycle Nghiệp Vụ End-To-End

Phần này gom lại các vòng đời lớn của hệ thống theo đúng góc nhìn nghiệp vụ. Khi báo cáo, có thể dùng các lifecycle này để giải thích vì sao mỗi module tồn tại và dữ liệu đi qua những điểm kiểm soát nào.

### 48.1. Vòng Đời Tài Khoản Candidate

```text
Guest
-> đăng ký candidate
-> NguoiDung role CANDIDATE
-> login nhận JWT
-> tạo/cập nhật HoSoUngVien
-> upload minh chứng học vấn/chứng chỉ
-> admin duyệt minh chứng
-> hồ sơ đủ dữ liệu để apply và matching
-> candidate apply job
-> HR xử lý đơn
-> candidate nhận notification/chat
```

Business rule theo từng bước:

- Đăng ký chỉ tạo tài khoản, chưa đảm bảo hồ sơ đầy đủ.
- Candidate có thể tìm job ngay cả khi chưa có hồ sơ.
- Apply cần hồ sơ ứng viên, vì đơn ứng tuyển phải biết candidate dùng profile nào.
- Hồ sơ càng đủ summary, skills, industries, education, certificate, experience thì matching càng tốt.
- Minh chứng được admin duyệt sau khi candidate upload file lên Cloudinary và lưu URL.
- Candidate không tự sửa trạng thái duyệt minh chứng; chỉ admin đổi `APPROVED`/`REJECTED`.

Điểm source code:

| Bước | Frontend | Backend |
| --- | --- | --- |
| Register | `app/auth/register/candidate` | `AuthController.registerCandidate` -> `AuthService.registerCandidate` |
| Login | `app/auth/login` | `AuthController.login` -> `AuthService.login` |
| Profile | `app/profile` | `CandidateProfileController` + split controllers |
| Proof review | `app/admin/candidate-proofs` | `AdminCandidateProofService` |
| Apply | `app/jobs/[id]` | `CandidateJobApplicationService.apply` |
| Notification | header/home hooks | `NotificationService` |

### 48.2. Vòng Đời Công Ty Từ Đăng Ký Đến Tuyển Dụng

```text
Owner register
-> tạo user owner
-> tạo CongTy PENDING
-> tạo ChiNhanhCongTy
-> tạo TepMinhChungCongTy
-> tạo ThanhVienCongTy role OWNER
-> admin duyệt công ty
-> owner mua gói
-> SePay xác nhận thanh toán
-> công ty có gói ACTIVE
-> owner/HR tạo job
-> admin duyệt job
-> job public
-> candidate apply/chat
-> HR xử lý pipeline
```

Business rule quan trọng:

- Công ty mới luôn đi qua trạng thái kiểm duyệt.
- Owner có quyền công ty nhờ `ThanhVienCongTy`, không phải nhờ role hệ thống riêng.
- Công ty chưa `APPROVED` bị hạn chế chức năng company-admin.
- Tạo job cần cả công ty approved và gói đăng bài active.
- Job do company tạo chưa mặc định public nếu còn cần admin duyệt.
- HR chỉ thao tác được trong phạm vi chi nhánh được gán.

Điểm source code:

| Bước | Frontend | Backend |
| --- | --- | --- |
| Owner register | `app/auth/register/owner` | `OwnerRegistrationService.registerOwner` |
| Admin duyệt công ty | `app/admin/companies` | `AdminCompanyService.approveCompany/rejectCompany` |
| Mua gói | `app/company-admin/packages` | `CompanyAdminPackageService.registerPackage` |
| Webhook | SePay callback | `SepayWebhookController` -> `SepayWebhookService` |
| Tạo job | `app/company-admin/jobs` | `CompanyAdminJobService.createJob` |
| Admin duyệt job | `app/admin/jobs` | `AdminJobService.approveJob/rejectJob/hideJob` |
| Quản lý đơn | `app/company-admin/applications` | `CompanyAdminApplicationService` |

### 48.3. Vòng Đời Tin Tuyển Dụng

```text
Company job form
-> validate company/branch/package
-> save TinTuyenDung
-> save KyNangTinTuyenDung
-> trạng thái nội bộ DRAFT/PENDING tùy rule
-> admin review
-> APPROVED
-> sync Elasticsearch public search
-> sync Qdrant job vector
-> public job detail/search/home
-> candidate apply/favorite/chat
-> HR update application status
```

Các trạng thái/điểm kiểm soát:

- `DRAFT` hoặc trạng thái tạo ban đầu: job do công ty nhập, chưa public.
- `APPROVED`: job có thể xuất hiện ở public list/search/detail nếu công ty cũng approved.
- `REJECTED`: job bị từ chối, public không thấy.
- Hidden/deleted: job không còn public, nhưng dữ liệu lịch sử application nên vẫn được giữ.

Khi debug job không hiện:

1. Kiểm tra `TinTuyenDung.trangThai`.
2. Kiểm tra `CongTy.trangThai`.
3. Kiểm tra job có `ngayXoa` không.
4. Kiểm tra deadline/hạn nộp nếu service có lọc.
5. Kiểm tra Elasticsearch có index chưa.
6. Kiểm tra frontend filter có loại job ra không.

### 48.4. Vòng Đời Đơn Ứng Tuyển

```text
Candidate chọn job
-> load job detail
-> load apply status
-> chọn profile
-> upload/chọn CV nếu job yêu cầu
-> POST apply
-> save DonUngTuyen
-> index application vector
-> notify company users
-> HR xem application
-> HR mở detail
-> HR đổi trạng thái
-> notify candidate
-> chat nếu cần
```

Business rule:

- Một candidate không được nộp trùng cùng một job nếu service đã có guard duplicate.
- Đơn phải gắn job và profile cụ thể.
- Nếu job yêu cầu CV, payload thiếu CV phải bị chặn.
- HR không được xem đơn ngoài công ty/chi nhánh/job scope.
- Đổi trạng thái đơn là hành động của company-admin, không phải candidate.

Trạng thái application nên được hiểu như pipeline tuyển dụng:

| Nhóm trạng thái | Ý nghĩa nghiệp vụ | Actor thao tác |
| --- | --- | --- |
| Mới nộp | Candidate vừa apply, HR chưa xử lý | Candidate tạo |
| Đang xem xét | HR đã mở/đang đánh giá | HR/Owner |
| Phỏng vấn/liên hệ | HR muốn trao đổi thêm | HR/Owner |
| Từ chối | Không tiếp tục quy trình | HR/Owner |
| Được chọn/đạt | Candidate phù hợp | HR/Owner |

Nếu source đang dùng string status khác tên ở bảng trên, khi báo cáo nên nói theo ý nghĩa pipeline thay vì hứa cứng tên enum.

## 49. Ma Trận Quyền Theo Action

### 49.1. Public/Candidate

| Action | Guest | Candidate | Company Owner/HR | Admin | Guard backend |
| --- | --- | --- | --- | --- | --- |
| Xem trang chủ | Có | Có | Có | Có | public |
| Search job | Có | Có | Có | Có | public |
| Xem chi tiết job public | Có | Có | Có | Có | public |
| Favorite job | Không | Có | Không nên dùng | Không nên dùng | candidate principal |
| Apply job | Không | Có | Không | Không | candidate principal + ownership profile |
| Quản lý hồ sơ | Không | Có | Không | Không | candidate principal |
| Chat từ job detail | Không | Có | Có nếu là recruiter context | Không | `ChatService` scope |

### 49.2. Company Admin

| Action | Owner | HR | Candidate | Admin | Rule |
| --- | --- | --- | --- | --- | --- |
| Vào company-admin shell | Có nếu có membership | Có nếu có membership | Không | Không theo flow thường | `company-admin/me` |
| Xem dashboard | Có | Có theo scope | Không | Không | membership |
| Xem chi nhánh | Tất cả chi nhánh công ty | Chi nhánh được gán | Không | Không | branch scope |
| Tạo/sửa job | Có | Có nếu được gán chi nhánh | Không | Không | approved + package + branch |
| Xóa job | Có | Có nếu service cho phép | Không | Không | job thuộc scope |
| Xem applications | Có | Có theo chi nhánh | Không | Không | job/branch scope |
| Đổi trạng thái đơn | Có | Có theo chi nhánh | Không | Không | application thuộc scope |
| Chạy matching | Có | Có theo job scope | Không | Không | job thuộc scope |
| Quản lý HR | Có | Không | Không | Không | owner-only |
| Mua gói | Có | Không hoặc hạn chế | Không | Không | owner/company rule |
| Sửa thông tin công ty | Có | Không hoặc hạn chế | Không | Không | owner/company rule |

### 49.3. Super Admin

| Action | Admin | Non-admin | Guard |
| --- | --- | --- | --- |
| Dashboard stats | Có | Không | `requireAdmin()` |
| Quản lý user | Có | Không | `requireAdmin()` |
| Duyệt công ty | Có | Không | `requireAdmin()` |
| Duyệt job | Có | Không | `requireAdmin()` |
| Duyệt candidate proof | Có | Không | `requireAdmin()` |
| CRUD package/catalog | Có | Không | `requireAdmin()` |
| Reindex search/vector | Có | Không | `requireAdmin()` |

Điểm cần nhấn:

- Frontend ẩn menu để UX rõ hơn, nhưng backend mới là nơi quyết định quyền thật.
- Mọi action nhạy cảm phải kiểm tra lại ownership/scope ở service.
- Không dùng role hệ thống để suy ra owner/HR; phải đọc membership công ty.

## 50. State Transition Chi Tiết

### 50.1. Company Status

```text
PENDING
  -> APPROVED  khi admin duyệt
  -> REJECTED  khi admin từ chối

REJECTED
  -> PENDING   khi owner cập nhật minh chứng/thông tin và resubmit

APPROVED
  -> giữ nguyên khi công ty vận hành bình thường
```

Ảnh hưởng UI:

- `PENDING`: hiển thị thông báo chờ duyệt, khóa nhiều action vận hành.
- `REJECTED`: hiển thị lý do nếu có, cho phép cập nhật/resubmit theo rule.
- `APPROVED`: mở dashboard/jobs/applications/packages theo role.

### 50.2. Candidate Proof Status

```text
UNVERIFIED
  -> PENDING   khi candidate upload proof URL và lưu

PENDING
  -> APPROVED  khi admin duyệt
  -> REJECTED  khi admin từ chối

REJECTED
  -> PENDING   khi candidate upload/sửa minh chứng mới nếu flow reset status
```

Điểm schema:

- Không lưu lý do từ chối học vấn/chứng chỉ nếu schema không có cột phù hợp.
- Nếu sau này cần rejection reason, phải confirm thay đổi schema/API/UI.

### 50.3. Package Payment Status

```text
Company chọn gói
-> DangKyGoiCongTy.trangThai = PENDING
-> trangThaiThanhToan = UNPAID
-> frontend hiển thị QR/payment code
-> SePay webhook hợp lệ
-> trangThaiThanhToan = PAID
-> trangThai = ACTIVE
-> set batDauLuc/hetHanLuc
```

Rule vận hành:

- Frontend không được tự active gói.
- Webhook phải verify secret, amount và payment code.
- Webhook lặp phải idempotent.
- Khi gói hết hạn, tạo job phải bị chặn nếu service kiểm tra active package.

### 50.4. Search/Vector Index State

```text
DB record thay đổi
-> service build text/search document
-> external index upsert/delete
-> DB tracking entity ghi nhận point/document
```

Các tình huống cần reindex:

- Đổi logic build text embedding.
- Thêm field mới vào matching text.
- Import dữ liệu cũ.
- Qdrant/Elasticsearch bị reset collection/index.
- Job/profile/application đã thay đổi nhưng kết quả matching/search vẫn cũ.

## 51. Validation Và Payload Rule Theo Module

### 51.1. Auth

| Field | Rule |
| --- | --- |
| Email | normalize lowercase, không trống, không trùng khi register |
| Password | kiểm tra qua `AuthenticationManager`, lưu hash khi register |
| User active | `dangHoatDong=true` mới login được |
| Token | frontend lưu để gọi API protected; backend đọc qua JWT filter |

### 51.2. Candidate Profile

| Nhóm | Rule |
| --- | --- |
| Summary | Cho phép update text giới thiệu/mục tiêu nghề nghiệp |
| Skills | Replace-all theo danh sách ID |
| Industries | Replace-all theo danh sách ID |
| Education | Check ownership, gắn vào profile, proof URL quyết định status |
| Certificate | Có `loaiChungChiId`, proof URL phục vụ admin duyệt |
| Experience | Gắn vào profile, dùng cho explanation/matching |
| Selection | Bật/tắt item trong hồ sơ cụ thể, không nên ảnh hưởng hồ sơ khác |

Validation UI nên giữ:

- Không submit nhiều lần khi `saving=true`.
- Hiện lỗi ngay gần field/upload box.
- Không gọi API lưu học vấn/chứng chỉ nếu thiếu minh chứng theo rule hiện tại.
- Sau mutate nên reload profile hoặc update state từ response để tránh UI lệch DB.

### 51.3. Company Job

| Nhóm | Rule |
| --- | --- |
| Company | phải approved |
| Package | phải có gói active nếu tạo job |
| Branch | branchId phải thuộc công ty và user có quyền |
| Skills | gửi danh sách skill IDs, backend replace mapping |
| Status | company tạo, admin review để public |
| Index | update/delete cần sync Elasticsearch/Qdrant |

Validation UI nên giữ:

- Disable submit nếu thiếu field bắt buộc.
- Không cho HR chọn chi nhánh ngoài scope.
- Metadata job lấy từ API, không hard-code catalog.
- Delete job cần confirm dialog.

### 51.4. Application

| Nhóm | Rule |
| --- | --- |
| Job | phải tồn tại, public/valid theo service |
| Candidate | phải đăng nhập |
| Profile | `hoSoUngVienId` phải thuộc user |
| Duplicate | không nộp trùng cùng job |
| CV | nếu job yêu cầu CV thì payload phải có URL/file |
| Status update | HR/Owner phải có quyền với application |

### 51.5. Admin Review

| Nhóm | Rule |
| --- | --- |
| Company approve | set company `APPROVED`, update proof nếu service làm |
| Company reject | set `REJECTED`, lưu lý do nếu schema/service hỗ trợ |
| Job approve | set public status, sync index, notify company |
| Job reject/hide | remove/hide khỏi public search, notify company |
| Candidate proof | update `trangThai` của học vấn/chứng chỉ |
| Catalog/package | CRUD dữ liệu danh mục, không đổi schema |

## 52. Notification Event Map

| Event | Người nhận chính | Nội dung nghiệp vụ | Nơi thường tạo |
| --- | --- | --- | --- |
| Admin duyệt công ty | Owner | Công ty được duyệt, mở chức năng | `AdminCompanyService` |
| Admin từ chối công ty | Owner | Công ty bị từ chối, cần bổ sung | `AdminCompanyService` |
| Admin duyệt job | Owner/HR liên quan | Job được public | `AdminJobService` |
| Admin từ chối/hide job | Owner/HR liên quan | Job không public | `AdminJobService` |
| Candidate nộp đơn | Owner/HR liên quan | Có đơn mới cho job | `CandidateJobApplicationService` |
| HR đổi trạng thái đơn | Candidate | Đơn ứng tuyển đổi trạng thái | `CompanyAdminApplicationService` |
| Admin duyệt proof candidate | Candidate | Minh chứng được xác minh | `AdminCandidateProofService` |
| Admin từ chối proof candidate | Candidate | Minh chứng bị từ chối | `AdminCandidateProofService` |
| Gói active sau thanh toán | Owner | Gói đã thanh toán/kích hoạt | `SepayWebhookService` |
| Tin nhắn mới | Người còn lại trong conversation | Có message mới | `ChatService` hoặc realtime layer |

Quy tắc debug notification:

- Nếu không thấy badge, kiểm tra event có gọi `NotificationService` không.
- Nếu sai người nhận, kiểm tra user id được truyền vào notification.
- Nếu đã có DB record nhưng UI không tăng, kiểm tra unread-count và mark-read.
- Nếu notification dẫn sai trang, kiểm tra field đường dẫn nếu schema/service có dùng.

## 53. Chat Business Rules Chi Tiết

### 53.1. Các Context Mở Chat

| Context | API | Ý nghĩa |
| --- | --- | --- |
| Candidate chat từ job | `POST /api/v1/chats/jobs/{jobId}/open` | Candidate hỏi nhà tuyển dụng về job |
| Recruiter chat từ application | `POST /api/v1/chats/applications/{applicationId}/open` | HR trao đổi với candidate đã apply |
| Recruiter chat từ candidate match | `POST /api/v1/chats/jobs/{jobId}/candidate-profiles/{profileId}/open` | HR liên hệ candidate phù hợp chưa apply |

### 53.2. Rule Find-Or-Create Conversation

```text
Request mở chat
-> xác định candidate user/profile
-> xác định recruiter/company/job context
-> tìm conversation đã tồn tại theo context
-> nếu chưa có thì tạo CuocTroChuyen
-> trả conversation detail
```

Rule cần giữ:

- Không tạo duplicate conversation cho cùng job/candidate/recruiter context nếu service đã có unique logic.
- Message phải lưu DB trước khi publish realtime event.
- Realtime event chỉ là kênh đẩy UI, không thay thế dữ liệu gốc trong DB.
- Người gửi không nên nhận nhầm event như người nhận nếu UI đã optimistic append.

### 53.3. Debug Chat

| Triệu chứng | Kiểm tra |
| --- | --- |
| Không mở được chat từ job | job public/approved, candidate login, `ChatController.openJobConversation` |
| HR mở chat sai candidate | application/profile id, mapper partner label, company scope |
| Tin gửi rồi reload mất | `TinNhanRepository.save`, transaction, list messages API |
| Realtime không chạy | WebSocket URL, handshake token, `ChatWebSocketSessionRegistry`, publisher |
| Conversation bị trùng | find-or-create key trong `ChatService` |

## 54. Operational Runbook Cho Demo Và Vận Hành

### 54.1. Trước Khi Demo

Checklist:

1. Backend chạy được.
2. Frontend chạy được.
3. Database có user admin, candidate, owner/HR demo.
4. Có ít nhất một công ty `APPROVED`.
5. Có ít nhất một gói active hoặc chuẩn bị flow SePay.
6. Có job approved để public search.
7. Có hồ sơ candidate đủ skills/industries/experience.
8. Qdrant/embedding service chạy nếu demo matching.
9. Elasticsearch chạy nếu demo full-text search.
10. Cloudinary config đúng nếu demo upload.

### 54.2. Khi Demo Matching

Thứ tự an toàn:

```text
1. Chạy/kiểm tra embedding service
2. Kiểm tra Qdrant
3. Admin reindex jobs-profiles
4. Admin reindex experiences nếu cần explanation kinh nghiệm
5. Vào company-admin applications
6. Chọn chi nhánh
7. Chọn job
8. Chạy candidate matching
9. Nếu có application, chạy application matching
10. Mở insight panel để giải thích
```

Nếu kết quả rỗng:

- Kiểm tra job đã approved và có vector.
- Kiểm tra candidate profile có vector.
- Kiểm tra profile có skills/industries/experience đủ dữ liệu.
- Kiểm tra Qdrant collection name.
- Kiểm tra embedding service có lỗi không.

### 54.3. Khi Demo SePay

Thứ tự:

```text
1. Owner vào packages
2. Chọn gói
3. Backend tạo registration PENDING/UNPAID
4. UI hiển thị QR/payment code
5. SePay webhook gửi callback
6. Backend verify secret/content/amount
7. Registration chuyển PAID/ACTIVE
8. Reload packages
9. Tạo job để chứng minh gói có hiệu lực
```

Nếu gói không active:

- Kiểm tra webhook endpoint đúng chưa.
- Kiểm tra secret.
- Kiểm tra nội dung chuyển khoản có payment code.
- Kiểm tra amount.
- Kiểm tra registration id trong content có parse được không.
- Kiểm tra idempotency nếu webhook đã được xử lý trước đó.

### 54.4. Khi Demo Upload Cloudinary

Luồng chuẩn:

```text
Frontend xin signature
-> Cloudinary direct upload
-> lấy secure_url
-> gửi secure_url vào API domain
-> backend lưu URL
-> UI reload data
```

Nếu upload lỗi:

- Kiểm tra Cloudinary env.
- Kiểm tra purpose truyền vào signature.
- Kiểm tra file type/size nếu UI có giới hạn.
- Kiểm tra browser network tới Cloudinary.
- Kiểm tra payload lưu URL xuống backend.

## 55. Chuẩn Báo Cáo Kiến Trúc Theo 5 Lớp

Khi cần trình bày một chức năng bất kỳ, dùng cùng một format 5 lớp để câu trả lời chặt chẽ:

```text
1. UI route/component
2. Hook quản lý state/action
3. Frontend service gọi API
4. Backend controller nhận request
5. Backend service xử lý business rule + repository/external service
```

Ví dụ company tạo job:

```text
UI: app/company-admin/jobs/CompanyAdminJobsClient
Hook: useCompanyAdminJobActions
Service FE: services/company-admin/jobs.service.ts
Controller: CompanySubAdminController
Service BE: CompanyAdminJobService
Repository/Infra: TinTuyenDungRepository, KyNangTinTuyenDungRepository, Elasticsearch, Qdrant
```

Ví dụ candidate apply:

```text
UI: app/jobs/[id]/JobApplyModal
Hook: useJobDetail
Service FE: candidate-application.service.ts
Controller: CandidateJobApplicationController
Service BE: CandidateJobApplicationService
Repository/Infra: DonUngTuyenRepository, CandidateProfileRepository, ApplicationEmbeddingIndexService, NotificationService
```

Ví dụ admin duyệt proof:

```text
UI: app/admin/candidate-proofs
Hook: useAdminCandidateProofsActions
Service FE: candidate-proofs.service.ts
Controller: AdminCandidateProofController
Service BE: AdminCandidateProofService
Repository/Infra: HocVanUngVienRepository, ChungChiUngVienRepository, NotificationService
```

## 56. Checklist Khi Cập Nhật BUSINESS_FLOW.md Sau Này

Khi thêm/sửa chức năng, cập nhật tài liệu này theo cùng cấu trúc:

1. Mục actor nào bị ảnh hưởng.
2. Route frontend nào thay đổi.
3. Hook/service frontend nào gọi API.
4. Endpoint mới hoặc endpoint đổi hành vi.
5. Controller/service backend xử lý.
6. Entity/repository nào liên quan.
7. Status/permission/validation nào mới.
8. Có ảnh hưởng notification/chat/search/index/payment không.
9. QA case cần thêm.
10. Giới hạn schema nếu có.

Quy tắc viết tài liệu:

- Ghi đường dẫn file thật để dễ trace.
- Ghi flow dạng text trước, chi tiết endpoint sau.
- Ghi business rule bằng ngôn ngữ nghiệp vụ, không chỉ mô tả code.
- Nếu behavior phụ thuộc config hoặc service ngoài, ghi rõ điều kiện.
- Nếu chưa chắc tên trạng thái thật, ghi theo ý nghĩa nghiệp vụ và kiểm tra source trước khi khẳng định.

## 57. CodeGraph Source Walkthrough Bổ Sung

Phần này được bổ sung sau khi đọc source bằng CodeGraph, tập trung vào các chi tiết thật đang nằm trong service/controller/hook để khi báo cáo hoặc debug không bị nói chung chung.

### 57.1. Login Redirect Theo Source Frontend

Trong `useLoginFlow`, frontend không chỉ dựa vào role trong token để điều hướng.

Luồng thật:

```text
authService.login(data)
-> lưu accessToken vào localStorage
-> lưu user vào localStorage
-> setAuthCookie(token, expiry)
-> nếu role ADMIN: router.replace("/admin")
-> nếu không phải ADMIN:
     gọi companyAdminService.getMe()
     nếu getMe thành công:
       nếu company REJECTED -> /company-admin/settings
       ngược lại -> /company-admin
     nếu getMe lỗi -> /
```

Ý nghĩa nghiệp vụ:

- Candidate bình thường sau login sẽ rơi về `/` vì không có membership company nên `companyAdminService.getMe()` lỗi.
- Owner/HR có membership sẽ vào company-admin.
- Công ty bị từ chối được đưa thẳng về settings để sửa thông tin/minh chứng.
- Admin không gọi company-admin me vì role admin được xử lý trước.

Điểm debug:

- Nếu owner login nhưng về `/`, kiểm tra `GET /api/v1/company-admin/me` và membership `ThanhVienCongTy`.
- Nếu company bị `REJECTED` nhưng không vào settings, kiểm tra `congTy.trangThai` trong `CompanyAdminMeResponse`.
- Nếu token đã lưu nhưng route protected vẫn lỗi, kiểm tra cookie qua `setAuthCookie` và localStorage.

### 57.2. Auth Backend Theo Source

`AuthController` có prefix:

```http
/api/v1/auth
```

Các trách nhiệm thật:

| Endpoint | Controller | Service |
| --- | --- | --- |
| `GET /cloudinary-signature` | `AuthController.getCloudinarySignature` | `CloudinaryStorageService.generateSignature` |
| `POST /register` | `AuthController.registerCandidate` | `AuthService.registerCandidate` |
| `POST /login` | `AuthController.login` | `AuthService.login` |
| `POST /register-owner` | `AuthController.registerOwner` | `OwnerRegistrationService.registerOwner` |
| `GET /proof-types` | `AuthController.getOwnerProofTypes` | `OwnerRegistrationService.listOwnerProofTypes` |
| `GET /me` | `AuthController.getMe` | `AuthUserProfileService` |
| `PATCH /me` | `AuthController.updateMe` | `AuthUserProfileService` |
| `PATCH /me/avatar` | `AuthController.updateAvatar` | `AuthUserProfileService` |

`AuthService.registerCandidate` làm các việc chính:

```text
normalize email
-> ensureEmailNotExists
-> requireRole(CANDIDATE)
-> encode password
-> set dangHoatDong=true
-> save NguoiDung
-> jwtService.generateAccessToken
-> build AuthResponse
```

`AuthService.login` làm các việc chính:

```text
normalize email
-> find user by email
-> nếu user không active: 403
-> AuthenticationManager.authenticate
-> generate access token
-> build AuthResponse
```

Điểm cần nói khi bảo vệ:

- Mật khẩu không so sánh thủ công trong controller; Spring Security authentication manager xử lý.
- Email được normalize trước khi tìm/lưu để tránh trùng khác chữ hoa/thường.
- User bị khóa không được login dù credential đúng.
- Register candidate trả token ngay, nên user có thể vào hệ thống sau đăng ký.

### 57.3. Cloudinary Signature Theo Source

`CloudinaryStorageService.generateSignature(purpose)` tạo response gồm:

| Field | Ý nghĩa |
| --- | --- |
| `signature` | chữ ký do Cloudinary API sign từ params |
| `timestamp` | thời điểm ký |
| `cloud_name` | cloud name từ config |
| `api_key` | public API key |
| `folder` | folder upload đã resolve |

Logic folder hiện tại:

```text
purpose == "logo" -> properties.logoFolder
purpose khác      -> properties.folder
```

Ý nghĩa:

- `logo` đi vào folder logo.
- `proof`, `avatar`, `cv` hoặc purpose khác hiện rơi về folder mặc định.
- Frontend upload trực tiếp Cloudinary, backend chỉ cấp chữ ký và lưu URL sau đó.

Debug upload:

- Nếu logo vào sai folder, kiểm tra purpose frontend có truyền `"logo"` không.
- Nếu avatar/proof dùng chung folder là đúng theo source hiện tại.
- Nếu cần tách folder avatar/CV riêng, phải sửa `resolveFolder`, config, tài liệu và kiểm thử upload lại.

## 58. Company Admin Theo Source

### 58.1. `company-admin/me` Là Điểm Hydrate Quyền

`CompanyAdminProfileService.getMe` làm các việc:

```text
principal.userId
-> accessService.getActiveMemberships(userId)
-> nếu rỗng: 403 "Người dùng không thuộc công ty nào"
-> lấy membership đầu tiên để xác định công ty
-> build thông tin người dùng
-> build thông tin công ty
-> nếu có owner membership:
     listOwnerBranches(firstMembership)
   nếu không:
     map các branch từ membership active
-> trả CompanyAdminMeResponse
```

Ý nghĩa:

- `company-admin/me` là API trung tâm để shell/sidebar biết user là owner hay HR.
- Owner được mở rộng ra toàn bộ chi nhánh công ty.
- HR chỉ nhận chi nhánh trong membership active.
- Nếu user role hệ thống là `CANDIDATE` nhưng có membership owner/HR, vẫn vào company-admin được.

### 58.2. Update Company Info/Logo/Resubmit

Theo `CompanyAdminProfileService`:

| Action | Rule source |
| --- | --- |
| Update logo | `logoUrl` phải có text, trim rồi lưu vào `CongTy.logoUrl`. |
| Update info | Chỉ set field nếu request có dữ liệu phù hợp; website rỗng thì clear về null. |
| Resubmit | Chỉ công ty `REJECTED` mới được chuyển về `PENDING`; đồng thời clear `lyDoTuChoi`. |
| Resolve approved company | Nếu company không `APPROVED`, throw `403`. |

Điểm báo cáo:

- Công ty bị từ chối có đường quay lại quy trình duyệt thông qua resubmit.
- Resubmit không tự approved; chỉ đưa về `PENDING` để admin duyệt lại.
- Các action vận hành nhạy cảm dùng `resolveApprovedManagedCompany`, nên công ty pending/rejected bị chặn ở backend.

### 58.3. Company Job Service Theo Source

`CompanyAdminJobService.createJob` làm đúng thứ tự:

```text
resolveApprovedManagedCompany(userId)
-> ensureActivePostingPackage(congTy)
-> accessService.requireMembership(userId, request.chiNhanhId, OWNER/HR)
-> tạo TinTuyenDung
-> set nguoiDang từ membership.nguoiDung
-> set chiNhanh từ membership.chiNhanh
-> applyJobPayload
-> set trangThai = "DRAFT"
-> save TinTuyenDung
-> replaceJobSkills
-> syncJobIndexes
-> map response
```

Chi tiết `applyJobPayload`:

| Field request | Lưu vào job |
| --- | --- |
| `tieuDe` | `TinTuyenDung.tieuDe` sau trim |
| `nganhNgheId` | load `NganhNghe` |
| `moTa` | `TinTuyenDung.moTa` sau trim |
| `yeuCau` | `TinTuyenDung.yeuCau` sau trim |
| `phucLoi` | trim hoặc null |
| `batBuocCV` | boolean |
| `mauCvUrl` | trim hoặc null |
| `loaiHinhLamViecId` | load `LoaiHinhLamViec` |
| `capDoKinhNghiemId` | load `CapDoKinhNghiem` |
| `luongToiThieu` | salary min |
| `luongToiDa` | salary max |
| `soLuongTuyen` | số lượng tuyển |
| `denHanLuc` | hạn nộp |

Điểm quan trọng:

- Job tạo từ company-admin hiện được set `DRAFT`.
- Skill mapping được thay sau khi job được save.
- Index được sync sau khi mapping kỹ năng đã lưu để search/matching có dữ liệu đủ.
- Delete job là soft delete bằng `ngayXoa`, sau đó sync index để job biến khỏi public/matching nếu service index xử lý đúng.

### 58.4. Company Applications Theo Source

`CompanyAdminApplicationService` có status whitelist:

```text
PENDING
REVIEWING
ACCEPTED
REJECTED
```

Luồng list/detail/update:

```text
listApplications(principal, chiNhanhId)
-> requireMembership(userId, chiNhanhId, OWNER/HR)
-> query DonUngTuyen theo TinTuyenDung.ChiNhanh.Id
-> mapper mapApplication(detail=false)

getApplicationDetail(principal, applicationId)
-> requireManagedApplication
-> mapper mapApplication(detail=true)

updateApplicationStatus(principal, applicationId, request)
-> requireManagedApplication
-> normalizeApplicationStatus
-> save status
-> notify candidate
```

Rule cần giữ:

- Không nhận status ngoài whitelist.
- Application detail phải đi qua `requireManagedApplication`, không query trực tiếp theo id rồi trả ra.
- Candidate profile detail cho job dùng `getCandidateProfileForJob`, trước tiên gọi `jobService.requireManagedJob`, sau đó mới map profile.
- Company applications list được scope theo chi nhánh của job, không theo candidate.

## 59. Matching Theo Source

### 59.1. Candidate Matches Cho HR

`SemanticMatchingService.findMatchingCandidatesForJob`:

```text
requireQdrantEnabled
-> load TinTuyenDung by jobId, ngayXoa null
-> lấy branchId từ job.chiNhanh
-> accessService.requireMembership(userId, branchId, OWNER/HR)
-> jobEmbeddingIndexService.getOrCreateIndexVectorForMatching(job)
-> qdrant search khoHoSoUngVien với queryVector
-> đọc payload hoSoUngVienId
-> load HoSoUngVien theo ids và ngayXoa null
-> mapCandidateMatch
-> sort theo score
-> limit
```

Điểm nghiệp vụ:

- HR chỉ match được job thuộc chi nhánh mình có quyền.
- Qdrant trả vector candidates, DB vẫn là nguồn xác thực profile còn tồn tại.
- `getOrCreateIndexVectorForMatching` giúp lazy index job nếu chưa có vector.
- Candidate matching không cần có `DonUngTuyen`.

### 59.2. Application Matches Cho HR

`SemanticMatchingService.findSubmittedApplicationMatchesForJob`:

```text
requireQdrantEnabled
-> load TinTuyenDung by jobId, ngayXoa null
-> requireMembership theo branchId
-> load DonUngTuyen của job
-> nếu không có đơn: return []
-> ensureIndexedForMatching từng application
-> lấy job vector
-> qdrant search khoDonUngTuyen filter tinTuyenDungId
-> mapSubmittedApplicationMatch
-> sort theo score
-> limit
```

Điểm nghiệp vụ:

- Application matching chỉ rank những đơn đã nộp vào job đó.
- Nếu job chưa có đơn thì empty là đúng, không phải lỗi Qdrant.
- Filter `tinTuyenDungId` ở Qdrant giúp không lẫn application của job khác.
- Trước khi search, service đảm bảo application đã được index.

### 59.3. Recommended Jobs Cho Candidate

`SemanticMatchingService.findMatchingJobsForProfile`:

```text
requireQdrantEnabled
-> load HoSoUngVien theo profileId + userId
-> candidateProfileEmbeddingIndexService.getOrCreateIndexVectorForMatching(profile)
-> qdrant search khoTinTuyenDung
-> đọc payload tinTuyenDungId
-> load jobs bằng findPublicApprovedActiveJobsByIds
-> enrich bằng candidate skills/industries/experience/summary
-> map JobSemanticMatchResponse
```

Điểm nghiệp vụ:

- Candidate chỉ match job bằng profile thuộc chính user đó.
- Job trả về phải là public approved active, không chỉ vì Qdrant có vector.
- Nếu profile thiếu summary/skills/experience, score/explanation có thể nghèo hơn dù vector vẫn tồn tại.

## 60. SePay Theo Source

### 60.1. Verify Webhook

`SepayWebhookService.verifyWebhookSecret`:

```text
expectedSecret = sepayProperties.webhookSecretKey
-> nếu chưa config: 500
-> đọc secret từ X-Secret-Key
-> nếu không có thì đọc Authorization dạng "Apikey <secret>"
-> nếu không khớp: 401
```

Ý nghĩa:

- Webhook không có secret hoặc secret sai không được xử lý.
- Hỗ trợ cả header riêng và Authorization `Apikey`.
- Nếu môi trường thiếu config secret, lỗi là lỗi vận hành backend, không phải lỗi user.

### 60.2. Handle Webhook Tiền Vào

`SepayWebhookService.handleWebhook`:

```text
if request null -> 400
if transferType != "in" -> return null
extract registration id từ code/content/referenceCode/description
load DangKyGoiCongTy
if already paid -> return registration
verifyAmount
resolve duration days từ DanhMucGoi
resolve start time
set trangThaiThanhToan = "PAID"
set trangThai = "ACTIVE"
set batDauLuc/hetHanLuc
save registration
NotificationService.createForUser(owner, ...)
return saved
```

Điểm nghiệp vụ:

- Webhook tiền ra bị bỏ qua.
- Nếu đăng ký đã paid, webhook lặp không nhân đôi thời hạn vì service return sớm.
- Registration id có thể lấy từ `code`; nếu không có thì thử các field text khác.
- Amount được verify trước khi active.
- Sau active có notification về `/company-admin/packages`.

Debug:

- Nếu webhook trả 404, kiểm tra registration id parse từ nội dung chuyển khoản.
- Nếu 401, kiểm tra secret.
- Nếu không active mà không lỗi, kiểm tra `transferType` có phải `"in"` không.
- Nếu webhook lặp nhưng không đổi gì thêm, đó là idempotency đúng.

## 61. Public Job Detail Theo Source Frontend

`useJobDetail` điều phối nhiều trạng thái nhỏ trên trang `/jobs/[id]`.

### 61.1. Load Job Và Session Candidate

Luồng:

```text
đọc token localStorage
-> kiểm expiry JWT
-> nếu hết hạn: clearAdminSession, setIsCandidate(false)
-> đọc user localStorage
-> isCandidate = user.vaiTro === CANDIDATE
-> publicJobService.getJobDetail(jobId)
-> nếu lỗi: "Tin tuyển dụng không tồn tại, chưa được duyệt hoặc đã hết hạn."
```

Sau khi có job và user là candidate:

```text
publicJobService.getFavoriteStatus(job.id)
candidateApplicationService.getApplicationStatus(job.id)
```

Ý nghĩa:

- Guest vẫn xem detail public được.
- Favorite/apply status chỉ gọi khi frontend xác định user là candidate.
- Nếu token hết hạn, session local bị clear để tránh UI hiện action sai.

### 61.2. Apply Modal

Luồng mở modal:

```text
if chưa login candidate -> /auth/login
if đã apply -> không mở lại
set modal open
if chưa có profiles trong state:
    candidateProfileService.listProfiles()
    nếu chỉ có một profile thì auto select
```

Luồng submit:

```text
if chưa chọn profile -> lỗi "Vui lòng chọn hồ sơ ứng viên."
if job.batBuocCV && chưa có cvFile -> lỗi "Tin này bắt buộc nộp file CV."
if cần CV:
    authService.getCloudinarySignature("proof")
    authService.uploadToCloudinary(file, signature)
candidateApplicationService.applyToJob(job.id, { hoSoUngVienId, cvUrl })
setHasApplied(true)
đóng modal
hiện notice ứng tuyển thành công
```

Điểm cần nhớ:

- CV bắt buộc hiện đang dùng Cloudinary signature purpose `"proof"`.
- `hoSoUngVienId` được convert sang number trước khi gửi.
- Apply thành công cập nhật state local ngay, không cần reload cả trang.

## 62. Admin Controllers Theo Source

Các admin controller đã được split thành 8 class chuyên biệt. Tất cả đều extend `AbstractAdminController` và gọi `requireAdmin()` trước khi gọi service.

Nhóm endpoint thật:

| Nhóm | Endpoint chính | Service qua facade |
| --- | --- | --- |
| Dashboard | `GET /stats` | `adminService.getStats` |
| Users | `GET /users`, `PATCH /users/{userId}/status`, `DELETE /users/{userId}` | user service phía sau facade |
| Companies | `GET /companies`, `GET /companies/{companyId}`, approve/reject | company service phía sau facade |
| Packages | `GET/POST/PATCH/DELETE /packages`, `GET /packages/subscriptions` | package service |
| Jobs | `GET /jobs`, `GET /jobs/{jobId}`, approve/reject/hide | job service |
| Candidate proofs | `/candidate-proofs` | proof service |
| Catalogs | `/system-roles`, `/company-roles`, `/proof-types`, `/certificate-types` | catalog service |
| Index | `/elasticsearch/*`, `/qdrant/*` | search index service |

Điểm source đáng chú ý:

- `stats()` trả dashboard cards: tổng user/công ty và trạng thái chính.
- `companyDetail()` trả thông tin công ty, owner, chi nhánh, minh chứng.
- `approveCompany()` mở đường cho công ty đi tiếp vào company-admin.
- `rejectCompany()` nhận `ReviewCompanyRequest` để lưu lý do nếu service/schema hỗ trợ.
- `createPackage()` trả HTTP `201 CREATED`.
- Các thao tác delete/update đều đi sau `requireAdmin()`, frontend admin shell chỉ là lớp UX.

## 63. Error/HTTP Semantics Theo Source

| Tình huống | HTTP/source behavior | Ý nghĩa |
| --- | --- | --- |
| User không thuộc công ty | `403` trong `CompanyAdminProfileService.getMe` | Không có membership active |
| Công ty chưa approved | `403` trong `resolveApprovedManagedCompany` | Không được dùng chức năng vận hành |
| Resubmit khi không phải REJECTED | `400` | Chỉ công ty bị từ chối mới gửi lại |
| Job id null | `400` trong `requireManagedJob` | Request thiếu dữ liệu |
| Job không tồn tại/đã xóa | `404` | Không trả job soft-deleted |
| Job thiếu chi nhánh | `400` | Dữ liệu job không hợp lệ |
| Logo URL rỗng | `400` | Không lưu logo trống qua endpoint logo |
| Webhook secret sai | `401` | Callback không hợp lệ |
| Webhook secret chưa config | `500` | Lỗi cấu hình server |
| Webhook không parse được registration id | `400` | Nội dung thanh toán sai |
| Qdrant disabled | service matching throw lỗi | Matching không khả dụng |

Khi viết UI error:

- `400`: thường là lỗi input hoặc trạng thái action không hợp lệ.
- `401`: auth/webhook secret/token không hợp lệ.
- `403`: đăng nhập rồi nhưng không đủ quyền hoặc company status chưa đạt.
- `404`: record không tồn tại, đã xóa mềm hoặc không public.
- `500`: cấu hình/infra backend.

## 64. Những Điểm Dễ Bị Sai So Với Source

| Nhầm lẫn | Source đúng |
| --- | --- |
| Owner có role hệ thống riêng | Owner/HR được xác định qua `ThanhVienCongTy`; role hệ thống có thể vẫn là candidate. |
| Company job tạo xong là public ngay | `CompanyAdminJobService.createJob` set `trangThai = "DRAFT"`. |
| HR xem được mọi chi nhánh công ty | HR chỉ thấy chi nhánh từ membership active; owner mới mở toàn bộ branch. |
| Dropdown applications chỉ lấy job có đơn | Source job list lấy từ `CompanyAdminJobService.listJobs` theo branch, không phụ thuộc application. |
| Candidate matching rank đơn đã nộp | Candidate matching search profile collection; application matching mới rank đơn. |
| SePay webhook nào cũng xử lý | Service chỉ xử lý `transferType = "in"`. |
| Cloudinary purpose nào cũng có folder riêng | Source chỉ tách riêng `"logo"`, còn lại dùng folder mặc định. |
| Frontend tự quyết owner/HR bằng role token | Login frontend gọi `companyAdminService.getMe()` để xác định membership. |

## 65. Checklist Source-First Khi Mở Rộng Tài Liệu

Khi tiếp tục làm `BUSINESS_FLOW.md`, ưu tiên đọc source theo thứ tự này:

1. Frontend route `page.tsx` để biết màn hình nào là entry.
2. Client component chính để biết state/action nào được truyền xuống.
3. Hook `use...Data` và `use...Actions` để biết flow thật.
4. Frontend service để lấy endpoint chính xác.
5. Backend controller để biết HTTP method/path và guard.
6. Backend service để biết business rule, status, notification, index.
7. Repository/entity để biết dữ liệu thật và soft delete.
8. External service nếu flow chạm Cloudinary, SePay, Elasticsearch, Qdrant, WebSocket.

CodeGraph query gợi ý:

```text
AuthController AuthService OwnerRegistrationService CloudinaryStorageService
CompanySubAdminController CompanyAdminJobService CompanyAdminApplicationService
SemanticMatchingService JobEmbeddingIndexService CandidateProfileEmbeddingIndexService
AbstractAdminController AdminCompanyService AdminJobService AdminCandidateProofService
SepayWebhookService SepayPaymentService
ChatController ChatService ChatRealtimePublisher
useLoginFlow useJobDetail useCompanyAdminApplicationsData useApplicationsMatchingPreview
```

Rule khi cập nhật:

- Nếu CodeGraph cho thấy source khác tài liệu cũ, ưu tiên source hiện tại.
- Nếu tên status trong source là string, ghi đúng string đó.
- Nếu tài liệu muốn mô tả ý nghĩa nghiệp vụ rộng hơn source, ghi rõ đó là ý nghĩa/pipeline, không phải enum cứng.
- Không thêm hứa hẹn tính năng chưa thấy trong source.
