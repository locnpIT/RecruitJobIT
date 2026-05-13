package com.phuocloc.projectfinal.recruit.publicjob.dto.response;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PublicJobDetailResponse {

    private Long id;
    private String maTin;
    private String title;
    private String status;
    private String company;
    private Boolean companyVerified;
    private String industry;
    private String companySize;
    private String website;
    private String location;
    private String salary;
    private String level;
    private String workType;
    private String experience;
    private String deadline;
    private String postedAt;
    private String education;
    private String headcount;
    private String gender;
    private String updatedAt;
    private Boolean batBuocCv;
    private String mauCvUrl;
    private List<String> tags;
    private List<String> description;
    private List<String> requirements;
    private List<String> benefits;
    private String companyDescription;
    private List<PublicJobSummaryResponse> similarJobs;
}
