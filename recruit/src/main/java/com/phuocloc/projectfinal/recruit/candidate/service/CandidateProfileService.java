package com.phuocloc.projectfinal.recruit.candidate.service;

import com.phuocloc.projectfinal.recruit.ai.service.CandidateProfileEmbeddingIndexService;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.CreateCandidateProfileRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.ToggleProfileItemSelectionRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.UpdateCandidateSummaryRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.UpdateKyNangUngVienRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.UpdateNganhNgheUngVienRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.UpsertChungChiRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.UpsertHocVanRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.UpsertKinhNghiemLamViecRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.response.CandidateProfileListItemResponse;
import com.phuocloc.projectfinal.recruit.candidate.dto.response.CandidateProfileMetadataResponse;
import com.phuocloc.projectfinal.recruit.candidate.dto.response.CandidateProfileResponse;
import com.phuocloc.projectfinal.recruit.candidate.dto.response.ProfileItemSelectionResponse;
import com.phuocloc.projectfinal.recruit.auth.repository.UsersRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.CandidateProfileRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.ChungChiUngVienRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.HoSoChungChiRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.HoSoHocVanRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.HoSoKinhNghiemRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.HocVanUngVienRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.KinhNghiemLamViecUngVienRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.KyNangRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.KyNangUngVienRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.LoaiChungChiRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.NganhNgheUngVienRepository;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.KyNang;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.NganhNghe;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.repository.NganhNgheRepository;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.ChungChiUngVien;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoChungChi;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoHocVan;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoKinhNghiem;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoUngVien;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HocVanUngVien;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.KinhNghiemLamViecUngVien;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.KyNangUngVien;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.LoaiChungChi;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.NganhNgheUngVien;
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
public class CandidateProfileService {

    private static final String PROOF_STATUS_UNVERIFIED = "UNVERIFIED";
    private static final String PROOF_STATUS_PENDING = "PENDING";

    private final CandidateProfileAccessService accessService;
    private final CandidateProfileMapper candidateProfileMapper;
    private final UsersRepository usersRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final HocVanUngVienRepository hocVanUngVienRepository;
    private final KinhNghiemLamViecUngVienRepository kinhNghiemLamViecUngVienRepository;
    private final ChungChiUngVienRepository chungChiUngVienRepository;
    private final KyNangUngVienRepository kyNangUngVienRepository;
    private final KyNangRepository kyNangRepository;
    private final NganhNgheUngVienRepository nganhNgheUngVienRepository;
    private final NganhNgheRepository nganhNgheRepository;
    private final LoaiChungChiRepository loaiChungChiRepository;
    private final HoSoHocVanRepository hoSoHocVanRepository;
    private final HoSoKinhNghiemRepository hoSoKinhNghiemRepository;
    private final HoSoChungChiRepository hoSoChungChiRepository;
    private final CandidateProfileEmbeddingIndexService chiMucNhungHoSoUngVienService;

    @Transactional(readOnly = true)
    public CandidateProfileResponse getProfile(Long userId) {
        HoSoUngVien profile = accessService.requireProfile(userId);
        return mapProfile(profile);
    }

    @Transactional(readOnly = true)
    public List<CandidateProfileListItemResponse> listProfiles(Long userId) {
        return accessService.listProfiles(userId).stream()
                .map(profile -> CandidateProfileListItemResponse.builder()
                        .id(profile.getId() == null ? null : profile.getId().longValue())
                        .tenHoSo(profile.getTenHoSo())
                        .tieuDe(buildProfileTitle(profile))
                        .mucTieuNgheNghiep(profile.getMucTieuNgheNghiep())
                        .gioiThieuBanThan(profile.getGioiThieuBanThan())
                        .ngayCapNhat(profile.getNgayCapNhat())
                        .build())
                .toList();
    }

    @Transactional
    public CandidateProfileListItemResponse createProfile(Long userId, CreateCandidateProfileRequest request) {
        Integer nguoiDungId = accessService.toInt(userId, "userId");
        NguoiDung nguoiDung = usersRepository.findById(nguoiDungId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
        HoSoUngVien baseProfile = candidateProfileRepository
                .findFirstByNguoiDung_IdOrderByNgayCapNhatDesc(nguoiDungId)
                .orElse(null);

        HoSoUngVien profile = new HoSoUngVien();
        profile.setNguoiDung(nguoiDung);
        profile.setTenHoSo(accessService.trimToNull(request == null ? null : request.getTenHoSo()));
        profile.setGioiThieuBanThan(accessService.trimToNull(request == null ? null : request.getGioiThieuBanThan()));
        profile.setMucTieuNgheNghiep(accessService.trimToNull(request == null ? null : request.getMucTieuNgheNghiep()));
        profile = candidateProfileRepository.save(profile);

        if (profile.getTenHoSo() == null) {
            profile.setTenHoSo("Hồ sơ #" + profile.getId());
            profile = candidateProfileRepository.save(profile);
        }

        Integer sourceProfileId = baseProfile == null ? null : baseProfile.getId();
        ganMacDinhTatCaNoiDungHienCo(profile, nguoiDungId, sourceProfileId);

        return CandidateProfileListItemResponse.builder()
                .id(profile.getId() == null ? null : profile.getId().longValue())
                .tenHoSo(profile.getTenHoSo())
                .tieuDe(buildProfileTitle(profile))
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

    @Transactional
    public CandidateProfileResponse syncProfileIndex(Long userId, Long profileId) {
        HoSoUngVien profile = profileId == null
                ? accessService.requireProfile(userId)
                : accessService.requireProfileById(userId, profileId);
        dongBoChiMucHoSo(profile);
        return mapProfile(profile);
    }

    @Transactional(readOnly = true)
    public CandidateProfileMetadataResponse getMetadata() {
        return CandidateProfileMetadataResponse.builder()
                .kyNangs(kyNangRepository.findAllByOrderByTenAsc().stream().map(candidateProfileMapper::mapSkillOption).toList())
                .nganhNghes(nganhNgheRepository.findAllByOrderByTenAsc().stream().map(candidateProfileMapper::mapNganhNgheOption).toList())
                .loaiChungChis(loaiChungChiRepository.findAllByOrderByTenAsc().stream().map(candidateProfileMapper::mapLoaiChungChiOption).toList())
                .build();
    }

    @Transactional
    public CandidateProfileResponse.HocVanItem createHocVan(Long userId, UpsertHocVanRequest request) {
        HoSoUngVien profile = accessService.requireProfile(userId);
        return createHocVanInternal(profile, request);
    }

    @Transactional
    public CandidateProfileResponse.HocVanItem createHocVan(Long userId, Long profileId, UpsertHocVanRequest request) {
        HoSoUngVien profile = accessService.requireProfileById(userId, profileId);
        return createHocVanInternal(profile, request);
    }

    @Transactional
    public CandidateProfileResponse.HocVanItem updateHocVan(Long userId, Long hocVanId, UpsertHocVanRequest request) {
        HoSoUngVien profile = accessService.requireProfile(userId);
        return updateHocVanInternal(profile, hocVanId, request);
    }

    @Transactional
    public CandidateProfileResponse.HocVanItem updateHocVan(Long userId, Long profileId, Long hocVanId, UpsertHocVanRequest request) {
        HoSoUngVien profile = accessService.requireProfileById(userId, profileId);
        return updateHocVanInternal(profile, hocVanId, request);
    }

    @Transactional
    public void deleteHocVan(Long userId, Long hocVanId) {
        HoSoUngVien profile = accessService.requireProfile(userId);
        deleteHocVanInternal(profile, hocVanId);
    }

    @Transactional
    public void deleteHocVan(Long userId, Long profileId, Long hocVanId) {
        HoSoUngVien profile = accessService.requireProfileById(userId, profileId);
        deleteHocVanInternal(profile, hocVanId);
    }

    @Transactional
    public CandidateProfileResponse.KinhNghiemItem createKinhNghiem(Long userId, UpsertKinhNghiemLamViecRequest request) {
        HoSoUngVien profile = accessService.requireProfile(userId);
        return createKinhNghiemInternal(profile, request);
    }

    @Transactional
    public CandidateProfileResponse.KinhNghiemItem createKinhNghiem(Long userId, Long profileId, UpsertKinhNghiemLamViecRequest request) {
        HoSoUngVien profile = accessService.requireProfileById(userId, profileId);
        return createKinhNghiemInternal(profile, request);
    }

    @Transactional
    public CandidateProfileResponse.KinhNghiemItem updateKinhNghiem(Long userId, Long kinhNghiemId, UpsertKinhNghiemLamViecRequest request) {
        HoSoUngVien profile = accessService.requireProfile(userId);
        return updateKinhNghiemInternal(profile, kinhNghiemId, request);
    }

    @Transactional
    public CandidateProfileResponse.KinhNghiemItem updateKinhNghiem(Long userId, Long profileId, Long kinhNghiemId, UpsertKinhNghiemLamViecRequest request) {
        HoSoUngVien profile = accessService.requireProfileById(userId, profileId);
        return updateKinhNghiemInternal(profile, kinhNghiemId, request);
    }

    @Transactional
    public void deleteKinhNghiem(Long userId, Long kinhNghiemId) {
        HoSoUngVien profile = accessService.requireProfile(userId);
        deleteKinhNghiemInternal(profile, kinhNghiemId);
    }

    @Transactional
    public void deleteKinhNghiem(Long userId, Long profileId, Long kinhNghiemId) {
        HoSoUngVien profile = accessService.requireProfileById(userId, profileId);
        deleteKinhNghiemInternal(profile, kinhNghiemId);
    }

    @Transactional
    public CandidateProfileResponse.ChungChiItem createChungChi(Long userId, UpsertChungChiRequest request) {
        HoSoUngVien profile = accessService.requireProfile(userId);
        return createChungChiInternal(profile, request);
    }

    @Transactional
    public CandidateProfileResponse.ChungChiItem createChungChi(Long userId, Long profileId, UpsertChungChiRequest request) {
        HoSoUngVien profile = accessService.requireProfileById(userId, profileId);
        return createChungChiInternal(profile, request);
    }

    @Transactional
    public CandidateProfileResponse.ChungChiItem updateChungChi(Long userId, Long chungChiId, UpsertChungChiRequest request) {
        HoSoUngVien profile = accessService.requireProfile(userId);
        return updateChungChiInternal(profile, chungChiId, request);
    }

    @Transactional
    public CandidateProfileResponse.ChungChiItem updateChungChi(Long userId, Long profileId, Long chungChiId, UpsertChungChiRequest request) {
        HoSoUngVien profile = accessService.requireProfileById(userId, profileId);
        return updateChungChiInternal(profile, chungChiId, request);
    }

    @Transactional
    public void deleteChungChi(Long userId, Long chungChiId) {
        HoSoUngVien profile = accessService.requireProfile(userId);
        deleteChungChiInternal(profile, chungChiId);
    }

    @Transactional
    public void deleteChungChi(Long userId, Long profileId, Long chungChiId) {
        HoSoUngVien profile = accessService.requireProfileById(userId, profileId);
        deleteChungChiInternal(profile, chungChiId);
    }

    @Transactional
    public List<CandidateProfileResponse.KyNangItem> updateSkills(Long userId, UpdateKyNangUngVienRequest request) {
        HoSoUngVien profile = accessService.requireProfile(userId);
        return updateSkillsByProfile(profile, request);
    }

    @Transactional
    public List<CandidateProfileResponse.KyNangItem> updateSkills(Long userId, Long profileId, UpdateKyNangUngVienRequest request) {
        HoSoUngVien profile = accessService.requireProfileById(userId, profileId);
        return updateSkillsByProfile(profile, request);
    }

    @Transactional
    public List<CandidateProfileResponse.NganhNgheItem> updateIndustries(Long userId, UpdateNganhNgheUngVienRequest request) {
        HoSoUngVien profile = accessService.requireProfile(userId);
        return updateIndustriesByProfile(profile, request);
    }

    @Transactional
    public List<CandidateProfileResponse.NganhNgheItem> updateIndustries(Long userId, Long profileId, UpdateNganhNgheUngVienRequest request) {
        HoSoUngVien profile = accessService.requireProfileById(userId, profileId);
        return updateIndustriesByProfile(profile, request);
    }

    @Transactional
    public CandidateProfileResponse updateSummary(Long userId, UpdateCandidateSummaryRequest request) {
        HoSoUngVien profile = accessService.requireProfile(userId);
        return updateSummaryInternal(profile, request);
    }

    @Transactional
    public CandidateProfileResponse updateSummary(Long userId, Long profileId, UpdateCandidateSummaryRequest request) {
        HoSoUngVien profile = accessService.requireProfileById(userId, profileId);
        return updateSummaryInternal(profile, request);
    }

    @Transactional
    public ProfileItemSelectionResponse updateHocVanSelection(Long userId, Long profileId, Long hocVanId, ToggleProfileItemSelectionRequest request) {
        HoSoUngVien profile = accessService.requireProfileById(userId, profileId);
        Integer hocVanInt = accessService.toInt(hocVanId, "hocVanId");
        HocVanUngVien hocVan = hocVanUngVienRepository.findById(hocVanInt)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy học vấn"));
        ensureOwner(profile.getNguoiDung(), hocVan.getNguoiDung());
        boolean selected = request != null && Boolean.TRUE.equals(request.getDuocChon());
        if (selected) {
            if (!hoSoHocVanRepository.existsByHoSoUngVien_IdAndHocVan_Id(profile.getId(), hocVanInt)) {
                hoSoHocVanRepository.save(new HoSoHocVan(profile, hocVan));
            }
        } else {
            hoSoHocVanRepository.deleteByHoSoUngVien_IdAndHocVan_Id(profile.getId(), hocVanInt);
        }
        return ProfileItemSelectionResponse.builder()
                .profileId(profileId)
                .itemId(hocVanId)
                .loai("HOC_VAN")
                .duocChon(selected)
                .build();
    }

    @Transactional
    public ProfileItemSelectionResponse updateKinhNghiemSelection(Long userId, Long profileId, Long kinhNghiemId, ToggleProfileItemSelectionRequest request) {
        HoSoUngVien profile = accessService.requireProfileById(userId, profileId);
        Integer kinhNghiemInt = accessService.toInt(kinhNghiemId, "kinhNghiemId");
        KinhNghiemLamViecUngVien kinhNghiem = kinhNghiemLamViecUngVienRepository.findById(kinhNghiemInt)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy kinh nghiệm làm việc"));
        ensureOwner(profile.getNguoiDung(), kinhNghiem.getNguoiDung());
        boolean selected = request != null && Boolean.TRUE.equals(request.getDuocChon());
        if (selected) {
            if (!hoSoKinhNghiemRepository.existsByHoSoUngVien_IdAndKinhNghiem_Id(profile.getId(), kinhNghiemInt)) {
                hoSoKinhNghiemRepository.save(new HoSoKinhNghiem(profile, kinhNghiem));
            }
        } else {
            hoSoKinhNghiemRepository.deleteByHoSoUngVien_IdAndKinhNghiem_Id(profile.getId(), kinhNghiemInt);
        }
        return ProfileItemSelectionResponse.builder()
                .profileId(profileId)
                .itemId(kinhNghiemId)
                .loai("KINH_NGHIEM")
                .duocChon(selected)
                .build();
    }

    @Transactional
    public ProfileItemSelectionResponse updateChungChiSelection(Long userId, Long profileId, Long chungChiId, ToggleProfileItemSelectionRequest request) {
        HoSoUngVien profile = accessService.requireProfileById(userId, profileId);
        Integer chungChiInt = accessService.toInt(chungChiId, "chungChiId");
        ChungChiUngVien chungChi = chungChiUngVienRepository.findById(chungChiInt)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy chứng chỉ"));
        ensureOwner(profile.getNguoiDung(), chungChi.getNguoiDung());
        boolean selected = request != null && Boolean.TRUE.equals(request.getDuocChon());
        if (selected) {
            if (!hoSoChungChiRepository.existsByHoSoUngVien_IdAndChungChi_Id(profile.getId(), chungChiInt)) {
                hoSoChungChiRepository.save(new HoSoChungChi(profile, chungChi));
            }
        } else {
            hoSoChungChiRepository.deleteByHoSoUngVien_IdAndChungChi_Id(profile.getId(), chungChiInt);
        }
        return ProfileItemSelectionResponse.builder()
                .profileId(profileId)
                .itemId(chungChiId)
                .loai("CHUNG_CHI")
                .duocChon(selected)
                .build();
    }

    private CandidateProfileResponse.HocVanItem createHocVanInternal(HoSoUngVien profile, UpsertHocVanRequest request) {
        NguoiDung nguoiDung = profile.getNguoiDung();
        HocVanUngVien entity = new HocVanUngVien();
        applyHocVan(entity, nguoiDung, request);
        HocVanUngVien saved = hocVanUngVienRepository.save(entity);
        hoSoHocVanRepository.save(new HoSoHocVan(profile, saved));
        return candidateProfileMapper.mapHocVan(saved, true);
    }

    private CandidateProfileResponse.HocVanItem updateHocVanInternal(HoSoUngVien profile, Long hocVanId, UpsertHocVanRequest request) {
        NguoiDung nguoiDung = profile.getNguoiDung();
        Integer hocVanInt = accessService.toInt(hocVanId, "hocVanId");
        HocVanUngVien entity = hocVanUngVienRepository.findById(hocVanInt)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy học vấn"));
        ensureOwner(nguoiDung, entity.getNguoiDung());
        applyHocVan(entity, nguoiDung, request);
        HocVanUngVien saved = hocVanUngVienRepository.save(entity);
        if (!hoSoHocVanRepository.existsByHoSoUngVien_IdAndHocVan_Id(profile.getId(), hocVanInt)) {
            hoSoHocVanRepository.save(new HoSoHocVan(profile, saved));
        }
        return candidateProfileMapper.mapHocVan(saved, true);
    }

    private void deleteHocVanInternal(HoSoUngVien profile, Long hocVanId) {
        Integer hocVanInt = accessService.toInt(hocVanId, "hocVanId");
        HocVanUngVien entity = hocVanUngVienRepository.findById(hocVanInt)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy học vấn"));
        ensureOwner(profile.getNguoiDung(), entity.getNguoiDung());
        hoSoHocVanRepository.deleteByHocVan_Id(hocVanInt);
        hocVanUngVienRepository.delete(entity);
    }

    private CandidateProfileResponse.KinhNghiemItem createKinhNghiemInternal(HoSoUngVien profile, UpsertKinhNghiemLamViecRequest request) {
        NguoiDung nguoiDung = profile.getNguoiDung();
        KinhNghiemLamViecUngVien entity = new KinhNghiemLamViecUngVien();
        applyKinhNghiem(entity, nguoiDung, request);
        KinhNghiemLamViecUngVien saved = kinhNghiemLamViecUngVienRepository.save(entity);
        hoSoKinhNghiemRepository.save(new HoSoKinhNghiem(profile, saved));
        return candidateProfileMapper.mapKinhNghiem(saved, true);
    }

    private CandidateProfileResponse.KinhNghiemItem updateKinhNghiemInternal(HoSoUngVien profile, Long kinhNghiemId, UpsertKinhNghiemLamViecRequest request) {
        NguoiDung nguoiDung = profile.getNguoiDung();
        Integer kinhNghiemInt = accessService.toInt(kinhNghiemId, "kinhNghiemId");
        KinhNghiemLamViecUngVien entity = kinhNghiemLamViecUngVienRepository.findById(kinhNghiemInt)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy kinh nghiệm làm việc"));
        ensureOwner(nguoiDung, entity.getNguoiDung());
        applyKinhNghiem(entity, nguoiDung, request);
        KinhNghiemLamViecUngVien saved = kinhNghiemLamViecUngVienRepository.save(entity);
        if (!hoSoKinhNghiemRepository.existsByHoSoUngVien_IdAndKinhNghiem_Id(profile.getId(), kinhNghiemInt)) {
            hoSoKinhNghiemRepository.save(new HoSoKinhNghiem(profile, saved));
        }
        return candidateProfileMapper.mapKinhNghiem(saved, true);
    }

    private void deleteKinhNghiemInternal(HoSoUngVien profile, Long kinhNghiemId) {
        Integer kinhNghiemInt = accessService.toInt(kinhNghiemId, "kinhNghiemId");
        KinhNghiemLamViecUngVien entity = kinhNghiemLamViecUngVienRepository.findById(kinhNghiemInt)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy kinh nghiệm làm việc"));
        ensureOwner(profile.getNguoiDung(), entity.getNguoiDung());
        hoSoKinhNghiemRepository.deleteByKinhNghiem_Id(kinhNghiemInt);
        kinhNghiemLamViecUngVienRepository.delete(entity);
    }

    private CandidateProfileResponse.ChungChiItem createChungChiInternal(HoSoUngVien profile, UpsertChungChiRequest request) {
        NguoiDung nguoiDung = profile.getNguoiDung();
        ChungChiUngVien entity = new ChungChiUngVien();
        applyChungChi(entity, nguoiDung, request);
        ChungChiUngVien saved = chungChiUngVienRepository.save(entity);
        hoSoChungChiRepository.save(new HoSoChungChi(profile, saved));
        return candidateProfileMapper.mapChungChi(saved, true);
    }

    private CandidateProfileResponse.ChungChiItem updateChungChiInternal(HoSoUngVien profile, Long chungChiId, UpsertChungChiRequest request) {
        NguoiDung nguoiDung = profile.getNguoiDung();
        Integer chungChiInt = accessService.toInt(chungChiId, "chungChiId");
        ChungChiUngVien entity = chungChiUngVienRepository.findById(chungChiInt)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy chứng chỉ"));
        ensureOwner(nguoiDung, entity.getNguoiDung());
        applyChungChi(entity, nguoiDung, request);
        ChungChiUngVien saved = chungChiUngVienRepository.save(entity);
        if (!hoSoChungChiRepository.existsByHoSoUngVien_IdAndChungChi_Id(profile.getId(), chungChiInt)) {
            hoSoChungChiRepository.save(new HoSoChungChi(profile, saved));
        }
        return candidateProfileMapper.mapChungChi(saved, true);
    }

    private void deleteChungChiInternal(HoSoUngVien profile, Long chungChiId) {
        Integer chungChiInt = accessService.toInt(chungChiId, "chungChiId");
        ChungChiUngVien entity = chungChiUngVienRepository.findById(chungChiInt)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy chứng chỉ"));
        ensureOwner(profile.getNguoiDung(), entity.getNguoiDung());
        hoSoChungChiRepository.deleteByChungChi_Id(chungChiInt);
        chungChiUngVienRepository.delete(entity);
    }

    private List<CandidateProfileResponse.KyNangItem> updateSkillsByProfile(HoSoUngVien profile, UpdateKyNangUngVienRequest request) {
        List<Integer> incoming = request.getKyNangIds() == null ? List.of() : request.getKyNangIds();
        Set<Integer> dedup = new LinkedHashSet<>();
        incoming.stream().filter(Objects::nonNull).forEach(dedup::add);

        List<KyNang> skills = dedup.isEmpty() ? List.of() : kyNangRepository.findAllById(dedup);
        if (skills.size() != dedup.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Một hoặc nhiều kỹ năng không hợp lệ");
        }

        Integer profileId = profile.getId();
        if (profileId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hồ sơ ứng viên không hợp lệ");
        }

        kyNangUngVienRepository.deleteByHoSoUngVien_Id(profileId);
        if (!skills.isEmpty()) {
            List<KyNangUngVien> newProfileSkills = skills.stream()
                    .map(skill -> new KyNangUngVien(profile, skill))
                    .toList();
            kyNangUngVienRepository.saveAll(newProfileSkills);
        }
        return skills.stream().map(skill -> candidateProfileMapper.mapKyNang(skill, true)).toList();
    }

    private List<CandidateProfileResponse.NganhNgheItem> updateIndustriesByProfile(HoSoUngVien profile, UpdateNganhNgheUngVienRequest request) {
        List<Integer> incoming = request.getNganhNgheIds() == null ? List.of() : request.getNganhNgheIds();
        Set<Integer> dedup = new LinkedHashSet<>();
        incoming.stream().filter(Objects::nonNull).forEach(dedup::add);

        List<NganhNghe> industries = dedup.isEmpty() ? List.of() : nganhNgheRepository.findAllById(dedup);
        if (industries.size() != dedup.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Một hoặc nhiều ngành nghề không hợp lệ");
        }

        nganhNgheUngVienRepository.deleteByHoSoUngVien_Id(profile.getId());
        List<NganhNgheUngVien> newLinks = new ArrayList<>();
        for (NganhNghe industry : industries) {
            NganhNgheUngVien link = new NganhNgheUngVien();
            link.setHoSoUngVien(profile);
            link.setNganhNghe(industry);
            newLinks.add(link);
        }
        nganhNgheUngVienRepository.saveAll(newLinks);
        return newLinks.stream().map(link -> candidateProfileMapper.mapNganhNghe(link.getNganhNghe())).toList();
    }

    private CandidateProfileResponse updateSummaryInternal(HoSoUngVien profile, UpdateCandidateSummaryRequest request) {
        profile.setTenHoSo(accessService.trimToNull(request == null ? null : request.getTenHoSo()));
        profile.setGioiThieuBanThan(accessService.trimToNull(request == null ? null : request.getGioiThieuBanThan()));
        profile.setMucTieuNgheNghiep(accessService.trimToNull(request == null ? null : request.getMucTieuNgheNghiep()));
        if (profile.getTenHoSo() == null && profile.getId() != null) {
            profile.setTenHoSo("Hồ sơ #" + profile.getId());
        }
        return mapProfile(profile);
    }

    private String buildProfileTitle(HoSoUngVien profile) {
        if (profile == null) {
            return "Hồ sơ";
        }
        if (org.springframework.util.StringUtils.hasText(profile.getTenHoSo())) {
            return profile.getTenHoSo();
        }
        if (profile.getId() == null) {
            return "Hồ sơ";
        }
        return "Hồ sơ #" + profile.getId();
    }

    private void applyHocVan(HocVanUngVien entity, NguoiDung nguoiDung, UpsertHocVanRequest request) {
        if (request == null || !org.springframework.util.StringUtils.hasText(request.getTenTruong())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "tenTruong không hợp lệ");
        }
        entity.setNguoiDung(nguoiDung);
        entity.setTenTruong(request.getTenTruong().trim());
        entity.setChuyenNganh(accessService.trimToNull(request.getChuyenNganh()));
        entity.setBacHoc(accessService.trimToNull(request.getBacHoc()));
        entity.setThoiGianBatDau(request.getThoiGianBatDau());
        entity.setThoiGianKetThuc(request.getThoiGianKetThuc());
        entity.setDuongDanTep(accessService.trimToNull(request.getDuongDanTep()));
        entity.setTrangThai(resolveProofStatus(entity.getDuongDanTep()));
    }

    private void applyKinhNghiem(KinhNghiemLamViecUngVien entity, NguoiDung nguoiDung, UpsertKinhNghiemLamViecRequest request) {
        if (request == null || !org.springframework.util.StringUtils.hasText(request.getTenCongTy())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "tenCongTy không hợp lệ");
        }
        entity.setNguoiDung(nguoiDung);
        entity.setTenCongTy(request.getTenCongTy().trim());
        entity.setChucDanh(accessService.trimToNull(request.getChucDanh()));
        entity.setMoTaCongViec(accessService.trimToNull(request.getMoTaCongViec()));
        entity.setThoiGianBatDau(request.getThoiGianBatDau());
        entity.setThoiGianKetThuc(request.getThoiGianKetThuc());
    }

    private void applyChungChi(ChungChiUngVien entity, NguoiDung nguoiDung, UpsertChungChiRequest request) {
        if (request == null || request.getLoaiChungChiId() == null || !org.springframework.util.StringUtils.hasText(request.getTenChungChi())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dữ liệu chứng chỉ không hợp lệ");
        }
        LoaiChungChi loai = loaiChungChiRepository.findById(request.getLoaiChungChiId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy loại chứng chỉ"));
        entity.setNguoiDung(nguoiDung);
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
        Integer profileId = profile.getId();
        Integer nguoiDungId = profile.getNguoiDung() == null ? null : profile.getNguoiDung().getId();
        if (nguoiDungId == null || profileId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hồ sơ ứng viên không hợp lệ");
        }

        Set<Integer> selectedHocVanIds = hoSoHocVanRepository.findByHoSoUngVien_Id(profileId).stream()
                .filter(link -> link.getHocVan() != null && link.getHocVan().getId() != null)
                .map(link -> link.getHocVan().getId())
                .collect(java.util.stream.Collectors.toSet());
        Set<Integer> selectedKinhNghiemIds = hoSoKinhNghiemRepository.findByHoSoUngVien_Id(profileId).stream()
                .filter(link -> link.getKinhNghiem() != null && link.getKinhNghiem().getId() != null)
                .map(link -> link.getKinhNghiem().getId())
                .collect(java.util.stream.Collectors.toSet());
        Set<Integer> selectedChungChiIds = hoSoChungChiRepository.findByHoSoUngVien_Id(profileId).stream()
                .filter(link -> link.getChungChi() != null && link.getChungChi().getId() != null)
                .map(link -> link.getChungChi().getId())
                .collect(java.util.stream.Collectors.toSet());
        List<CandidateProfileResponse.HocVanItem> hocVans = hocVanUngVienRepository.findByNguoiDung_IdOrderByThoiGianBatDauDesc(nguoiDungId)
                .stream()
                .map(item -> candidateProfileMapper.mapHocVan(item, item.getId() != null && selectedHocVanIds.contains(item.getId())))
                .toList();
        List<CandidateProfileResponse.KinhNghiemItem> kinhNghiems = kinhNghiemLamViecUngVienRepository.findByNguoiDung_IdOrderByThoiGianBatDauDesc(nguoiDungId)
                .stream()
                .map(item -> candidateProfileMapper.mapKinhNghiem(item, item.getId() != null && selectedKinhNghiemIds.contains(item.getId())))
                .toList();
        List<CandidateProfileResponse.ChungChiItem> chungChis = chungChiUngVienRepository.findByNguoiDung_IdOrderByNgayBatDauDesc(nguoiDungId)
                .stream()
                .map(item -> candidateProfileMapper.mapChungChi(item, item.getId() != null && selectedChungChiIds.contains(item.getId())))
                .toList();
        List<CandidateProfileResponse.KyNangItem> kyNangs = kyNangUngVienRepository.findByHoSoUngVien_Id(profileId)
                .stream()
                .filter(link -> link.getKyNang() != null)
                .map(link -> candidateProfileMapper.mapKyNang(link.getKyNang(), true))
                .toList();
        List<CandidateProfileResponse.NganhNgheItem> nganhNghes = nganhNgheUngVienRepository.findByHoSoUngVien_Id(profileId)
                .stream()
                .map(link -> candidateProfileMapper.mapNganhNghe(link.getNganhNghe()))
                .toList();

        return CandidateProfileResponse.builder()
                .hoSoUngVienId(profile.getId() == null ? null : profile.getId().longValue())
                .tenHoSo(profile.getTenHoSo())
                .gioiThieuBanThan(profile.getGioiThieuBanThan())
                .mucTieuNgheNghiep(profile.getMucTieuNgheNghiep())
                .hocVans(hocVans)
                .kinhNghiems(kinhNghiems)
                .chungChis(chungChis)
                .kyNangs(kyNangs)
                .nganhNghes(nganhNghes)
                .build();
    }

    private void ganMacDinhTatCaNoiDungHienCo(HoSoUngVien profile, Integer nguoiDungId, Integer sourceProfileId) {
        if (profile == null || profile.getId() == null || nguoiDungId == null) {
            return;
        }

        List<HoSoHocVan> hocVanLinks = hocVanUngVienRepository.findByNguoiDung_IdOrderByThoiGianBatDauDesc(nguoiDungId)
                .stream()
                .map(item -> new HoSoHocVan(profile, item))
                .toList();
        if (!hocVanLinks.isEmpty()) {
            hoSoHocVanRepository.saveAll(hocVanLinks);
        }

        List<HoSoKinhNghiem> kinhNghiemLinks = kinhNghiemLamViecUngVienRepository.findByNguoiDung_IdOrderByThoiGianBatDauDesc(nguoiDungId)
                .stream()
                .map(item -> new HoSoKinhNghiem(profile, item))
                .toList();
        if (!kinhNghiemLinks.isEmpty()) {
            hoSoKinhNghiemRepository.saveAll(kinhNghiemLinks);
        }

        List<HoSoChungChi> chungChiLinks = chungChiUngVienRepository.findByNguoiDung_IdOrderByNgayBatDauDesc(nguoiDungId)
                .stream()
                .map(item -> new HoSoChungChi(profile, item))
                .toList();
        if (!chungChiLinks.isEmpty()) {
            hoSoChungChiRepository.saveAll(chungChiLinks);
        }

        if (sourceProfileId != null) {
            List<KyNangUngVien> kyNangLinks = kyNangUngVienRepository.findByHoSoUngVien_Id(sourceProfileId).stream()
                    .filter(item -> item.getKyNang() != null)
                    .map(item -> new KyNangUngVien(profile, item.getKyNang()))
                    .toList();
            if (!kyNangLinks.isEmpty()) {
                kyNangUngVienRepository.saveAll(kyNangLinks);
            }
        }
    }

    private void ensureOwner(NguoiDung expectedUser, NguoiDung actualUser) {
        Integer expectedId = expectedUser == null ? null : expectedUser.getId();
        Integer actualId = actualUser == null ? null : actualUser.getId();
        if (!Objects.equals(expectedId, actualId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không có quyền thao tác dữ liệu này");
        }
    }

    private void dongBoChiMucHoSo(HoSoUngVien profile) {
        chiMucNhungHoSoUngVienService.dongBoChiMuc(profile);
    }
}
