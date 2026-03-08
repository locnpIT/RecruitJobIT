package com.phuocloc.projectfinal.recruit.common.entity;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class BaseEntity {

    private Long id;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private Boolean deleted;


}
