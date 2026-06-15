package com.phuocloc.projectfinal.recruit.publicjob.service;

import com.phuocloc.projectfinal.recruit.infrastructure.elasticsearch.ElasticsearchClientService;
import com.phuocloc.projectfinal.recruit.infrastructure.elasticsearch.ElasticsearchProperties;
import com.phuocloc.projectfinal.recruit.infrastructure.elasticsearch.ElasticsearchSearchResult;
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
                Map.of("ngayTao", "desc")
        ));
        return elasticsearchClientService.searchDocuments(elasticsearchProperties.getJobIndex(), body);
    }

    public ElasticsearchSearchResult searchJobIdsForAi(
            String tuKhoa,
            String diaDiem,
            Integer luongToiThieuMongMuon,
            Integer luongToiDaMongMuon,
            String capDoKinhNghiemText,
            String loaiHinhLamViecText,
            Boolean remote,
            Boolean khongYeuCauKinhNghiem,
            String tuKhoaLoaiTru,
            Integer page,
            Integer size
    ) {
        int safePage = normalizePage(page);
        int safeSize = normalizeSize(size);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("from", safePage * safeSize);
        body.put("size", safeSize);
        body.put("track_total_hits", true);
        body.put("query", buildQuery(
                tuKhoa,
                diaDiem,
                null,
                null,
                null,
                luongToiThieuMongMuon,
                luongToiDaMongMuon,
                capDoKinhNghiemText,
                loaiHinhLamViecText,
                remote,
                khongYeuCauKinhNghiem,
                tuKhoaLoaiTru
        ));
        body.put("sort", List.of(
                Map.of("_score", "desc"),
                Map.of("ngayTao", "desc")
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
        return buildQuery(tuKhoa, diaDiem, nganhNgheId, loaiHinhLamViecId, capDoKinhNghiemId, null, null);
    }

    private Map<String, Object> buildQuery(
            String tuKhoa,
            String diaDiem,
            Integer nganhNgheId,
            Integer loaiHinhLamViecId,
            Integer capDoKinhNghiemId,
            Integer luongToiThieuMongMuon,
            Integer luongToiDaMongMuon
    ) {
        return buildQuery(
                tuKhoa,
                diaDiem,
                nganhNgheId,
                loaiHinhLamViecId,
                capDoKinhNghiemId,
                luongToiThieuMongMuon,
                luongToiDaMongMuon,
                null,
                null,
                null,
                null,
                null
        );
    }

    private Map<String, Object> buildQuery(
            String tuKhoa,
            String diaDiem,
            Integer nganhNgheId,
            Integer loaiHinhLamViecId,
            Integer capDoKinhNghiemId,
            Integer luongToiThieuMongMuon,
            Integer luongToiDaMongMuon,
            String capDoKinhNghiemText,
            String loaiHinhLamViecText,
            Boolean remote,
            Boolean khongYeuCauKinhNghiem,
            String tuKhoaLoaiTru
    ) {
        List<Object> must = new ArrayList<>();
        List<Object> mustNot = new ArrayList<>();
        List<Object> filter = new ArrayList<>();

        // null denHanLuc = không có hạn chót = luôn hợp lệ
        filter.add(Map.of("bool", Map.of(
                "should", List.of(
                        Map.of("bool", Map.of("must_not", List.of(Map.of("exists", Map.of("field", "denHanLuc"))))),
                        Map.of("range", Map.of("denHanLuc", Map.of("gte", "now")))
                ),
                "minimum_should_match", 1
        )));

        if (nganhNgheId != null) {
            filter.add(Map.of("term", Map.of("nganhNgheId", nganhNgheId)));
        }
        if (loaiHinhLamViecId != null) {
            filter.add(Map.of("term", Map.of("loaiHinhLamViecId", loaiHinhLamViecId)));
        }
        if (capDoKinhNghiemId != null) {
            filter.add(Map.of("term", Map.of("capDoKinhNghiemId", capDoKinhNghiemId)));
        }
        addSalaryFilters(filter, luongToiThieuMongMuon, luongToiDaMongMuon);

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
                            "fields", List.of("tinhThanhTen^2", "xaPhuongTen"),
                            "operator", "and"
                    )
            ));
        }
        addTextMust(must, capDoKinhNghiemText, List.of("capDoKinhNghiemTen^3", "tieuDe", "moTa", "yeuCau"));
        addTextMust(must, loaiHinhLamViecText, List.of("loaiHinhLamViecTen^3", "tieuDe", "moTa", "yeuCau"));
        if (Boolean.TRUE.equals(remote)) {
            addTextMust(must, "remote từ xa online work from home làm ở nhà", List.of(
                    "loaiHinhLamViecTen^3",
                    "tieuDe",
                    "moTa",
                    "yeuCau",
                    "phucLoi"
            ));
        }
        if (Boolean.TRUE.equals(khongYeuCauKinhNghiem)) {
            addTextMust(must, "fresher intern thực tập không yêu cầu kinh nghiệm entry", List.of(
                    "capDoKinhNghiemTen^3",
                    "tieuDe",
                    "moTa",
                    "yeuCau"
            ));
        }
        addExcludedKeywords(mustNot, tuKhoaLoaiTru);

        Map<String, Object> bool = new LinkedHashMap<>();
        bool.put("filter", filter);
        if (!must.isEmpty()) {
            bool.put("must", must);
        }
        if (!mustNot.isEmpty()) {
            bool.put("must_not", mustNot);
        }
        return Map.of("bool", bool);
    }

    private void addTextMust(List<Object> must, String query, List<String> fields) {
        if (!StringUtils.hasText(query)) {
            return;
        }
        must.add(Map.of(
                "multi_match", Map.of(
                        "query", query.trim(),
                        "fields", fields,
                        "operator", "or"
                )
        ));
    }

    private void addExcludedKeywords(List<Object> mustNot, String excludedKeywords) {
        if (!StringUtils.hasText(excludedKeywords)) {
            return;
        }
        for (String keyword : excludedKeywords.split("[,;|\\n]+")) {
            if (!StringUtils.hasText(keyword)) {
                continue;
            }
            mustNot.add(Map.of(
                    "multi_match", Map.of(
                            "query", keyword.trim(),
                            "fields", List.of(
                                    "tieuDe",
                                    "moTa",
                                    "yeuCau",
                                    "phucLoi",
                                    "congTyTen",
                                    "nganhNgheTen",
                                    "kyNangs"
                            ),
                            "operator", "and"
                    )
            ));
        }
    }

    private void addSalaryFilters(List<Object> filter, Integer expectedMinSalary, Integer expectedMaxSalary) {
        if (expectedMinSalary == null && expectedMaxSalary == null) {
            return;
        }
        if (expectedMinSalary != null) {
            filter.add(Map.of("bool", Map.of(
                    "should", List.of(
                            Map.of("range", Map.of("luongToiDa", Map.of("gte", expectedMinSalary))),
                            Map.of("range", Map.of("luongToiThieu", Map.of("gte", expectedMinSalary)))
                    ),
                    "minimum_should_match", 1
            )));
        }
        if (expectedMaxSalary != null) {
            filter.add(Map.of("bool", Map.of(
                    "should", List.of(
                            Map.of("range", Map.of("luongToiThieu", Map.of("lte", expectedMaxSalary))),
                            Map.of("range", Map.of("luongToiDa", Map.of("lte", expectedMaxSalary)))
                    ),
                    "minimum_should_match", 1
            )));
        }
    }
}
