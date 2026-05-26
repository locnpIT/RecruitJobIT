package com.phuocloc.projectfinal.recruit.publicjob.service;

import com.phuocloc.projectfinal.recruit.infrastructure.elasticsearch.ElasticsearchClientService;
import com.phuocloc.projectfinal.recruit.infrastructure.elasticsearch.ElasticsearchProperties;
import com.phuocloc.projectfinal.recruit.infrastructure.elasticsearch.ElasticsearchSearchResult;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Nghiệp vụ xây query DSL và gọi Elasticsearch cho luồng search public jobs.
 */
@Service
@RequiredArgsConstructor
public class PublicJobElasticsearchSearchService {

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 12;
    private static final int MAX_SIZE = 30;

    private final ElasticsearchClientService elasticsearchClientService;
    private final ElasticsearchProperties elasticsearchProperties;

    public boolean isEnabled() {
        return elasticsearchClientService.isEnabled();
    }

    public int normalizePage(Integer page) {
        if (page == null || page < 0) {
            return DEFAULT_PAGE;
        }
        return page;
    }

    public int normalizeSize(Integer size) {
        if (size == null || size <= 0) {
            return DEFAULT_SIZE;
        }
        return Math.min(size, MAX_SIZE);
    }

    /**
     * Search danh sách job-id theo keyword + filter.
     */
    public ElasticsearchSearchResult searchJobIds(
            String tuKhoa,
            String diaDiem,
            Integer nganhNgheId,
            Integer loaiHinhLamViecId,
            Integer capDoKinhNghiemId,
            Integer page,
            Integer size
    ) {
        int safePage = normalizePage(page);
        int safeSize = normalizeSize(size);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("from", safePage * safeSize);
        body.put("size", safeSize);
        body.put("track_total_hits", true);
        body.put("query", buildQuery(tuKhoa, diaDiem, nganhNgheId, loaiHinhLamViecId, capDoKinhNghiemId));
        body.put("sort", List.of(
                Map.of("_score", "desc"),
                Map.of("ngayTaoEpoch", "desc")
        ));
        return elasticsearchClientService.searchDocuments(elasticsearchProperties.getJobIndex(), body);
    }

    private Map<String, Object> buildQuery(
            String tuKhoa,
            String diaDiem,
            Integer nganhNgheId,
            Integer loaiHinhLamViecId,
            Integer capDoKinhNghiemId
    ) {
        List<Object> must = new ArrayList<>();
        List<Object> filter = new ArrayList<>();

        filter.add(Map.of("term", Map.of("trangThai", "APPROVED")));
        filter.add(Map.of("term", Map.of("congTyTrangThai", "APPROVED")));
        filter.add(Map.of("range", Map.of("denHanLucEpoch", Map.of("gte", LocalDateTime.now().toEpochSecond(ZoneOffset.UTC)))));

        if (nganhNgheId != null) {
            filter.add(Map.of("term", Map.of("nganhNgheId", nganhNgheId)));
        }
        if (loaiHinhLamViecId != null) {
            filter.add(Map.of("term", Map.of("loaiHinhLamViecId", loaiHinhLamViecId)));
        }
        if (capDoKinhNghiemId != null) {
            filter.add(Map.of("term", Map.of("capDoKinhNghiemId", capDoKinhNghiemId)));
        }

        if (StringUtils.hasText(tuKhoa)) {
            must.add(Map.of(
                    "multi_match", Map.of(
                            "query", tuKhoa.trim(),
                            "fields", List.of(
                                    "tieuDe^4",
                                    "moTa^2",
                                    "yeuCau^2",
                                    "phucLoi",
                                    "congTyTen^2",
                                    "nganhNgheTen^2",
                                    "kyNangs^2"
                            ),
                            "operator", "and"
                    )
            ));
        }

        if (StringUtils.hasText(diaDiem)) {
            must.add(Map.of(
                    "multi_match", Map.of(
                            "query", diaDiem.trim(),
                            "fields", List.of("diaDiem^3", "tinhThanhTen^2", "xaPhuongTen"),
                            "operator", "and"
                    )
            ));
        }

        Map<String, Object> bool = new LinkedHashMap<>();
        bool.put("filter", filter);
        if (!must.isEmpty()) {
            bool.put("must", must);
        }
        return Map.of("bool", bool);
    }
}
