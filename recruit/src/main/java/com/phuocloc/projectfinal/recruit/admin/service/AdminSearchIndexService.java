package com.phuocloc.projectfinal.recruit.admin.service;

import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminElasticsearchHealthResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminElasticsearchReindexResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminQdrantExperienceReindexResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminQdrantReindexResponse;
import com.phuocloc.projectfinal.recruit.ai.service.CandidateProfileEmbeddingIndexService;
import com.phuocloc.projectfinal.recruit.ai.service.JobEmbeddingIndexService;
import com.phuocloc.projectfinal.recruit.ai.service.KinhNghiemEmbeddingIndexService;
import com.phuocloc.projectfinal.recruit.candidate.repository.KinhNghiemLamViecUngVienRepository;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.KinhNghiemLamViecUngVien;
import com.phuocloc.projectfinal.recruit.infrastructure.elasticsearch.ElasticsearchClientService;
import com.phuocloc.projectfinal.recruit.infrastructure.elasticsearch.ElasticsearchProperties;
import com.phuocloc.projectfinal.recruit.infrastructure.qdrant.QdrantClientService;
import com.phuocloc.projectfinal.recruit.infrastructure.qdrant.QdrantProperties;
import com.phuocloc.projectfinal.recruit.publicjob.service.PublicJobElasticsearchIndexService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
/**
 * Các thao tác vận hành Elasticsearch/Qdrant của admin.
 */
public class AdminSearchIndexService {

    private final ElasticsearchClientService elasticsearchClientService;
    private final ElasticsearchProperties elasticsearchProperties;
    private final PublicJobElasticsearchIndexService publicJobElasticsearchIndexService;
    private final QdrantProperties qdrantProperties;
    private final QdrantClientService qdrantClientService;
    private final JobEmbeddingIndexService jobEmbeddingIndexService;
    private final CandidateProfileEmbeddingIndexService candidateProfileEmbeddingIndexService;
    private final KinhNghiemEmbeddingIndexService kinhNghiemEmbeddingIndexService;
    private final KinhNghiemLamViecUngVienRepository kinhNghiemLamViecUngVienRepository;

    @Transactional(readOnly = true)
    public AdminElasticsearchHealthResponse getElasticsearchHealth() {
        if (!elasticsearchClientService.isEnabled()) {
            return AdminElasticsearchHealthResponse.builder()
                    .enabled(false)
                    .reachable(false)
                    .url(elasticsearchProperties.getUrl())
                    .jobIndex(elasticsearchProperties.getJobIndex())
                    .error("Elasticsearch đang tắt (app.elasticsearch.enabled=false)")
                    .build();
        }
        try {
            ElasticsearchClientService.ElasticsearchClusterInfo info = elasticsearchClientService.getClusterInfo();
            return AdminElasticsearchHealthResponse.builder()
                    .enabled(true)
                    .reachable(true)
                    .url(elasticsearchProperties.getUrl())
                    .jobIndex(elasticsearchProperties.getJobIndex())
                    .clusterName(info.getClusterName())
                    .nodeName(info.getNodeName())
                    .version(info.getVersion())
                    .error(null)
                    .build();
        } catch (RuntimeException ex) {
            return AdminElasticsearchHealthResponse.builder()
                    .enabled(true)
                    .reachable(false)
                    .url(elasticsearchProperties.getUrl())
                    .jobIndex(elasticsearchProperties.getJobIndex())
                    .error(ex.getMessage())
                    .build();
        }
    }

    @Transactional(readOnly = true)
    public AdminElasticsearchReindexResponse reindexPublicJobs() {
        PublicJobElasticsearchIndexService.DongBoIndexSummary summary =
                publicJobElasticsearchIndexService.reindexAllPublicJobs();
        return AdminElasticsearchReindexResponse.builder()
                .enabled(summary.isEnabled())
                .jobIndex(elasticsearchProperties.getJobIndex())
                .tongTinPublic(summary.getTongTinPublic())
                .soDaDongBo(summary.getSoDaDongBo())
                .soThatBai(summary.getSoThatBai())
                .build();
    }

    @Transactional
    public AdminQdrantReindexResponse reindexQdrantJobsAndProfiles() {
        JobEmbeddingIndexService.DongBoIndexSummary jobs = jobEmbeddingIndexService.reindexAllPublicJobs();
        CandidateProfileEmbeddingIndexService.DongBoIndexSummary profiles = candidateProfileEmbeddingIndexService.reindexAllProfiles();
        return AdminQdrantReindexResponse.builder()
                .enabled(jobs.enabled() || profiles.enabled())
                .jobCollection(qdrantProperties.getKhoTinTuyenDung())
                .candidateProfileCollection(qdrantProperties.getKhoHoSoUngVien())
                .tongTinTuyenDung(jobs.tongSo())
                .soTinTuyenDungDaDongBo(jobs.soDaDongBo())
                .soTinTuyenDungThatBai(jobs.soThatBai())
                .tongHoSoUngVien(profiles.tongSo())
                .soHoSoUngVienDaDongBo(profiles.soDaDongBo())
                .soHoSoUngVienThatBai(profiles.soThatBai())
                .build();
    }

    @Transactional
    public AdminQdrantExperienceReindexResponse reindexWorkExperiences() {
        if (!qdrantClientService.isEnabled()) {
            return AdminQdrantExperienceReindexResponse.builder()
                    .enabled(false)
                    .experienceCollection(qdrantProperties.getKhoKinhNghiem())
                    .tongKinhNghiem(0)
                    .soDaDongBo(0)
                    .soThatBai(0)
                    .build();
        }

        List<KinhNghiemLamViecUngVien> experiences = kinhNghiemLamViecUngVienRepository.findAll().stream()
                .filter(exp -> exp.getId() != null)
                .toList();
        int success = 0;
        int failed = 0;
        for (KinhNghiemLamViecUngVien experience : experiences) {
            try {
                if (kinhNghiemEmbeddingIndexService.syncIndexWithResult(experience)) {
                    success++;
                } else {
                    failed++;
                }
            } catch (RuntimeException ex) {
                failed++;
            }
        }

        return AdminQdrantExperienceReindexResponse.builder()
                .enabled(true)
                .experienceCollection(qdrantProperties.getKhoKinhNghiem())
                .tongKinhNghiem(experiences.size())
                .soDaDongBo(success)
                .soThatBai(failed)
                .build();
    }
}
