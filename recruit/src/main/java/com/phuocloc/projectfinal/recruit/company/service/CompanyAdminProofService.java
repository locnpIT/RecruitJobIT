package com.phuocloc.projectfinal.recruit.company.service;

import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.company.dto.request.CompanyProofUploadBatchRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.UpdateCompanyProofRequest;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyAdminProofResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyProofTypeResponse;
import com.phuocloc.projectfinal.recruit.company.enums.CompanyProofDocumentStatus;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyProofDocumentRepository;
import com.phuocloc.projectfinal.recruit.company.repository.LoaiTaiLieuRepository;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.CongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.LoaiTaiLieu;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.TepMinhChungCongTy;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import com.phuocloc.projectfinal.recruit.common.util.ServiceUtils;

@Service
@RequiredArgsConstructor
public class CompanyAdminProofService {

    private final CompanyAdminProfileService profileService;
    private final CompanyProofDocumentRepository companyProofDocumentRepository;
    private final LoaiTaiLieuRepository loaiTaiLieuRepository;

    public CompanyAdminProofResponse uploadProofDocument(AppUserPrinciple principal, UpdateCompanyProofRequest request) {
        CongTy congTy = profileService.resolveManagedCompany(principal.getUserId().intValue());
        if (request == null || !StringUtils.hasText(request.getDuongDanTep())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "duongDanTep không hợp lệ");
        }

        LoaiTaiLieu loaiTaiLieu = resolveDefaultLoaiTaiLieu();
        return saveProofDocument(congTy, loaiTaiLieu, request.getDuongDanTep(), request.getTenTep());
    }

    public List<CompanyProofTypeResponse> listProofTypes() {
        return loaiTaiLieuRepository.findAllByOrderByIdAsc().stream()
                .map(this::mapProofType)
                .toList();
    }

    public List<CompanyAdminProofResponse> uploadProofDocuments(AppUserPrinciple principal, CompanyProofUploadBatchRequest request) {
        CongTy congTy = profileService.resolveManagedCompany(principal.getUserId().intValue());
        if (request == null || request.getMinhChungs() == null || request.getMinhChungs().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Danh sách minh chứng không hợp lệ");
        }

        return request.getMinhChungs().stream()
                .map(item -> saveProofDocument(
                        congTy,
                        resolveLoaiTaiLieuById(item.getLoaiTaiLieuId()),
                        item.getDuongDanTep(),
                        item.getTenTep()
                ))
                .toList();
    }

    private LoaiTaiLieu resolveDefaultLoaiTaiLieu() {
        return loaiTaiLieuRepository.findAllByOrderByIdAsc().stream()
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chưa có loại tài liệu nào trong hệ thống"));
    }

    private LoaiTaiLieu resolveLoaiTaiLieuById(Integer loaiTaiLieuId) {
        if (loaiTaiLieuId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "loaiTaiLieuId không hợp lệ");
        }
        return loaiTaiLieuRepository.findById(loaiTaiLieuId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy loại tài liệu"));
    }

    private CompanyAdminProofResponse saveProofDocument(CongTy congTy, LoaiTaiLieu loaiTaiLieu, String duongDanTep, String tenTep) {
        if (congTy == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Công ty không hợp lệ");
        }
        if (!StringUtils.hasText(duongDanTep)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "duongDanTep không hợp lệ");
        }

        String fileName = StringUtils.hasText(tenTep) ? tenTep.trim() : resolveFileNameFromUrl(duongDanTep);

        TepMinhChungCongTy proofDocument = new TepMinhChungCongTy();
        proofDocument.setCongTy(congTy);
        proofDocument.setLoaiTaiLieu(loaiTaiLieu);
        proofDocument.setDuongDanTep(duongDanTep.trim());
        proofDocument.setTenTep(fileName);
        proofDocument.setTrangThai(CompanyProofDocumentStatus.PENDING.name());
        proofDocument.setLyDoTuChoi(null);
        proofDocument.setNgayXoa(null);
        return mapProofDocument(companyProofDocumentRepository.save(proofDocument));
    }

    private CompanyAdminProofResponse mapProofDocument(TepMinhChungCongTy proofDocument) {
        return CompanyAdminProofResponse.builder()
                .id(ServiceUtils.toLong(proofDocument.getId()))
                .tenTep(proofDocument.getTenTep())
                .duongDanTep(proofDocument.getDuongDanTep())
                .loaiTaiLieu(proofDocument.getLoaiTaiLieu() == null ? null : proofDocument.getLoaiTaiLieu().getTen())
                .trangThai(proofDocument.getTrangThai())
                .lyDoTuChoi(proofDocument.getLyDoTuChoi())
                .ngayTao(proofDocument.getNgayTao())
                .build();
    }

    private CompanyProofTypeResponse mapProofType(LoaiTaiLieu loaiTaiLieu) {
        return CompanyProofTypeResponse.builder()
                .id(ServiceUtils.toLong(loaiTaiLieu.getId()))
                .ten(loaiTaiLieu.getTen())
                .moTa(loaiTaiLieu.getMoTa())
                .build();
    }

    private String resolveFileNameFromUrl(String url) {
        try {
            String path = URI.create(url).getPath();
            if (!StringUtils.hasText(path)) {
                return "company-proof";
            }
            String fileName = path.substring(path.lastIndexOf('/') + 1);
            return StringUtils.hasText(fileName) ? fileName : "company-proof";
        } catch (Exception ex) {
            return "company-proof";
        }
    }
}
