package com.phuocloc.projectfinal.recruit.candidate.service;

import com.phuocloc.projectfinal.recruit.candidate.dto.request.UpdateKyNangUngVienRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.CreateCandidateProfileRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.UpdateCandidateSummaryRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.UpsertChungChiRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.UpsertHocVanRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.response.CandidateProfileListItemResponse;
import com.phuocloc.projectfinal.recruit.candidate.dto.response.CandidateProfileMetadataResponse;
import com.phuocloc.projectfinal.recruit.candidate.dto.response.CandidateProfileResponse;
import com.phuocloc.projectfinal.recruit.candidate.repository.CandidateProfileRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.ChungChiUngVienRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.HocVanUngVienRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.KyNangRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.KyNangUngVienRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.LoaiChungChiRepository;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.KyNang;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.ChungChiUngVien;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoUngVien;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HocVanUngVien;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.KyNangUngVien;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.LoaiChungChi;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
/**
 * Nghiệp vụ hồ sơ ứng viên.
 *
 * <p>Service này triển khai toàn bộ CRUD cho hồ sơ ứng viên và các thành phần con
 * (học vấn, chứng chỉ, kỹ năng), đồng thời đảm bảo ownership thông qua
 * {@link CandidateProfileAccessService}.</p>
 */
public class CandidateProfileService {

    private static final String PROOF_STATUS_UNVERIFIED = "UNVERIFIED";
    private static final String PROOF_STATUS_PENDING = "PENDING";

    private final CandidateProfileAccessService accessService;
    private final CandidateProfileMapper candidateProfileMapper;
    private final CandidateProfileRepository candidateProfileRepository;
    private final HocVanUngVienRepository hocVanUngVienRepository;
    private final ChungChiUngVienRepository chungChiUngVienRepository;
    private final KyNangUngVienRepository kyNangUngVienRepository;
    private final KyNangRepository kyNangRepository;
    private final LoaiChungChiRepository loaiChungChiRepository;

    @Transactional(readOnly = true)
    public CandidateProfileResponse getProfile(Long userId) {
        HoSoUngVien profile = accessService.requireProfile(userId);
        return mapProfile(profile);
    }

    @Transactional(readOnly = true)
    public List<CandidateProfileListItemResponse> listProfiles(Long userId) {
        // Danh sách hồ sơ để frontend hiển thị selector profile.
        return accessService.listProfiles(userId).stream()
                .map(profile -> CandidateProfileListItemResponse.builder()
                        .id(profile.getId() == null ? null : profile.getId().longValue())
                        .title(buildProfileTitle(profile))
                        .mucTieuNgheNghiep(profile.getMucTieuNgheNghiep())
                        .gioiThieuBanThan(profile.getGioiThieuBanThan())
                        .ngayCapNhat(profile.getNgayCapNhat())
                        .build())
                .toList();
    }

    @Transactional
    public CandidateProfileListItemResponse createProfile(Long userId, CreateCandidateProfileRequest request) {
        HoSoUngVien baseProfile = accessService.requireProfile(userId);
        HoSoUngVien profile = new HoSoUngVien();
        profile.setNguoiDung(baseProfile.getNguoiDung());
        profile.setGioiThieuBanThan(accessService.trimToNull(request == null ? null : request.getGioiThieuBanThan()));
        profile.setMucTieuNgheNghiep(accessService.trimToNull(request == null ? null : request.getMucTieuNgheNghiep()));
        profile = candidateProfileRepository.save(profile);

        return CandidateProfileListItemResponse.builder()
                .id(profile.getId() == null ? null : profile.getId().longValue())
                .title(buildProfileTitle(profile))
                .mucTieuNgheNghiep(profile.getMucTieuNgheNghiep())
                .gioiThieuBanThan(profile.getGioiThieuBanThan())
                .ngayCapNhat(profile.getNgayCapNhat())
                .build();
    }

    @Transactional(readOnly = true)
    public CandidateProfileResponse getProfileById(Long userId, Long profileId) {
        HoSoUngVien profile = accessService.requireProfileById(userId, profileId);
        return mapProfile(profile);
    }

    @Transactional(readOnly = true)
    public CandidateProfileMetadataResponse getMetadata() {
        return CandidateProfileMetadataResponse.builder()
                .kyNangs(kyNangRepository.findAllByOrderByTenAsc().stream().map(candidateProfileMapper::mapSkillOption).toList())
                .loaiChungChis(loaiChungChiRepository.findAllByOrderByTenAsc().stream().map(candidateProfileMapper::mapLoaiChungChiOption).toList())
                .build();
    }

    @Transactional
    public CandidateProfileResponse.HocVanItem createHocVan(Long userId, UpsertHocVanRequest request) {
        HoSoUngVien profile = accessService.requireProfile(userId);
        HocVanUngVien entity = new HocVanUngVien();
        applyHocVan(entity, profile, request);
        return candidateProfileMapper.mapHocVan(hocVanUngVienRepository.save(entity));
    }

    @Transactional
    public CandidateProfileResponse.HocVanItem createHocVan(Long userId, Long profileId, UpsertHocVanRequest request) {
        HoSoUngVien profile = accessService.requireProfileById(userId, profileId);
        HocVanUngVien entity = new HocVanUngVien();
        applyHocVan(entity, profile, request);
        return candidateProfileMapper.mapHocVan(hocVanUngVienRepository.save(entity));
    }

    @Transactional
    public CandidateProfileResponse.HocVanItem updateHocVan(Long userId, Long hocVanId, UpsertHocVanRequest request) {
        HoSoUngVien profile = accessService.requireProfile(userId);
        HocVanUngVien entity = hocVanUngVienRepository.findById(accessService.toInt(hocVanId, "hocVanId"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy học vấn"));
        accessService.ensureOwner(profile, entity.getHoSoUngVien());
        applyHocVan(entity, profile, request);
        return candidateProfileMapper.mapHocVan(hocVanUngVienRepository.save(entity));
    }

    @Transactional
    public CandidateProfileResponse.HocVanItem updateHocVan(Long userId, Long profileId, Long hocVanId, UpsertHocVanRequest request) {
        HoSoUngVien profile = accessService.requireProfileById(userId, profileId);
        HocVanUngVien entity = hocVanUngVienRepository.findById(accessService.toInt(hocVanId, "hocVanId"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy học vấn"));
        accessService.ensureOwner(profile, entity.getHoSoUngVien());
        applyHocVan(entity, profile, request);
        return candidateProfileMapper.mapHocVan(hocVanUngVienRepository.save(entity));
    }

    @Transactional
    public void deleteHocVan(Long userId, Long hocVanId) {
        HoSoUngVien profile = accessService.requireProfile(userId);
        HocVanUngVien entity = hocVanUngVienRepository.findById(accessService.toInt(hocVanId, "hocVanId"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy học vấn"));
        accessService.ensureOwner(profile, entity.getHoSoUngVien());
        hocVanUngVienRepository.delete(entity);
    }

    @Transactional
    public void deleteHocVan(Long userId, Long profileId, Long hocVanId) {
        HoSoUngVien profile = accessService.requireProfileById(userId, profileId);
        HocVanUngVien entity = hocVanUngVienRepository.findById(accessService.toInt(hocVanId, "hocVanId"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy học vấn"));
        accessService.ensureOwner(profile, entity.getHoSoUngVien());
        hocVanUngVienRepository.delete(entity);
    }

    @Transactional
    public CandidateProfileResponse.ChungChiItem createChungChi(Long userId, UpsertChungChiRequest request) {
        HoSoUngVien profile = accessService.requireProfile(userId);
        ChungChiUngVien entity = new ChungChiUngVien();
        applyChungChi(entity, profile, request);
        return candidateProfileMapper.mapChungChi(chungChiUngVienRepository.save(entity));
    }

    @Transactional
    public CandidateProfileResponse.ChungChiItem createChungChi(Long userId, Long profileId, UpsertChungChiRequest request) {
        HoSoUngVien profile = accessService.requireProfileById(userId, profileId);
        ChungChiUngVien entity = new ChungChiUngVien();
        applyChungChi(entity, profile, request);
        return candidateProfileMapper.mapChungChi(chungChiUngVienRepository.save(entity));
    }

    @Transactional
    public CandidateProfileResponse.ChungChiItem updateChungChi(Long userId, Long chungChiId, UpsertChungChiRequest request) {
        HoSoUngVien profile = accessService.requireProfile(userId);
        ChungChiUngVien entity = chungChiUngVienRepository.findById(accessService.toInt(chungChiId, "chungChiId"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy chứng chỉ"));
        accessService.ensureOwner(profile, entity.getHoSoUngVien());
        applyChungChi(entity, profile, request);
        return candidateProfileMapper.mapChungChi(chungChiUngVienRepository.save(entity));
    }

    @Transactional
    public CandidateProfileResponse.ChungChiItem updateChungChi(Long userId, Long profileId, Long chungChiId, UpsertChungChiRequest request) {
        HoSoUngVien profile = accessService.requireProfileById(userId, profileId);
        ChungChiUngVien entity = chungChiUngVienRepository.findById(accessService.toInt(chungChiId, "chungChiId"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy chứng chỉ"));
        accessService.ensureOwner(profile, entity.getHoSoUngVien());
        applyChungChi(entity, profile, request);
        return candidateProfileMapper.mapChungChi(chungChiUngVienRepository.save(entity));
    }

    @Transactional
    public void deleteChungChi(Long userId, Long chungChiId) {
        HoSoUngVien profile = accessService.requireProfile(userId);
        ChungChiUngVien entity = chungChiUngVienRepository.findById(accessService.toInt(chungChiId, "chungChiId"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy chứng chỉ"));
        accessService.ensureOwner(profile, entity.getHoSoUngVien());
        chungChiUngVienRepository.delete(entity);
    }

    @Transactional
    public void deleteChungChi(Long userId, Long profileId, Long chungChiId) {
        HoSoUngVien profile = accessService.requireProfileById(userId, profileId);
        ChungChiUngVien entity = chungChiUngVienRepository.findById(accessService.toInt(chungChiId, "chungChiId"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy chứng chỉ"));
        accessService.ensureOwner(profile, entity.getHoSoUngVien());
        chungChiUngVienRepository.delete(entity);
    }

    @Transactional
    public List<CandidateProfileResponse.KyNangItem> updateSkills(Long userId, UpdateKyNangUngVienRequest request) {
        HoSoUngVien profile = accessService.requireProfile(userId);
        List<Integer> incoming = request.getKyNangIds() == null ? List.of() : request.getKyNangIds();
        Set<Integer> dedup = new LinkedHashSet<>();
        incoming.stream().filter(Objects::nonNull).forEach(dedup::add);

        List<KyNang> skills = dedup.isEmpty() ? List.of() : kyNangRepository.findAllById(dedup);
        if (skills.size() != dedup.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Một hoặc nhiều kỹ năng không hợp lệ");
        }

        // Replace-all strategy để đồng bộ tuyệt đối state kỹ năng theo payload.
        kyNangUngVienRepository.deleteByHoSoUngVien_Id(profile.getId());
        List<KyNangUngVien> newLinks = new ArrayList<>();
        for (KyNang skill : skills) {
            KyNangUngVien link = new KyNangUngVien();
            link.setHoSoUngVien(profile);
            link.setKyNang(skill);
            newLinks.add(link);
        }
        kyNangUngVienRepository.saveAll(newLinks);
        return newLinks.stream().map(link -> candidateProfileMapper.mapKyNang(link.getKyNang())).toList();
    }

    @Transactional
    public List<CandidateProfileResponse.KyNangItem> updateSkills(Long userId, Long profileId, UpdateKyNangUngVienRequest request) {
        HoSoUngVien profile = accessService.requireProfileById(userId, profileId);
        return updateSkillsByProfile(profile, request);
    }

    @Transactional
    public CandidateProfileResponse updateSummary(Long userId, UpdateCandidateSummaryRequest request) {
        HoSoUngVien profile = accessService.requireProfile(userId);
        profile.setGioiThieuBanThan(accessService.trimToNull(request == null ? null : request.getGioiThieuBanThan()));
        profile.setMucTieuNgheNghiep(accessService.trimToNull(request == null ? null : request.getMucTieuNgheNghiep()));
        return mapProfile(profile);
    }

    @Transactional
    public CandidateProfileResponse updateSummary(Long userId, Long profileId, UpdateCandidateSummaryRequest request) {
        HoSoUngVien profile = accessService.requireProfileById(userId, profileId);
        profile.setGioiThieuBanThan(accessService.trimToNull(request == null ? null : request.getGioiThieuBanThan()));
        profile.setMucTieuNgheNghiep(accessService.trimToNull(request == null ? null : request.getMucTieuNgheNghiep()));
        return mapProfile(profile);
    }

    private List<CandidateProfileResponse.KyNangItem> updateSkillsByProfile(HoSoUngVien profile, UpdateKyNangUngVienRequest request) {
        List<Integer> incoming = request.getKyNangIds() == null ? List.of() : request.getKyNangIds();
        Set<Integer> dedup = new LinkedHashSet<>();
        incoming.stream().filter(Objects::nonNull).forEach(dedup::add);

        List<KyNang> skills = dedup.isEmpty() ? List.of() : kyNangRepository.findAllById(dedup);
        if (skills.size() != dedup.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Một hoặc nhiều kỹ năng không hợp lệ");
        }

        // Replace-all strategy tương tự updateSkills(userId, request).
        kyNangUngVienRepository.deleteByHoSoUngVien_Id(profile.getId());
        List<KyNangUngVien> newLinks = new ArrayList<>();
        for (KyNang skill : skills) {
            KyNangUngVien link = new KyNangUngVien();
            link.setHoSoUngVien(profile);
            link.setKyNang(skill);
            newLinks.add(link);
        }
        kyNangUngVienRepository.saveAll(newLinks);
        return newLinks.stream().map(link -> candidateProfileMapper.mapKyNang(link.getKyNang())).toList();
    }

    private String buildProfileTitle(HoSoUngVien profile) {
        if (profile == null || profile.getId() == null) return "Hồ sơ";
        return "Hồ sơ #" + profile.getId();
    }

    private void applyHocVan(HocVanUngVien entity, HoSoUngVien profile, UpsertHocVanRequest request) {
        if (request == null || !org.springframework.util.StringUtils.hasText(request.getTenTruong())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "tenTruong không hợp lệ");
        }
        entity.setHoSoUngVien(profile);
        entity.setTenTruong(request.getTenTruong().trim());
        entity.setChuyenNganh(accessService.trimToNull(request.getChuyenNganh()));
        entity.setBacHoc(accessService.trimToNull(request.getBacHoc()));
        entity.setThoiGianBatDau(request.getThoiGianBatDau());
        entity.setThoiGianKetThuc(request.getThoiGianKetThuc());
        entity.setDuongDanTep(accessService.trimToNull(request.getDuongDanTep()));
        entity.setTrangThai(resolveProofStatus(entity.getDuongDanTep()));
    }

    private void applyChungChi(ChungChiUngVien entity, HoSoUngVien profile, UpsertChungChiRequest request) {
        if (request == null || request.getLoaiChungChiId() == null || !org.springframework.util.StringUtils.hasText(request.getTenChungChi())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dữ liệu chứng chỉ không hợp lệ");
        }
        LoaiChungChi loai = loaiChungChiRepository.findById(request.getLoaiChungChiId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy loại chứng chỉ"));
        entity.setHoSoUngVien(profile);
        entity.setLoaiChungChi(loai);
        entity.setTenChungChi(request.getTenChungChi().trim());
        entity.setNgayBatDau(request.getNgayBatDau());
        entity.setNgayHetHan(request.getNgayHetHan());
        entity.setDuongDanTep(accessService.trimToNull(request.getDuongDanTep()));
        entity.setTrangThai(resolveProofStatus(entity.getDuongDanTep()));
    }

    private String resolveProofStatus(String proofUrl) {
        return org.springframework.util.StringUtils.hasText(proofUrl)
                ? PROOF_STATUS_PENDING
                : PROOF_STATUS_UNVERIFIED;
    }

    private CandidateProfileResponse mapProfile(HoSoUngVien profile) {
        List<CandidateProfileResponse.HocVanItem> hocVans = hocVanUngVienRepository.findByHoSoUngVien_IdOrderByThoiGianBatDauDesc(profile.getId())
                .stream().map(candidateProfileMapper::mapHocVan).toList();
        List<CandidateProfileResponse.ChungChiItem> chungChis = chungChiUngVienRepository.findByHoSoUngVien_IdOrderByNgayBatDauDesc(profile.getId())
                .stream().map(candidateProfileMapper::mapChungChi).toList();
        List<CandidateProfileResponse.KyNangItem> kyNangs = kyNangUngVienRepository.findByHoSoUngVien_Id(profile.getId())
                .stream().map(link -> candidateProfileMapper.mapKyNang(link.getKyNang())).toList();

        return CandidateProfileResponse.builder()
                .hoSoUngVienId(profile.getId() == null ? null : profile.getId().longValue())
                .gioiThieuBanThan(profile.getGioiThieuBanThan())
                .mucTieuNgheNghiep(profile.getMucTieuNgheNghiep())
                .hocVans(hocVans)
                .chungChis(chungChis)
                .kyNangs(kyNangs)
                .build();
    }

    
}
