package com.phuocloc.projectfinal.recruit.job.repository;

import com.phuocloc.projectfinal.recruit.job.entity.JobViewLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobViewLogRepository extends JpaRepository<JobViewLog, Long> {

    boolean existsByJob_IdAndSessionId(Long jobId, String sessionId);

    List<JobViewLog> findByJob_Id(Long jobId);
}
