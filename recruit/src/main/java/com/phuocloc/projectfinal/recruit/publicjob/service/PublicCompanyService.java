package com.phuocloc.projectfinal.recruit.publicjob.service;

import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.PublicTopCompanyProjection;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.TinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.publicjob.dto.response.PublicTopCompanyResponse;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
/**
 * Service public trả về danh sách công ty nổi bật trên homepage.
 *
 * <p>Chỉ lấy công ty đã duyệt, có tin tuyển dụng public còn hiệu lực
 * và có gói đăng bài đang hoạt động + thanh toán thành công.</p>
 */
public class PublicCompanyService {

    private static final int DEFAULT_LIMIT = 8;
    private static final int MAX_LIMIT = 10;

    private final TinTuyenDungRepository tinTuyenDungRepository;

    @Transactional(readOnly = true)
    public List<PublicTopCompanyResponse> listTopCompanies(Integer limit) {
        int safeLimit = limit == null || limit <= 0 ? DEFAULT_LIMIT : Math.min(limit, MAX_LIMIT);

        return tinTuyenDungRepository.findPublicTopCompaniesWithActivePackage(
                        LocalDateTime.now(),
                        PageRequest.of(0, safeLimit)
                ).stream()
                .map(this::mapTopCompany)
                .toList();
    }

    private PublicTopCompanyResponse mapTopCompany(PublicTopCompanyProjection projection) {
        return PublicTopCompanyResponse.builder()
                .id(projection.getCompanyId() == null ? null : projection.getCompanyId().longValue())
                .ten(projection.getCompanyName())
                .duongDanLogo(projection.getLogoUrl())
                .build();
    }
}
