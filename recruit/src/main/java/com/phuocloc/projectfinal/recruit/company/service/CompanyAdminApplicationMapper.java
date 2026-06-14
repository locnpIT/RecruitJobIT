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
import com.phuocloc.projectfinal.recruit.common.util.ServiceUtils;

@Component
@RequiredArgsConstructor
public class CompanyAdminApplicationMapper {

    private final HoSoHocVanRepository hoSoHocVanRepository;
    private final HoSoKinhNghiemRepository hoSoKinhNghiemRepository;
    private final HoSoChungChiRepository hoSoChungChiRepository;
    private final KyNangUngVienRepository kyNangUngVienRepository;

    public CompanyAdminApplicationResponse mapApplication(DonUngTuyen donUngTuyen, boolean includeProfileDetail) {
        HoSoUngVien profile = donUngTuyen.getHoSoUngVien();

        CompanyAdminApplicationResponse.CompanyAdminApplicationResponseBuilder builder = CompanyAdminApplicationResponse.builder()
                .id(ServiceUtils.toLong(donUngTuyen.getId()))
                .trangThai(donUngTuyen.getTrangThai())
                .cvUrl(donUngTuyen.getCvUrl())
                .thoiGianGuiThuMoi(donUngTuyen.getThoiGianGuiThuMoi())
                .ngayTao(donUngTuyen.getNgayTao());
        fillJobFields(builder, donUngTuyen.getTinTuyenDung());
        fillProfileFields(builder, profile);

        if (includeProfileDetail && profile != null && profile.getId() != null) {
            builder.hocVans(mapEducationItems(profile.getId()))
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
        CompanyAdminApplicationResponse.CompanyAdminApplicationResponseBuilder builder = CompanyAdminApplicationResponse.builder()
                .id(null).trangThai(null).cvUrl(null).thoiGianGuiThuMoi(null)
                .ngayTao(profile == null ? null : profile.getNgayTao());
        fillJobFields(builder, tinTuyenDung);
        fillProfileFields(builder, profile);

        if (includeProfileDetail && profile != null && profile.getId() != null) {
            builder.hocVans(mapEducationItems(profile.getId()))
                    .kinhNghiems(mapWorkExperienceItems(profile.getId()))
                    .chungChis(mapCertificateItems(profile.getId()))
                    .kyNangs(mapSkillItems(profile.getId()));
        }
        return builder.build();
    }

    private void fillJobFields(CompanyAdminApplicationResponse.CompanyAdminApplicationResponseBuilder builder,
            TinTuyenDung tinTuyenDung) {
        var branch = tinTuyenDung == null || tinTuyenDung.getChiNhanhs() == null
                ? null
                : tinTuyenDung.getChiNhanhs().stream().findFirst().orElse(null);
        builder.chiNhanhId(branch == null ? null : ServiceUtils.toLong(branch.getId()))
                .chiNhanhTen(branch == null ? null : branch.getTen())
                .congTyId(branch == null || branch.getCongTy() == null
                        ? null : ServiceUtils.toLong(branch.getCongTy().getId()))
                .congTyTen(branch == null || branch.getCongTy() == null
                        ? null : branch.getCongTy().getTen())
                .tinTuyenDungId(tinTuyenDung == null ? null : ServiceUtils.toLong(tinTuyenDung.getId()))
                .tieuDeTinTuyenDung(tinTuyenDung == null ? null : tinTuyenDung.getTieuDe());
    }

    private void fillProfileFields(CompanyAdminApplicationResponse.CompanyAdminApplicationResponseBuilder builder,
            HoSoUngVien profile) {
        var user = profile == null ? null : profile.getNguoiDung();
        builder.nguoiDungId(user == null ? null : ServiceUtils.toLong(user.getId()))
                .ungVienHoTen(user == null ? null : ServiceUtils.buildFullName(user.getHo(), user.getTen()))
                .ungVienEmail(user == null ? null : user.getEmail())
                .ungVienSoDienThoai(user == null ? null : user.getSoDienThoai())
                .ungVienAnhDaiDienUrl(user == null ? null : user.getAnhDaiDienUrl())
                .hoSoUngVienId(profile == null ? null : ServiceUtils.toLong(profile.getId()))
                .gioiThieuBanThan(profile == null ? null : profile.getGioiThieuBanThan())
                .mucTieuNgheNghiep(profile == null ? null : profile.getMucTieuNgheNghiep());
    }

    private List<CompanyAdminApplicationResponse.HocVanItem> mapEducationItems(Integer profileId) {
        return hoSoHocVanRepository.findByHoSoUngVien_IdOrderByHocVan_ThoiGianBatDauDesc(profileId).stream()
                .map(link -> link.getHocVan())
                .filter(Objects::nonNull)
                .map(item -> CompanyAdminApplicationResponse.HocVanItem.builder()
                        .id(ServiceUtils.toLong(item.getId()))
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
                        .id(ServiceUtils.toLong(item.getId()))
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
                        .id(ServiceUtils.toLong(item.getId()))
                        .loaiChungChiId(item.getLoaiChungChi() == null ? null : ServiceUtils.toLong(item.getLoaiChungChi().getId()))
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
                        .id(ServiceUtils.toLong(item.getKyNang().getId()))
                        .ten(item.getKyNang().getTen())
                        .build())
                .toList();
    }

}
