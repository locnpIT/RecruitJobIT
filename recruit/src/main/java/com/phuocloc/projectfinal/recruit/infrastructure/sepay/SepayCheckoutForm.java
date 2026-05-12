package com.phuocloc.projectfinal.recruit.infrastructure.sepay;

import java.util.Map;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SepayCheckoutForm {

    private String actionUrl;

    private Map<String, String> fields;
}
