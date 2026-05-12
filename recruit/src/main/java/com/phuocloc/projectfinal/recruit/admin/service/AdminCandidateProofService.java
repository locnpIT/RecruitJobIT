package com.phuocloc.projectfinal.recruit.admin.service;

import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminCandidateProofResponse;
import com.phuocloc.projectfinal.recruit.candidate.repository.ChungChiUngVienRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.HocVanUngVienRepository;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.ChungChiUngVien;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoUngVien;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HocVanUngVien;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AdminCandidateProofService {

    private static final String TYPE_EDUCATION = "EDUCATION";
    private static final String TYPE_CERTIFICATE = "CERTIFICATE";
    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_APPROVED = "APPROVED";
    private static final String STATUS_REJECTED = "REJECTED";

    private final HocVanUngVienRepository hocVanUngVienRepository;
    private final ChungChiUngVienRepository chungChiUngVienRepository;

    public List<AdminCandidateProofResponse> listProofs(String status) {
        String normalizedStatus = StringUtils.hasText(status) ? status.trim().toUpperCase(Locale.ROOT) : STATUS_PENDING;
        List<AdminCandidateProofResponse> result = new ArrayList<>();

        hocVanUngVienRepository.findByTrangThaiOrderByIdDesc(normalizedStatus)
                .stream()
                .filter(item -> StringUtils.hasText(item.getDuongDanTep()))
                .map(this::mapEducation)
                .forEach(result::add);

        chungChiUngVienRepository.findByTrangThaiOrderByIdDesc(normalizedStatus)
                .stream()
                .filter(item -> StringUtils.hasText(item.getDuongDanTep()))
                .map(this::mapCertificate)
                .forEach(result::add);

        result.sort(Comparator.comparing(AdminCandidateProofResponse::getId, Comparator.nullsLast(Long::compareTo)).reversed());
        return result;
    }

    public AdminCandidateProofResponse approve(String type, Long proofId) {
        return updateStatus(type, proofId, STATUS_APPROVED);
    }

    public AdminCandidateProofResponse reject(String type, Long proofId) {
        return updateStatus(type, proofId, STATUS_REJECTED);
    }

    private AdminCandidateProofResponse updateStatus(String type, Long proofId, String status) {
        String normalizedType = normalizeType(type);
        Integer id = toInt(proofId);

        if (TYPE_EDUCATION.equals(normalizedType)) {
            HocVanUngVien entity = hocVanUngVienRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy học vấn"));
            if (!StringUtils.hasText(entity.getDuongDanTep())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Học vấn chưa có minh chứng để duyệt");
            }
            entity.setTrangThai(status);
            return mapEducation(hocVanUngVienRepository.save(entity));
        }

        ChungChiUngVien entity = chungChiUngVienRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy chứng chỉ"));
        if (!StringUtils.hasText(entity.getDuongDanTep())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chứng chỉ chưa có minh chứng để duyệt");
        }
        entity.setTrangThai(status);
        return mapCertificate(chungChiUngVienRepository.save(entity));
    }

    private AdminCandidateProofResponse mapEducation(HocVanUngVien entity) {
        HoSoUngVien profile = entity.getHoSoUngVien();
        NguoiDung user = profile == null ? null : profile.getNguoiDung();
        return AdminCandidateProofResponse.builder()
                .id(entity.getId() == null ? null : entity.getId().longValue())
                .hoSoUngVienId(profile == null || profile.getId() == null ? null : profile.getId().longValue())
                .loai(TYPE_EDUCATION)
                .tieuDe(entity.getTenTruong())
                .moTa(joinParts(entity.getBacHoc(), entity.getChuyenNganh()))
                .ungVienHoTen(fullName(user))
                .ungVienEmail(user == null ? null : user.getEmail())
                .duongDanTep(entity.getDuongDanTep())
                .trangThai(entity.getTrangThai())
                .build();
    }

    private AdminCandidateProofResponse mapCertificate(ChungChiUngVien entity) {
        HoSoUngVien profile = entity.getHoSoUngVien();
        NguoiDung user = profile == null ? null : profile.getNguoiDung();
        return AdminCandidateProofResponse.builder()
                .id(entity.getId() == null ? null : entity.getId().longValue())
                .hoSoUngVienId(profile == null || profile.getId() == null ? null : profile.getId().longValue())
                .loai(TYPE_CERTIFICATE)
                .tieuDe(entity.getTenChungChi())
                .moTa(entity.getLoaiChungChi() == null ? null : entity.getLoaiChungChi().getTen())
                .ungVienHoTen(fullName(user))
                .ungVienEmail(user == null ? null : user.getEmail())
                .duongDanTep(entity.getDuongDanTep())
                .trangThai(entity.getTrangThai())
                .build();
    }

    private String normalizeType(String type) {
        if (!StringUtils.hasText(type)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu loại minh chứng");
        }
        String normalized = type.trim().toUpperCase(Locale.ROOT);
        if ("EDUCATION".equals(normalized) || "HOC_VAN".equals(normalized)) {
            return TYPE_EDUCATION;
        }
        if ("CERTIFICATE".equals(normalized) || "CHUNG_CHI".equals(normalized)) {
            return TYPE_CERTIFICATE;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loại minh chứng không hợp lệ");
    }

    private String joinParts(String first, String second) {
        List<String> parts = new ArrayList<>();
        if (StringUtils.hasText(first)) {
            parts.add(first.trim());
        }
        if (StringUtils.hasText(second)) {
            parts.add(second.trim());
        }
        return parts.isEmpty() ? null : String.join(" - ", parts);
    }

    private Integer toInt(Long id) {
        if (id == null || id <= 0 || id > Integer.MAX_VALUE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID minh chứng không hợp lệ");
        }
        return id.intValue();
    }

    private String fullName(NguoiDung user) {
        if (user == null) {
            return null;
        }
        String joined = String.join(" ",
                user.getHo() == null ? "" : user.getHo().trim(),
                user.getTen() == null ? "" : user.getTen().trim()).trim();
        return StringUtils.hasText(joined) ? joined : user.getEmail();
    }
}
