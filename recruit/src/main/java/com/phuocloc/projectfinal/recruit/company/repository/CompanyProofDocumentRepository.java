package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.company.entity.CompanyProofDocument;
import com.phuocloc.projectfinal.recruit.company.enums.CompanyProofDocumentStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyProofDocumentRepository extends JpaRepository<CompanyProofDocument, Long> {

    List<CompanyProofDocument> findByCompany_IdOrderByCreatedAtDesc(Long companyId);

    List<CompanyProofDocument> findByCompany_IdAndStatusOrderByCreatedAtDesc(
            Long companyId,
            CompanyProofDocumentStatus status
    );
}
