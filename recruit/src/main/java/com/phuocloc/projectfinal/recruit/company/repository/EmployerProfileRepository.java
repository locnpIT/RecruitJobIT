package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.company.entity.EmployerProfile;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployerProfileRepository extends JpaRepository<EmployerProfile, Long> {

    Optional<EmployerProfile> findByUser_Id(Long userId);

    List<EmployerProfile> findByCompany_Id(Long companyId);

    List<EmployerProfile> findByCompany_IdAndIsActiveTrue(Long companyId);
}
