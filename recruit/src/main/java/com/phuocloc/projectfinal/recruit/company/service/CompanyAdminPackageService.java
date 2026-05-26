package com.phuocloc.projectfinal.recruit.company.service;

import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.company.dto.request.RegisterCompanyPackageRequest;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyPackageOverviewResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyPackagePlanResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyPackageRegistrationResponse;
import com.phuocloc.projectfinal.recruit.company.repository.DangKyGoiCongTyRepository;
import com.phuocloc.projectfinal.recruit.company.repository.DanhMucGoiRepository;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.CongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.DangKyGoiCongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.DanhMucGoi;
import com.phuocloc.projectfinal.recruit.infrastructure.sepay.SepayCheckoutForm;
import com.phuocloc.projectfinal.recruit.infrastructure.sepay.SepayPaymentService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CompanyAdminPackageService {

    private static final Pattern PACKAGE_DAYS_PATTERN = Pattern.compile("(\\d+)");
    private static final String COMPANY_NOT_APPROVED_MESSAGE = "Công ty chưa được duyệt, chỉ có thể cập nhật logo";

    private final CompanyAdminAccessService accessService;
    private final DangKyGoiCongTyRepository dangKyGoiCongTyRepository;
    private final DanhMucGoiRepository danhMucGoiRepository;
    private final SepayPaymentService sepayPaymentService;

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

    public boolean hasActivePostingPackage(CongTy congTy) {
        return resolveActivePostingPackage(congTy).isPresent();
    }

    public Optional<DangKyGoiCongTy> resolveActivePostingPackage(CongTy congTy) {
        if (congTy == null || congTy.getId() == null) {
            return Optional.empty();
        }

        LocalDateTime now = LocalDateTime.now();
        return dangKyGoiCongTyRepository.findByCongTy_IdOrderByNgayTaoDesc(congTy.getId()).stream()
                .filter(this::isActivePostingPackage)
                .filter(registration -> isWithinValidPeriod(registration, now))
                .findFirst();
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

    private Optional<DangKyGoiCongTy> findCurrentPackage(CongTy congTy) {
        if (congTy == null || congTy.getId() == null) {
            return Optional.empty();
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
}
