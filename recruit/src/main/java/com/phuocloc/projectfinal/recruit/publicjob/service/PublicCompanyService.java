package com.phuocloc.projectfinal.recruit.publicjob.service;

import com.phuocloc.projectfinal.recruit.company.repository.CompanyRepository;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyBranchRepository;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.CongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ChiNhanhCongTy;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.PublicTopCompanyProjection;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.TinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.publicjob.dto.response.PublicCompanyDetailResponse;
import com.phuocloc.projectfinal.recruit.publicjob.dto.response.PublicJobSummaryResponse;
import com.phuocloc.projectfinal.recruit.publicjob.dto.response.PublicTopCompanyResponse;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import com.phuocloc.projectfinal.recruit.common.util.ServiceUtils;

@Service
@RequiredArgsConstructor
/**
 * Service public trả về danh sách công ty nổi bật trên homepage.
 *
 * <p>Chỉ lấy công ty đã duyệt, có tin tuyển dụng public còn hiệu lực
 * và có gói đăng bài đang hoạt động + thanh toán thành công.</p>
 */
public class PublicCompanyService {

    private static final int DEFAULT_LIMIT = 8;
    private static final int MAX_LIMIT = 10;
    private static final int DEFAULT_COMPANY_JOBS_LIMIT = 12;
    private static final int MAX_COMPANY_JOBS_LIMIT = 30;

    private final TinTuyenDungRepository tinTuyenDungRepository;
    private final CompanyRepository companyRepository;
    private final CompanyBranchRepository companyBranchRepository;
    private final PublicJobService publicJobService;

    @Transactional(readOnly = true)
    public List<PublicTopCompanyResponse> listTopCompanies(Integer limit) {
        int safeLimit = limit == null || limit <= 0 ? DEFAULT_LIMIT : Math.min(limit, MAX_LIMIT);

        return tinTuyenDungRepository.findPublicTopCompaniesWithActivePackage(
                        LocalDateTime.now(),
                        PageRequest.of(0, safeLimit)
                ).stream()
                .map(this::mapTopCompany)
                .toList();
    }

    private PublicTopCompanyResponse mapTopCompany(PublicTopCompanyProjection projection) {
        return PublicTopCompanyResponse.builder()
                .id(projection.getCompanyId() == null ? null : projection.getCompanyId().longValue())
                .ten(projection.getCompanyName())
                .logoUrl(projection.getLogoUrl())
                .build();
    }

    @Transactional(readOnly = true)
    public PublicCompanyDetailResponse getCompanyDetail(Long companyId) {
        Integer safeCompanyId = toIntId(companyId, "companyId");
        CongTy company = requirePublicCompany(safeCompanyId);
        long activeJobs = tinTuyenDungRepository.countPublicApprovedActiveJobsByCompanyId(
                safeCompanyId,
                LocalDateTime.now()
        );
        List<PublicCompanyDetailResponse.BranchItem> branches = companyBranchRepository.findByCongTy_Id(safeCompanyId).stream()
                .filter(branch -> branch != null && branch.getNgayXoa() == null)
                .map(this::mapBranch)
                .toList();

        return PublicCompanyDetailResponse.builder()
                .id(ServiceUtils.toLong(company.getId()))
                .ten(company.getTen())
                .logoUrl(company.getLogoUrl())
                .website(company.getWebsite())
                .moTa(StringUtils.hasText(company.getMoTa()) ? company.getMoTa() : "Doanh nghiệp đang cập nhật thông tin giới thiệu.")
                .soTinDang(activeJobs)
                .chiNhanhs(branches)
                .build();
    }

    @Transactional(readOnly = true)
    public List<PublicJobSummaryResponse> listCompanyJobs(Long companyId, Integer branchId, Integer limit) {
        Integer safeCompanyId = toIntId(companyId, "companyId");
        requirePublicCompany(safeCompanyId);
        int safeLimit = limit == null || limit <= 0 ? DEFAULT_COMPANY_JOBS_LIMIT : Math.min(limit, MAX_COMPANY_JOBS_LIMIT);

        List<TinTuyenDung> jobs = tinTuyenDungRepository.findPublicApprovedActiveJobsByCompanyId(safeCompanyId, LocalDateTime.now())
                .stream()
                .filter(job -> branchId == null || branchId <= 0
                        || (job.getChiNhanh() != null && branchId.equals(job.getChiNhanh().getId())))
                .limit(safeLimit)
                .toList();
        return jobs.stream().map(publicJobService::mapSummary).toList();
    }

    private CongTy requirePublicCompany(Integer companyId) {
        return companyRepository.findByIdAndNgayXoaIsNullAndTrangThaiIgnoreCase(companyId, "APPROVED")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy công ty"));
    }

    private Integer toIntId(Long id, String fieldName) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " không hợp lệ");
        }
        return Math.toIntExact(id);
    }

    private PublicCompanyDetailResponse.BranchItem mapBranch(ChiNhanhCongTy branch) {
        return PublicCompanyDetailResponse.BranchItem.builder()
                .id(ServiceUtils.toLong(branch.getId()))
                .ten(branch.getTen())
                .diaChi(branch.getDiaChiChiTiet())
                .laTruSoChinh(Boolean.TRUE.equals(branch.getLaTruSoChinh()))
                .build();
    }
}
