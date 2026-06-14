package com.phuocloc.projectfinal.recruit.publicjob.service;

import com.phuocloc.projectfinal.recruit.domain.congty.entity.CongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ChiNhanhCongTy;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.CapDoKinhNghiem;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.LoaiHinhLamViec;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.NganhNghe;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.KyNangTinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.publicjob.dto.response.PublicJobDetailResponse;
import com.phuocloc.projectfinal.recruit.publicjob.dto.response.PublicJobSearchMetadataResponse;
import com.phuocloc.projectfinal.recruit.publicjob.dto.response.PublicJobSummaryResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import com.phuocloc.projectfinal.recruit.common.util.ServiceUtils;

/**
 * Maps {@link TinTuyenDung} entities to public-facing DTOs and provides
 * JPA-fallback filter predicates used by {@link PublicJobService}.
 */
@Component
@RequiredArgsConstructor
public class PublicJobMapper {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final KyNangTinTuyenDungRepository kyNangTinTuyenDungRepository;
    private final JobSearchTextAnalyzer textAnalyzer;

    // -------------------------------------------------------------------------
    // Public mapping
    // -------------------------------------------------------------------------

    public PublicJobSummaryResponse mapSummary(TinTuyenDung job) {
        String companyLogoUrl = resolveCompany(job) == null ? null : resolveCompany(job).getLogoUrl();
        return PublicJobSummaryResponse.builder()
                .id(toLong(job.getId()))
                .maTin(buildJobCode(job))
                .tieuDe(job.getTieuDe())
                .congTyId(resolveCompany(job) == null ? null : ServiceUtils.toLong(resolveCompany(job).getId()))
                .congTyTen(resolveCompanyName(job))
                .chiNhanhId(firstBranch(job) == null ? null : ServiceUtils.toLong(firstBranch(job).getId()))
                .chiNhanhTen(firstBranch(job) == null ? null : firstBranch(job).getTen())
                .logoUrl(companyLogoUrl)
                .diaDiem(resolveLocation(job))
                .mucLuong(formatSalary(job))
                .capDo(job.getCapDoKinhNghiem() == null ? "Đang cập nhật" : job.getCapDoKinhNghiem().getTen())
                .hinhThuc(resolveWorkType(job))
                .nganhNghe(resolveIndustry(job))
                .hanNop(formatDate(job.getDenHanLuc()))
                .ngayTao(job.getNgayTao())
                .build();
    }

    public PublicJobDetailResponse mapDetail(TinTuyenDung job, List<PublicJobSummaryResponse> similarJobs) {
        CongTy company = resolveCompany(job);
        String companyLogoUrl = company == null ? null : company.getLogoUrl();
        return PublicJobDetailResponse.builder()
                .id(toLong(job.getId()))
                .maTin(buildJobCode(job))
                .tieuDe(job.getTieuDe())
                .congTyId(company == null ? null : ServiceUtils.toLong(company.getId()))
                .congTy(resolveCompanyName(job))
                .logoUrl(companyLogoUrl)
                .congTyDaXacMinh(isCompanyApproved(company))
                .nhaTuyenDungId(job.getNguoiDang() == null ? null : ServiceUtils.toLong(job.getNguoiDang().getId()))
                .nhaTuyenDungTen(resolveRecruiterName(job))
                .nganhNghe(resolveIndustry(job))
                .websiteCongTy(company == null ? null : company.getWebsite())
                .diaDiem(resolveLocation(job))
                .mucLuong(formatSalary(job))
                .capDo(job.getCapDoKinhNghiem() == null ? "Đang cập nhật" : job.getCapDoKinhNghiem().getTen())
                .loaiHinhLamViec(resolveWorkType(job))
                .kinhNghiem(job.getCapDoKinhNghiem() == null ? "Đang cập nhật" : job.getCapDoKinhNghiem().getTen())
                .hanNop(formatDate(job.getDenHanLuc()))
                .dangLuc(formatRelativeTime(job.getNgayTao()))
                .soLuongTuyen(job.getSoLuongTuyen() == null ? "Đang cập nhật" : job.getSoLuongTuyen() + " người")
                .capNhatLuc(formatRelativeTime(job.getNgayCapNhat()))
                .batBuocCV(Boolean.TRUE.equals(job.getBatBuocCV()))
                .mauCvUrl(job.getMauCvUrl())
                .the(buildTags(job))
                .kyNangs(resolveJobSkills(job))
                .moTa(splitContent(job.getMoTa()))
                .yeuCau(splitContent(job.getYeuCau()))
                .phucLoi(splitContent(job.getPhucLoi()))
                .moTaCongTy(company == null || !StringUtils.hasText(company.getMoTa())
                        ? "Doanh nghiệp đang cập nhật thông tin giới thiệu."
                        : company.getMoTa())
                .viecLamTuongTu(similarJobs)
                .build();
    }

    public PublicJobSearchMetadataResponse.OptionItem mapOption(NganhNghe item) {
        return PublicJobSearchMetadataResponse.OptionItem.builder()
                .id(item == null ? null : ServiceUtils.toLong(item.getId()))
                .ten(item == null ? null : item.getTen())
                .build();
    }

    public PublicJobSearchMetadataResponse.OptionItem mapOption(LoaiHinhLamViec item) {
        return PublicJobSearchMetadataResponse.OptionItem.builder()
                .id(item == null ? null : ServiceUtils.toLong(item.getId()))
                .ten(item == null ? null : item.getTen())
                .build();
    }

    public PublicJobSearchMetadataResponse.OptionItem mapOption(CapDoKinhNghiem item) {
        return PublicJobSearchMetadataResponse.OptionItem.builder()
                .id(item == null ? null : ServiceUtils.toLong(item.getId()))
                .ten(item == null ? null : item.getTen())
                .build();
    }

    public boolean isPublicVisible(TinTuyenDung job) {
        if (job == null) {
            return false;
        }
        CongTy company = resolveCompany(job);
        return job.getNgayXoa() == null
                && "APPROVED".equalsIgnoreCase(job.getTrangThai())
                && (job.getDenHanLuc() == null || !job.getDenHanLuc().isBefore(LocalDateTime.now()))
                && company != null
                && company.getNgayXoa() == null
                && "APPROVED".equalsIgnoreCase(company.getTrangThai());
    }

    public boolean sameIndustry(TinTuyenDung source, TinTuyenDung target) {
        return source.getNganhNghe() != null
                && target.getNganhNghe() != null
                && Objects.equals(source.getNganhNghe().getId(), target.getNganhNghe().getId());
    }

    public boolean sameLocation(TinTuyenDung source, TinTuyenDung target) {
        return Objects.equals(textAnalyzer.normalize(resolveLocation(source)), textAnalyzer.normalize(resolveLocation(target)));
    }

    // -------------------------------------------------------------------------
    // JPA-fallback filter predicates
    // -------------------------------------------------------------------------

    public boolean matchesKeyword(TinTuyenDung job, String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return true;
        }
        String searchableText = buildSearchableJobText(job);
        List<String> tokens = textAnalyzer.splitSearchTokens(keyword);
        if (tokens.isEmpty()) {
            return true;
        }
        // Fallback JPA phải quét rộng gần giống Elasticsearch multi_match:
        // chỉ cần keyword xuất hiện trong bất kỳ nội dung chính nào của tin tuyển dụng.
        return tokens.stream().allMatch(token -> textAnalyzer.contains(searchableText, token));
    }

    public boolean matchesLocation(TinTuyenDung job, String location) {
        return !StringUtils.hasText(location) || textAnalyzer.contains(textAnalyzer.normalize(resolveLocation(job)), location);
    }

    public boolean matchesTextOption(String source, String expectedText) {
        if (!StringUtils.hasText(expectedText)) {
            return true;
        }
        List<String> expectedTokens = textAnalyzer.splitSearchTokens(textAnalyzer.expandSearchAliases(expectedText));
        String normalizedSource = textAnalyzer.normalize(textAnalyzer.expandSearchAliases(source));
        return expectedTokens.stream().allMatch(token -> textAnalyzer.contains(normalizedSource, token));
    }

    public boolean matchesSalary(TinTuyenDung job, Integer expectedMinSalary, Integer expectedMaxSalary) {
        if (expectedMinSalary == null && expectedMaxSalary == null) {
            return true;
        }
        Integer jobMinSalary = job.getLuongToiThieu();
        Integer jobMaxSalary = job.getLuongToiDa();

        // Khi tin để "Thỏa thuận" không có số lương, không thể chứng minh đạt filter lương cụ thể.
        if (jobMinSalary == null && jobMaxSalary == null) {
            return false;
        }

        // Khoảng lương của tin và khoảng lương mong muốn chỉ cần giao nhau là phù hợp.
        boolean reachesExpectedMin = expectedMinSalary == null
                || (jobMaxSalary != null && jobMaxSalary >= expectedMinSalary)
                || (jobMaxSalary == null && jobMinSalary != null && jobMinSalary >= expectedMinSalary);
        boolean doesNotStartAboveExpectedMax = expectedMaxSalary == null
                || (jobMinSalary != null && jobMinSalary <= expectedMaxSalary)
                || (jobMinSalary == null && jobMaxSalary != null && jobMaxSalary <= expectedMaxSalary);

        return reachesExpectedMin && doesNotStartAboveExpectedMax;
    }

    public boolean matchesRemote(TinTuyenDung job, Boolean remote) {
        if (!Boolean.TRUE.equals(remote)) {
            return true;
        }
        String searchableText = buildSearchableJobText(job);
        return textAnalyzer.contains(searchableText, "remote")
                || textAnalyzer.contains(searchableText, "tu xa")
                || textAnalyzer.contains(searchableText, "từ xa")
                || textAnalyzer.contains(searchableText, "online")
                || textAnalyzer.contains(searchableText, "work from home")
                || textAnalyzer.contains(searchableText, "lam o nha")
                || textAnalyzer.contains(searchableText, "làm ở nhà");
    }

    public boolean matchesNoExperienceRequired(TinTuyenDung job, Boolean noExperienceRequired) {
        if (!Boolean.TRUE.equals(noExperienceRequired)) {
            return true;
        }
        String searchableText = buildSearchableJobText(job);
        return textAnalyzer.contains(searchableText, "fresher")
                || textAnalyzer.contains(searchableText, "intern")
                || textAnalyzer.contains(searchableText, "thuc tap")
                || textAnalyzer.contains(searchableText, "thực tập")
                || textAnalyzer.contains(searchableText, "entry")
                || textAnalyzer.contains(searchableText, "khong yeu cau kinh nghiem")
                || textAnalyzer.contains(searchableText, "không yêu cầu kinh nghiệm")
                || textAnalyzer.contains(searchableText, "chua co kinh nghiem")
                || textAnalyzer.contains(searchableText, "chưa có kinh nghiệm");
    }

    public boolean matchesExcludedKeywords(TinTuyenDung job, String excludedKeywords) {
        if (!StringUtils.hasText(excludedKeywords)) {
            return false;
        }
        String searchableText = buildSearchableJobText(job);
        return textAnalyzer.splitExcludedKeywords(excludedKeywords).stream()
                .map(textAnalyzer::expandSearchAliases)
                .map(textAnalyzer::normalize)
                .anyMatch(keyword -> textAnalyzer.contains(searchableText, keyword));
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private String buildSearchableJobText(TinTuyenDung job) {
        return textAnalyzer.normalize(textAnalyzer.expandSearchAliases(String.join(" ",
                nullToEmpty(job.getTieuDe()),
                nullToEmpty(job.getMoTa()),
                nullToEmpty(job.getYeuCau()),
                nullToEmpty(job.getPhucLoi()),
                resolveCompanyName(job),
                resolveIndustry(job),
                resolveLocation(job),
                resolveExperienceLevel(job),
                resolveWorkType(job),
                String.join(" ", resolveJobSkills(job))
        )));
    }

    private List<String> resolveJobSkills(TinTuyenDung job) {
        if (job == null || job.getId() == null) {
            return List.of();
        }
        return kyNangTinTuyenDungRepository.findByTinTuyenDungIdOrderByKyNangTenAsc(job.getId()).stream()
                .filter(link -> link.getKyNang() != null && StringUtils.hasText(link.getKyNang().getTen()))
                .map(link -> link.getKyNang().getTen())
                .distinct()
                .toList();
    }

    private String resolveLocation(TinTuyenDung job) {
        ChiNhanhCongTy branch = firstBranch(job);
        if (branch == null || branch.getXaPhuong() == null) {
            return "Đang cập nhật";
        }
        String ward = branch.getXaPhuong().getTen();
        String province = branch.getXaPhuong().getTinhThanh() == null
                ? null
                : branch.getXaPhuong().getTinhThanh().getTen();
        if (StringUtils.hasText(ward) && StringUtils.hasText(province)) {
            return ward + ", " + province;
        }
        return StringUtils.hasText(province) ? province : ward;
    }

    private CongTy resolveCompany(TinTuyenDung job) {
        ChiNhanhCongTy branch = firstBranch(job);
        return branch == null ? null : branch.getCongTy();
    }

    private String resolveCompanyName(TinTuyenDung job) {
        CongTy company = resolveCompany(job);
        return company == null || !StringUtils.hasText(company.getTen()) ? "Đang cập nhật" : company.getTen();
    }

    private String resolveIndustry(TinTuyenDung job) {
        return job.getNganhNghe() == null || !StringUtils.hasText(job.getNganhNghe().getTen())
                ? "Đang cập nhật"
                : job.getNganhNghe().getTen();
    }

    private String resolveExperienceLevel(TinTuyenDung job) {
        return job.getCapDoKinhNghiem() == null ? "" : nullToEmpty(job.getCapDoKinhNghiem().getTen());
    }

    private String resolveWorkType(TinTuyenDung job) {
        String joined = resolveWorkTypes(job).stream()
                .map(LoaiHinhLamViec::getTen)
                .filter(StringUtils::hasText)
                .distinct()
                .collect(java.util.stream.Collectors.joining(", "));
        return StringUtils.hasText(joined) ? joined : "Đang cập nhật";
    }

    private String resolveRecruiterName(TinTuyenDung job) {
        if (job.getNguoiDang() == null) {
            return "Nhà tuyển dụng";
        }
        String fullName = ((job.getNguoiDang().getHo() == null ? "" : job.getNguoiDang().getHo().trim())
                + " "
                + (job.getNguoiDang().getTen() == null ? "" : job.getNguoiDang().getTen().trim())).trim();
        if (StringUtils.hasText(fullName)) {
            return fullName;
        }
        return StringUtils.hasText(job.getNguoiDang().getEmail()) ? job.getNguoiDang().getEmail() : "Nhà tuyển dụng";
    }

    private boolean isCompanyApproved(CongTy company) {
        return company != null && "APPROVED".equalsIgnoreCase(company.getTrangThai());
    }

    private List<String> buildTags(TinTuyenDung job) {
        return Arrays.asList(
                        resolveIndustry(job),
                        job.getCapDoKinhNghiem() == null ? null : job.getCapDoKinhNghiem().getTen(),
                        resolveWorkType(job),
                        buildJobCode(job)
                ).stream()
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
    }

    private List<String> splitContent(String value) {
        if (!StringUtils.hasText(value)) {
            return List.of("Doanh nghiệp đang cập nhật nội dung.");
        }
        return Arrays.stream(value.split("\\r?\\n"))
                .map(String::trim)
                .map(item -> item.replaceFirst("^[-•*]\\s*", ""))
                .filter(StringUtils::hasText)
                .toList();
    }

    private String formatSalary(TinTuyenDung job) {
        if (job.getLuongToiThieu() == null && job.getLuongToiDa() == null) {
            return "Thỏa thuận";
        }
        if (job.getLuongToiThieu() != null && job.getLuongToiDa() != null) {
            return formatMillion(job.getLuongToiThieu()) + " - " + formatMillion(job.getLuongToiDa()) + " triệu";
        }
        Integer salary = job.getLuongToiThieu() != null ? job.getLuongToiThieu() : job.getLuongToiDa();
        return "Từ " + formatMillion(salary) + " triệu";
    }

    private String formatMillion(Integer amount) {
        return amount == null ? "" : String.valueOf(Math.round(amount / 1_000_000.0));
    }

    private ChiNhanhCongTy firstBranch(TinTuyenDung job) {
        if (job == null || job.getChiNhanhs() == null || job.getChiNhanhs().isEmpty()) {
            return null;
        }
        return job.getChiNhanhs().stream().findFirst().orElse(null);
    }

    private List<LoaiHinhLamViec> resolveWorkTypes(TinTuyenDung job) {
        if (job == null) {
            return List.of();
        }
        if (job.getLoaiHinhLamViecs() != null && !job.getLoaiHinhLamViecs().isEmpty()) {
            return job.getLoaiHinhLamViecs().stream()
                    .filter(Objects::nonNull)
                    .toList();
        }
        return job.getLoaiHinhLamViec() == null ? List.of() : List.of(job.getLoaiHinhLamViec());
    }

    private String formatDate(LocalDateTime value) {
        return value == null ? "Không giới hạn" : value.format(DATE_FORMATTER);
    }

    private String formatRelativeTime(LocalDateTime value) {
        if (value == null) {
            return "Đang cập nhật";
        }
        long days = Duration.between(value, LocalDateTime.now()).toDays();
        if (days <= 0) {
            return "Hôm nay";
        }
        return days + " ngày trước";
    }

    private String buildJobCode(TinTuyenDung job) {
        return job.getId() == null ? null : "JOB-" + job.getId();
    }

    private Long toLong(Integer value) {
        return value == null ? null : value.longValue();
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
