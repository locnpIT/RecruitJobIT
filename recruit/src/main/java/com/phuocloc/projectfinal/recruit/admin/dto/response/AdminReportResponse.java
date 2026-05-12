package com.phuocloc.projectfinal.recruit.admin.dto.response;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminReportResponse {

    private List<Metric> metrics;
    private List<Integer> trendData;
    private List<TopCompany> topCompanies;
    private SystemStatus systemStatus;

    @Getter
    @Builder
    public static class Metric {
        private String label;
        private String value;
        private String note;
    }

    @Getter
    @Builder
    public static class TopCompany {
        private String name;
        private int jobs;
        private int applications;
    }

    @Getter
    @Builder
    public static class SystemStatus {
        private String apiUptime;
        private String averageLatency;
        private int pendingReviewTasks;
        private int openIncidents;
    }
}
