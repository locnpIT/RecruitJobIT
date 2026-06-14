package com.phuocloc.projectfinal.recruit.admin.service;

import com.phuocloc.projectfinal.recruit.admin.dto.request.AdminCreateCompanyRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.request.AdminUpdateCompanyBranchRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.request.AdminUpdateCompanyRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.request.ReviewCompanyRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminCompanyDetailResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminCompanyResponse;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyBranchRepository;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyProofDocumentRepository;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyRepository;
import com.phuocloc.projectfinal.recruit.company.repository.EmployerProfileRepository;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ChiNhanhCongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.CongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.TepMinhChungCongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ThanhVienCongTy;
import com.phuocloc.projectfinal.recruit.domain.diadiem.entity.TinhThanh;
import com.phuocloc.projectfinal.recruit.domain.diadiem.entity.XaPhuong;
import com.phuocloc.projectfinal.recruit.domain.diadiem.repository.XaPhuongRepository;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.TinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.notification.service.NotificationService;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
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
 * Nghiệp vụ duyệt công ty cho admin.
 *
 * <p>Service này bao phủ danh sách công ty, chi tiết công ty và hành động approve/reject
 * kèm đồng bộ trạng thái minh chứng pháp lý liên quan.</p>
 */
public class AdminCompanyService {

    private final CompanyRepository companyRepository;
    private final CompanyBranchRepository companyBranchRepository;
    private final CompanyProofDocumentRepository companyProofDocumentRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final TinTuyenDungRepository tinTuyenDungRepository;
    private final NotificationService notificationService;
    private final XaPhuongRepository xaPhuongRepository;

    @Transactional(readOnly = true)
    public List<AdminCompanyResponse> listCompanies(String status, String keyword) {
        // Mặc định chỉ hiển thị công ty chưa xóa mềm. Tab DELETED dùng riêng để rà lịch sử xóa.
        String normalizedStatus = ServiceUtils.normalize(status);
        String normalizedKeyword = ServiceUtils.normalize(keyword);

        return companyRepository.findAll(Sort.by(Sort.Direction.DESC, "ngayTao")).stream()
                .filter(company -> matchesStatus(company, normalizedStatus))
                .filter(company -> matchesKeyword(company, normalizedKeyword))
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
        String reason = ServiceUtils.trimToNull(request.getLyDoTuChoi());
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
                .congTy(mapCompany(company))
                .chuCongTy(AdminCompanyDetailResponse.Owner.builder()
                        .id(company.getChuCongTy() == null ? null : ServiceUtils.toLong(company.getChuCongTy().getId()))
                        .hoTen(ServiceUtils.buildFullName(
                                company.getChuCongTy() == null ? null : company.getChuCongTy().getHo(),
                                company.getChuCongTy() == null ? null : company.getChuCongTy().getTen()))
                        .email(company.getChuCongTy() == null ? null : company.getChuCongTy().getEmail())
                        .soDienThoai(company.getChuCongTy() == null ? null : company.getChuCongTy().getSoDienThoai())
                        .dangHoatDong(company.getChuCongTy() != null && Boolean.TRUE.equals(company.getChuCongTy().getDangHoatDong()))
                        .build())
                .chiNhanhs(branches.stream()
                        .map(branch -> AdminCompanyDetailResponse.Branch.builder()
                                .id(ServiceUtils.toLong(branch.getId()))
                                .ten(branch.getTen())
                                .diaChiChiTiet(branch.getDiaChiChiTiet())
                                .xaPhuongId(branch.getXaPhuong() == null ? null : ServiceUtils.toLong(branch.getXaPhuong().getId()))
                                .xaPhuongTen(branch.getXaPhuong() == null ? null : branch.getXaPhuong().getTen())
                                .tinhThanhId(branch.getXaPhuong() == null || branch.getXaPhuong().getTinhThanh() == null
                                        ? null
                                        : ServiceUtils.toLong(branch.getXaPhuong().getTinhThanh().getId()))
                                .tinhThanhTen(resolveTinhThanhTen(branch.getXaPhuong()))
                                .laTruSoChinh(branch.getLaTruSoChinh())
                                .trangThai(branch.getNgayXoa() == null ? "ACTIVE" : "DELETED")
                                .ngayTao(branch.getNgayTao())
                                .build())
                        .toList())
                .taiLieuMinhChungs(documents.stream()
                        .map(document -> AdminCompanyDetailResponse.ProofDocument.builder()
                                .id(ServiceUtils.toLong(document.getId()))
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

    @Transactional
    public AdminCompanyResponse createCompany(AdminCreateCompanyRequest request) {
        String ten = ServiceUtils.trimToNull(request.getTen());
        String maSoThue = ServiceUtils.trimToNull(request.getMaSoThue());
        if (ten == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên công ty không được để trống");
        }
        if (maSoThue == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã số thuế không được để trống");
        }
        if (request.getChiNhanhs() == null || request.getChiNhanhs().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phải có ít nhất một chi nhánh");
        }
        long soTruSoChinh = request.getChiNhanhs().stream()
                .filter(b -> Boolean.TRUE.equals(b.getLaTruSoChinh())).count();
        if (soTruSoChinh != 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phải chọn đúng một chi nhánh là trụ sở chính");
        }
        if (companyRepository.existsByMaSoThue(maSoThue)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã số thuế đã tồn tại");
        }

        CongTy company = new CongTy();
        company.setTen(ten);
        company.setMaSoThue(maSoThue);
        company.setWebsite(ServiceUtils.trimToNull(request.getWebsite()));
        company.setMoTa(ServiceUtils.trimToNull(request.getMoTa()));
        company.setTrangThai("APPROVED");
        company = companyRepository.save(company);

        for (AdminCreateCompanyRequest.BranchRequest branchReq : request.getChiNhanhs()) {
            ChiNhanhCongTy branch = new ChiNhanhCongTy();
            branch.setCongTy(company);
            branch.setTen(branchReq.getTen().trim());
            branch.setDiaChiChiTiet(branchReq.getDiaChiChiTiet().trim());
            branch.setLaTruSoChinh(Boolean.TRUE.equals(branchReq.getLaTruSoChinh()));
            if (branchReq.getXaPhuongId() != null) {
                branch.setXaPhuong(resolveXaPhuong(branchReq.getXaPhuongId()));
            }
            companyBranchRepository.save(branch);
        }

        return mapCompany(company);
    }

    @Transactional
    public AdminCompanyResponse updateCompany(Long companyId, AdminUpdateCompanyRequest request) {
        CongTy company = requireCompany(companyId);
        String ten = ServiceUtils.trimToNull(request.getTen());
        if (ten == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên công ty không được để trống");
        }
        company.setTen(ten);
        company.setWebsite(ServiceUtils.trimToNull(request.getWebsite()));
        company.setMoTa(ServiceUtils.trimToNull(request.getMoTa()));
        return mapCompany(companyRepository.save(company));
    }

    @Transactional
    public AdminCompanyDetailResponse createCompanyBranch(Long companyId, AdminUpdateCompanyBranchRequest request) {
        CongTy company = requireCompany(companyId);
        ChiNhanhCongTy branch = new ChiNhanhCongTy();
        branch.setCongTy(company);
        branch.setTen(requireText(request.getTen(), "Tên chi nhánh không được để trống"));
        branch.setDiaChiChiTiet(requireText(request.getDiaChiChiTiet(), "Địa chỉ chi nhánh không được để trống"));
        branch.setXaPhuong(resolveXaPhuong(request.getXaPhuongId()));
        branch.setLaTruSoChinh(Boolean.TRUE.equals(request.getLaTruSoChinh()));
        branch = companyBranchRepository.save(branch);

        if (Boolean.TRUE.equals(request.getLaTruSoChinh())) {
            setPrimaryBranch(company, branch);
        }

        return getCompanyDetail(companyId);
    }

    @Transactional
    public AdminCompanyDetailResponse updateCompanyBranch(Long companyId, Long branchId, AdminUpdateCompanyBranchRequest request) {
        CongTy company = requireCompany(companyId);
        ChiNhanhCongTy branch = requireCompanyBranch(company, branchId);

        branch.setTen(requireText(request.getTen(), "Tên chi nhánh không được để trống"));
        branch.setDiaChiChiTiet(requireText(request.getDiaChiChiTiet(), "Địa chỉ chi nhánh không được để trống"));
        branch.setXaPhuong(resolveXaPhuong(request.getXaPhuongId()));

        if (Boolean.TRUE.equals(request.getLaTruSoChinh())) {
            setPrimaryBranch(company, branch);
        } else {
            ensurePrimaryBranchStillExists(company, branch);
            branch.setLaTruSoChinh(false);
            companyBranchRepository.save(branch);
        }

        return getCompanyDetail(companyId);
    }

    @Transactional
    public void deleteCompany(Long companyId) {
        CongTy company = requireCompany(companyId);
        company.setNgayXoa(LocalDateTime.now());
        companyRepository.save(company);
    }

    @Transactional
    public AdminCompanyDetailResponse deleteCompanyBranch(Long companyId, Long branchId) {
        CongTy company = requireCompany(companyId);
        ChiNhanhCongTy branch = requireCompanyBranch(company, branchId);
        List<ChiNhanhCongTy> activeBranches = companyBranchRepository.findByCongTy_Id(company.getId()).stream()
                .filter(item -> item.getNgayXoa() == null)
                .toList();
        boolean wasPrimary = Boolean.TRUE.equals(branch.getLaTruSoChinh());

        if (activeBranches.size() <= 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể xoá chi nhánh cuối cùng của công ty");
        }
        if (tinTuyenDungRepository.existsByChiNhanhs_IdAndNgayXoaIsNull(branch.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chi nhánh đang có tin tuyển dụng, không thể xoá");
        }
        if (!employerProfileRepository.findByChiNhanh_IdAndNgayXoaIsNullAndNguoiDung_DangHoatDongTrue(branch.getId()).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chi nhánh đang có thành viên hoạt động, không thể xoá");
        }

        branch.setNgayXoa(LocalDateTime.now());
        branch.setLaTruSoChinh(false);
        companyBranchRepository.save(branch);

        if (wasPrimary) {
            promoteNextPrimaryBranch(activeBranches, branch.getId());
        }

        return getCompanyDetail(companyId);
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
                .id(ServiceUtils.toLong(company.getId()))
                .ten(company.getTen())
                .maSoThue(company.getMaSoThue())
                .website(company.getWebsite())
                .trangThai(company.getNgayXoa() == null ? company.getTrangThai() : "DELETED")
                .lyDoTuChoi(company.getLyDoTuChoi())
                .chuCongTyHoTen(company.getChuCongTy() == null ? null : ServiceUtils.buildFullName(company.getChuCongTy().getHo(), company.getChuCongTy().getTen()))
                .chuCongTyEmail(company.getChuCongTy() == null ? null : company.getChuCongTy().getEmail())
                .soChiNhanh(company.getId() == null ? 0 : companyBranchRepository.findByCongTy_Id(company.getId()).size())
                .minhChungUrl(latestDocument == null ? null : latestDocument.getDuongDanTep())
                .minhChungTrangThai(latestDocument == null ? null : latestDocument.getTrangThai())
                .minhChungLyDoTuChoi(latestDocument == null ? null : latestDocument.getLyDoTuChoi())
                .ngayTao(company.getNgayTao())
                .ngayCapNhat(company.getNgayCapNhat())
                .build();
    }

    private boolean matchesStatus(CongTy company, String normalizedStatus) {
        if (!StringUtils.hasText(normalizedStatus)) {
            return company.getNgayXoa() == null;
        }
        if ("DELETED".equalsIgnoreCase(normalizedStatus)) {
            return company.getNgayXoa() != null;
        }
        return company.getNgayXoa() == null && normalizedStatus.equalsIgnoreCase(company.getTrangThai());
    }

    private boolean matchesKeyword(CongTy company, String normalizedKeyword) {
        if (!StringUtils.hasText(normalizedKeyword)) {
            return true;
        }
        return containsIgnoreCase(company.getTen(), normalizedKeyword);
    }

    private boolean containsIgnoreCase(String value, String keyword) {
        if (!StringUtils.hasText(value) || !StringUtils.hasText(keyword)) {
            return false;
        }
        return value.trim().toLowerCase().contains(keyword.toLowerCase());
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

    private XaPhuong resolveXaPhuong(Long xaPhuongId) {
        return xaPhuongRepository.findById(ServiceUtils.toIntId(xaPhuongId, "xaPhuongId"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy xã/phường"));
    }

    private CongTy requireCompany(Long companyId) {
        return companyRepository.findById(ServiceUtils.toIntId(companyId, "companyId"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy công ty"));
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

    private ChiNhanhCongTy requireCompanyBranch(CongTy company, Long branchId) {
        return companyBranchRepository.findByIdAndCongTy_Id(
                        ServiceUtils.toIntId(branchId, "branchId"),
                        company.getId()
                )
                .filter(branch -> branch.getNgayXoa() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy chi nhánh của công ty"));
    }

    private void setPrimaryBranch(CongTy company, ChiNhanhCongTy targetBranch) {
        List<ChiNhanhCongTy> branches = companyBranchRepository.findByCongTy_Id(company.getId()).stream()
                .filter(branch -> branch.getNgayXoa() == null)
                .toList();
        for (ChiNhanhCongTy item : branches) {
            item.setLaTruSoChinh(item.getId().equals(targetBranch.getId()));
        }
        companyBranchRepository.saveAll(branches);
    }

    private void ensurePrimaryBranchStillExists(CongTy company, ChiNhanhCongTy targetBranch) {
        if (!Boolean.TRUE.equals(targetBranch.getLaTruSoChinh())) {
            return;
        }
        boolean hasOtherActiveBranch = companyBranchRepository.findByCongTy_Id(company.getId()).stream()
                .filter(branch -> branch.getNgayXoa() == null)
                .anyMatch(branch -> !branch.getId().equals(targetBranch.getId()));
        if (!hasOtherActiveBranch) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Công ty phải có một trụ sở chính đang hoạt động");
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hãy chọn chi nhánh khác làm trụ sở chính trước khi bỏ cờ này");
    }

    private void promoteNextPrimaryBranch(List<ChiNhanhCongTy> branches, Integer removedBranchId) {
        branches.stream()
                .filter(branch -> branch.getNgayXoa() == null)
                .filter(branch -> removedBranchId == null || !branch.getId().equals(removedBranchId))
                .filter(branch -> !Boolean.TRUE.equals(branch.getLaTruSoChinh()))
                .min(Comparator.comparing(ChiNhanhCongTy::getNgayTao, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(ChiNhanhCongTy::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .ifPresent(nextPrimary -> {
                    nextPrimary.setLaTruSoChinh(true);
                    companyBranchRepository.save(nextPrimary);
                });
    }

    private String requireText(String value, String message) {
        if (!StringUtils.hasText(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value.trim();
    }
}
