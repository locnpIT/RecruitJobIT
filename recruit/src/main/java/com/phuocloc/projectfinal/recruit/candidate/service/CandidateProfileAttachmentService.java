package com.phuocloc.projectfinal.recruit.candidate.service;

import com.phuocloc.projectfinal.recruit.ai.service.KinhNghiemEmbeddingIndexService;
import com.phuocloc.projectfinal.recruit.candidate.repository.ChungChiUngVienRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.HoSoChungChiRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.HoSoHocVanRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.HoSoKinhNghiemRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.HocVanUngVienRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.KinhNghiemLamViecUngVienRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.KyNangUngVienRepository;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoChungChi;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoHocVan;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoKinhNghiem;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoUngVien;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.KyNangUngVien;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CandidateProfileAttachmentService {

    private final HocVanUngVienRepository hocVanUngVienRepository;
    private final KinhNghiemLamViecUngVienRepository kinhNghiemLamViecUngVienRepository;
    private final ChungChiUngVienRepository chungChiUngVienRepository;
    private final KyNangUngVienRepository kyNangUngVienRepository;
    private final HoSoHocVanRepository hoSoHocVanRepository;
    private final HoSoKinhNghiemRepository hoSoKinhNghiemRepository;
    private final HoSoChungChiRepository hoSoChungChiRepository;
    private final KinhNghiemEmbeddingIndexService kinhNghiemEmbeddingIndexService;

    public void attachExistingContentByDefault(HoSoUngVien profile, Integer nguoiDungId, Integer sourceProfileId) {
        if (profile == null || profile.getId() == null || nguoiDungId == null) {
            return;
        }

        // Hồ sơ mới mặc định dùng lại các mục ứng viên đã khai báo để không mất dữ liệu hồ sơ cũ.
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

        // Kinh nghiệm là một nguồn index riêng, nên hồ sơ mới cần sync lại từng kinh nghiệm gốc của user.
        kinhNghiemLamViecUngVienRepository.findByNguoiDung_IdOrderByThoiGianBatDauDesc(nguoiDungId)
                .forEach(kinhNghiemEmbeddingIndexService::syncIndex);

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
}
