package com.phuocloc.projectfinal.recruit.ai.repository;

import com.phuocloc.projectfinal.recruit.ai.entity.SkillGapAnalysis;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SkillGapAnalysisRepository extends JpaRepository<SkillGapAnalysis, Long> {

    Optional<SkillGapAnalysis> findFirstByJob_IdAndResume_IdOrderByAnalyzedAtDesc(Long jobId, Long resumeId);

    List<SkillGapAnalysis> findByCandidate_IdOrderByAnalyzedAtDesc(Long candidateId);
}
