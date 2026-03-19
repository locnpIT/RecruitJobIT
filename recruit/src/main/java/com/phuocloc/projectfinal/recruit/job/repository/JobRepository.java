package com.phuocloc.projectfinal.recruit.job.repository;

import com.phuocloc.projectfinal.recruit.job.entity.Job;
import com.phuocloc.projectfinal.recruit.job.enums.JobStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface JobRepository extends JpaRepository<Job, Long>, JpaSpecificationExecutor<Job> {

    List<Job> findByCompany_Id(Long companyId);

    List<Job> findByStatus(JobStatus status);

    List<Job> findByCompany_IdAndStatus(Long companyId, JobStatus status);
}
