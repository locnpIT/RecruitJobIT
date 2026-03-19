package com.phuocloc.projectfinal.recruit.job.repository;

import com.phuocloc.projectfinal.recruit.job.entity.JobApplication;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {

    List<JobApplication> findByJob_Id(Long jobId);

    List<JobApplication> findByCandidate_Id(Long candidateId);

    Optional<JobApplication> findByJob_IdAndCandidate_Id(Long jobId, Long candidateId);

    boolean existsByJob_IdAndCandidate_Id(Long jobId, Long candidateId);
}
