package com.phuocloc.projectfinal.recruit.job.repository;

import com.phuocloc.projectfinal.recruit.job.entity.JobSkill;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobSkillRepository extends JpaRepository<JobSkill, Long> {

    List<JobSkill> findByJob_Id(Long jobId);

    Optional<JobSkill> findByJob_IdAndSkill_Id(Long jobId, Long skillId);

    boolean existsByJob_IdAndSkill_Id(Long jobId, Long skillId);
}
