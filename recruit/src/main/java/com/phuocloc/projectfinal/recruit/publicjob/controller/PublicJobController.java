package com.phuocloc.projectfinal.recruit.publicjob.controller;

import com.phuocloc.projectfinal.recruit.common.response.SuccessResponse;
import com.phuocloc.projectfinal.recruit.publicjob.dto.response.PublicJobDetailResponse;
import com.phuocloc.projectfinal.recruit.publicjob.dto.response.PublicJobSummaryResponse;
import com.phuocloc.projectfinal.recruit.publicjob.service.PublicJobService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public/jobs")
@RequiredArgsConstructor
/**
 * Public API cho ứng viên/khách truy cập xem tin tuyển dụng.
 *
 * <p>Controller này chỉ expose dữ liệu đã qua bộ lọc nghiệp vụ trong
 * {@link PublicJobService}: tin APPROVED, chưa hết hạn, công ty đã duyệt.</p>
 */
public class PublicJobController {

    private final PublicJobService publicJobService;

    @GetMapping
    // Lấy danh sách tin đang hiển thị public, dùng cho homepage/search job.
    public ResponseEntity<SuccessResponse<List<PublicJobSummaryResponse>>> listJobs(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer limit
    ) {
        return ResponseEntity.ok(new SuccessResponse<>(
                "Lấy danh sách tin tuyển dụng public thành công",
                publicJobService.listJobs(keyword, location, limit)
        ));
    }

    @GetMapping("/{jobId}")
    // Lấy chi tiết một tin public theo id; nếu tin chưa duyệt/hết hạn sẽ trả 404.
    public ResponseEntity<SuccessResponse<PublicJobDetailResponse>> getJobDetail(
            @PathVariable Long jobId
    ) {
        return ResponseEntity.ok(new SuccessResponse<>(
                "Lấy chi tiết tin tuyển dụng public thành công",
                publicJobService.getJobDetail(jobId)
        ));
    }
}
