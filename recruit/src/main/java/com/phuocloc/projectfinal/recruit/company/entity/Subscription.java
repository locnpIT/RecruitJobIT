package com.phuocloc.projectfinal.recruit.company.entity;

import com.phuocloc.projectfinal.recruit.common.entity.BaseEntity;
import com.phuocloc.projectfinal.recruit.company.enums.SubscriptionPlanType;
import com.phuocloc.projectfinal.recruit.company.enums.SubscriptionStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.AssertTrue;
import java.time.LocalDateTime;
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
@Table(name = "goiDichVu")
public class Subscription extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "congTyId", nullable = false)
    private Company company;

    @Enumerated(EnumType.STRING)
    @Column(name = "loaiGoi", nullable = false, length = 20)
    @Builder.Default
    private SubscriptionPlanType planType = SubscriptionPlanType.FREE;

    @Enumerated(EnumType.STRING)
    @Column(name = "trangThai", nullable = false, length = 20)
    @Builder.Default
    private SubscriptionStatus status = SubscriptionStatus.ACTIVE;

    @Column(name = "batDauLuc", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "hetHanLuc")
    private LocalDateTime expiredAt;

    @Column(name = "giaHanDenLuc")
    private LocalDateTime graceUntil;

    @Column(name = "tuDongGiaHan", nullable = false)
    @Builder.Default
    private Boolean autoRenew = false;

    @AssertTrue(message = "expiredAt must be after startedAt")
    private boolean isValidPeriod() {
        if (startedAt == null) {
            return false;
        }
        return expiredAt == null || expiredAt.isAfter(startedAt);
    }
}
