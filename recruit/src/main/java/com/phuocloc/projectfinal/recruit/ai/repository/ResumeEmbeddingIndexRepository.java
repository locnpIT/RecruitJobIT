package com.phuocloc.projectfinal.recruit.ai.repository;

import com.phuocloc.projectfinal.recruit.ai.entity.ResumeEmbeddingIndex;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResumeEmbeddingIndexRepository extends JpaRepository<ResumeEmbeddingIndex, Long> {

    Optional<ResumeEmbeddingIndex> findByResumeIdAndIsActiveTrue(Long resumeId);

    List<ResumeEmbeddingIndex> findByResumeIdOrderByEmbeddedAtDesc(Long resumeId);
}
