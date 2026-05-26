package com.phuocloc.projectfinal.recruit.candidate.service;

import com.phuocloc.projectfinal.recruit.ai.service.CandidateProfileEmbeddingIndexService;
import com.phuocloc.projectfinal.recruit.auth.repository.UsersRepository;
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
import com.phuocloc.projectfinal.recruit.candidate.repository.CandidateProfileRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.KyNangRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.LoaiChungChiRepository;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.repository.NganhNgheRepository;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoUngVien;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CandidateProfileService {

    private final CandidateProfileAccessService accessService;
    private final CandidateProfileMapper candidateProfileMapper;
    private final CandidateProfileResponseAssembler responseAssembler;
    private final CandidateProfileContentService contentService;
    private final CandidateProfileAttachmentService attachmentService;
    private final UsersRepository usersRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final KyNangRepository kyNangRepository;
    private final NganhNgheRepository nganhNgheRepository;
    private final LoaiChungChiRepository loaiChungChiRepository;
    private final CandidateProfileEmbeddingIndexService chiMucNhungHoSoUngVienService;

    @Transactional(readOnly = true)
    public CandidateProfileResponse getProfile(Long userId) {
        HoSoUngVien profile = accessService.requireProfile(userId);
        return responseAssembler.mapProfile(profile);
    }

    @Transactional(readOnly = true)
    public List<CandidateProfileListItemResponse> listProfiles(Long userId) {
        return accessService.listProfiles(userId).stream()
                .map(responseAssembler::mapListItem)
                .toList();
    }

    @Transactional(readOnly = true)
    public Long findLatestProfileIdOrNull(Long userId) {
        // Homepage chỉ render "việc làm phù hợp với tôi" khi candidate đã có hồ sơ thật.
        return accessService.listProfiles(userId).stream()
                .findFirst()
                .map(profile -> profile.getId() == null ? null : profile.getId().longValue())
                .orElse(null);
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
        attachmentService.attachExistingContentByDefault(profile, nguoiDungId, sourceProfileId);
        return responseAssembler.mapListItem(profile);
    }

    @Transactional(readOnly = true)
    public CandidateProfileResponse getProfileById(Long userId, Long profileId) {
        HoSoUngVien profile = accessService.requireProfileById(userId, profileId);
        return responseAssembler.mapProfile(profile);
    }

    @Transactional
    public CandidateProfileResponse syncProfileIndex(Long userId, Long profileId) {
        HoSoUngVien profile = profileId == null
                ? accessService.requireProfile(userId)
                : accessService.requireProfileById(userId, profileId);
        chiMucNhungHoSoUngVienService.syncIndex(profile);
        return responseAssembler.mapProfile(profile);
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
        return contentService.createHocVan(accessService.requireProfile(userId), request);
    }

    @Transactional
    public CandidateProfileResponse.HocVanItem createHocVan(Long userId, Long profileId, UpsertHocVanRequest request) {
        return contentService.createHocVan(accessService.requireProfileById(userId, profileId), request);
    }

    @Transactional
    public CandidateProfileResponse.HocVanItem updateHocVan(Long userId, Long hocVanId, UpsertHocVanRequest request) {
        return contentService.updateHocVan(accessService.requireProfile(userId), hocVanId, request);
    }

    @Transactional
    public CandidateProfileResponse.HocVanItem updateHocVan(Long userId, Long profileId, Long hocVanId, UpsertHocVanRequest request) {
        return contentService.updateHocVan(accessService.requireProfileById(userId, profileId), hocVanId, request);
    }

    @Transactional
    public void deleteHocVan(Long userId, Long hocVanId) {
        contentService.deleteHocVan(accessService.requireProfile(userId), hocVanId);
    }

    @Transactional
    public void deleteHocVan(Long userId, Long profileId, Long hocVanId) {
        contentService.deleteHocVan(accessService.requireProfileById(userId, profileId), hocVanId);
    }

    @Transactional
    public CandidateProfileResponse.KinhNghiemItem createKinhNghiem(Long userId, UpsertKinhNghiemLamViecRequest request) {
        return contentService.createKinhNghiem(accessService.requireProfile(userId), request);
    }

    @Transactional
    public CandidateProfileResponse.KinhNghiemItem createKinhNghiem(Long userId, Long profileId, UpsertKinhNghiemLamViecRequest request) {
        return contentService.createKinhNghiem(accessService.requireProfileById(userId, profileId), request);
    }

    @Transactional
    public CandidateProfileResponse.KinhNghiemItem updateKinhNghiem(Long userId, Long kinhNghiemId, UpsertKinhNghiemLamViecRequest request) {
        return contentService.updateKinhNghiem(accessService.requireProfile(userId), kinhNghiemId, request);
    }

    @Transactional
    public CandidateProfileResponse.KinhNghiemItem updateKinhNghiem(Long userId, Long profileId, Long kinhNghiemId, UpsertKinhNghiemLamViecRequest request) {
        return contentService.updateKinhNghiem(accessService.requireProfileById(userId, profileId), kinhNghiemId, request);
    }

    @Transactional
    public void deleteKinhNghiem(Long userId, Long kinhNghiemId) {
        contentService.deleteKinhNghiem(accessService.requireProfile(userId), kinhNghiemId);
    }

    @Transactional
    public void deleteKinhNghiem(Long userId, Long profileId, Long kinhNghiemId) {
        contentService.deleteKinhNghiem(accessService.requireProfileById(userId, profileId), kinhNghiemId);
    }

    @Transactional
    public CandidateProfileResponse.ChungChiItem createChungChi(Long userId, UpsertChungChiRequest request) {
        return contentService.createChungChi(accessService.requireProfile(userId), request);
    }

    @Transactional
    public CandidateProfileResponse.ChungChiItem createChungChi(Long userId, Long profileId, UpsertChungChiRequest request) {
        return contentService.createChungChi(accessService.requireProfileById(userId, profileId), request);
    }

    @Transactional
    public CandidateProfileResponse.ChungChiItem updateChungChi(Long userId, Long chungChiId, UpsertChungChiRequest request) {
        return contentService.updateChungChi(accessService.requireProfile(userId), chungChiId, request);
    }

    @Transactional
    public CandidateProfileResponse.ChungChiItem updateChungChi(Long userId, Long profileId, Long chungChiId, UpsertChungChiRequest request) {
        return contentService.updateChungChi(accessService.requireProfileById(userId, profileId), chungChiId, request);
    }

    @Transactional
    public void deleteChungChi(Long userId, Long chungChiId) {
        contentService.deleteChungChi(accessService.requireProfile(userId), chungChiId);
    }

    @Transactional
    public void deleteChungChi(Long userId, Long profileId, Long chungChiId) {
        contentService.deleteChungChi(accessService.requireProfileById(userId, profileId), chungChiId);
    }

    @Transactional
    public List<CandidateProfileResponse.KyNangItem> updateSkills(Long userId, UpdateKyNangUngVienRequest request) {
        return contentService.updateSkills(accessService.requireProfile(userId), request);
    }

    @Transactional
    public List<CandidateProfileResponse.KyNangItem> updateSkills(Long userId, Long profileId, UpdateKyNangUngVienRequest request) {
        return contentService.updateSkills(accessService.requireProfileById(userId, profileId), request);
    }

    @Transactional
    public List<CandidateProfileResponse.NganhNgheItem> updateIndustries(Long userId, UpdateNganhNgheUngVienRequest request) {
        return contentService.updateIndustries(accessService.requireProfile(userId), request);
    }

    @Transactional
    public List<CandidateProfileResponse.NganhNgheItem> updateIndustries(Long userId, Long profileId, UpdateNganhNgheUngVienRequest request) {
        return contentService.updateIndustries(accessService.requireProfileById(userId, profileId), request);
    }

    @Transactional
    public CandidateProfileResponse updateSummary(Long userId, UpdateCandidateSummaryRequest request) {
        return updateSummaryInternal(accessService.requireProfile(userId), request);
    }

    @Transactional
    public CandidateProfileResponse updateSummary(Long userId, Long profileId, UpdateCandidateSummaryRequest request) {
        return updateSummaryInternal(accessService.requireProfileById(userId, profileId), request);
    }

    @Transactional
    public ProfileItemSelectionResponse updateHocVanSelection(Long userId, Long profileId, Long hocVanId, ToggleProfileItemSelectionRequest request) {
        return contentService.updateHocVanSelection(accessService.requireProfileById(userId, profileId), profileId, hocVanId, request);
    }

    @Transactional
    public ProfileItemSelectionResponse updateKinhNghiemSelection(Long userId, Long profileId, Long kinhNghiemId, ToggleProfileItemSelectionRequest request) {
        return contentService.updateKinhNghiemSelection(accessService.requireProfileById(userId, profileId), profileId, kinhNghiemId, request);
    }

    @Transactional
    public ProfileItemSelectionResponse updateChungChiSelection(Long userId, Long profileId, Long chungChiId, ToggleProfileItemSelectionRequest request) {
        return contentService.updateChungChiSelection(accessService.requireProfileById(userId, profileId), profileId, chungChiId, request);
    }

    private CandidateProfileResponse updateSummaryInternal(HoSoUngVien profile, UpdateCandidateSummaryRequest request) {
        profile.setTenHoSo(accessService.trimToNull(request == null ? null : request.getTenHoSo()));
        profile.setGioiThieuBanThan(accessService.trimToNull(request == null ? null : request.getGioiThieuBanThan()));
        profile.setMucTieuNgheNghiep(accessService.trimToNull(request == null ? null : request.getMucTieuNgheNghiep()));
        if (profile.getTenHoSo() == null && profile.getId() != null) {
            profile.setTenHoSo("Hồ sơ #" + profile.getId());
        }
        return responseAssembler.mapProfile(profile);
    }
}
