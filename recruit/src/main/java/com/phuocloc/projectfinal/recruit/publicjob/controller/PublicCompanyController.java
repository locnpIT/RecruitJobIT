package com.phuocloc.projectfinal.recruit.publicjob.controller;

import com.phuocloc.projectfinal.recruit.common.response.SuccessResponse;
import com.phuocloc.projectfinal.recruit.publicjob.dto.response.PublicTopCompanyResponse;
import com.phuocloc.projectfinal.recruit.publicjob.service.PublicCompanyService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public/companies")
@RequiredArgsConstructor
/**
 * Public API cho danh sách công ty nổi bật.
 */
public class PublicCompanyController {

    private final PublicCompanyService publicCompanyService;

    @GetMapping("/top")
    public ResponseEntity<SuccessResponse<List<PublicTopCompanyResponse>>> listTopCompanies(
            @RequestParam(required = false) Integer gioiHan,
            @RequestParam(required = false) Integer limit
    ) {
        Integer safeGioiHan = gioiHan != null ? gioiHan : limit;
        return ResponseEntity.ok(new SuccessResponse<>(
                "Lấy danh sách công ty nổi bật thành công",
                publicCompanyService.listTopCompanies(safeGioiHan)
        ));
    }
}
