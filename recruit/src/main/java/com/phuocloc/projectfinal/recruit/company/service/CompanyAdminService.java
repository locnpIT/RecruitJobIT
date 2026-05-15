package com.phuocloc.projectfinal.recruit.company.service;

import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.auth.repository.UsersRepository;
import com.phuocloc.projectfinal.recruit.company.dto.request.CreateCompanyJobRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.UpdateCompanyJobRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.RegisterCompanyPackageRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.CompanyProofUploadBatchRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.UpdateCompanyInfoRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.UpdateCompanyLogoRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.UpdateCompanyProofRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.UpdateApplicationStatusRequest;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyAdminApplicationResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyAdminJobResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyAdminMeResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyAdminProofResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyJobMetadataResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyPackageOverviewResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyPackagePlanResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyPackageRegistrationResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyProofTypeResponse;
import com.phuocloc.projectfinal.recruit.company.enums.CompanyProofDocumentStatus;
import com.phuocloc.projectfinal.recruit.company.enums.CompanyProofDocumentType;
import com.phuocloc.projectfinal.recruit.company.enums.EmployerCompanyRole;
import com.phuocloc.projectfinal.recruit.candidate.repository.ChungChiUngVienRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.HocVanUngVienRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.KyNangRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.KyNangUngVienRepository;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ChiNhanhCongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.DanhMucGoi;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.DangKyGoiCongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.CongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.LoaiTaiLieu;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.TepMinhChungCongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ThanhVienCongTy;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.CapDoKinhNghiem;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.KyNang;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.LoaiHinhLamViec;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.NganhNghe;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.repository.CapDoKinhNghiemRepository;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.repository.LoaiHinhLamViecRepository;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.repository.NganhNgheRepository;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.DonUngTuyen;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.KyNangTinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoUngVien;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyBranchRepository;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyProofDocumentRepository;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyRepository;
import com.phuocloc.projectfinal.recruit.company.repository.DangKyGoiCongTyRepository;
import com.phuocloc.projectfinal.recruit.company.repository.DanhMucGoiRepository;
import com.phuocloc.projectfinal.recruit.company.repository.LoaiTaiLieuRepository;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.DonUngTuyenRepository;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.KyNangTinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.TinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.infrastructure.sepay.SepayPaymentService;
import com.phuocloc.projectfinal.recruit.infrastructure.sepay.SepayCheckoutForm;
import com.phuocloc.projectfinal.recruit.notification.service.NotificationService;
import java.net.URI;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.HashMap;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
/**
 * Nghiệp vụ chính của khu vực company-admin.
 *
 * <p>Service này gom phần lớn use case của owner/HR:
 * lấy thông tin công ty, quản lý minh chứng, quản lý gói, tạo/sửa/xóa job
 * và xem danh sách đơn ứng tuyển.</p>
 */
public class CompanyAdminService {

    private static final Pattern PACKAGE_DAYS_PATTERN = Pattern.compile("(\\d+)");
    private static final String COMPANY_NOT_APPROVED_MESSAGE = "Công ty chưa được duyệt, chỉ có thể cập nhật logo";
    private static final Set<String> COMPANY_ADMIN_ROLES = Set.of(
            EmployerCompanyRole.OWNER.name(),
            EmployerCompanyRole.MASTER_BRANCH.name(),
            EmployerCompanyRole.HR.name()
    );
    private static final Set<String> APPLICATION_STATUSES = Set.of(
            "PENDING",
            "REVIEWING",
            "ACCEPTED",
            "REJECTED"
    );

    private final CompanyAdminAccessService accessService;
    private final UsersRepository usersRepository;
    private final CompanyRepository companyRepository;
    private final CompanyBranchRepository companyBranchRepository;
    private final CompanyProofDocumentRepository companyProofDocumentRepository;
    private final DangKyGoiCongTyRepository dangKyGoiCongTyRepository;
    private final DanhMucGoiRepository danhMucGoiRepository;
    private final LoaiTaiLieuRepository loaiTaiLieuRepository;
    private final TinTuyenDungRepository tinTuyenDungRepository;
    private final DonUngTuyenRepository donUngTuyenRepository;
    private final KyNangTinTuyenDungRepository kyNangTinTuyenDungRepository;
    private final HocVanUngVienRepository hocVanUngVienRepository;
    private final ChungChiUngVienRepository chungChiUngVienRepository;
    private final KyNangRepository kyNangRepository;
    private final KyNangUngVienRepository kyNangUngVienRepository;
    private final NganhNgheRepository nganhNgheRepository;
    private final LoaiHinhLamViecRepository loaiHinhLamViecRepository;
    private final CapDoKinhNghiemRepository capDoKinhNghiemRepository;
    private final SepayPaymentService sepayPaymentService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public CompanyAdminMeResponse getMe(AppUserPrinciple principal) {
        // Đây là API "hydrate dashboard" nên trả về snapshot tổng hợp khá lớn.
        Integer userId = principal.getUserId().intValue();
        List<ThanhVienCongTy> memberships = accessService.getActiveMemberships(userId);
        if (memberships.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Người dùng không thuộc công ty nào");
        }

        ThanhVienCongTy firstMembership = memberships.getFirst();
        var user = usersRepository.findById(userId).orElse(null);
        CompanyAdminMeResponse.ThongTinNguoiDung nguoiDung = CompanyAdminMeResponse.ThongTinNguoiDung.builder()
                .id(principal.getUserId())
                .email(principal.getEmail())
                .ten(user == null ? null : user.getTen())
                .ho(user == null ? null : user.getHo())
                .vaiTroHeThong(principal.getRole().name())
                .dangHoatDong(principal.isEnabled())
                .build();

        CompanyAdminMeResponse.ThongTinCongTy congTy = mapCompanyResponse(firstMembership.getChiNhanh().getCongTy());

        // Owner thấy toàn bộ chi nhánh; HR chỉ thấy chi nhánh mình thuộc về.
        boolean laChuCongTy = memberships.stream().anyMatch(this::isOwnerMembership);
        List<CompanyAdminMeResponse.ThongTinChiNhanh> chiNhanhs;
        if (laChuCongTy) {
            Integer companyId = firstMembership.getChiNhanh().getCongTy().getId();
            chiNhanhs = companyBranchRepository.findByCongTy_Id(companyId).stream()
                    .map(branch -> CompanyAdminMeResponse.ThongTinChiNhanh.builder()
                            .chiNhanhId(branch.getId() == null ? null : branch.getId().longValue())
                            .chiNhanhTen(branch.getTen())
                            .congTyId(branch.getCongTy() == null || branch.getCongTy().getId() == null
                                    ? null
                                    : branch.getCongTy().getId().longValue())
                            .congTyTen(branch.getCongTy() == null ? null : branch.getCongTy().getTen())
                            .vaiTroCongTy(EmployerCompanyRole.OWNER.name())
                            .laTruSoChinh(branch.getLaTruSoChinh())
                            .trangThai(branch.getNgayXoa() == null ? "ACTIVE" : "DELETED")
                            .build())
                    .toList();
        } else {
            chiNhanhs = memberships.stream()
                    .map(this::mapBranchMembership)
                    .toList();
        }

        return CompanyAdminMeResponse.builder()
                .nguoiDung(nguoiDung)
                .congTy(congTy)
                .chiNhanhs(chiNhanhs)
                .build();
    }

    @Transactional(readOnly = true)
    public List<CompanyAdminMeResponse.ThongTinChiNhanh> getBranches(AppUserPrinciple principal) {
        Integer userId = principal.getUserId().intValue();
        return accessService.getAccessibleBranches(userId).stream()
                .map(branch -> CompanyAdminMeResponse.ThongTinChiNhanh.builder()
                        .chiNhanhId(branch.getId() == null ? null : branch.getId().longValue())
                        .chiNhanhTen(branch.getTen())
                        .congTyId(branch.getCongTy() == null || branch.getCongTy().getId() == null
                                ? null
                                : branch.getCongTy().getId().longValue())
                        .congTyTen(branch.getCongTy() == null ? null : branch.getCongTy().getTen())
                        .vaiTroCongTy(resolveRoleForBranch(userId, branch))
                        .laTruSoChinh(branch.getLaTruSoChinh())
                        .trangThai(branch.getNgayXoa() == null ? "ACTIVE" : "DELETED")
                        .build())
                .toList();
    }

    @Transactional
    public CompanyAdminMeResponse.ThongTinCongTy updateLogo(AppUserPrinciple principal, UpdateCompanyLogoRequest request) {
        Integer userId = principal.getUserId().intValue();
        CongTy congTy = resolveManagedCompany(userId);

        if (request == null || !StringUtils.hasText(request.getLogoUrl())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "logoUrl không hợp lệ");
        }

        congTy.setLogoUrl(request.getLogoUrl().trim());
        congTy = companyRepository.save(congTy);

        return mapCompanyResponse(congTy);
    }

    @Transactional
    public CompanyAdminMeResponse.ThongTinCongTy updateCompanyInfo(AppUserPrinciple principal, UpdateCompanyInfoRequest request) {
        Integer userId = principal.getUserId().intValue();
        CongTy congTy = resolveManagedCompany(userId);

        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dữ liệu cập nhật không hợp lệ");
        }

        if (StringUtils.hasText(request.getTenCongTy())) {
            congTy.setTen(request.getTenCongTy().trim());
        }
        if (StringUtils.hasText(request.getMaSoThue())) {
            congTy.setMaSoThue(request.getMaSoThue().trim());
        }
        if (StringUtils.hasText(request.getWebsite())) {
            congTy.setWebsite(request.getWebsite().trim());
        } else {
            congTy.setWebsite(null);
        }
        if (request.getMoTaCongTy() != null) {
            congTy.setMoTa(trimToNull(request.getMoTaCongTy()));
        }

        congTy = companyRepository.save(congTy);
        return mapCompanyResponse(congTy);
    }

    @Transactional
    public CompanyAdminProofResponse uploadProofDocument(AppUserPrinciple principal, UpdateCompanyProofRequest request) {
        Integer userId = principal.getUserId().intValue();
        CongTy congTy = resolveManagedCompany(userId);

        if (request == null || !StringUtils.hasText(request.getDuongDanTep())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "duongDanTep không hợp lệ");
        }

        LoaiTaiLieu loaiTaiLieu = resolveOrCreateLoaiTaiLieu(CompanyProofDocumentType.BUSINESS_REGISTRATION.name());
        return saveProofDocument(congTy, loaiTaiLieu, request.getDuongDanTep(), request.getTenTep());
    }

    @Transactional(readOnly = true)
    public List<CompanyProofTypeResponse> listProofTypes() {
        return loaiTaiLieuRepository.findAllByOrderByIdAsc().stream()
                .map(this::mapProofType)
                .toList();
    }

    @Transactional(readOnly = true)
    public CompanyJobMetadataResponse getJobMetadata() {
        // Metadata cho form tạo/sửa tin tuyển dụng.
        // Bao gồm cả kỹ năng để frontend render checklist, lưu vào bảng mapping KyNangTinTuyenDung.
        return CompanyJobMetadataResponse.builder()
                .nganhNghes(nganhNgheRepository.findAll().stream()
                        .map(this::mapMetadataOption)
                        .toList())
                .loaiHinhLamViecs(loaiHinhLamViecRepository.findAll().stream()
                        .map(this::mapMetadataOption)
                        .toList())
                .capDoKinhNghiems(capDoKinhNghiemRepository.findAll().stream()
                        .map(this::mapMetadataOption)
                        .toList())
                .kyNangs(kyNangRepository.findAllByOrderByTenAsc().stream()
                        .map(this::mapMetadataOption)
                        .toList())
                .build();
    }

    @Transactional
    public List<CompanyAdminProofResponse> uploadProofDocuments(AppUserPrinciple principal, CompanyProofUploadBatchRequest request) {
        Integer userId = principal.getUserId().intValue();
        CongTy congTy = resolveManagedCompany(userId);

        if (request == null || request.getMinhChungs() == null || request.getMinhChungs().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Danh sách minh chứng không hợp lệ");
        }

        return request.getMinhChungs().stream()
                .map(item -> saveProofDocument(
                        congTy,
                        resolveLoaiTaiLieuById(item.getLoaiTaiLieuId()),
                        item.getDuongDanTep(),
                        item.getTenTep()
                ))
                .toList();
    }

    @Transactional
    public CompanyAdminMeResponse.ThongTinCongTy resubmitCompany(AppUserPrinciple principal) {
        Integer userId = principal.getUserId().intValue();
        CongTy congTy = resolveManagedCompany(userId);

        if (!"REJECTED".equalsIgnoreCase(congTy.getTrangThai())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ công ty bị từ chối mới có thể gửi duyệt lại");
        }

        congTy.setTrangThai("PENDING");
        congTy.setLyDoTuChoi(null);
        congTy = companyRepository.save(congTy);

        return CompanyAdminMeResponse.ThongTinCongTy.builder()
                .id(congTy.getId() == null ? null : congTy.getId().longValue())
                .ten(congTy.getTen())
                .maSoThue(congTy.getMaSoThue())
                .website(congTy.getWebsite())
                .moTa(congTy.getMoTa())
                .logoUrl(congTy.getLogoUrl())
                .trangThai(congTy.getTrangThai())
                .lyDoTuChoi(congTy.getLyDoTuChoi())
                .build();
    }

    @Transactional(readOnly = true)
    public List<CompanyAdminJobResponse> listJobs(AppUserPrinciple principal, Integer chiNhanhId) {
        accessService.requireMembership(principal.getUserId().intValue(), chiNhanhId, COMPANY_ADMIN_ROLES);
        List<TinTuyenDung> jobs = tinTuyenDungRepository.findByChiNhanh_IdAndNgayXoaIsNullOrderByNgayTaoDesc(chiNhanhId);
        // Load kỹ năng theo batch để tránh N+1 query khi chi nhánh có nhiều tin.
        Map<Integer, List<CompanyAdminJobResponse.KyNangItem>> jobSkillMap = mapJobSkillsByJobIds(jobs);
        return jobs.stream()
                .map(job -> mapJob(job, jobSkillMap.getOrDefault(job.getId(), List.of())))
                .toList();
    }

    @Transactional
    public CompanyAdminJobResponse createJob(AppUserPrinciple principal, CreateCompanyJobRequest request) {
        CongTy congTy = resolveApprovedManagedCompany(principal.getUserId().intValue());
        ensureActivePostingPackage(congTy);
        ThanhVienCongTy membership = accessService.requireMembership(
                principal.getUserId().intValue(),
                request.getChiNhanhId(),
                COMPANY_ADMIN_ROLES
        );

        NganhNghe nganhNghe = nganhNgheRepository.findById(request.getNganhNgheId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ngành nghề"));
        LoaiHinhLamViec loaiHinhLamViec = loaiHinhLamViecRepository.findById(request.getLoaiHinhLamViecId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy loại hình làm việc"));
        CapDoKinhNghiem capDoKinhNghiem = capDoKinhNghiemRepository.findById(request.getCapDoKinhNghiemId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy cấp độ kinh nghiệm"));

        TinTuyenDung tinTuyenDung = new TinTuyenDung();
        tinTuyenDung.setNguoiDang(membership.getNguoiDung());
        tinTuyenDung.setChiNhanh(membership.getChiNhanh());
        tinTuyenDung.setTieuDe(request.getTieuDe().trim());
        tinTuyenDung.setNganhNghe(nganhNghe);
        tinTuyenDung.setMoTa(request.getMoTa().trim());
        tinTuyenDung.setYeuCau(request.getYeuCau().trim());
        tinTuyenDung.setPhucLoi(trimToNull(request.getPhucLoi()));
        tinTuyenDung.setBatBuocCV(Boolean.TRUE.equals(request.getBatBuocCV()));
        tinTuyenDung.setMauCvUrl(trimToNull(request.getMauCvUrl()));
        tinTuyenDung.setLoaiHinhLamViec(loaiHinhLamViec);
        tinTuyenDung.setCapDoKinhNghiem(capDoKinhNghiem);
        tinTuyenDung.setLuongToiThieu(request.getLuongToiThieu());
        tinTuyenDung.setLuongToiDa(request.getLuongToiDa());
        tinTuyenDung.setSoLuongTuyen(request.getSoLuongTuyen());
        tinTuyenDung.setTrangThai("DRAFT");
        tinTuyenDung.setDenHanLuc(request.getDenHanLuc());
        tinTuyenDung = tinTuyenDungRepository.save(tinTuyenDung);
        // Lưu danh sách kỹ năng yêu cầu của tin vào bảng mapping.
        replaceJobSkills(tinTuyenDung, request.getKyNangIds());

        return mapJob(tinTuyenDung, mapJobSkills(tinTuyenDung.getId()));
    }

    @Transactional
    public CompanyAdminJobResponse updateJob(AppUserPrinciple principal, Long jobId, UpdateCompanyJobRequest request) {
        TinTuyenDung tinTuyenDung = requireManagedJob(principal, jobId);

        NganhNghe nganhNghe = nganhNgheRepository.findById(request.getNganhNgheId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ngành nghề"));
        LoaiHinhLamViec loaiHinhLamViec = loaiHinhLamViecRepository.findById(request.getLoaiHinhLamViecId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy loại hình làm việc"));
        CapDoKinhNghiem capDoKinhNghiem = capDoKinhNghiemRepository.findById(request.getCapDoKinhNghiemId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy cấp độ kinh nghiệm"));

        tinTuyenDung.setTieuDe(request.getTieuDe().trim());
        tinTuyenDung.setNganhNghe(nganhNghe);
        tinTuyenDung.setMoTa(request.getMoTa().trim());
        tinTuyenDung.setYeuCau(request.getYeuCau().trim());
        tinTuyenDung.setPhucLoi(trimToNull(request.getPhucLoi()));
        tinTuyenDung.setBatBuocCV(Boolean.TRUE.equals(request.getBatBuocCV()));
        tinTuyenDung.setMauCvUrl(trimToNull(request.getMauCvUrl()));
        tinTuyenDung.setLoaiHinhLamViec(loaiHinhLamViec);
        tinTuyenDung.setCapDoKinhNghiem(capDoKinhNghiem);
        tinTuyenDung.setLuongToiThieu(request.getLuongToiThieu());
        tinTuyenDung.setLuongToiDa(request.getLuongToiDa());
        tinTuyenDung.setSoLuongTuyen(request.getSoLuongTuyen());
        tinTuyenDung.setDenHanLuc(request.getDenHanLuc());
        tinTuyenDung = tinTuyenDungRepository.save(tinTuyenDung);
        // Update kỹ năng theo chiến lược replace-all: dữ liệu trong request là nguồn sự thật.
        replaceJobSkills(tinTuyenDung, request.getKyNangIds());

        return mapJob(tinTuyenDung, mapJobSkills(tinTuyenDung.getId()));
    }

    @Transactional
    public void deleteJob(AppUserPrinciple principal, Long jobId) {
        TinTuyenDung tinTuyenDung = requireManagedJob(principal, jobId);
        tinTuyenDung.setNgayXoa(LocalDateTime.now());
        tinTuyenDungRepository.save(tinTuyenDung);
    }

    @Transactional(readOnly = true)
    public List<CompanyAdminApplicationResponse> listApplications(AppUserPrinciple principal, Integer chiNhanhId) {
        accessService.requireMembership(principal.getUserId().intValue(), chiNhanhId, COMPANY_ADMIN_ROLES);
        return donUngTuyenRepository.findByTinTuyenDung_ChiNhanh_IdAndNgayXoaIsNullOrderByNgayTaoDesc(chiNhanhId).stream()
                .map(application -> mapApplication(application, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public CompanyAdminApplicationResponse getApplicationDetail(AppUserPrinciple principal, Long applicationId) {
        DonUngTuyen application = requireManagedApplication(principal, applicationId);
        return mapApplication(application, true);
    }

    @Transactional
    public CompanyAdminApplicationResponse updateApplicationStatus(
            AppUserPrinciple principal,
            Long applicationId,
            UpdateApplicationStatusRequest request
    ) {
        DonUngTuyen application = requireManagedApplication(principal, applicationId);
        String status = normalizeApplicationStatus(request == null ? null : request.getTrangThai());
        application.setTrangThai(status);
        DonUngTuyen saved = donUngTuyenRepository.save(application);

        HoSoUngVien profile = saved.getHoSoUngVien();
        Integer candidateUserId = profile != null && profile.getNguoiDung() != null ? profile.getNguoiDung().getId() : null;
        String jobTitle = saved.getTinTuyenDung() == null ? "Tin tuyển dụng" : saved.getTinTuyenDung().getTieuDe();
        String link = saved.getTinTuyenDung() != null && saved.getTinTuyenDung().getId() != null
                ? "/jobs/" + saved.getTinTuyenDung().getId()
                : "/jobs";
        notificationService.createForUserId(
                candidateUserId,
                "Cập nhật trạng thái đơn ứng tuyển",
                "Đơn ứng tuyển vào \"" + (jobTitle == null ? "Tin tuyển dụng" : jobTitle) + "\" đã chuyển sang trạng thái " + status + ".",
                link
        );

        return mapApplication(saved, true);
    }

    @Transactional(readOnly = true)
    public CompanyPackageOverviewResponse listPackages(AppUserPrinciple principal) {
        CongTy congTy = accessService.resolveOwnerCompany(principal.getUserId().intValue());
        ensureCompanyApproved(congTy);

        List<CompanyPackagePlanResponse> plans = danhMucGoiRepository.findAllByOrderByIdAsc().stream()
                .map(this::mapPackagePlan)
                .toList();

        return CompanyPackageOverviewResponse.builder()
                .danhSachGoi(plans)
                .goiHienTai(findCurrentPackage(congTy).map(this::mapPackageRegistration).orElse(null))
                .coQuyenDangBai(hasActivePostingPackage(congTy))
                .build();
    }

    @Transactional
    public CompanyPackageRegistrationResponse registerPackage(AppUserPrinciple principal, RegisterCompanyPackageRequest request) {
        CongTy congTy = accessService.resolveOwnerCompany(principal.getUserId().intValue());
        ensureCompanyApproved(congTy);

        if (request == null || request.getDanhMucGoiId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần chọn gói");
        }

        DanhMucGoi danhMucGoi = danhMucGoiRepository.findById(request.getDanhMucGoiId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy gói"));

        DangKyGoiCongTy registration = new DangKyGoiCongTy();
        registration.setCongTy(congTy);
        registration.setDanhMucGoi(danhMucGoi);
        registration.setTrangThai("PENDING");
        registration.setTrangThaiThanhToan("UNPAID");
        registration.setBatDauLuc(null);
        registration.setHetHanLuc(null);
        registration.setGiaTaiThoiDiemDangKy(danhMucGoi.getGiaNiemYet());
        registration = dangKyGoiCongTyRepository.save(registration);

        if (registration.getGiaTaiThoiDiemDangKy() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Gói chưa có giá niêm yết");
        }

        String paymentCode = sepayPaymentService.buildPaymentCodeForRegistration(registration.getId());
        String transferContent = sepayPaymentService.buildTransferContent(paymentCode);
        String qrImageUrl = sepayPaymentService.buildQrImageUrl(
                Math.round(registration.getGiaTaiThoiDiemDangKy()),
                paymentCode
        );
        SepayCheckoutForm checkoutForm = sepayPaymentService.buildCheckoutForm(
                Math.round(registration.getGiaTaiThoiDiemDangKy()),
                paymentCode,
                "Thanh toan dang ky goi " + (danhMucGoi.getMaGoi() == null ? "" : danhMucGoi.getMaGoi()),
                String.valueOf(congTy.getId())
        );

        CompanyPackageRegistrationResponse response = mapPackageRegistration(registration);
        response.setPaymentGateway("SEPAY");
        response.setPaymentCode(paymentCode);
        response.setTransferContent(transferContent);
        response.setQrImageUrl(qrImageUrl);
        response.setCheckoutFormAction(checkoutForm.getActionUrl());
        response.setCheckoutFormFields(checkoutForm.getFields());
        return response;
    }

    private CompanyAdminMeResponse.ThongTinChiNhanh mapBranchMembership(ThanhVienCongTy membership) {
        ChiNhanhCongTy branch = membership.getChiNhanh();
        return CompanyAdminMeResponse.ThongTinChiNhanh.builder()
                .chiNhanhId(branch.getId() == null ? null : branch.getId().longValue())
                .chiNhanhTen(branch.getTen())
                .congTyId(branch.getCongTy() == null || branch.getCongTy().getId() == null
                        ? null
                        : branch.getCongTy().getId().longValue())
                .congTyTen(branch.getCongTy() == null ? null : branch.getCongTy().getTen())
                .vaiTroCongTy(membership.getVaiTroCongTy() == null ? null : membership.getVaiTroCongTy().getTen())
                .laTruSoChinh(branch.getLaTruSoChinh())
                .trangThai(membership.getTrangThai())
                .build();
    }

    private CongTy resolveManagedCompany(Integer userId) {
        List<ThanhVienCongTy> memberships = accessService.getActiveMemberships(userId);
        if (memberships.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Người dùng không thuộc công ty nào");
        }
        ChiNhanhCongTy firstBranch = memberships.getFirst().getChiNhanh();
        if (firstBranch == null || firstBranch.getCongTy() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không xác định được công ty quản lý");
        }
        Integer companyId = firstBranch.getCongTy().getId();
        if (companyId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không xác định được công ty quản lý");
        }
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy công ty"));
    }

    private CongTy resolveApprovedManagedCompany(Integer userId) {
        CongTy congTy = resolveManagedCompany(userId);
        if (!"APPROVED".equalsIgnoreCase(congTy.getTrangThai())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, COMPANY_NOT_APPROVED_MESSAGE);
        }
        return congTy;
    }

    private String resolveRoleForBranch(Integer userId, ChiNhanhCongTy branch) {
        if (isCompanyOwner(userId, branch == null || branch.getCongTy() == null ? null : branch.getCongTy().getId())) {
            return EmployerCompanyRole.OWNER.name();
        }
        return accessService.getActiveMemberships(userId).stream()
                .filter(membership -> membership.getChiNhanh() != null
                        && membership.getChiNhanh().getId() != null
                        && branch.getId() != null
                        && Objects.equals(membership.getChiNhanh().getId(), branch.getId()))
                .map(membership -> membership.getVaiTroCongTy() == null ? null : membership.getVaiTroCongTy().getTen())
                .filter(StringUtils::hasText)
                .findFirst()
                .orElse(branch.getLaTruSoChinh() ? EmployerCompanyRole.OWNER.name() : EmployerCompanyRole.HR.name());
    }

    private TinTuyenDung requireManagedJob(AppUserPrinciple principal, Long jobId) {
        if (jobId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "jobId không được để trống");
        }
        TinTuyenDung tinTuyenDung = tinTuyenDungRepository.findById(Math.toIntExact(jobId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tin tuyển dụng"));
        if (tinTuyenDung.getNgayXoa() != null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tin tuyển dụng");
        }
        if (tinTuyenDung.getChiNhanh() == null || tinTuyenDung.getChiNhanh().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tin tuyển dụng không hợp lệ");
        }
        accessService.requireMembership(
                principal.getUserId().intValue(),
                tinTuyenDung.getChiNhanh().getId(),
                COMPANY_ADMIN_ROLES
        );
        return tinTuyenDung;
    }

    private DonUngTuyen requireManagedApplication(AppUserPrinciple principal, Long applicationId) {
        if (principal == null || principal.getUserId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bạn cần đăng nhập");
        }
        if (applicationId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "applicationId không được để trống");
        }
        DonUngTuyen application = donUngTuyenRepository.findByIdAndNgayXoaIsNull(Math.toIntExact(applicationId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn ứng tuyển"));
        if (application.getTinTuyenDung() == null
                || application.getTinTuyenDung().getChiNhanh() == null
                || application.getTinTuyenDung().getChiNhanh().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đơn ứng tuyển không hợp lệ");
        }

        accessService.requireMembership(
                principal.getUserId().intValue(),
                application.getTinTuyenDung().getChiNhanh().getId(),
                COMPANY_ADMIN_ROLES
        );
        return application;
    }

    private String normalizeApplicationStatus(String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        if (!APPLICATION_STATUSES.contains(normalized)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Trạng thái đơn ứng tuyển không hợp lệ. Chỉ hỗ trợ PENDING, REVIEWING, ACCEPTED, REJECTED"
            );
        }
        return normalized;
    }

    private boolean isOwnerMembership(ThanhVienCongTy membership) {
        return membership != null
                && membership.getVaiTroCongTy() != null
                && EmployerCompanyRole.OWNER.name().equalsIgnoreCase(membership.getVaiTroCongTy().getTen());
    }

    private boolean isCompanyOwner(Integer userId, Integer companyId) {
        if (userId == null || companyId == null) {
            return false;
        }
        return accessService.getActiveMemberships(userId).stream()
                .filter(this::isOwnerMembership)
                .anyMatch(membership -> membership.getChiNhanh() != null
                        && membership.getChiNhanh().getCongTy() != null
                        && companyId.equals(membership.getChiNhanh().getCongTy().getId()));
    }

    private CompanyAdminJobResponse mapJob(TinTuyenDung tinTuyenDung, List<CompanyAdminJobResponse.KyNangItem> kyNangs) {
        return CompanyAdminJobResponse.builder()
                .id(tinTuyenDung.getId() == null ? null : tinTuyenDung.getId().longValue())
                .tieuDe(tinTuyenDung.getTieuDe())
                .trangThai(tinTuyenDung.getTrangThai())
                .chiNhanhId(tinTuyenDung.getChiNhanh() == null || tinTuyenDung.getChiNhanh().getId() == null
                        ? null
                        : tinTuyenDung.getChiNhanh().getId().longValue())
                .chiNhanhTen(tinTuyenDung.getChiNhanh() == null ? null : tinTuyenDung.getChiNhanh().getTen())
                .congTyId(tinTuyenDung.getChiNhanh() == null
                        || tinTuyenDung.getChiNhanh().getCongTy() == null
                        || tinTuyenDung.getChiNhanh().getCongTy().getId() == null
                        ? null
                        : tinTuyenDung.getChiNhanh().getCongTy().getId().longValue())
                .congTyTen(tinTuyenDung.getChiNhanh() == null || tinTuyenDung.getChiNhanh().getCongTy() == null
                        ? null
                        : tinTuyenDung.getChiNhanh().getCongTy().getTen())
                .moTa(tinTuyenDung.getMoTa())
                .yeuCau(tinTuyenDung.getYeuCau())
                .phucLoi(tinTuyenDung.getPhucLoi())
                .batBuocCV(tinTuyenDung.getBatBuocCV())
                .mauCvUrl(tinTuyenDung.getMauCvUrl())
                .nganhNgheId(tinTuyenDung.getNganhNghe() == null || tinTuyenDung.getNganhNghe().getId() == null
                        ? null
                        : tinTuyenDung.getNganhNghe().getId().longValue())
                .nganhNgheTen(tinTuyenDung.getNganhNghe() == null ? null : tinTuyenDung.getNganhNghe().getTen())
                .loaiHinhLamViecId(tinTuyenDung.getLoaiHinhLamViec() == null || tinTuyenDung.getLoaiHinhLamViec().getId() == null
                        ? null
                        : tinTuyenDung.getLoaiHinhLamViec().getId().longValue())
                .loaiHinhLamViecTen(tinTuyenDung.getLoaiHinhLamViec() == null ? null : tinTuyenDung.getLoaiHinhLamViec().getTen())
                .capDoKinhNghiemId(tinTuyenDung.getCapDoKinhNghiem() == null || tinTuyenDung.getCapDoKinhNghiem().getId() == null
                        ? null
                        : tinTuyenDung.getCapDoKinhNghiem().getId().longValue())
                .capDoKinhNghiemTen(tinTuyenDung.getCapDoKinhNghiem() == null ? null : tinTuyenDung.getCapDoKinhNghiem().getTen())
                .luongToiThieu(tinTuyenDung.getLuongToiThieu())
                .luongToiDa(tinTuyenDung.getLuongToiDa())
                .soLuongTuyen(tinTuyenDung.getSoLuongTuyen())
                .lyDoTuChoi(tinTuyenDung.getLyDoTuChoi())
                .denHanLuc(tinTuyenDung.getDenHanLuc())
                .ngayTao(tinTuyenDung.getNgayTao())
                .kyNangs(kyNangs)
                .build();
    }

    // Convert các thực thể danh mục về DTO option chung cho frontend.
    private CompanyJobMetadataResponse.OptionItem mapMetadataOption(NganhNghe entity) {
        return CompanyJobMetadataResponse.OptionItem.builder()
                .id(entity.getId() == null ? null : entity.getId().longValue())
                .ten(entity.getTen())
                .build();
    }

    private CompanyJobMetadataResponse.OptionItem mapMetadataOption(LoaiHinhLamViec entity) {
        return CompanyJobMetadataResponse.OptionItem.builder()
                .id(entity.getId() == null ? null : entity.getId().longValue())
                .ten(entity.getTen())
                .build();
    }

    private CompanyJobMetadataResponse.OptionItem mapMetadataOption(CapDoKinhNghiem entity) {
        return CompanyJobMetadataResponse.OptionItem.builder()
                .id(entity.getId() == null ? null : entity.getId().longValue())
                .ten(entity.getTen())
                .build();
    }

    private CompanyJobMetadataResponse.OptionItem mapMetadataOption(KyNang entity) {
        return CompanyJobMetadataResponse.OptionItem.builder()
                .id(entity.getId() == null ? null : entity.getId().longValue())
                .ten(entity.getTen())
                .build();
    }

    // Lấy toàn bộ kỹ năng theo danh sách tin tuyển dụng để giảm số query khi render bảng.
    private Map<Integer, List<CompanyAdminJobResponse.KyNangItem>> mapJobSkillsByJobIds(List<TinTuyenDung> jobs) {
        List<Integer> jobIds = jobs.stream()
                .map(TinTuyenDung::getId)
                .filter(Objects::nonNull)
                .toList();
        if (jobIds.isEmpty()) {
            return Map.of();
        }

        Map<Integer, List<CompanyAdminJobResponse.KyNangItem>> result = new HashMap<>();
        List<KyNangTinTuyenDung> links = kyNangTinTuyenDungRepository.findByTinTuyenDungIdsOrderByKyNangTenAsc(jobIds);
        for (KyNangTinTuyenDung link : links) {
            if (link.getTinTuyenDung() == null || link.getTinTuyenDung().getId() == null || link.getKyNang() == null) {
                continue;
            }
            Integer jobId = link.getTinTuyenDung().getId();
            result.computeIfAbsent(jobId, ignored -> new ArrayList<>())
                    .add(CompanyAdminJobResponse.KyNangItem.builder()
                            .id(link.getKyNang().getId() == null ? null : link.getKyNang().getId().longValue())
                            .ten(link.getKyNang().getTen())
                            .build());
        }
        return result;
    }

    private List<CompanyAdminJobResponse.KyNangItem> mapJobSkills(Integer jobId) {
        if (jobId == null) {
            return List.of();
        }
        return kyNangTinTuyenDungRepository.findByTinTuyenDungIdOrderByKyNangTenAsc(jobId).stream()
                .filter(link -> link.getKyNang() != null)
                .map(link -> CompanyAdminJobResponse.KyNangItem.builder()
                        .id(link.getKyNang().getId() == null ? null : link.getKyNang().getId().longValue())
                        .ten(link.getKyNang().getTen())
                        .build())
                .toList();
    }

    // Đồng bộ kỹ năng của tin tuyển dụng theo chiến lược replace-all.
    // Mỗi lần create/update job, bảng mapping sẽ phản ánh đúng dữ liệu người dùng vừa gửi.
    private void replaceJobSkills(TinTuyenDung tinTuyenDung, List<Integer> requestedSkillIds) {
        if (tinTuyenDung == null || tinTuyenDung.getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tin tuyển dụng không hợp lệ");
        }

        List<KyNang> skills = resolveSkills(requestedSkillIds);
        kyNangTinTuyenDungRepository.deleteByTinTuyenDung_Id(tinTuyenDung.getId());
        if (skills.isEmpty()) {
            return;
        }

        List<KyNangTinTuyenDung> links = skills.stream()
                .map(skill -> new KyNangTinTuyenDung(tinTuyenDung, skill))
                .toList();
        kyNangTinTuyenDungRepository.saveAll(links);
    }

    // Validate id kỹ năng và loại bỏ duplicate giữ theo thứ tự chọn từ frontend.
    private List<KyNang> resolveSkills(List<Integer> skillIds) {
        LinkedHashSet<Integer> dedup = skillIds == null
                ? new LinkedHashSet<>()
                : skillIds.stream()
                .filter(Objects::nonNull)
                .map(id -> Math.max(id, 0))
                .filter(id -> id > 0)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
        if (dedup.isEmpty()) {
            return List.of();
        }

        List<KyNang> skills = kyNangRepository.findAllById(dedup);
        if (skills.size() != dedup.size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Một hoặc nhiều kỹ năng không tồn tại");
        }

        // Sắp xếp theo thứ tự người dùng gửi lên để frontend nhận lại đúng kỳ vọng.
        Map<Integer, KyNang> byId = skills.stream()
                .filter(skill -> skill.getId() != null)
                .collect(java.util.stream.Collectors.toMap(KyNang::getId, skill -> skill));
        List<KyNang> ordered = new ArrayList<>();
        for (Integer requestedId : dedup) {
            KyNang skill = byId.get(requestedId);
            if (skill != null) {
                ordered.add(skill);
            }
        }
        return ordered;
    }

    private CompanyAdminApplicationResponse mapApplication(DonUngTuyen donUngTuyen, boolean includeProfileDetail) {
        HoSoUngVien profile = donUngTuyen.getHoSoUngVien();
        var user = profile == null ? null : profile.getNguoiDung();

        CompanyAdminApplicationResponse.CompanyAdminApplicationResponseBuilder builder = CompanyAdminApplicationResponse.builder()
                .id(donUngTuyen.getId() == null ? null : donUngTuyen.getId().longValue())
                .trangThai(donUngTuyen.getTrangThai())
                .cvUrl(donUngTuyen.getCvUrl())
                .ngayTao(donUngTuyen.getNgayTao())
                .chiNhanhId(donUngTuyen.getTinTuyenDung() == null
                        || donUngTuyen.getTinTuyenDung().getChiNhanh() == null
                        || donUngTuyen.getTinTuyenDung().getChiNhanh().getId() == null
                        ? null
                        : donUngTuyen.getTinTuyenDung().getChiNhanh().getId().longValue())
                .chiNhanhTen(donUngTuyen.getTinTuyenDung() == null || donUngTuyen.getTinTuyenDung().getChiNhanh() == null
                        ? null
                        : donUngTuyen.getTinTuyenDung().getChiNhanh().getTen())
                .congTyId(donUngTuyen.getTinTuyenDung() == null
                        || donUngTuyen.getTinTuyenDung().getChiNhanh() == null
                        || donUngTuyen.getTinTuyenDung().getChiNhanh().getCongTy() == null
                        || donUngTuyen.getTinTuyenDung().getChiNhanh().getCongTy().getId() == null
                        ? null
                        : donUngTuyen.getTinTuyenDung().getChiNhanh().getCongTy().getId().longValue())
                .congTyTen(donUngTuyen.getTinTuyenDung() == null
                        || donUngTuyen.getTinTuyenDung().getChiNhanh() == null
                        || donUngTuyen.getTinTuyenDung().getChiNhanh().getCongTy() == null
                        ? null
                        : donUngTuyen.getTinTuyenDung().getChiNhanh().getCongTy().getTen())
                .tinTuyenDungId(donUngTuyen.getTinTuyenDung() == null || donUngTuyen.getTinTuyenDung().getId() == null
                        ? null
                        : donUngTuyen.getTinTuyenDung().getId().longValue())
                .tieuDeTinTuyenDung(donUngTuyen.getTinTuyenDung() == null ? null : donUngTuyen.getTinTuyenDung().getTieuDe())
                .nguoiDungId(user == null || user.getId() == null
                        ? null
                        : user.getId().longValue())
                .ungVienHoTen(user == null
                        ? null
                        : buildFullName(user.getHo(), user.getTen()))
                .ungVienEmail(user == null
                        ? null
                        : user.getEmail())
                .ungVienSoDienThoai(user == null ? null : user.getSoDienThoai())
                .ungVienAnhDaiDienUrl(user == null ? null : user.getAnhDaiDienUrl())
                .hoSoUngVienId(profile == null || profile.getId() == null ? null : profile.getId().longValue())
                .gioiThieuBanThan(profile == null ? null : profile.getGioiThieuBanThan())
                .mucTieuNgheNghiep(profile == null ? null : profile.getMucTieuNgheNghiep());

        // List API giữ payload gọn; detail API mới trả đầy đủ học vấn/chứng chỉ/kỹ năng.
        if (includeProfileDetail && profile != null && profile.getId() != null) {
            builder
                    .hocVans(mapEducationItems(profile.getId()))
                    .chungChis(mapCertificateItems(profile.getId()))
                    .kyNangs(mapSkillItems(profile.getId()));
        }

        return builder.build();
    }

    private List<CompanyAdminApplicationResponse.HocVanItem> mapEducationItems(Integer profileId) {
        return hocVanUngVienRepository.findByHoSoUngVien_IdOrderByThoiGianBatDauDesc(profileId).stream()
                .map(item -> CompanyAdminApplicationResponse.HocVanItem.builder()
                        .id(item.getId() == null ? null : item.getId().longValue())
                        .tenTruong(item.getTenTruong())
                        .chuyenNganh(item.getChuyenNganh())
                        .bacHoc(item.getBacHoc())
                        .thoiGianBatDau(item.getThoiGianBatDau())
                        .thoiGianKetThuc(item.getThoiGianKetThuc())
                        .duongDanTep(item.getDuongDanTep())
                        .trangThai(item.getTrangThai())
                        .build())
                .toList();
    }

    private List<CompanyAdminApplicationResponse.ChungChiItem> mapCertificateItems(Integer profileId) {
        return chungChiUngVienRepository.findByHoSoUngVien_IdOrderByNgayBatDauDesc(profileId).stream()
                .map(item -> CompanyAdminApplicationResponse.ChungChiItem.builder()
                        .id(item.getId() == null ? null : item.getId().longValue())
                        .loaiChungChiId(item.getLoaiChungChi() == null || item.getLoaiChungChi().getId() == null
                                ? null
                                : item.getLoaiChungChi().getId().longValue())
                        .loaiChungChiTen(item.getLoaiChungChi() == null ? null : item.getLoaiChungChi().getTen())
                        .tenChungChi(item.getTenChungChi())
                        .ngayBatDau(item.getNgayBatDau())
                        .ngayHetHan(item.getNgayHetHan())
                        .duongDanTep(item.getDuongDanTep())
                        .trangThai(item.getTrangThai())
                        .build())
                .toList();
    }

    private List<CompanyAdminApplicationResponse.KyNangItem> mapSkillItems(Integer profileId) {
        return kyNangUngVienRepository.findByHoSoUngVien_Id(profileId).stream()
                .filter(item -> item.getKyNang() != null)
                .map(item -> CompanyAdminApplicationResponse.KyNangItem.builder()
                        .id(item.getKyNang().getId() == null ? null : item.getKyNang().getId().longValue())
                        .ten(item.getKyNang().getTen())
                        .build())
                .toList();
    }

    private CompanyPackagePlanResponse mapPackagePlan(DanhMucGoi goi) {
        return CompanyPackagePlanResponse.builder()
                .id(goi.getId() == null ? null : goi.getId().longValue())
                .maGoi(goi.getMaGoi())
                .tenGoi(goi.getTenGoi())
                .moTa(goi.getMoTa())
                .giaNiemYet(goi.getGiaNiemYet() == null ? null : BigDecimal.valueOf(goi.getGiaNiemYet().doubleValue()))
                .soNgayHieuLuc(resolvePackageDurationDays(goi))
                .build();
    }

    private CompanyPackageRegistrationResponse mapPackageRegistration(DangKyGoiCongTy registration) {
        return CompanyPackageRegistrationResponse.builder()
                .id(registration.getId() == null ? null : registration.getId().longValue())
                .congTyId(registration.getCongTy() == null || registration.getCongTy().getId() == null
                        ? null
                        : registration.getCongTy().getId().longValue())
                .danhMucGoiId(registration.getDanhMucGoi() == null || registration.getDanhMucGoi().getId() == null
                        ? null
                        : registration.getDanhMucGoi().getId().longValue())
                .maGoi(registration.getDanhMucGoi() == null ? null : registration.getDanhMucGoi().getMaGoi())
                .tenGoi(registration.getDanhMucGoi() == null ? null : registration.getDanhMucGoi().getTenGoi())
                .trangThai(registration.getTrangThai())
                .trangThaiThanhToan(registration.getTrangThaiThanhToan())
                .batDauLuc(registration.getBatDauLuc())
                .hetHanLuc(registration.getHetHanLuc())
                .giaTaiThoiDiemDangKy(registration.getGiaTaiThoiDiemDangKy() == null
                        ? null
                        : BigDecimal.valueOf(registration.getGiaTaiThoiDiemDangKy().doubleValue()))
                .ngayTao(registration.getNgayTao())
                .coHieuLuc(isActivePostingPackage(registration) && isWithinValidPeriod(registration, LocalDateTime.now()))
                .build();
    }

    private java.util.Optional<DangKyGoiCongTy> findCurrentPackage(CongTy congTy) {
        if (congTy == null || congTy.getId() == null) {
            return java.util.Optional.empty();
        }
        return dangKyGoiCongTyRepository.findByCongTy_IdOrderByNgayTaoDesc(congTy.getId()).stream()
                .filter(registration -> "ACTIVE".equalsIgnoreCase(registration.getTrangThai()))
                .findFirst();
    }

    private int resolvePackageDurationDays(DanhMucGoi goi) {
        if (goi == null || goi.getMaGoi() == null) {
            return 30;
        }

        Matcher matcher = PACKAGE_DAYS_PATTERN.matcher(goi.getMaGoi().trim());
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }
        return 30;
    }

    private void ensureCompanyApproved(CongTy congTy) {
        if (congTy == null || !"APPROVED".equalsIgnoreCase(congTy.getTrangThai())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, COMPANY_NOT_APPROVED_MESSAGE);
        }
    }

    private void ensureActivePostingPackage(CongTy congTy) {
        if (!hasActivePostingPackage(congTy)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Công ty chưa có gói đăng bài đang hoạt động");
        }
    }

    private CompanyAdminMeResponse.ThongTinCongTy mapCompanyResponse(CongTy congTy) {
        DangKyGoiCongTy activePostingPackage = resolveActivePostingPackage(congTy).orElse(null);
        return CompanyAdminMeResponse.ThongTinCongTy.builder()
                .id(congTy.getId() == null ? null : congTy.getId().longValue())
                .ten(congTy.getTen())
                .maSoThue(congTy.getMaSoThue())
                .website(congTy.getWebsite())
                .moTa(congTy.getMoTa())
                .logoUrl(congTy.getLogoUrl())
                .trangThai(congTy.getTrangThai())
                .lyDoTuChoi(congTy.getLyDoTuChoi())
                .coQuyenDangBai(activePostingPackage != null)
                .goiDangBaiTen(activePostingPackage == null || activePostingPackage.getDanhMucGoi() == null
                        ? null
                        : activePostingPackage.getDanhMucGoi().getTenGoi())
                .goiDangBaiHetHanLuc(activePostingPackage == null ? null : activePostingPackage.getHetHanLuc())
                .goiDangBaiTrangThai(activePostingPackage == null ? null : activePostingPackage.getTrangThai())
                .goiDangBaiTrangThaiThanhToan(activePostingPackage == null ? null : activePostingPackage.getTrangThaiThanhToan())
                .build();
    }

    private boolean hasActivePostingPackage(CongTy congTy) {
        return resolveActivePostingPackage(congTy).isPresent();
    }

    private java.util.Optional<DangKyGoiCongTy> resolveActivePostingPackage(CongTy congTy) {
        if (congTy == null || congTy.getId() == null) {
            return java.util.Optional.empty();
        }

        LocalDateTime now = LocalDateTime.now();
        return dangKyGoiCongTyRepository.findByCongTy_IdOrderByNgayTaoDesc(congTy.getId()).stream()
                .filter(this::isActivePostingPackage)
                .filter(registration -> isWithinValidPeriod(registration, now))
                .findFirst();
    }

    private boolean isActivePostingPackage(DangKyGoiCongTy registration) {
        if (registration == null) {
            return false;
        }

        String status = registration.getTrangThai() == null ? "" : registration.getTrangThai().trim().toUpperCase(Locale.ROOT);
        String paymentStatus = registration.getTrangThaiThanhToan() == null
                ? ""
                : registration.getTrangThaiThanhToan().trim().toUpperCase(Locale.ROOT);

        boolean paymentOk = switch (paymentStatus) {
            case "PAID", "SUCCESS", "COMPLETED", "DONE" -> true;
            default -> false;
        };

        return "ACTIVE".equals(status) && paymentOk;
    }

    private boolean isWithinValidPeriod(DangKyGoiCongTy registration, LocalDateTime now) {
        if (registration == null || now == null) {
            return false;
        }

        LocalDateTime start = registration.getBatDauLuc();
        LocalDateTime end = registration.getHetHanLuc();
        return start != null && end != null && !now.isBefore(start) && !now.isAfter(end);
    }

    private String buildFullName(String ho, String ten) {
        return (StringUtils.hasText(ho) ? ho.trim() : "") + " " + (StringUtils.hasText(ten) ? ten.trim() : "");
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private LoaiTaiLieu resolveOrCreateLoaiTaiLieu(String tenLoaiTaiLieu) {
        return loaiTaiLieuRepository.findByTenIgnoreCase(tenLoaiTaiLieu)
                .orElseGet(() -> {
                    LoaiTaiLieu loaiTaiLieu = new LoaiTaiLieu();
                    loaiTaiLieu.setTen(tenLoaiTaiLieu);
                    loaiTaiLieu.setMoTa("Tự động tạo cho luồng company-admin");
                    return loaiTaiLieuRepository.save(loaiTaiLieu);
                });
    }

    private LoaiTaiLieu resolveLoaiTaiLieuById(Integer loaiTaiLieuId) {
        if (loaiTaiLieuId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "loaiTaiLieuId không hợp lệ");
        }
        return loaiTaiLieuRepository.findById(loaiTaiLieuId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy loại tài liệu"));
    }

    private CompanyAdminProofResponse saveProofDocument(CongTy congTy, LoaiTaiLieu loaiTaiLieu, String duongDanTep, String tenTep) {
        if (congTy == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Công ty không hợp lệ");
        }
        if (!StringUtils.hasText(duongDanTep)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "duongDanTep không hợp lệ");
        }

        String fileName = StringUtils.hasText(tenTep)
                ? tenTep.trim()
                : resolveFileNameFromUrl(duongDanTep);

        TepMinhChungCongTy proofDocument = new TepMinhChungCongTy();
        proofDocument.setCongTy(congTy);
        proofDocument.setLoaiTaiLieu(loaiTaiLieu);
        proofDocument.setDuongDanTep(duongDanTep.trim());
        proofDocument.setTenTep(fileName);
        proofDocument.setTrangThai(CompanyProofDocumentStatus.PENDING.name());
        proofDocument.setLyDoTuChoi(null);
        proofDocument.setNgayXoa(null);
        proofDocument = companyProofDocumentRepository.save(proofDocument);

        return mapProofDocument(proofDocument);
    }

    private CompanyAdminProofResponse mapProofDocument(TepMinhChungCongTy proofDocument) {
        return CompanyAdminProofResponse.builder()
                .id(proofDocument.getId() == null ? null : proofDocument.getId().longValue())
                .tenTep(proofDocument.getTenTep())
                .duongDanTep(proofDocument.getDuongDanTep())
                .loaiTaiLieu(proofDocument.getLoaiTaiLieu() == null ? null : proofDocument.getLoaiTaiLieu().getTen())
                .trangThai(proofDocument.getTrangThai())
                .lyDoTuChoi(proofDocument.getLyDoTuChoi())
                .ngayTao(proofDocument.getNgayTao())
                .build();
    }

    private CompanyProofTypeResponse mapProofType(LoaiTaiLieu loaiTaiLieu) {
        return CompanyProofTypeResponse.builder()
                .id(loaiTaiLieu.getId() == null ? null : loaiTaiLieu.getId().longValue())
                .ten(loaiTaiLieu.getTen())
                .moTa(loaiTaiLieu.getMoTa())
                .build();
    }

    private String resolveFileNameFromUrl(String url) {
        try {
            String path = URI.create(url).getPath();
            if (!StringUtils.hasText(path)) {
                return "company-proof";
            }
            String fileName = path.substring(path.lastIndexOf('/') + 1);
            return StringUtils.hasText(fileName) ? fileName : "company-proof";
        } catch (Exception ex) {
            return "company-proof";
        }
    }
}
