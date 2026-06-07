package com.phuocloc.projectfinal.recruit.candidate.service;

import com.phuocloc.projectfinal.recruit.candidate.dto.response.CandidateProfileMetadataResponse;
import com.phuocloc.projectfinal.recruit.candidate.dto.response.CandidateProfileResponse;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.KyNang;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.NganhNghe;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.ChungChiUngVien;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HocVanUngVien;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.KinhNghiemLamViecUngVien;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.LoaiChungChi;
import org.springframework.stereotype.Component;
import com.phuocloc.projectfinal.recruit.common.util.ServiceUtils;

/**
 * Mapper chuyên trách chuyển entity hồ sơ ứng viên sang response DTO cho frontend.
 * Tách mapper riêng giúp service giữ trọng tâm ở nghiệp vụ và quyền truy cập,
 * còn phần định dạng dữ liệu trả về được gom về một nơi.
 */
@Component
public class CandidateProfileMapper {

    /**
     * Chuyển skill master data thành option item cho dropdown/tag picker phía frontend.
     */
    public CandidateProfileMetadataResponse.OptionItem mapSkillOption(KyNang skill) {
        return CandidateProfileMetadataResponse.OptionItem.builder()
                .id(ServiceUtils.toLong(skill.getId()))
                .ten(skill.getTen())
                .build();
    }

    /**
     * Chuyển ngành nghề master data thành option item cho UI chọn ngành nghề quan tâm.
     */
    public CandidateProfileMetadataResponse.OptionItem mapNganhNgheOption(NganhNghe nganhNghe) {
        return CandidateProfileMetadataResponse.OptionItem.builder()
                .id(ServiceUtils.toLong(nganhNghe.getId()))
                .ten(nganhNghe.getTen())
                .build();
    }

    /**
     * Chuyển loại chứng chỉ master data thành option item.
     */
    public CandidateProfileMetadataResponse.OptionItem mapLoaiChungChiOption(LoaiChungChi item) {
        return CandidateProfileMetadataResponse.OptionItem.builder()
                .id(ServiceUtils.toLong(item.getId()))
                .ten(item.getTen())
                .build();
    }

    /**
     * Chuyển bản ghi học vấn của một hồ sơ cụ thể sang DTO trả về cho màn profile.
     */
    public CandidateProfileResponse.HocVanItem mapHocVan(HocVanUngVien entity) {
        return mapHocVan(entity, true);
    }

    public CandidateProfileResponse.HocVanItem mapHocVan(HocVanUngVien entity, boolean duocChon) {
        return CandidateProfileResponse.HocVanItem.builder()
                .id(ServiceUtils.toLong(entity.getId()))
                .duocChon(duocChon)
                .tenTruong(entity.getTenTruong())
                .chuyenNganh(entity.getChuyenNganh())
                .bacHoc(entity.getBacHoc())
                .thoiGianBatDau(entity.getThoiGianBatDau())
                .thoiGianKetThuc(entity.getThoiGianKetThuc())
                .duongDanTep(entity.getDuongDanTep())
                .trangThai(entity.getTrangThai())
                .build();
    }

    /**
     * Chuyển bản ghi kinh nghiệm làm việc sang DTO hiển thị trong profile.
     */
    public CandidateProfileResponse.KinhNghiemItem mapKinhNghiem(KinhNghiemLamViecUngVien entity) {
        return mapKinhNghiem(entity, true);
    }

    public CandidateProfileResponse.KinhNghiemItem mapKinhNghiem(KinhNghiemLamViecUngVien entity, boolean duocChon) {
        return CandidateProfileResponse.KinhNghiemItem.builder()
                .id(ServiceUtils.toLong(entity.getId()))
                .duocChon(duocChon)
                .tenCongTy(entity.getTenCongTy())
                .chucDanh(entity.getChucDanh())
                .moTaCongViec(entity.getMoTaCongViec())
                .thoiGianBatDau(entity.getThoiGianBatDau())
                .thoiGianKetThuc(entity.getThoiGianKetThuc())
                .build();
    }

    /**
     * Chuyển bản ghi chứng chỉ ứng viên sang DTO,
     * đồng thời flatten thêm id/tên loại chứng chỉ để frontend không phải tự suy luận.
     */
    public CandidateProfileResponse.ChungChiItem mapChungChi(ChungChiUngVien entity) {
        return mapChungChi(entity, true);
    }

    public CandidateProfileResponse.ChungChiItem mapChungChi(ChungChiUngVien entity, boolean duocChon) {
        return CandidateProfileResponse.ChungChiItem.builder()
                .id(ServiceUtils.toLong(entity.getId()))
                .duocChon(duocChon)
                .loaiChungChiId(entity.getLoaiChungChi() == null ? null : ServiceUtils.toLong(entity.getLoaiChungChi().getId()))
                .loaiChungChiTen(entity.getLoaiChungChi() == null ? null : entity.getLoaiChungChi().getTen())
                .tenChungChi(entity.getTenChungChi())
                .ngayBatDau(entity.getNgayBatDau())
                .ngayHetHan(entity.getNgayHetHan())
                .duongDanTep(entity.getDuongDanTep())
                .trangThai(entity.getTrangThai())
                .build();
    }

    /**
     * Map kỹ năng đã gán cho hồ sơ ứng viên sang DTO đơn giản cho giao diện tag list.
     */
    public CandidateProfileResponse.KyNangItem mapKyNang(KyNang skill) {
        return mapKyNang(skill, true);
    }

    public CandidateProfileResponse.KyNangItem mapKyNang(KyNang skill, boolean duocChon) {
        return CandidateProfileResponse.KyNangItem.builder()
                .id(ServiceUtils.toLong(skill.getId()))
                .duocChon(duocChon)
                .ten(skill.getTen())
                .build();
    }

    /**
     * Map ngành nghề ứng viên đã chọn sang DTO cho trang profile.
     */
    public CandidateProfileResponse.NganhNgheItem mapNganhNghe(NganhNghe nganhNghe) {
        return CandidateProfileResponse.NganhNgheItem.builder()
                .id(ServiceUtils.toLong(nganhNghe.getId()))
                .ten(nganhNghe.getTen())
                .build();
    }
}
