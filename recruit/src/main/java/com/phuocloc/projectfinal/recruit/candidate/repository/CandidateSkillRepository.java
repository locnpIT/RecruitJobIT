package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.candidate.entity.CandidateSkill;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CandidateSkillRepository extends JpaRepository<CandidateSkill, Long> {

    List<CandidateSkill> findByCandidateProfile_Id(Long candidateProfileId);

    Optional<CandidateSkill> findByCandidateProfile_IdAndSkill_Id(Long candidateProfileId, Long skillId);

    boolean existsByCandidateProfile_IdAndSkill_Id(Long candidateProfileId, Long skillId);
}
