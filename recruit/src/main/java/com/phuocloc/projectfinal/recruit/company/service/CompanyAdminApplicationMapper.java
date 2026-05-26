package com.phuocloc.projectfinal.recruit.company.service;

import com.phuocloc.projectfinal.recruit.candidate.repository.HoSoChungChiRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.HoSoHocVanRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.HoSoKinhNghiemRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.KyNangUngVienRepository;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyAdminApplicationResponse;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.DonUngTuyen;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoUngVien;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
public class CompanyAdminApplicationMapper {

    private final HoSoHocVanRepository hoSoHocVanRepository;
    private final HoSoKinhNghiemRepository hoSoKinhNghiemRepository;
    private final HoSoChungChiRepository hoSoChungChiRepository;
    private final KyNangUngVienRepository kyNangUngVienRepository;

    public CompanyAdminApplicationResponse mapApplication(DonUngTuyen donUngTuyen, boolean includeProfileDetail) {
        HoSoUngVien profile = donUngTuyen.getHoSoUngVien();
        var user = profile == null ? null : profile.getNguoiDung();

        CompanyAdminApplicationResponse.CompanyAdminApplicationResponseBuilder builder = CompanyAdminApplicationResponse.builder()
                .id(donUngTuyen.getId() == null ? null : donUngTuyen.getId().longValue())
                .trangThai(donUngTuyen.getTrangThai())
                .cvUrl(donUngTuyen.getCvUrl())
                .ngayTao(donUngTuyen.getNgayTao())
                .chiNhanhId(donUngTuyen.getTinTuyenDung() == null
                        || donUngTuyen.getTinTuyenDung().getChiNhanh() == null
                        || donUngTuyen.getTinTuyenDung().getChiNhanh().getId() == null
                        ? null
                        : donUngTuyen.getTinTuyenDung().getChiNhanh().getId().longValue())
                .chiNhanhTen(donUngTuyen.getTinTuyenDung() == null || donUngTuyen.getTinTuyenDung().getChiNhanh() == null
                        ? null
                        : donUngTuyen.getTinTuyenDung().getChiNhanh().getTen())
                .congTyId(donUngTuyen.getTinTuyenDung() == null
                        || donUngTuyen.getTinTuyenDung().getChiNhanh() == null
                        || donUngTuyen.getTinTuyenDung().getChiNhanh().getCongTy() == null
                        || donUngTuyen.getTinTuyenDung().getChiNhanh().getCongTy().getId() == null
                        ? null
                        : donUngTuyen.getTinTuyenDung().getChiNhanh().getCongTy().getId().longValue())
                .congTyTen(donUngTuyen.getTinTuyenDung() == null
                        || donUngTuyen.getTinTuyenDung().getChiNhanh() == null
                        || donUngTuyen.getTinTuyenDung().getChiNhanh().getCongTy() == null
                        ? null
                        : donUngTuyen.getTinTuyenDung().getChiNhanh().getCongTy().getTen())
                .tinTuyenDungId(donUngTuyen.getTinTuyenDung() == null || donUngTuyen.getTinTuyenDung().getId() == null
                        ? null
                        : donUngTuyen.getTinTuyenDung().getId().longValue())
                .tieuDeTinTuyenDung(donUngTuyen.getTinTuyenDung() == null ? null : donUngTuyen.getTinTuyenDung().getTieuDe())
                .nguoiDungId(user == null || user.getId() == null
                        ? null
                        : user.getId().longValue())
                .ungVienHoTen(user == null
                        ? null
                        : buildFullName(user.getHo(), user.getTen()))
                .ungVienEmail(user == null
                        ? null
                        : user.getEmail())
                .ungVienSoDienThoai(user == null ? null : user.getSoDienThoai())
                .ungVienAnhDaiDienUrl(user == null ? null : user.getAnhDaiDienUrl())
                .hoSoUngVienId(profile == null || profile.getId() == null ? null : profile.getId().longValue())
                .gioiThieuBanThan(profile == null ? null : profile.getGioiThieuBanThan())
                .mucTieuNgheNghiep(profile == null ? null : profile.getMucTieuNgheNghiep());

        if (includeProfileDetail && profile != null && profile.getId() != null) {
            builder
                    .hocVans(mapEducationItems(profile.getId()))
                    .kinhNghiems(mapWorkExperienceItems(profile.getId()))
                    .chungChis(mapCertificateItems(profile.getId()))
                    .kyNangs(mapSkillItems(profile.getId()));
        }

        return builder.build();
    }

    public CompanyAdminApplicationResponse mapCandidateProfileForJob(
            TinTuyenDung tinTuyenDung,
            HoSoUngVien profile,
            boolean includeProfileDetail
    ) {
        var user = profile == null ? null : profile.getNguoiDung();

        CompanyAdminApplicationResponse.CompanyAdminApplicationResponseBuilder builder = CompanyAdminApplicationResponse.builder()
                .id(null)
                .trangThai(null)
                .cvUrl(null)
                .ngayTao(profile == null ? null : profile.getNgayTao())
                .chiNhanhId(tinTuyenDung == null
                        || tinTuyenDung.getChiNhanh() == null
                        || tinTuyenDung.getChiNhanh().getId() == null
                        ? null
                        : tinTuyenDung.getChiNhanh().getId().longValue())
                .chiNhanhTen(tinTuyenDung == null || tinTuyenDung.getChiNhanh() == null
                        ? null
                        : tinTuyenDung.getChiNhanh().getTen())
                .congTyId(tinTuyenDung == null
                        || tinTuyenDung.getChiNhanh() == null
                        || tinTuyenDung.getChiNhanh().getCongTy() == null
                        || tinTuyenDung.getChiNhanh().getCongTy().getId() == null
                        ? null
                        : tinTuyenDung.getChiNhanh().getCongTy().getId().longValue())
                .congTyTen(tinTuyenDung == null
                        || tinTuyenDung.getChiNhanh() == null
                        || tinTuyenDung.getChiNhanh().getCongTy() == null
                        ? null
                        : tinTuyenDung.getChiNhanh().getCongTy().getTen())
                .tinTuyenDungId(tinTuyenDung == null || tinTuyenDung.getId() == null
                        ? null
                        : tinTuyenDung.getId().longValue())
                .tieuDeTinTuyenDung(tinTuyenDung == null ? null : tinTuyenDung.getTieuDe())
                .nguoiDungId(user == null || user.getId() == null
                        ? null
                        : user.getId().longValue())
                .ungVienHoTen(user == null
                        ? null
                        : buildFullName(user.getHo(), user.getTen()))
                .ungVienEmail(user == null
                        ? null
                        : user.getEmail())
                .ungVienSoDienThoai(user == null ? null : user.getSoDienThoai())
                .ungVienAnhDaiDienUrl(user == null ? null : user.getAnhDaiDienUrl())
                .hoSoUngVienId(profile == null || profile.getId() == null ? null : profile.getId().longValue())
                .gioiThieuBanThan(profile == null ? null : profile.getGioiThieuBanThan())
                .mucTieuNgheNghiep(profile == null ? null : profile.getMucTieuNgheNghiep());

        if (includeProfileDetail && profile != null && profile.getId() != null) {
            builder
                    .hocVans(mapEducationItems(profile.getId()))
                    .kinhNghiems(mapWorkExperienceItems(profile.getId()))
                    .chungChis(mapCertificateItems(profile.getId()))
                    .kyNangs(mapSkillItems(profile.getId()));
        }

        return builder.build();
    }

    private List<CompanyAdminApplicationResponse.HocVanItem> mapEducationItems(Integer profileId) {
        return hoSoHocVanRepository.findByHoSoUngVien_IdOrderByHocVan_ThoiGianBatDauDesc(profileId).stream()
                .map(link -> link.getHocVan())
                .filter(Objects::nonNull)
                .map(item -> CompanyAdminApplicationResponse.HocVanItem.builder()
                        .id(item.getId() == null ? null : item.getId().longValue())
                        .tenTruong(item.getTenTruong())
                        .chuyenNganh(item.getChuyenNganh())
                        .bacHoc(item.getBacHoc())
                        .thoiGianBatDau(item.getThoiGianBatDau())
                        .thoiGianKetThuc(item.getThoiGianKetThuc())
                        .duongDanTep(item.getDuongDanTep())
                        .trangThai(item.getTrangThai())
                        .build())
                .toList();
    }

    private List<CompanyAdminApplicationResponse.KinhNghiemItem> mapWorkExperienceItems(Integer profileId) {
        return hoSoKinhNghiemRepository.findByHoSoUngVien_IdOrderByKinhNghiem_ThoiGianBatDauDesc(profileId).stream()
                .map(link -> link.getKinhNghiem())
                .filter(Objects::nonNull)
                .map(item -> CompanyAdminApplicationResponse.KinhNghiemItem.builder()
                        .id(item.getId() == null ? null : item.getId().longValue())
                        .tenCongTy(item.getTenCongTy())
                        .chucDanh(item.getChucDanh())
                        .moTaCongViec(item.getMoTaCongViec())
                        .thoiGianBatDau(item.getThoiGianBatDau())
                        .thoiGianKetThuc(item.getThoiGianKetThuc())
                        .build())
                .toList();
    }

    private List<CompanyAdminApplicationResponse.ChungChiItem> mapCertificateItems(Integer profileId) {
        return hoSoChungChiRepository.findByHoSoUngVien_IdOrderByChungChi_NgayBatDauDesc(profileId).stream()
                .map(link -> link.getChungChi())
                .filter(Objects::nonNull)
                .map(item -> CompanyAdminApplicationResponse.ChungChiItem.builder()
                        .id(item.getId() == null ? null : item.getId().longValue())
                        .loaiChungChiId(item.getLoaiChungChi() == null || item.getLoaiChungChi().getId() == null
                                ? null
                                : item.getLoaiChungChi().getId().longValue())
                        .loaiChungChiTen(item.getLoaiChungChi() == null ? null : item.getLoaiChungChi().getTen())
                        .tenChungChi(item.getTenChungChi())
                        .ngayBatDau(item.getNgayBatDau())
                        .ngayHetHan(item.getNgayHetHan())
                        .duongDanTep(item.getDuongDanTep())
                        .trangThai(item.getTrangThai())
                        .build())
                .toList();
    }

    private List<CompanyAdminApplicationResponse.KyNangItem> mapSkillItems(Integer profileId) {
        return kyNangUngVienRepository.findByHoSoUngVien_Id(profileId).stream()
                .filter(item -> item.getKyNang() != null)
                .map(item -> CompanyAdminApplicationResponse.KyNangItem.builder()
                        .id(item.getKyNang().getId() == null ? null : item.getKyNang().getId().longValue())
                        .ten(item.getKyNang().getTen())
                        .build())
                .toList();
    }

    private String buildFullName(String ho, String ten) {
        return (StringUtils.hasText(ho) ? ho.trim() : "") + " " + (StringUtils.hasText(ten) ? ten.trim() : "");
    }
}
