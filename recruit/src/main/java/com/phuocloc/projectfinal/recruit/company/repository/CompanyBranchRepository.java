package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.company.entity.CompanyBranch;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyBranchRepository extends JpaRepository<CompanyBranch, Long> {

    List<CompanyBranch> findByCompany_Id(Long companyId);

    Optional<CompanyBranch> findByCompany_IdAndIsHeadquarterTrue(Long companyId);
}
