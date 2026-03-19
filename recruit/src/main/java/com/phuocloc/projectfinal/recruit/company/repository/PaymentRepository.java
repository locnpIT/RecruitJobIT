package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.company.entity.Payment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByTransactionCode(String transactionCode);

    Optional<Payment> findByIdempotencyKey(String idempotencyKey);

    List<Payment> findByCompany_IdOrderByCreatedAtDesc(Long companyId);
}
