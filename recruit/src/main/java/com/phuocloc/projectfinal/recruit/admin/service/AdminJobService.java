package com.phuocloc.projectfinal.recruit.admin.service;

import com.phuocloc.projectfinal.recruit.ai.service.JobEmbeddingIndexService;
import com.phuocloc.projectfinal.recruit.admin.dto.request.ReviewJobRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminJobDetailResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminJobResponse;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ChiNhanhCongTy;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.TinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.notification.service.NotificationService;
import com.phuocloc.projectfinal.recruit.publicjob.service.PublicJobElasticsearchIndexService;
import java.util.List;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import com.phuocloc.projectfinal.recruit.common.util.ServiceUtils;

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
    private final NotificationService notificationService;
    private final JobEmbeddingIndexService chiMucNhungTinTuyenDungService;
    private final PublicJobElasticsearchIndexService publicJobElasticsearchIndexService;

    @Transactional(readOnly = true)
    public List<AdminJobResponse> listJobs(String keyword, String company, String status, String industry, String location) {
        String normalizedKeyword = ServiceUtils.normalize(keyword);
        String normalizedCompany = ServiceUtils.normalize(company);
        String normalizedStatus = ServiceUtils.normalize(status);
        String normalizedIndustry = ServiceUtils.normalize(industry);
        String normalizedLocation = ServiceUtils.normalize(location);

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
        response.setTongQuan(mapJob(job));
        response.setMoTa(job.getMoTa());
        response.setYeuCau(job.getYeuCau());
        response.setPhucLoi(job.getPhucLoi());
        response.setBatBuocCV(job.getBatBuocCV());
        response.setMauCvUrl(job.getMauCvUrl());
        return response;
    }

    @Transactional
    public AdminJobResponse approveJob(Long jobId) {
        return changeJobStatus(jobId, "APPROVED", null,
                "Tin tuyển dụng đã được duyệt",
                job -> "Tin \"" + safeJobTitle(job) + "\" đã được admin duyệt.");
    }

    @Transactional
    public AdminJobResponse rejectJob(Long jobId, ReviewJobRequest request) {
        String reason = ServiceUtils.trimToNull(request.getLyDoTuChoi());
        if (reason == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập lý do từ chối");
        }
        return changeJobStatus(jobId, "REJECTED", reason,
                "Tin tuyển dụng bị từ chối",
                job -> "Tin \"" + safeJobTitle(job) + "\" bị từ chối. Lý do: " + reason);
    }

    @Transactional
    public AdminJobResponse hideJob(Long jobId) {
        return changeJobStatus(jobId, "HIDDEN", null,
                "Tin tuyển dụng đã bị ẩn",
                job -> "Tin \"" + safeJobTitle(job) + "\" đã bị ẩn bởi admin.");
    }

    private AdminJobResponse changeJobStatus(Long jobId, String status, String lyDoTuChoi,
            String notificationTitle, Function<TinTuyenDung, String> notificationBody) {
        TinTuyenDung job = requireJob(jobId);
        job.setTrangThai(status);
        job.setLyDoTuChoi(lyDoTuChoi);
        notificationService.createForUser(
                job.getNguoiDang(),
                notificationTitle,
                notificationBody.apply(job),
                "/company-admin/jobs"
        );
        TinTuyenDung saved = tinTuyenDungRepository.save(job);
        chiMucNhungTinTuyenDungService.syncOrDeactivateIndex(saved);
        publicJobElasticsearchIndexService.syncOrDelete(saved);
        return mapJob(saved);
    }

    private TinTuyenDung requireJob(Long jobId) {
        // Luôn loại bỏ bản ghi đã xóa mềm để tránh thao tác sai dữ liệu lịch sử.
        return tinTuyenDungRepository.findById(ServiceUtils.toIntId(jobId, "jobId"))
                .filter(job -> job.getNgayXoa() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tin tuyển dụng"));
    }

    private boolean matchesJobKeyword(TinTuyenDung job, String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return true;
        }
        return ServiceUtils.contains(ServiceUtils.normalize(job.getTieuDe()), keyword)
                || ServiceUtils.contains(ServiceUtils.normalize(job.getMoTa()), keyword);
    }

    private boolean matchesJobCompany(TinTuyenDung job, String companyKeyword) {
        if (!StringUtils.hasText(companyKeyword)) {
            return true;
        }
        return job.getChiNhanhs().stream()
                .map(branch -> branch.getCongTy() == null ? null : branch.getCongTy().getTen())
                .anyMatch(companyName -> ServiceUtils.contains(ServiceUtils.normalize(companyName), companyKeyword));
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
        return ServiceUtils.contains(ServiceUtils.normalize(industryName), industryKeyword);
    }

    private boolean matchesJobLocation(TinTuyenDung job, String locationKeyword) {
        if (!StringUtils.hasText(locationKeyword)) {
            return true;
        }

        return job.getChiNhanhs().stream()
                .map(this::resolveBranchLocation)
                .anyMatch(diaChi -> ServiceUtils.contains(ServiceUtils.normalize(diaChi), locationKeyword));
    }

    private AdminJobResponse mapJob(TinTuyenDung job) {
        ChiNhanhCongTy branch = firstBranch(job);
        String companyName = branch != null && branch.getCongTy() != null
                ? branch.getCongTy().getTen()
                : null;
        String companyLogoUrl = branch != null && branch.getCongTy() != null
                ? branch.getCongTy().getLogoUrl()
                : null;
        String branchName = branch == null ? null : branch.getTen();
        String diaDiem = resolveBranchLocation(branch);

        return AdminJobResponse.builder()
                .id(ServiceUtils.toLong(job.getId()))
                .tieuDe(job.getTieuDe())
                .congTyTen(companyName)
                .congTyLogoUrl(companyLogoUrl)
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

    private String safeJobTitle(TinTuyenDung job) {
        if (job == null || !StringUtils.hasText(job.getTieuDe())) {
            return "không xác định";
        }
        return job.getTieuDe().trim();
    }

    private ChiNhanhCongTy firstBranch(TinTuyenDung job) {
        if (job == null || job.getChiNhanhs() == null) {
            return null;
        }
        return job.getChiNhanhs().stream().findFirst().orElse(null);
    }

    private String resolveBranchLocation(ChiNhanhCongTy branch) {
        if (branch == null) {
            return null;
        }
        String xaPhuong = branch.getXaPhuong() == null ? null : branch.getXaPhuong().getTen();
        String tinhThanh = branch.getXaPhuong() == null || branch.getXaPhuong().getTinhThanh() == null
                ? null
                : branch.getXaPhuong().getTinhThanh().getTen();
        return StringUtils.hasText(xaPhuong) && StringUtils.hasText(tinhThanh)
                ? xaPhuong + ", " + tinhThanh
                : (StringUtils.hasText(tinhThanh) ? tinhThanh : xaPhuong);
    }
}
