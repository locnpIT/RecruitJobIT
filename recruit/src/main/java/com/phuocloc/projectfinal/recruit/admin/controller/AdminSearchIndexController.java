package com.phuocloc.projectfinal.recruit.admin.controller;

import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminElasticsearchHealthResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminElasticsearchReindexResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminQdrantExperienceReindexResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminQdrantReindexResponse;
import com.phuocloc.projectfinal.recruit.admin.service.AdminService;
import com.phuocloc.projectfinal.recruit.common.response.SuccessResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
class AdminSearchIndexController extends AbstractAdminController {

    private final AdminService adminService;

    @GetMapping("/elasticsearch/health")
    public ResponseEntity<SuccessResponse<AdminElasticsearchHealthResponse>> elasticsearchHealth() {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>(
                "Lấy trạng thái Elasticsearch thành công",
                adminService.getElasticsearchHealth()));
    }

    @PostMapping("/elasticsearch/reindex/jobs")
    public ResponseEntity<SuccessResponse<AdminElasticsearchReindexResponse>> reindexPublicJobs() {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>(
                "Reindex dữ liệu jobs lên Elasticsearch thành công",
                adminService.reindexPublicJobs()));
    }

    @PostMapping("/qdrant/reindex/jobs-profiles")
    public ResponseEntity<SuccessResponse<AdminQdrantReindexResponse>> reindexQdrantJobsAndProfiles() {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>(
                "Reindex dữ liệu semantic lên Qdrant thành công",
                adminService.reindexQdrantJobsAndProfiles()));
    }

    @PostMapping("/qdrant/reindex/experiences")
    public ResponseEntity<SuccessResponse<AdminQdrantExperienceReindexResponse>> reindexWorkExperiences() {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>(
                "Reindex kinh nghiệm làm việc lên Qdrant thành công",
                adminService.reindexWorkExperiences()));
    }
}
