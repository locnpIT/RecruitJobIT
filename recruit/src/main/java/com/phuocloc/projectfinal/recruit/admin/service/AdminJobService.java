package com.phuocloc.projectfinal.recruit.admin.service;

import com.phuocloc.projectfinal.recruit.admin.dto.request.ReviewJobRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminJobDetailResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminJobResponse;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.TinTuyenDungRepository;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
/**
 * Nghiệp vụ duyệt tin tuyển dụng cho Admin.
 *
 * <p>Chức năng chính: lọc danh sách, xem chi tiết, duyệt/từ chối/ẩn tin.
 * Trạng thái tin được quản lý bằng trường {@code trangThai} trong entity.</p>
 */
public class AdminJobService {

    private final TinTuyenDungRepository tinTuyenDungRepository;

    @Transactional(readOnly = true)
    public List<AdminJobResponse> listJobs(String keyword, String company, String status, String industry, String location) {
        String normalizedKeyword = normalize(keyword);
        String normalizedCompany = normalize(company);
        String normalizedStatus = normalize(status);
        String normalizedIndustry = normalize(industry);
        String normalizedLocation = normalize(location);

        // Hiện tại lọc in-memory sau khi lấy dữ liệu chưa xóa mềm.
        // Có thể tối ưu sau bằng query spec nếu dữ liệu tăng lớn.
        return tinTuyenDungRepository.findByNgayXoaIsNull(Sort.by(Sort.Direction.DESC, "ngayTao")).stream()
                .filter(job -> matchesJobKeyword(job, normalizedKeyword))
                .filter(job -> matchesJobCompany(job, normalizedCompany))
                .filter(job -> matchesJobStatus(job, normalizedStatus))
                .filter(job -> matchesJobIndustry(job, normalizedIndustry))
                .filter(job -> matchesJobLocation(job, normalizedLocation))
                .map(this::mapJob)
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminJobDetailResponse getJobDetail(Long jobId) {
        TinTuyenDung job = requireJob(jobId);
        AdminJobDetailResponse response = new AdminJobDetailResponse();
        response.setSummary(mapJob(job));
        response.setMoTa(job.getMoTa());
        response.setYeuCau(job.getYeuCau());
        response.setPhucLoi(job.getPhucLoi());
        response.setBatBuocCv(job.getBatBuocCV());
        response.setMauCvUrl(job.getMauCvUrl());
        return response;
    }

    @Transactional
    public AdminJobResponse approveJob(Long jobId) {
        TinTuyenDung job = requireJob(jobId);
        // Duyệt tin: reset lý do từ chối cũ (nếu có).
        job.setTrangThai("APPROVED");
        job.setLyDoTuChoi(null);
        return mapJob(tinTuyenDungRepository.save(job));
    }

    @Transactional
    public AdminJobResponse rejectJob(Long jobId, ReviewJobRequest request) {
        TinTuyenDung job = requireJob(jobId);
        String reason = trimToNull(request.getLyDoTuChoi());
        if (reason == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập lý do từ chối");
        }
        job.setTrangThai("REJECTED");
        job.setLyDoTuChoi(reason);
        return mapJob(tinTuyenDungRepository.save(job));
    }

    @Transactional
    public AdminJobResponse hideJob(Long jobId) {
        TinTuyenDung job = requireJob(jobId);
        job.setTrangThai("HIDDEN");
        return mapJob(tinTuyenDungRepository.save(job));
    }

    private TinTuyenDung requireJob(Long jobId) {
        // Luôn loại bỏ bản ghi đã xóa mềm để tránh thao tác sai dữ liệu lịch sử.
        return tinTuyenDungRepository.findById(toIntId(jobId, "jobId"))
                .filter(job -> job.getNgayXoa() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tin tuyển dụng"));
    }

    private boolean matchesJobKeyword(TinTuyenDung job, String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return true;
        }
        return contains(normalize(job.getTieuDe()), keyword)
                || contains(normalize(job.getMoTa()), keyword);
    }

    private boolean matchesJobCompany(TinTuyenDung job, String companyKeyword) {
        if (!StringUtils.hasText(companyKeyword)) {
            return true;
        }
        String companyName = job.getChiNhanh() != null && job.getChiNhanh().getCongTy() != null
                ? job.getChiNhanh().getCongTy().getTen()
                : null;
        return contains(normalize(companyName), companyKeyword);
    }

    private boolean matchesJobStatus(TinTuyenDung job, String status) {
        if (!StringUtils.hasText(status)) {
            return true;
        }
        return status.equalsIgnoreCase(job.getTrangThai());
    }

    private boolean matchesJobIndustry(TinTuyenDung job, String industryKeyword) {
        if (!StringUtils.hasText(industryKeyword)) {
            return true;
        }
        String industryName = job.getNganhNghe() == null ? null : job.getNganhNghe().getTen();
        return contains(normalize(industryName), industryKeyword);
    }

    private boolean matchesJobLocation(TinTuyenDung job, String locationKeyword) {
        if (!StringUtils.hasText(locationKeyword)) {
            return true;
        }

        String xaPhuong = job.getChiNhanh() == null || job.getChiNhanh().getXaPhuong() == null
                ? null
                : job.getChiNhanh().getXaPhuong().getTen();
        String tinhThanh = job.getChiNhanh() == null
                || job.getChiNhanh().getXaPhuong() == null
                || job.getChiNhanh().getXaPhuong().getTinhThanh() == null
                ? null
                : job.getChiNhanh().getXaPhuong().getTinhThanh().getTen();
        String diaChi = (StringUtils.hasText(xaPhuong) ? xaPhuong : "")
                + " "
                + (StringUtils.hasText(tinhThanh) ? tinhThanh : "");
        return contains(normalize(diaChi), locationKeyword);
    }

    private AdminJobResponse mapJob(TinTuyenDung job) {
        String companyName = job.getChiNhanh() != null && job.getChiNhanh().getCongTy() != null
                ? job.getChiNhanh().getCongTy().getTen()
                : null;
        String branchName = job.getChiNhanh() == null ? null : job.getChiNhanh().getTen();
        String xaPhuong = job.getChiNhanh() == null || job.getChiNhanh().getXaPhuong() == null
                ? null
                : job.getChiNhanh().getXaPhuong().getTen();
        String tinhThanh = job.getChiNhanh() == null
                || job.getChiNhanh().getXaPhuong() == null
                || job.getChiNhanh().getXaPhuong().getTinhThanh() == null
                ? null
                : job.getChiNhanh().getXaPhuong().getTinhThanh().getTen();
        String diaDiem = StringUtils.hasText(xaPhuong) && StringUtils.hasText(tinhThanh)
                ? xaPhuong + ", " + tinhThanh
                : (StringUtils.hasText(tinhThanh) ? tinhThanh : xaPhuong);

        return AdminJobResponse.builder()
                .id(job.getId() == null ? null : job.getId().longValue())
                .tieuDe(job.getTieuDe())
                .congTyTen(companyName)
                .chiNhanhTen(branchName)
                .diaDiem(diaDiem)
                .nganhNgheTen(job.getNganhNghe() == null ? null : job.getNganhNghe().getTen())
                .capDoKinhNghiemTen(job.getCapDoKinhNghiem() == null ? null : job.getCapDoKinhNghiem().getTen())
                .luongToiThieu(job.getLuongToiThieu())
                .luongToiDa(job.getLuongToiDa())
                .trangThai(job.getTrangThai())
                .lyDoTuChoi(job.getLyDoTuChoi())
                .denHanLuc(job.getDenHanLuc())
                .ngayTao(job.getNgayTao())
                .build();
    }

    private Integer toIntId(Long id, String fieldName) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " không được để trống");
        }
        return Math.toIntExact(id);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private boolean contains(String source, String keyword) {
        return StringUtils.hasText(source) && source.contains(keyword);
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
