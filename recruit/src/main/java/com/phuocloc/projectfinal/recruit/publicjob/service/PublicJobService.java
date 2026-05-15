package com.phuocloc.projectfinal.recruit.publicjob.service;

import com.phuocloc.projectfinal.recruit.domain.congty.entity.CongTy;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.KyNangTinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.TinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.publicjob.dto.response.PublicJobDetailResponse;
import com.phuocloc.projectfinal.recruit.publicjob.dto.response.PublicJobSummaryResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
/**
 * Service public cho tin tuyển dụng.
 *
 * <p>Luồng public chỉ được phép trả về tin đã được Admin duyệt, chưa xóa mềm,
 * chưa hết hạn và thuộc công ty đã được duyệt. Điều này đảm bảo ứng viên không
 * thấy tin nháp, tin bị từ chối hoặc tin của công ty chưa xác minh.</p>
 */
public class PublicJobService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final int DEFAULT_LIMIT = 8;
    private static final int SIMILAR_LIMIT = 4;

    private final TinTuyenDungRepository tinTuyenDungRepository;
    private final KyNangTinTuyenDungRepository kyNangTinTuyenDungRepository;

    @Transactional(readOnly = true)
    public List<PublicJobSummaryResponse> listJobs(String keyword, String location, Integer limit) {
        int safeLimit = limit == null || limit <= 0 ? DEFAULT_LIMIT : Math.min(limit, 30);
        String normalizedKeyword = normalize(keyword);
        String normalizedLocation = normalize(location);

        return tinTuyenDungRepository.findPublicApprovedActiveJobs(LocalDateTime.now()).stream()
                .filter(job -> matchesKeyword(job, normalizedKeyword))
                .filter(job -> matchesLocation(job, normalizedLocation))
                .limit(safeLimit)
                .map(this::mapSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public PublicJobDetailResponse getJobDetail(Long jobId) {
        TinTuyenDung job = requirePublicJob(jobId);
        List<PublicJobSummaryResponse> similarJobs = tinTuyenDungRepository.findPublicApprovedActiveJobs(LocalDateTime.now()).stream()
                .filter(item -> !Objects.equals(item.getId(), job.getId()))
                .filter(item -> sameIndustry(item, job) || sameLocation(item, job))
                .limit(SIMILAR_LIMIT)
                .map(this::mapSummary)
                .toList();

        return PublicJobDetailResponse.builder()
                .id(toLong(job.getId()))
                .maTin(buildJobCode(job))
                .tieuDe(job.getTieuDe())
                .trangThai("Đang tuyển dụng")
                .congTy(resolveCompanyName(job))
                .congTyDaXacMinh(isCompanyApproved(resolveCompany(job)))
                .nhaTuyenDungId(job.getNguoiDang() == null || job.getNguoiDang().getId() == null ? null : job.getNguoiDang().getId().longValue())
                .nhaTuyenDungTen(resolveRecruiterName(job))
                .nganhNghe(resolveIndustry(job))
                .quyMoCongTy("Đang cập nhật")
                .websiteCongTy(resolveCompany(job) == null ? null : resolveCompany(job).getWebsite())
                .diaDiem(resolveLocation(job))
                .mucLuong(formatSalary(job))
                .capDo(job.getCapDoKinhNghiem() == null ? "Đang cập nhật" : job.getCapDoKinhNghiem().getTen())
                .loaiHinhLamViec(job.getLoaiHinhLamViec() == null ? "Đang cập nhật" : job.getLoaiHinhLamViec().getTen())
                .kinhNghiem(job.getCapDoKinhNghiem() == null ? "Đang cập nhật" : job.getCapDoKinhNghiem().getTen())
                .hanNop(formatDate(job.getDenHanLuc()))
                .dangLuc(formatRelativeTime(job.getNgayTao()))
                .hocVan("Không yêu cầu")
                .soLuongTuyen(job.getSoLuongTuyen() == null ? "Đang cập nhật" : job.getSoLuongTuyen() + " người")
                .gioiTinh("Không yêu cầu")
                .capNhatLuc(formatRelativeTime(job.getNgayCapNhat()))
                .batBuocCv(Boolean.TRUE.equals(job.getBatBuocCV()))
                .mauCvUrl(job.getMauCvUrl())
                .the(buildTags(job))
                .kyNangs(resolveJobSkills(job))
                .moTa(splitContent(job.getMoTa()))
                .yeuCau(splitContent(job.getYeuCau()))
                .phucLoi(splitContent(job.getPhucLoi()))
                .moTaCongTy(resolveCompany(job) == null || !StringUtils.hasText(resolveCompany(job).getMoTa())
                        ? "Doanh nghiệp đang cập nhật thông tin giới thiệu."
                        : resolveCompany(job).getMoTa())
                .viecLamTuongTu(similarJobs)
                .build();
    }

    public TinTuyenDung requirePublicJob(Long jobId) {
        if (jobId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "jobId không được để trống");
        }
        return tinTuyenDungRepository.findPublicApprovedActiveJobById(Math.toIntExact(jobId), LocalDateTime.now())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tin tuyển dụng đang hiển thị"));
    }

    public PublicJobSummaryResponse mapSummary(TinTuyenDung job) {
        return PublicJobSummaryResponse.builder()
                .id(toLong(job.getId()))
                .maTin(buildJobCode(job))
                .tieuDe(job.getTieuDe())
                .congTyTen(resolveCompanyName(job))
                .diaDiem(resolveLocation(job))
                .mucLuong(formatSalary(job))
                .capDo(job.getCapDoKinhNghiem() == null ? "Đang cập nhật" : job.getCapDoKinhNghiem().getTen())
                .hinhThuc(job.getLoaiHinhLamViec() == null ? "Đang cập nhật" : job.getLoaiHinhLamViec().getTen())
                .nganhNghe(resolveIndustry(job))
                .hanNop(formatDate(job.getDenHanLuc()))
                .tag(resolveTag(job))
                .ngayTao(job.getNgayTao())
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

    private boolean matchesKeyword(TinTuyenDung job, String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return true;
        }
        return contains(normalize(job.getTieuDe()), keyword)
                || contains(normalize(resolveCompanyName(job)), keyword)
                || contains(normalize(resolveIndustry(job)), keyword);
    }

    private boolean matchesLocation(TinTuyenDung job, String location) {
        return !StringUtils.hasText(location) || contains(normalize(resolveLocation(job)), location);
    }

    private boolean sameIndustry(TinTuyenDung source, TinTuyenDung target) {
        return source.getNganhNghe() != null
                && target.getNganhNghe() != null
                && Objects.equals(source.getNganhNghe().getId(), target.getNganhNghe().getId());
    }

    private boolean sameLocation(TinTuyenDung source, TinTuyenDung target) {
        return Objects.equals(normalize(resolveLocation(source)), normalize(resolveLocation(target)));
    }

    private List<String> buildTags(TinTuyenDung job) {
        return Arrays.asList(
                        resolveIndustry(job),
                        job.getCapDoKinhNghiem() == null ? null : job.getCapDoKinhNghiem().getTen(),
                        job.getLoaiHinhLamViec() == null ? null : job.getLoaiHinhLamViec().getTen(),
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
        if (job.getChiNhanh() == null || job.getChiNhanh().getXaPhuong() == null) {
            return "Đang cập nhật";
        }
        String ward = job.getChiNhanh().getXaPhuong().getTen();
        String province = job.getChiNhanh().getXaPhuong().getTinhThanh() == null
                ? null
                : job.getChiNhanh().getXaPhuong().getTinhThanh().getTen();
        if (StringUtils.hasText(ward) && StringUtils.hasText(province)) {
            return ward + ", " + province;
        }
        return StringUtils.hasText(province) ? province : ward;
    }

    private CongTy resolveCompany(TinTuyenDung job) {
        return job.getChiNhanh() == null ? null : job.getChiNhanh().getCongTy();
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

    private String resolveTag(TinTuyenDung job) {
        long days = job.getNgayTao() == null ? 99 : Duration.between(job.getNgayTao(), LocalDateTime.now()).toDays();
        return days <= 3 ? "Mới" : "Đã duyệt";
    }

    private String buildJobCode(TinTuyenDung job) {
        return job.getId() == null ? null : "JOB-" + job.getId();
    }

    private Long toLong(Integer value) {
        return value == null ? null : value.longValue();
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private boolean contains(String source, String keyword) {
        return StringUtils.hasText(source) && source.contains(keyword);
    }
}
