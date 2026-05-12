package com.phuocloc.projectfinal.recruit.candidate.service;

import com.phuocloc.projectfinal.recruit.candidate.dto.response.CandidateProfileMetadataResponse;
import com.phuocloc.projectfinal.recruit.candidate.dto.response.CandidateProfileResponse;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.KyNang;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.ChungChiUngVien;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HocVanUngVien;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.LoaiChungChi;
import org.springframework.stereotype.Component;

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
                .id(skill.getId() == null ? null : skill.getId().longValue())
                .ten(skill.getTen())
                .build();
    }

    /**
     * Chuyển loại chứng chỉ master data thành option item.
     */
    public CandidateProfileMetadataResponse.OptionItem mapLoaiChungChiOption(LoaiChungChi item) {
        return CandidateProfileMetadataResponse.OptionItem.builder()
                .id(item.getId() == null ? null : item.getId().longValue())
                .ten(item.getTen())
                .build();
    }

    /**
     * Chuyển bản ghi học vấn của một hồ sơ cụ thể sang DTO trả về cho màn profile.
     */
    public CandidateProfileResponse.HocVanItem mapHocVan(HocVanUngVien entity) {
        return CandidateProfileResponse.HocVanItem.builder()
                .id(entity.getId() == null ? null : entity.getId().longValue())
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
     * Chuyển bản ghi chứng chỉ ứng viên sang DTO,
     * đồng thời flatten thêm id/tên loại chứng chỉ để frontend không phải tự suy luận.
     */
    public CandidateProfileResponse.ChungChiItem mapChungChi(ChungChiUngVien entity) {
        return CandidateProfileResponse.ChungChiItem.builder()
                .id(entity.getId() == null ? null : entity.getId().longValue())
                .loaiChungChiId(entity.getLoaiChungChi() == null || entity.getLoaiChungChi().getId() == null
                        ? null : entity.getLoaiChungChi().getId().longValue())
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
        return CandidateProfileResponse.KyNangItem.builder()
                .id(skill.getId() == null ? null : skill.getId().longValue())
                .ten(skill.getTen())
                .build();
    }
}
