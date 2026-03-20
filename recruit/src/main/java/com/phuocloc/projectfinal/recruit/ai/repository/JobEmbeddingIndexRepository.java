package com.phuocloc.projectfinal.recruit.ai.repository;

import com.phuocloc.projectfinal.recruit.ai.entity.JobEmbeddingIndex;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobEmbeddingIndexRepository extends JpaRepository<JobEmbeddingIndex, Long> {

    Optional<JobEmbeddingIndex> findByJobIdAndIsActiveTrue(Long jobId);

    List<JobEmbeddingIndex> findByJobIdOrderByEmbeddedAtDesc(Long jobId);
}
