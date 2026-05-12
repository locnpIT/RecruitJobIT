package com.phuocloc.projectfinal.recruit.admin.service;

import com.phuocloc.projectfinal.recruit.admin.dto.request.CreatePackageRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.request.UpdatePackageRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminPackageResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminPackageSubscriptionResponse;
import com.phuocloc.projectfinal.recruit.company.repository.DangKyGoiCongTyRepository;
import com.phuocloc.projectfinal.recruit.company.repository.DanhMucGoiRepository;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.DangKyGoiCongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.DanhMucGoi;
import java.util.List;
import java.util.Locale;
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
 * Nghiệp vụ quản lý danh mục gói dịch vụ.
 *
 * <p>Admin dùng service này để tạo/sửa/xóa gói và xem lịch sử đăng ký gói gần đây.</p>
 */
public class AdminPackageService {

    private static final Pattern PACKAGE_DAYS_PATTERN = Pattern.compile("(\\d+)");

    private final DanhMucGoiRepository danhMucGoiRepository;
    private final DangKyGoiCongTyRepository dangKyGoiCongTyRepository;

    @Transactional(readOnly = true)
    public List<AdminPackageResponse> listPackages() {
        return danhMucGoiRepository.findAllByOrderByIdAsc().stream()
                .map(this::mapPackage)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminPackageSubscriptionResponse> listPackageSubscriptions() {
        return dangKyGoiCongTyRepository.findTop10ByOrderByNgayTaoDesc().stream()
                .map(this::mapPackageSubscription)
                .toList();
    }

    @Transactional
    public AdminPackageResponse createPackage(CreatePackageRequest request) {
        // Mã gói hiện được suy ra từ số ngày hiệu lực để đồng bộ naming business.
        String tenGoi = trimToNull(request.getTenGoi());
        if (tenGoi == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên gói không được để trống");
        }

        int soNgayHieuLuc = request.getSoNgayHieuLuc();
        String maGoi = buildPackageCode(soNgayHieuLuc);
        if (danhMucGoiRepository.findByMaGoiIgnoreCase(maGoi).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã gói đã tồn tại");
        }

        DanhMucGoi goi = new DanhMucGoi();
        goi.setMaGoi(maGoi);
        goi.setTenGoi(tenGoi);
        goi.setMoTa(trimToNull(request.getMoTa()));
        goi.setGiaNiemYet(request.getGiaNiemYet() == null ? null : request.getGiaNiemYet().floatValue());
        goi = danhMucGoiRepository.save(goi);

        return mapPackage(goi);
    }

    @Transactional
    public AdminPackageResponse updatePackage(Long packageId, UpdatePackageRequest request) {
        DanhMucGoi goi = requirePackage(packageId);
        String tenGoi = trimToNull(request.getTenGoi());
        if (tenGoi == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên gói không được để trống");
        }

        int soNgayHieuLuc = request.getSoNgayHieuLuc();
        String maGoi = buildPackageCode(soNgayHieuLuc);
        if (!maGoi.equalsIgnoreCase(goi.getMaGoi()) && danhMucGoiRepository.findByMaGoiIgnoreCase(maGoi).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã gói đã tồn tại");
        }

        goi.setMaGoi(maGoi);
        goi.setTenGoi(tenGoi);
        goi.setMoTa(trimToNull(request.getMoTa()));
        goi.setGiaNiemYet(request.getGiaNiemYet() == null ? null : request.getGiaNiemYet().floatValue());
        goi = danhMucGoiRepository.save(goi);
        return mapPackage(goi);
    }

    @Transactional
    public void deletePackage(Long packageId) {
        // Không cho xóa gói đã từng được công ty sử dụng để tránh phá dữ liệu lịch sử.
        DanhMucGoi goi = requirePackage(packageId);
        long usageCount = dangKyGoiCongTyRepository.countByDanhMucGoi_Id(goi.getId());
        if (usageCount > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Gói đã được sử dụng, không thể xoá");
        }
        danhMucGoiRepository.delete(goi);
    }

    private DanhMucGoi requirePackage(Long packageId) {
        return danhMucGoiRepository.findById(toIntId(packageId, "packageId"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy gói"));
    }

    private Integer toIntId(Long id, String fieldName) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " không được để trống");
        }
        return Math.toIntExact(id);
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private AdminPackageResponse mapPackage(DanhMucGoi goi) {
        return AdminPackageResponse.builder()
                .id(goi.getId() == null ? null : goi.getId().longValue())
                .maGoi(goi.getMaGoi())
                .tenGoi(goi.getTenGoi())
                .moTa(goi.getMoTa())
                .giaNiemYet(goi.getGiaNiemYet() == null ? null : java.math.BigDecimal.valueOf(goi.getGiaNiemYet().doubleValue()))
                .soNgayHieuLuc(resolvePackageDurationDays(goi.getMaGoi()))
                .soCongTyDangSuDung(dangKyGoiCongTyRepository.countByDanhMucGoi_Id(goi.getId()))
                .build();
    }

    private AdminPackageSubscriptionResponse mapPackageSubscription(DangKyGoiCongTy registration) {
        return AdminPackageSubscriptionResponse.builder()
                .id(registration.getId() == null ? null : registration.getId().longValue())
                .congTy(registration.getCongTy() == null ? null : registration.getCongTy().getTen())
                .goi(registration.getDanhMucGoi() == null ? null : registration.getDanhMucGoi().getTenGoi())
                .trangThai(registration.getTrangThai())
                .trangThaiThanhToan(registration.getTrangThaiThanhToan())
                .batDauLuc(registration.getBatDauLuc())
                .hetHanLuc(registration.getHetHanLuc())
                .giaTaiThoiDiemDangKy(registration.getGiaTaiThoiDiemDangKy() == null
                        ? null
                        : java.math.BigDecimal.valueOf(registration.getGiaTaiThoiDiemDangKy().doubleValue()))
                .ngayTao(registration.getNgayTao())
                .coHieuLuc(isActivePackageRegistration(registration))
                .build();
    }

    private boolean isActivePackageRegistration(DangKyGoiCongTy registration) {
        if (registration == null) {
            return false;
        }

        boolean activeStatus = "ACTIVE".equalsIgnoreCase(registration.getTrangThai());
        boolean paid = registration.getTrangThaiThanhToan() != null
                && List.of("PAID", "SUCCESS", "COMPLETED", "DONE")
                .contains(registration.getTrangThaiThanhToan().trim().toUpperCase(Locale.ROOT));
        boolean withinPeriod = registration.getBatDauLuc() != null
                && registration.getHetHanLuc() != null
                && !registration.getBatDauLuc().isAfter(java.time.LocalDateTime.now())
                && !registration.getHetHanLuc().isBefore(java.time.LocalDateTime.now());
        return activeStatus && paid && withinPeriod;
    }

    private int resolvePackageDurationDays(String maGoi) {
        if (!StringUtils.hasText(maGoi)) {
            return 30;
        }
        Matcher matcher = PACKAGE_DAYS_PATTERN.matcher(maGoi);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }
        return 30;
    }

    private String buildPackageCode(int soNgayHieuLuc) {
        return "GOI_" + soNgayHieuLuc + "_NGAY";
    }
}
