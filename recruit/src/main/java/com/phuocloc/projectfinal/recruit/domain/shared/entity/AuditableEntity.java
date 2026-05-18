package com.phuocloc.projectfinal.recruit.domain.shared.entity;

import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Base entity dùng chung cho các bảng cần kế thừa metadata audit.
 * Hiện tại class để sẵn làm điểm mở rộng cho các trường audit về sau.
 */
@Getter
@Setter
@NoArgsConstructor
@MappedSuperclass
public abstract class AuditableEntity {
}
