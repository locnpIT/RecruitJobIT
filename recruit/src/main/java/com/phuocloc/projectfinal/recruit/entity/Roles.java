package com.phuocloc.projectfinal.recruit.entity;

import com.phuocloc.projectfinal.recruit.common.entity.BaseEntity;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Roles extends BaseEntity {

    private String code;
    private String name;
    private String description;

}
