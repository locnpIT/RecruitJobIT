package com.phuocloc.projectfinal.recruit.domain.diadiem.controller;

import com.phuocloc.projectfinal.recruit.common.response.SuccessResponse;
import com.phuocloc.projectfinal.recruit.domain.diadiem.dto.response.TinhThanhResponse;
import com.phuocloc.projectfinal.recruit.domain.diadiem.dto.response.XaPhuongResponse;
import com.phuocloc.projectfinal.recruit.domain.diadiem.repository.TinhThanhRepository;
import com.phuocloc.projectfinal.recruit.domain.diadiem.repository.XaPhuongRepository;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/locations")
/**
 * API metadata địa điểm.
 *
 * <p>Frontend dùng controller này để load tỉnh/thành và phường/xã cho các form
 * đăng ký công ty, tạo chi nhánh và các form có địa điểm hành chính.</p>
 */
public class LocationController {

    private final TinhThanhRepository tinhThanhRepository;
    private final XaPhuongRepository xaPhuongRepository;

    public LocationController(
            TinhThanhRepository tinhThanhRepository,
            XaPhuongRepository xaPhuongRepository
    ) {
        this.tinhThanhRepository = tinhThanhRepository;
        this.xaPhuongRepository = xaPhuongRepository;
    }

    @GetMapping("/tinh-thanh")
    // Lấy danh sách toàn bộ tỉnh/thành theo thứ tự tên tăng dần để render dropdown tỉnh/thành.
    public ResponseEntity<SuccessResponse<List<TinhThanhResponse>>> tinhThanh() {
        List<TinhThanhResponse> data = tinhThanhRepository.findAll(Sort.by(Sort.Direction.ASC, "ten")).stream()
                .map(item -> TinhThanhResponse.builder()
                        .id(item.getId() == null ? null : item.getId().longValue())
                        .ten(item.getTen())
                        .moTa(item.getMoTa())
                        .build())
                .toList();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách tỉnh thành thành công", data));
    }

    @GetMapping("/xa-phuong")
    // Lấy danh sách phường/xã theo tỉnh thành đã chọn.
    // Frontend gọi route này khi user chọn một tỉnh/thành trong form.
    public ResponseEntity<SuccessResponse<List<XaPhuongResponse>>> xaPhuong(
            @RequestParam Integer tinhThanhId
    ) {
        List<XaPhuongResponse> data = xaPhuongRepository.findByTinhThanh_IdOrderByTenAsc(tinhThanhId).stream()
                .map(item -> XaPhuongResponse.builder()
                        .id(item.getId() == null ? null : item.getId().longValue())
                        .ten(item.getTen())
                        .moTa(item.getMoTa())
                        .tinhThanhId(item.getTinhThanh() == null || item.getTinhThanh().getId() == null
                                ? null
                                : item.getTinhThanh().getId().longValue())
                        .tinhThanhTen(item.getTinhThanh() == null ? null : item.getTinhThanh().getTen())
                        .build())
                .toList();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách phường xã thành công", data));
    }
}
