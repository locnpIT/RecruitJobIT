package com.phuocloc.projectfinal.recruit.candidate.service;

import com.phuocloc.projectfinal.recruit.candidate.dto.request.ToggleProfileItemSelectionRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.UpdateKyNangUngVienRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.UpdateNganhNgheUngVienRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.UpsertChungChiRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.UpsertHocVanRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.UpsertKinhNghiemLamViecRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.response.CandidateProfileResponse;
import com.phuocloc.projectfinal.recruit.candidate.dto.response.ProfileItemSelectionResponse;
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
import com.phuocloc.projectfinal.recruit.ai.service.KinhNghiemEmbeddingIndexService;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Slf4j
public class CandidateProfileContentService {

    private static final String PROOF_STATUS_UNVERIFIED = "UNVERIFIED";
    private static final String PROOF_STATUS_PENDING = "PENDING";

    private final CandidateProfileAccessService accessService;
    private final CandidateProfileMapper candidateProfileMapper;
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
    private final KinhNghiemEmbeddingIndexService kinhNghiemEmbeddingIndexService;

    public CandidateProfileResponse.HocVanItem createHocVan(HoSoUngVien profile, UpsertHocVanRequest request) {
        NguoiDung nguoiDung = profile.getNguoiDung();
        HocVanUngVien entity = new HocVanUngVien();
        applyHocVan(entity, nguoiDung, request);
        HocVanUngVien saved = hocVanUngVienRepository.save(entity);
        hoSoHocVanRepository.save(new HoSoHocVan(profile, saved));
        return candidateProfileMapper.mapHocVan(saved, true);
    }

    public CandidateProfileResponse.HocVanItem updateHocVan(HoSoUngVien profile, Long hocVanId, UpsertHocVanRequest request) {
        NguoiDung nguoiDung = profile.getNguoiDung();
        Integer hocVanInt = accessService.toInt(hocVanId, "hocVanId");
        HocVanUngVien entity = hocVanUngVienRepository.findById(hocVanInt)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy học vấn"));
        ensureOwner(nguoiDung, entity.getNguoiDung());
        applyHocVan(entity, nguoiDung, request);
        HocVanUngVien saved = hocVanUngVienRepository.save(entity);
        return candidateProfileMapper.mapHocVan(saved, true);
    }

    public void deleteHocVan(HoSoUngVien profile, Long hocVanId) {
        Integer hocVanInt = accessService.toInt(hocVanId, "hocVanId");
        HocVanUngVien entity = hocVanUngVienRepository.findById(hocVanInt)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy học vấn"));
        ensureOwner(profile.getNguoiDung(), entity.getNguoiDung());
        hoSoHocVanRepository.deleteByHoSoUngVien_IdAndHocVan_Id(profile.getId(), hocVanInt);
    }

    public CandidateProfileResponse.KinhNghiemItem createKinhNghiem(HoSoUngVien profile, UpsertKinhNghiemLamViecRequest request) {
        NguoiDung nguoiDung = profile.getNguoiDung();
        KinhNghiemLamViecUngVien entity = new KinhNghiemLamViecUngVien();
        applyKinhNghiem(entity, nguoiDung, request);
        KinhNghiemLamViecUngVien saved = kinhNghiemLamViecUngVienRepository.save(entity);
        hoSoKinhNghiemRepository.save(new HoSoKinhNghiem(profile, saved));
        syncKinhNghiemIndexQuietly(saved);
        return candidateProfileMapper.mapKinhNghiem(saved, true);
    }

    public CandidateProfileResponse.KinhNghiemItem updateKinhNghiem(HoSoUngVien profile, Long kinhNghiemId, UpsertKinhNghiemLamViecRequest request) {
        NguoiDung nguoiDung = profile.getNguoiDung();
        Integer kinhNghiemInt = accessService.toInt(kinhNghiemId, "kinhNghiemId");
        KinhNghiemLamViecUngVien entity = kinhNghiemLamViecUngVienRepository.findById(kinhNghiemInt)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy kinh nghiệm làm việc"));
        ensureOwner(nguoiDung, entity.getNguoiDung());
        applyKinhNghiem(entity, nguoiDung, request);
        KinhNghiemLamViecUngVien saved = kinhNghiemLamViecUngVienRepository.save(entity);
        syncKinhNghiemIndexQuietly(saved);
        return candidateProfileMapper.mapKinhNghiem(saved, true);
    }

    public void deleteKinhNghiem(HoSoUngVien profile, Long kinhNghiemId) {
        Integer kinhNghiemInt = accessService.toInt(kinhNghiemId, "kinhNghiemId");
        KinhNghiemLamViecUngVien entity = kinhNghiemLamViecUngVienRepository.findById(kinhNghiemInt)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy kinh nghiệm làm việc"));
        ensureOwner(profile.getNguoiDung(), entity.getNguoiDung());
        hoSoKinhNghiemRepository.deleteByHoSoUngVien_IdAndKinhNghiem_Id(profile.getId(), kinhNghiemInt);
    }

    public CandidateProfileResponse.ChungChiItem createChungChi(HoSoUngVien profile, UpsertChungChiRequest request) {
        NguoiDung nguoiDung = profile.getNguoiDung();
        ChungChiUngVien entity = new ChungChiUngVien();
        applyChungChi(entity, nguoiDung, request);
        ChungChiUngVien saved = chungChiUngVienRepository.save(entity);
        hoSoChungChiRepository.save(new HoSoChungChi(profile, saved));
        return candidateProfileMapper.mapChungChi(saved, true);
    }

    public CandidateProfileResponse.ChungChiItem updateChungChi(HoSoUngVien profile, Long chungChiId, UpsertChungChiRequest request) {
        NguoiDung nguoiDung = profile.getNguoiDung();
        Integer chungChiInt = accessService.toInt(chungChiId, "chungChiId");
        ChungChiUngVien entity = chungChiUngVienRepository.findById(chungChiInt)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy chứng chỉ"));
        ensureOwner(nguoiDung, entity.getNguoiDung());
        applyChungChi(entity, nguoiDung, request);
        ChungChiUngVien saved = chungChiUngVienRepository.save(entity);
        return candidateProfileMapper.mapChungChi(saved, true);
    }

    public void deleteChungChi(HoSoUngVien profile, Long chungChiId) {
        Integer chungChiInt = accessService.toInt(chungChiId, "chungChiId");
        ChungChiUngVien entity = chungChiUngVienRepository.findById(chungChiInt)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy chứng chỉ"));
        ensureOwner(profile.getNguoiDung(), entity.getNguoiDung());
        hoSoChungChiRepository.deleteByHoSoUngVien_IdAndChungChi_Id(profile.getId(), chungChiInt);
    }

    public List<CandidateProfileResponse.KyNangItem> updateSkills(HoSoUngVien profile, UpdateKyNangUngVienRequest request) {
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

    public List<CandidateProfileResponse.NganhNgheItem> updateIndustries(HoSoUngVien profile, UpdateNganhNgheUngVienRequest request) {
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

    public ProfileItemSelectionResponse updateHocVanSelection(
            HoSoUngVien profile,
            Long profileId,
            Long hocVanId,
            ToggleProfileItemSelectionRequest request
    ) {
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
        return buildSelectionResponse(profileId, hocVanId, "HOC_VAN", selected);
    }

    public ProfileItemSelectionResponse updateKinhNghiemSelection(
            HoSoUngVien profile,
            Long profileId,
            Long kinhNghiemId,
            ToggleProfileItemSelectionRequest request
    ) {
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
        return buildSelectionResponse(profileId, kinhNghiemId, "KINH_NGHIEM", selected);
    }

    public ProfileItemSelectionResponse updateChungChiSelection(
            HoSoUngVien profile,
            Long profileId,
            Long chungChiId,
            ToggleProfileItemSelectionRequest request
    ) {
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
        return buildSelectionResponse(profileId, chungChiId, "CHUNG_CHI", selected);
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

    private ProfileItemSelectionResponse buildSelectionResponse(Long profileId, Long itemId, String loai, boolean selected) {
        return ProfileItemSelectionResponse.builder()
                .profileId(profileId)
                .itemId(itemId)
                .loai(loai)
                .duocChon(selected)
                .build();
    }

    private void ensureOwner(NguoiDung expectedUser, NguoiDung actualUser) {
        Integer expectedId = expectedUser == null ? null : expectedUser.getId();
        Integer actualId = actualUser == null ? null : actualUser.getId();
        if (!Objects.equals(expectedId, actualId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không có quyền thao tác dữ liệu này");
        }
    }

    /**
     * Đồng bộ embedding kinh nghiệm vào Qdrant sau create/update.
     * Lỗi embedding không làm thất bại thao tác chính — chỉ log warning.
     */
    private void syncKinhNghiemIndexQuietly(KinhNghiemLamViecUngVien saved) {
        try {
            kinhNghiemEmbeddingIndexService.syncIndex(saved);
        } catch (Exception ex) {
            log.warn("Không đồng bộ được embedding kinh nghiệm {} — bỏ qua để không ảnh hưởng thao tác chính",
                    saved.getId(), ex);
        }
    }
}
