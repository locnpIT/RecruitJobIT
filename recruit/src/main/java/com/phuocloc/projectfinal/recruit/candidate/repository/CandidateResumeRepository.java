package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.candidate.entity.CandidateResume;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CandidateResumeRepository extends JpaRepository<CandidateResume, Long> {

    List<CandidateResume> findByCandidate_Id(Long candidateId);

    Optional<CandidateResume> findByIdAndCandidate_Id(Long resumeId, Long candidateId);

    Optional<CandidateResume> findByCandidate_IdAndIsDefaultTrue(Long candidateId);
}
