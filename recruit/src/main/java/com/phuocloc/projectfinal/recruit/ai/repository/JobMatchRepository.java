package com.phuocloc.projectfinal.recruit.ai.repository;

import com.phuocloc.projectfinal.recruit.ai.entity.JobMatch;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobMatchRepository extends JpaRepository<JobMatch, Long> {

    List<JobMatch> findByCandidate_IdOrderByFinalScoreDesc(Long candidateId);

    List<JobMatch> findByJob_IdOrderByFinalScoreDesc(Long jobId);

    Optional<JobMatch> findFirstByJob_IdAndResume_IdOrderByMatchedAtDesc(Long jobId, Long resumeId);
}
