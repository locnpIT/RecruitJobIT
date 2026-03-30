package com.phuocloc.projectfinal.recruit.company.entity;

import com.phuocloc.projectfinal.recruit.common.entity.BaseEntity;
import com.phuocloc.projectfinal.recruit.company.enums.PaymentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "thanhToan",
        uniqueConstraints = @UniqueConstraint(name = "uk_payment_transaction_code", columnNames = "maGiaoDich")
)
public class Payment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "congTyId", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goiDichVuId", nullable = false)
    private Subscription subscription;

    @Column(name = "maGiaoDich", length = 120)
    private String transactionCode;

    @Column(name = "soTien", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "tienTe", nullable = false, length = 10)
    @Builder.Default
    private String currency = "VND";

    @Enumerated(EnumType.STRING)
    @Column(name = "trangThai", nullable = false, length = 20)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "thanhToanLuc")
    private LocalDateTime paidAt;

    @PrePersist
    @PreUpdate
    private void validateIntegrity() {
        if (company == null || subscription == null || company.getId() == null) {
            return;
        }
        Company subscriptionCompany = subscription.getCompany();
        if (subscriptionCompany != null
                && subscriptionCompany.getId() != null
                && !Objects.equals(company.getId(), subscriptionCompany.getId())) {
            throw new IllegalStateException("Payment.company must match Subscription.company.");
        }
    }
}
