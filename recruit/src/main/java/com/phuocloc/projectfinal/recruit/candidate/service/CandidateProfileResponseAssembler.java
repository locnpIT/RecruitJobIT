package com.phuocloc.projectfinal.recruit.candidate.service;

import com.phuocloc.projectfinal.recruit.candidate.dto.response.CandidateProfileListItemResponse;
import com.phuocloc.projectfinal.recruit.candidate.dto.response.CandidateProfileResponse;
import com.phuocloc.projectfinal.recruit.candidate.repository.ChungChiUngVienRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.HoSoChungChiRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.HoSoHocVanRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.HoSoKinhNghiemRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.HocVanUngVienRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.KinhNghiemLamViecUngVienRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.KyNangUngVienRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.NganhNgheUngVienRepository;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoUngVien;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
@RequiredArgsConstructor
public class CandidateProfileResponseAssembler {

    private final CandidateProfileMapper candidateProfileMapper;
    private final HocVanUngVienRepository hocVanUngVienRepository;
    private final KinhNghiemLamViecUngVienRepository kinhNghiemLamViecUngVienRepository;
    private final ChungChiUngVienRepository chungChiUngVienRepository;
    private final KyNangUngVienRepository kyNangUngVienRepository;
    private final NganhNgheUngVienRepository nganhNgheUngVienRepository;
    private final HoSoHocVanRepository hoSoHocVanRepository;
    private final HoSoKinhNghiemRepository hoSoKinhNghiemRepository;
    private final HoSoChungChiRepository hoSoChungChiRepository;

    public CandidateProfileListItemResponse mapListItem(HoSoUngVien profile) {
        return CandidateProfileListItemResponse.builder()
                .id(profile.getId() == null ? null : profile.getId().longValue())
                .tenHoSo(profile.getTenHoSo())
                .tieuDe(buildProfileTitle(profile))
                .mucTieuNgheNghiep(profile.getMucTieuNgheNghiep())
                .gioiThieuBanThan(profile.getGioiThieuBanThan())
                .ngayCapNhat(profile.getNgayCapNhat())
                .build();
    }

    public CandidateProfileResponse mapProfile(HoSoUngVien profile) {
        Integer profileId = profile.getId();
        Integer nguoiDungId = profile.getNguoiDung() == null ? null : profile.getNguoiDung().getId();
        if (nguoiDungId == null || profileId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hồ sơ ứng viên không hợp lệ");
        }

        Set<Integer> selectedHocVanIds = hoSoHocVanRepository.findByHoSoUngVien_Id(profileId).stream()
                .filter(link -> link.getHocVan() != null && link.getHocVan().getId() != null)
                .map(link -> link.getHocVan().getId())
                .collect(Collectors.toSet());
        Set<Integer> selectedKinhNghiemIds = hoSoKinhNghiemRepository.findByHoSoUngVien_Id(profileId).stream()
                .filter(link -> link.getKinhNghiem() != null && link.getKinhNghiem().getId() != null)
                .map(link -> link.getKinhNghiem().getId())
                .collect(Collectors.toSet());
        Set<Integer> selectedChungChiIds = hoSoChungChiRepository.findByHoSoUngVien_Id(profileId).stream()
                .filter(link -> link.getChungChi() != null && link.getChungChi().getId() != null)
                .map(link -> link.getChungChi().getId())
                .collect(Collectors.toSet());

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

    public String buildProfileTitle(HoSoUngVien profile) {
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
}
