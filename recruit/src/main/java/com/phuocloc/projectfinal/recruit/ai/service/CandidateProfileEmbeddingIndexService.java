package com.phuocloc.projectfinal.recruit.ai.service;

import com.phuocloc.projectfinal.recruit.candidate.repository.ChungChiUngVienRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.HocVanUngVienRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.KinhNghiemLamViecUngVienRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.KyNangUngVienRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.NganhNgheUngVienRepository;
import com.phuocloc.projectfinal.recruit.domain.ai.entity.ChiMucNhungHoSoUngVien;
import com.phuocloc.projectfinal.recruit.domain.ai.repository.ChiMucNhungHoSoUngVienRepository;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoUngVien;
import com.phuocloc.projectfinal.recruit.infrastructure.qdrant.QdrantClientService;
import com.phuocloc.projectfinal.recruit.infrastructure.qdrant.QdrantProperties;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Đồng bộ chỉ mục nhúng cho hồ sơ ứng viên lên Qdrant + bảng ChiMucNhungHoSoUngVien.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CandidateProfileEmbeddingIndexService {

    private static final String TRANG_THAI_DA_CHI_MUC = "INDEXED";
    private static final String TRANG_THAI_LOI = "FAILED";

    private final ChiMucNhungHoSoUngVienRepository chiMucRepository;
    private final KinhNghiemLamViecUngVienRepository kinhNghiemRepository;
    private final HocVanUngVienRepository hocVanRepository;
    private final ChungChiUngVienRepository chungChiRepository;
    private final KyNangUngVienRepository kyNangRepository;
    private final NganhNgheUngVienRepository nganhNgheRepository;
    private final TextEmbeddingService vanBanNhungService;
    private final QdrantClientService qdrantClientService;
    private final QdrantProperties qdrantProperties;

    /**
     * Đồng bộ một hồ sơ ứng viên lên vector store.
     *
     * <p>Flow:
     * 1) Gom text hồ sơ.
     * 2) Sinh vector embedding.
     * 3) Upsert vào Qdrant.
     * 4) Lưu trạng thái index trong bảng ChiMucNhungHoSoUngVien.</p>
     */
    @Transactional
    public void dongBoChiMuc(HoSoUngVien hoSoUngVien) {
        if (hoSoUngVien == null || hoSoUngVien.getId() == null || !qdrantClientService.isEnabled()) {
            return;
        }
        String pointId = taoMaDiem(hoSoUngVien.getId());

        try {
            String noiDung = ghepNoiDungNhung(hoSoUngVien);
            List<Float> vector = vanBanNhungService.taoVector(noiDung);
            qdrantClientService.upsertPoint(
                    qdrantProperties.getKhoHoSoUngVien(),
                    pointId,
                    vector,
                    taoPayload(hoSoUngVien)
            );
            luuTrangThai(hoSoUngVien, pointId, TRANG_THAI_DA_CHI_MUC);
        } catch (Exception ex) {
            luuTrangThai(hoSoUngVien, pointId, TRANG_THAI_LOI);
            log.warn("Không đồng bộ được chỉ mục nhúng cho hồ sơ ứng viên {}", hoSoUngVien.getId(), ex);
        }
    }

    /**
     * Upsert trạng thái index trong DB để có thể audit và retry khi cần.
     */
    private void luuTrangThai(HoSoUngVien hoSoUngVien, String maDiem, String trangThai) {
        ChiMucNhungHoSoUngVien chiMuc = chiMucRepository.findByHoSoUngVien_Id(hoSoUngVien.getId())
                .orElseGet(ChiMucNhungHoSoUngVien::new);
        chiMuc.setHoSoUngVien(hoSoUngVien);
        chiMuc.setMaDiem(maDiem);
        chiMuc.setTrangThai(trangThai);
        chiMucRepository.save(chiMuc);
    }

    private String taoMaDiem(Integer hoSoUngVienId) {
        return "ho-so-ung-vien-" + hoSoUngVienId;
    }

    /**
     * Metadata phụ lưu kèm point trên Qdrant để phục vụ filter/debug.
     */
    private Map<String, Object> taoPayload(HoSoUngVien hoSoUngVien) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("hoSoUngVienId", hoSoUngVien.getId());
        payload.put("nguoiDungId", hoSoUngVien.getNguoiDung() == null ? null : hoSoUngVien.getNguoiDung().getId());
        payload.put("ngayCapNhat", hoSoUngVien.getNgayCapNhat() == null ? null : hoSoUngVien.getNgayCapNhat().toString());
        return payload;
    }

    /**
     * Hợp nhất toàn bộ nội dung hồ sơ thành một text duy nhất trước khi embedding.
     * Cách này giúp vector thể hiện ngữ cảnh tổng thể của ứng viên.
     */
    private String ghepNoiDungNhung(HoSoUngVien hoSoUngVien) {
        StringBuilder sb = new StringBuilder(1024);

        append(sb, "Muc tieu nghe nghiep", hoSoUngVien.getMucTieuNgheNghiep());
        append(sb, "Gioi thieu ban than", hoSoUngVien.getGioiThieuBanThan());

        kyNangRepository.findByHoSoUngVien_Id(hoSoUngVien.getId()).forEach(item -> {
            if (item.getKyNang() != null) {
                append(sb, "Ky nang", item.getKyNang().getTen());
            }
        });
        nganhNgheRepository.findByHoSoUngVien_Id(hoSoUngVien.getId()).forEach(item -> {
            if (item.getNganhNghe() != null) {
                append(sb, "Nganh nghe quan tam", item.getNganhNghe().getTen());
            }
        });
        kinhNghiemRepository.findByHoSoUngVien_IdOrderByThoiGianBatDauDesc(hoSoUngVien.getId()).forEach(item -> {
            append(sb, "Kinh nghiem", item.getChucDanh());
            append(sb, "Cong ty", item.getTenCongTy());
            append(sb, "Mo ta cong viec", item.getMoTaCongViec());
            appendKhoangThoiGian(sb, "Thoi gian kinh nghiem", item.getThoiGianBatDau(), item.getThoiGianKetThuc());
        });
        hocVanRepository.findByHoSoUngVien_IdOrderByThoiGianBatDauDesc(hoSoUngVien.getId()).forEach(item -> {
            append(sb, "Hoc van", item.getBacHoc());
            append(sb, "Chuyen nganh", item.getChuyenNganh());
            append(sb, "Truong", item.getTenTruong());
            appendKhoangThoiGian(sb, "Thoi gian hoc", item.getThoiGianBatDau(), item.getThoiGianKetThuc());
        });
        chungChiRepository.findByHoSoUngVien_IdOrderByNgayBatDauDesc(hoSoUngVien.getId()).forEach(item -> {
            append(sb, "Chung chi", item.getTenChungChi());
            if (item.getLoaiChungChi() != null) {
                append(sb, "Loai chung chi", item.getLoaiChungChi().getTen());
            }
        });

        return sb.toString();
    }

    /**
     * Chuẩn hóa cách ghi mốc thời gian thành chuỗi để model embedding hiểu liên tục quá trình.
     */
    private void appendKhoangThoiGian(StringBuilder sb, String label, LocalDate from, LocalDate to) {
        if (from == null && to == null) {
            return;
        }
        sb.append(label).append(": ")
                .append(from == null ? "?" : from)
                .append(" - ")
                .append(to == null ? "nay" : to)
                .append('\n');
    }

    /**
     * Append cặp nhãn-giá-trị theo format thống nhất.
     */
    private void append(StringBuilder sb, String label, String value) {
        if (!StringUtils.hasText(value)) {
            return;
        }
        sb.append(label).append(": ").append(value.trim()).append('\n');
    }
}
