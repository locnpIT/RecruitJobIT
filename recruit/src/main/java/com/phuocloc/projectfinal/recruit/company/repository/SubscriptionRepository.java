package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.company.entity.Subscription;
import com.phuocloc.projectfinal.recruit.company.enums.SubscriptionStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    List<Subscription> findByCompany_IdOrderByCreatedAtDesc(Long companyId);

    Optional<Subscription> findFirstByCompany_IdOrderByCreatedAtDesc(Long companyId);

    List<Subscription> findByStatus(SubscriptionStatus status);
}
