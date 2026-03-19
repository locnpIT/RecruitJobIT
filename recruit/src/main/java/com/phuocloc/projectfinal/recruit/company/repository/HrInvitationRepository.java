package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.company.entity.HrInvitation;
import com.phuocloc.projectfinal.recruit.company.enums.InvitationStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HrInvitationRepository extends JpaRepository<HrInvitation, Long> {

    Optional<HrInvitation> findByToken(String token);

    List<HrInvitation> findByCompany_Id(Long companyId);

    List<HrInvitation> findByInvitedEmailAndStatus(String invitedEmail, InvitationStatus status);
}
