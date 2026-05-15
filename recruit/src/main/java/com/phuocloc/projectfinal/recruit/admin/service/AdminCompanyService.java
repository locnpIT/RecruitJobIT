package com.phuocloc.projectfinal.recruit.admin.service;

import com.phuocloc.projectfinal.recruit.admin.dto.request.ReviewCompanyRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminCompanyDetailResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminCompanyResponse;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyBranchRepository;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyProofDocumentRepository;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyRepository;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ChiNhanhCongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.CongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.TepMinhChungCongTy;
import com.phuocloc.projectfinal.recruit.domain.diadiem.entity.TinhThanh;
import com.phuocloc.projectfinal.recruit.domain.diadiem.entity.XaPhuong;
import com.phuocloc.projectfinal.recruit.notification.service.NotificationService;
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
 * Nghiệp vụ duyệt công ty cho admin.
 *
 * <p>Service này bao phủ danh sách công ty, chi tiết công ty và hành động approve/reject
 * kèm đồng bộ trạng thái minh chứng pháp lý liên quan.</p>
 */
public class AdminCompanyService {

    private final CompanyRepository companyRepository;
    private final CompanyBranchRepository companyBranchRepository;
    private final CompanyProofDocumentRepository companyProofDocumentRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<AdminCompanyResponse> listCompanies(String status) {
        // Lọc theo trạng thái nếu frontend yêu cầu, ngược lại trả toàn bộ công ty chưa xóa mềm.
        String normalizedStatus = normalize(status);

        return companyRepository.findAll(Sort.by(Sort.Direction.DESC, "ngayTao")).stream()
                .filter(company -> company.getNgayXoa() == null)
                .filter(company -> StringUtils.hasText(normalizedStatus)
                        ? normalizedStatus.equalsIgnoreCase(company.getTrangThai())
                        : true)
                .map(this::mapCompany)
                .toList();
    }

    @Transactional
    public AdminCompanyResponse approveCompany(Long companyId) {
        // Khi duyệt công ty cũng đồng bộ trạng thái các minh chứng sang APPROVED.
        CongTy company = requireCompany(companyId);
        company.setTrangThai("APPROVED");
        company.setLyDoTuChoi(null);
        company = companyRepository.save(company);

        updateProofDocuments(company.getId(), "APPROVED", null);
        notificationService.createForUser(
                company.getChuCongTy(),
                "Công ty đã được duyệt",
                "Công ty " + safeCompanyName(company) + " đã được admin duyệt.",
                "/company-admin/settings"
        );
        return mapCompany(company);
    }

    @Transactional
    public AdminCompanyResponse rejectCompany(Long companyId, ReviewCompanyRequest request) {
        // Từ chối công ty bắt buộc phải có lý do để owner biết cần chỉnh gì trước khi gửi lại.
        CongTy company = requireCompany(companyId);
        String reason = trimToNull(request.getLyDoTuChoi());
        if (reason == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập lý do từ chối");
        }

        company.setTrangThai("REJECTED");
        company.setLyDoTuChoi(reason);
        company = companyRepository.save(company);

        updateProofDocuments(company.getId(), "REJECTED", reason);
        notificationService.createForUser(
                company.getChuCongTy(),
                "Công ty bị từ chối",
                "Công ty " + safeCompanyName(company) + " bị từ chối. Lý do: " + reason,
                "/company-admin/settings"
        );
        return mapCompany(company);
    }

    @Transactional(readOnly = true)
    public AdminCompanyDetailResponse getCompanyDetail(Long companyId) {
        CongTy company = requireCompany(companyId);
        List<ChiNhanhCongTy> branches = companyBranchRepository.findByCongTy_Id(company.getId());
        List<TepMinhChungCongTy> documents = companyProofDocumentRepository.findByCongTy_IdOrderByNgayTaoDesc(company.getId()).stream()
                .filter(this::isRenderableProofDocument)
                .toList();

        return AdminCompanyDetailResponse.builder()
                .company(mapCompany(company))
                .owner(AdminCompanyDetailResponse.Owner.builder()
                        .id(company.getChuCongTy() == null || company.getChuCongTy().getId() == null
                                ? null
                                : company.getChuCongTy().getId().longValue())
                        .hoTen(buildFullName(
                                company.getChuCongTy() == null ? null : company.getChuCongTy().getHo(),
                                company.getChuCongTy() == null ? null : company.getChuCongTy().getTen()))
                        .email(company.getChuCongTy() == null ? null : company.getChuCongTy().getEmail())
                        .soDienThoai(company.getChuCongTy() == null ? null : company.getChuCongTy().getSoDienThoai())
                        .dangHoatDong(company.getChuCongTy() != null && Boolean.TRUE.equals(company.getChuCongTy().getDangHoatDong()))
                        .build())
                .branches(branches.stream()
                        .map(branch -> AdminCompanyDetailResponse.Branch.builder()
                                .id(branch.getId() == null ? null : branch.getId().longValue())
                                .ten(branch.getTen())
                                .diaChiChiTiet(branch.getDiaChiChiTiet())
                                .xaPhuongTen(branch.getXaPhuong() == null ? null : branch.getXaPhuong().getTen())
                                .tinhThanhTen(resolveTinhThanhTen(branch.getXaPhuong()))
                                .laTruSoChinh(branch.getLaTruSoChinh())
                                .trangThai(branch.getNgayXoa() == null ? "ACTIVE" : "DELETED")
                                .ngayTao(branch.getNgayTao())
                                .build())
                        .toList())
                .proofDocuments(documents.stream()
                        .map(document -> AdminCompanyDetailResponse.ProofDocument.builder()
                                .id(document.getId() == null ? null : document.getId().longValue())
                                .tenTep(document.getTenTep())
                                .duongDanTep(document.getDuongDanTep())
                                .loaiTaiLieu(document.getLoaiTaiLieu() == null ? null : document.getLoaiTaiLieu().getTen())
                                .trangThai(document.getTrangThai())
                                .lyDoTuChoi(document.getLyDoTuChoi())
                                .ngayTao(document.getNgayTao())
                                .build())
                        .toList())
                .build();
    }

    private void updateProofDocuments(Integer companyId, String status, String rejectReason) {
        List<TepMinhChungCongTy> documents = companyProofDocumentRepository.findByCongTy_IdOrderByNgayTaoDesc(companyId);
        for (TepMinhChungCongTy document : documents) {
            document.setTrangThai(status);
            document.setLyDoTuChoi(rejectReason);
        }
        if (!documents.isEmpty()) {
            companyProofDocumentRepository.saveAll(documents);
        }
    }

    private AdminCompanyResponse mapCompany(CongTy company) {
        List<TepMinhChungCongTy> documents = companyProofDocumentRepository.findByCongTy_IdOrderByNgayTaoDesc(company.getId());
        TepMinhChungCongTy latestDocument = documents.stream()
                .filter(this::isRenderableProofDocument)
                .findFirst()
                .orElse(null);

        return AdminCompanyResponse.builder()
                .id(company.getId() == null ? null : company.getId().longValue())
                .ten(company.getTen())
                .maSoThue(company.getMaSoThue())
                .website(company.getWebsite())
                .trangThai(company.getTrangThai())
                .lyDoTuChoi(company.getLyDoTuChoi())
                .chuCongTyHoTen(company.getChuCongTy() == null ? null : buildFullName(company.getChuCongTy().getHo(), company.getChuCongTy().getTen()))
                .chuCongTyEmail(company.getChuCongTy() == null ? null : company.getChuCongTy().getEmail())
                .soChiNhanh(company.getId() == null ? 0 : companyBranchRepository.findByCongTy_Id(company.getId()).size())
                .minhChungUrl(latestDocument == null ? null : latestDocument.getDuongDanTep())
                .minhChungTrangThai(latestDocument == null ? null : latestDocument.getTrangThai())
                .minhChungLyDoTuChoi(latestDocument == null ? null : latestDocument.getLyDoTuChoi())
                .ngayTao(company.getNgayTao())
                .ngayCapNhat(company.getNgayCapNhat())
                .build();
    }

    private boolean isRenderableProofDocument(TepMinhChungCongTy document) {
        if (document == null) {
            return false;
        }

        if (document.getNgayXoa() != null) {
            return false;
        }

        String status = document.getTrangThai();
        if (status == null) {
            return true;
        }

        return !"REJECTED".equalsIgnoreCase(status) && !"REJECT".equalsIgnoreCase(status);
    }

    private CongTy requireCompany(Long companyId) {
        return companyRepository.findById(toIntId(companyId, "companyId"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy công ty"));
    }

    private Integer toIntId(Long id, String fieldName) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " không được để trống");
        }
        return Math.toIntExact(id);
    }

    private String buildFullName(String ho, String ten) {
        String fullName = (StringUtils.hasText(ho) ? ho.trim() : "") + " " + (StringUtils.hasText(ten) ? ten.trim() : "");
        return fullName.trim();
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String resolveTinhThanhTen(XaPhuong xaPhuong) {
        if (xaPhuong == null || xaPhuong.getTinhThanh() == null) {
            return null;
        }
        TinhThanh tinhThanh = xaPhuong.getTinhThanh();
        return tinhThanh.getTen();
    }

    private String safeCompanyName(CongTy company) {
        if (company == null || !StringUtils.hasText(company.getTen())) {
            return "của bạn";
        }
        return "\"" + company.getTen().trim() + "\"";
    }
}
