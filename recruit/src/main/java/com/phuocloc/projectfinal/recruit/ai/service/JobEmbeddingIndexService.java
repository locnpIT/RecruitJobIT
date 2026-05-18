package com.phuocloc.projectfinal.recruit.ai.service;

import com.phuocloc.projectfinal.recruit.domain.ai.entity.ChiMucNhungTinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.ai.repository.ChiMucNhungTinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.KyNangTinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.infrastructure.qdrant.QdrantClientService;
import com.phuocloc.projectfinal.recruit.infrastructure.qdrant.QdrantProperties;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Đồng bộ chỉ mục nhúng cho tin tuyển dụng lên Qdrant + bảng ChiMucNhungTinTuyenDung.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JobEmbeddingIndexService {

    private static final String TRANG_THAI_DA_CHI_MUC = "INDEXED";
    private static final String TRANG_THAI_TAM_DUNG = "INACTIVE";
    private static final String TRANG_THAI_LOI = "FAILED";

    private final ChiMucNhungTinTuyenDungRepository chiMucRepository;
    private final KyNangTinTuyenDungRepository kyNangTinTuyenDungRepository;
    private final TextEmbeddingService vanBanNhungService;
    private final QdrantClientService qdrantClientService;
    private final QdrantProperties qdrantProperties;

    /**
     * Đồng bộ hoặc tạm dừng index cho một tin tuyển dụng.
     *
     * <p>Chỉ index các tin đang được phép hiển thị public (`APPROVED`, chưa xóa mềm).
     * Các tin còn lại sẽ bị rút khỏi vector store để tránh xuất hiện trong kết quả semantic.</p>
     */
    @Transactional
    public void dongBoHoacTamDungChiMuc(TinTuyenDung tinTuyenDung) {
        if (tinTuyenDung == null || tinTuyenDung.getId() == null || !qdrantClientService.isEnabled()) {
            return;
        }
        String pointId = taoMaDiem(tinTuyenDung.getId());

        // Chỉ index tin đang hoạt động public; còn lại xóa khỏi vector store để kết quả semantic sạch.
        if (!laTinHoatDongDeTimKiem(tinTuyenDung)) {
            try {
                qdrantClientService.deletePoint(qdrantProperties.getKhoTinTuyenDung(), pointId);
            } catch (Exception ex) {
                log.debug("Không xóa được point {} khỏi Qdrant (có thể chưa tồn tại)", pointId, ex);
            }
            luuTrangThai(tinTuyenDung, pointId, TRANG_THAI_TAM_DUNG);
            return;
        }

        try {
            String noiDung = ghepNoiDungNhung(tinTuyenDung);
            List<Float> vector = vanBanNhungService.taoVector(noiDung);
            qdrantClientService.upsertPoint(
                    qdrantProperties.getKhoTinTuyenDung(),
                    pointId,
                    vector,
                    taoPayload(tinTuyenDung)
            );
            luuTrangThai(tinTuyenDung, pointId, TRANG_THAI_DA_CHI_MUC);
        } catch (Exception ex) {
            luuTrangThai(tinTuyenDung, pointId, TRANG_THAI_LOI);
            log.warn("Không đồng bộ được chỉ mục nhúng cho tin tuyển dụng {}", tinTuyenDung.getId(), ex);
        }
    }

    /**
     * Rule active của semantic search job.
     */
    private boolean laTinHoatDongDeTimKiem(TinTuyenDung tinTuyenDung) {
        return tinTuyenDung.getNgayXoa() == null && "APPROVED".equalsIgnoreCase(tinTuyenDung.getTrangThai());
    }

    /**
     * Lưu trạng thái index trong DB để có thể quan sát và retry theo job.
     */
    private void luuTrangThai(TinTuyenDung tinTuyenDung, String maDiem, String trangThai) {
        ChiMucNhungTinTuyenDung chiMuc = chiMucRepository.findByTinTuyenDung_Id(tinTuyenDung.getId())
                .orElseGet(ChiMucNhungTinTuyenDung::new);
        chiMuc.setTinTuyenDung(tinTuyenDung);
        chiMuc.setMaDiem(maDiem);
        chiMuc.setTrangThai(trangThai);
        chiMucRepository.save(chiMuc);
    }

    private String taoMaDiem(Integer tinTuyenDungId) {
        return "tin-tuyen-dung-" + tinTuyenDungId;
    }

    /**
     * Payload phụ trợ của point để dùng khi filter/debug trên Qdrant.
     */
    private Map<String, Object> taoPayload(TinTuyenDung tinTuyenDung) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("tinTuyenDungId", tinTuyenDung.getId());
        payload.put("trangThai", tinTuyenDung.getTrangThai());
        payload.put("nganhNghe", tinTuyenDung.getNganhNghe() == null ? null : tinTuyenDung.getNganhNghe().getTen());
        payload.put("congTy", tinTuyenDung.getChiNhanh() == null || tinTuyenDung.getChiNhanh().getCongTy() == null
                ? null
                : tinTuyenDung.getChiNhanh().getCongTy().getTen());
        payload.put("ngayCapNhat", tinTuyenDung.getNgayCapNhat() == null ? null : tinTuyenDung.getNgayCapNhat().toString());
        return payload;
    }

    /**
     * Gom toàn bộ thông tin job thành text ngữ nghĩa:
     * mô tả/yêu cầu/phúc lợi, metadata nghề nghiệp, địa điểm, kỹ năng.
     */
    private String ghepNoiDungNhung(TinTuyenDung tinTuyenDung) {
        StringBuilder sb = new StringBuilder(1024);
        append(sb, "Tieu de", tinTuyenDung.getTieuDe());
        append(sb, "Mo ta", tinTuyenDung.getMoTa());
        append(sb, "Yeu cau", tinTuyenDung.getYeuCau());
        append(sb, "Phuc loi", tinTuyenDung.getPhucLoi());
        append(sb, "Nganh nghe", tinTuyenDung.getNganhNghe() == null ? null : tinTuyenDung.getNganhNghe().getTen());
        append(sb, "Loai hinh lam viec", tinTuyenDung.getLoaiHinhLamViec() == null ? null : tinTuyenDung.getLoaiHinhLamViec().getTen());
        append(sb, "Cap do kinh nghiem", tinTuyenDung.getCapDoKinhNghiem() == null ? null : tinTuyenDung.getCapDoKinhNghiem().getTen());
        append(sb, "Cong ty", tinTuyenDung.getChiNhanh() == null || tinTuyenDung.getChiNhanh().getCongTy() == null
                ? null
                : tinTuyenDung.getChiNhanh().getCongTy().getTen());
        append(sb, "Chi nhanh", tinTuyenDung.getChiNhanh() == null ? null : tinTuyenDung.getChiNhanh().getTen());
        append(sb, "Dia chi chi tiet", tinTuyenDung.getChiNhanh() == null ? null : tinTuyenDung.getChiNhanh().getDiaChiChiTiet());
        if (tinTuyenDung.getChiNhanh() != null && tinTuyenDung.getChiNhanh().getXaPhuong() != null) {
            append(sb, "Xa phuong", tinTuyenDung.getChiNhanh().getXaPhuong().getTen());
            if (tinTuyenDung.getChiNhanh().getXaPhuong().getTinhThanh() != null) {
                append(sb, "Tinh thanh", tinTuyenDung.getChiNhanh().getXaPhuong().getTinhThanh().getTen());
            }
        }
        append(sb, "Luong toi thieu", tinTuyenDung.getLuongToiThieu() == null ? null : tinTuyenDung.getLuongToiThieu().toString());
        append(sb, "Luong toi da", tinTuyenDung.getLuongToiDa() == null ? null : tinTuyenDung.getLuongToiDa().toString());
        append(sb, "So luong tuyen", tinTuyenDung.getSoLuongTuyen() == null ? null : tinTuyenDung.getSoLuongTuyen().toString());
        append(sb, "Bat buoc cv", Boolean.TRUE.equals(tinTuyenDung.getBatBuocCV()) ? "co" : "khong");

        kyNangTinTuyenDungRepository.findByTinTuyenDungIdOrderByKyNangTenAsc(tinTuyenDung.getId()).forEach(item -> {
            if (item.getKyNang() != null) {
                append(sb, "Ky nang", item.getKyNang().getTen());
            }
        });

        return sb.toString();
    }

    /**
     * Append trường text theo format thống nhất trước khi embedding.
     */
    private void append(StringBuilder sb, String label, String value) {
        if (!StringUtils.hasText(value)) {
            return;
        }
        sb.append(label).append(": ").append(value.trim()).append('\n');
    }
}
