package com.phuocloc.projectfinal.recruit.ai.repository;

import com.phuocloc.projectfinal.recruit.ai.entity.SkillGapAnalysis;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SkillGapAnalysisRepository extends JpaRepository<SkillGapAnalysis, Long> {

    Optional<SkillGapAnalysis> findFirstByJob_IdAndResume_IdOrderByAnalyzedAtDesc(Long jobId, Long resumeId);

    Optional<SkillGapAnalysis> findFirstByJob_IdAndCandidate_IdOrderByAnalyzedAtDesc(Long jobId, Long candidateId);

    List<SkillGapAnalysis> findByCandidate_IdOrderByAnalyzedAtDesc(Long candidateId);

    List<SkillGapAnalysis> findByJob_IdOrderByCoverageScoreDescMissingCountAscAnalyzedAtDesc(Long jobId);

    List<SkillGapAnalysis> findByJob_IdAndMissingCountLessThanEqualOrderByCoverageScoreDescMissingCountAscAnalyzedAtDesc(
            Long jobId, Integer maxMissingCount
    );

    List<SkillGapAnalysis> findByJob_IdAndCoverageScoreGreaterThanEqualOrderByCoverageScoreDescMissingCountAscAnalyzedAtDesc(
            Long jobId, BigDecimal minCoverageScore
    );
}
