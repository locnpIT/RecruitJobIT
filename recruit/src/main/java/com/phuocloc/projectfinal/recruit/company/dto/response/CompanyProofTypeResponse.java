package com.phuocloc.projectfinal.recruit.company.dto.response;

import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyProofTypeResponse implements Serializable {

    private Long id;
    private String ten;
    private String moTa;
}
