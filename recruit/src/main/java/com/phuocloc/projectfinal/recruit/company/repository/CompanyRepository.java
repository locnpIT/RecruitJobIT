package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.company.entity.Company;
import com.phuocloc.projectfinal.recruit.company.enums.CompanyStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface CompanyRepository extends JpaRepository<Company, Long>, JpaSpecificationExecutor<Company> {

    Optional<Company> findByTaxCode(String taxCode);

    boolean existsByTaxCode(String taxCode);

    List<Company> findByStatus(CompanyStatus status);
}
