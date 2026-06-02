package com.phuocloc.projectfinal.recruit.company.service;

import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.candidate.repository.CandidateProfileRepository;
import com.phuocloc.projectfinal.recruit.company.dto.request.UpdateApplicationStatusRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.SendInterviewMailRequest;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyAdminApplicationResponse;
import com.phuocloc.projectfinal.recruit.company.enums.EmployerCompanyRole;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.DonUngTuyen;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.DonUngTuyenRepository;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoUngVien;
import com.phuocloc.projectfinal.recruit.infrastructure.mail.HrCredentialMailService;
import com.phuocloc.projectfinal.recruit.notification.service.NotificationService;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CompanyAdminApplicationService {

    private static final Set<String> COMPANY_ADMIN_ROLES = Set.of(
            EmployerCompanyRole.OWNER.name(),
            EmployerCompanyRole.MASTER_BRANCH.name(),
            EmployerCompanyRole.HR.name()
    );
    private static final Set<String> APPLICATION_STATUSES = Set.of(
            "PENDING",
            "REVIEWING",
            "ACCEPTED",
            "REJECTED",
            "CONFIRMED",
            "DECLINED"
    );

    private final CompanyAdminAccessService accessService;
    private final CompanyAdminJobService jobService;
    private final CompanyAdminApplicationMapper applicationMapper;
    private final DonUngTuyenRepository donUngTuyenRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final NotificationService notificationService;
    private final HrCredentialMailService hrCredentialMailService;

    public List<CompanyAdminApplicationResponse> listApplications(AppUserPrinciple principal, Integer chiNhanhId) {
        accessService.requireMembership(principal.getUserId().intValue(), chiNhanhId, COMPANY_ADMIN_ROLES);
        return donUngTuyenRepository.findByTinTuyenDung_ChiNhanh_IdAndNgayXoaIsNullOrderByNgayTaoDesc(chiNhanhId).stream()
                .map(application -> applicationMapper.mapApplication(application, false))
                .toList();
    }

    public CompanyAdminApplicationResponse getApplicationDetail(AppUserPrinciple principal, Long applicationId) {
        DonUngTuyen application = requireManagedApplication(principal, applicationId);
        return applicationMapper.mapApplication(application, true);
    }

    public CompanyAdminApplicationResponse getCandidateProfileForJob(AppUserPrinciple principal, Long jobId, Long profileId) {
        TinTuyenDung tinTuyenDung = jobService.requireManagedJob(principal, jobId);
        HoSoUngVien profile = requireActiveCandidateProfile(profileId);
        return applicationMapper.mapCandidateProfileForJob(tinTuyenDung, profile, true);
    }

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

        return applicationMapper.mapApplication(saved, true);
    }

    public CompanyAdminApplicationResponse sendInterviewEmail(
            AppUserPrinciple principal,
            Long applicationId,
            SendInterviewMailRequest request
    ) {
        DonUngTuyen application = requireManagedApplication(principal, applicationId);
        if (!"ACCEPTED".equalsIgnoreCase(application.getTrangThai())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ có thể gửi mail phỏng vấn cho đơn đã được chấp nhận");
        }
        if (application.getHoSoUngVien() == null || application.getHoSoUngVien().getNguoiDung() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu thông tin ứng viên để gửi mail");
        }
        if (application.getTinTuyenDung() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu thông tin tin tuyển dụng");
        }

        var candidate = application.getHoSoUngVien().getNguoiDung();
        var job = application.getTinTuyenDung();
        var branch = job.getChiNhanh();
        var company = branch != null ? branch.getCongTy() : null;

        hrCredentialMailService.sendInterviewInvitation(
                application.getId() == null ? applicationId : application.getId().longValue(),
                candidate.getEmail(),
                candidate.getTen(),
                candidate.getHo(),
                company == null ? "Công ty" : company.getTen(),
                job.getTieuDe(),
                formatInterviewDateTime(request.getThoiGianPhongVan()),
                request.getDiaDiemPhongVan(),
                request.getGhiChu(),
                resolveBranchAddress(branch)
        );

        return applicationMapper.mapApplication(application, true);
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

    private HoSoUngVien requireActiveCandidateProfile(Long profileId) {
        if (profileId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "profileId không được để trống");
        }
        return candidateProfileRepository.findById(Math.toIntExact(profileId))
                .filter(profile -> profile.getNgayXoa() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ ứng viên"));
    }

    private String normalizeApplicationStatus(String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        if (!APPLICATION_STATUSES.contains(normalized)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Trạng thái đơn ứng tuyển không hợp lệ. Chỉ hỗ trợ PENDING, REVIEWING, ACCEPTED, REJECTED, CONFIRMED, DECLINED"
            );
        }
        return normalized;
    }

    private String formatInterviewDateTime(LocalDateTime value) {
        return value == null ? "" : value.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
    }

    private String resolveBranchAddress(com.phuocloc.projectfinal.recruit.domain.congty.entity.ChiNhanhCongTy branch) {
        if (branch == null) {
            return "Chưa có địa chỉ chi nhánh";
        }
        if (branch.getDiaChiChiTiet() != null && !branch.getDiaChiChiTiet().isBlank()) {
            return branch.getDiaChiChiTiet().trim();
        }
        return branch.getTen() == null ? "Chưa có địa chỉ chi nhánh" : branch.getTen().trim();
    }
}
