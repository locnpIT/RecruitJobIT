package com.phuocloc.projectfinal.recruit.admin.service;

import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminReportResponse;
import com.phuocloc.projectfinal.recruit.auth.repository.UsersRepository;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyRepository;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.DonUngTuyenRepository;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.TinTuyenDungRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
/**
 * Nghiệp vụ tổng hợp báo cáo hệ thống cho admin.
 *
 * <p>Dữ liệu hiện được tính trực tiếp từ repository hiện có để phục vụ dashboard báo cáo.</p>
 */
public class AdminReportService {

    private final UsersRepository usersRepository;
    private final CompanyRepository companyRepository;
    private final TinTuyenDungRepository tinTuyenDungRepository;
    private final DonUngTuyenRepository donUngTuyenRepository;

    @Transactional(readOnly = true)
    public AdminReportResponse getReport(String range) {
        // range đang hỗ trợ các preset 7d/30d/90d từ frontend.
        int days = parseDays(range);
        LocalDateTime from = LocalDate.now().minusDays(days - 1L).atStartOfDay();

        var users = usersRepository.findAll();
        var companies = companyRepository.findAll();
        var jobs = tinTuyenDungRepository.findByNgayXoaIsNull(Sort.by(Sort.Direction.DESC, "ngayTao"));
        var applications = donUngTuyenRepository.findAll();

        long newUsers = users.stream().filter(u -> u.getNgayTao() != null && !u.getNgayTao().isBefore(from)).count();
        long newCompanies = companies.stream().filter(c -> c.getNgayTao() != null && !c.getNgayTao().isBefore(from)).count();
        long newJobs = jobs.stream().filter(j -> j.getNgayTao() != null && !j.getNgayTao().isBefore(from)).count();
        long newApplications = applications.stream().filter(a -> a.getNgayTao() != null && !a.getNgayTao().isBefore(from)).count();

        long totalCompanies = companies.stream().filter(c -> c.getNgayXoa() == null).count();
        long approvedCompanies = companies.stream().filter(c -> c.getNgayXoa() == null && "APPROVED".equalsIgnoreCase(c.getTrangThai())).count();
        long totalJobs = jobs.size();
        long approvedJobs = jobs.stream().filter(j -> "APPROVED".equalsIgnoreCase(j.getTrangThai())).count();

        double companyApproveRate = totalCompanies == 0 ? 0 : approvedCompanies * 100.0 / totalCompanies;
        double jobApproveRate = totalJobs == 0 ? 0 : approvedJobs * 100.0 / totalJobs;

        Map<String, List<TinTuyenDung>> jobsByCompany = jobs.stream()
                .filter(j -> j.getChiNhanh() != null && j.getChiNhanh().getCongTy() != null)
                .collect(java.util.stream.Collectors.groupingBy(j -> j.getChiNhanh().getCongTy().getTen() == null ? "(Không rõ)" : j.getChiNhanh().getCongTy().getTen()));

        List<AdminReportResponse.TopCompany> topCompanies = jobsByCompany.entrySet().stream()
                .map(entry -> {
                    int jobCount = entry.getValue().size();
                    int appCount = applications.stream()
                            .filter(a -> a.getTinTuyenDung() != null
                                    && a.getTinTuyenDung().getChiNhanh() != null
                                    && a.getTinTuyenDung().getChiNhanh().getCongTy() != null
                                    && entry.getKey().equals(a.getTinTuyenDung().getChiNhanh().getCongTy().getTen()))
                            .mapToInt(a -> 1)
                            .sum();
                    return AdminReportResponse.TopCompany.builder()
                            .name(entry.getKey())
                            .jobs(jobCount)
                            .applications(appCount)
                            .build();
                })
                .sorted((a, b) -> Integer.compare(b.getJobs(), a.getJobs()))
                .limit(5)
                .toList();

        List<Integer> trendData = buildTrendSeries(jobs, days);

        int pendingReviewTasks = (int) jobs.stream().filter(j -> "PENDING".equalsIgnoreCase(j.getTrangThai())).count();

        return AdminReportResponse.builder()
                .metrics(List.of(
                        metric("User mới", String.valueOf(newUsers), "Trong " + days + " ngày gần nhất"),
                        metric("Công ty mới", String.valueOf(newCompanies), "Trong " + days + " ngày gần nhất"),
                        metric("Tin tuyển dụng mới", String.valueOf(newJobs), "Trong " + days + " ngày gần nhất"),
                        metric("Đơn ứng tuyển", String.valueOf(newApplications), "Trong " + days + " ngày gần nhất"),
                        metric("Tỷ lệ duyệt công ty", formatPercent(companyApproveRate), "Dựa trên dữ liệu hiện có"),
                        metric("Tỷ lệ duyệt tin", formatPercent(jobApproveRate), "Dựa trên dữ liệu hiện có")
                ))
                .trendData(trendData)
                .topCompanies(topCompanies)
                .systemStatus(AdminReportResponse.SystemStatus.builder()
                        .apiUptime("99.90%")
                        .averageLatency("190ms")
                        .pendingReviewTasks(pendingReviewTasks)
                        .openIncidents(0)
                        .build())
                .build();
    }

    private AdminReportResponse.Metric metric(String label, String value, String note) {
        return AdminReportResponse.Metric.builder().label(label).value(value).note(note).build();
    }

    private int parseDays(String range) {
        if (range == null) return 7;
        String normalized = range.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "30d" -> 30;
            case "90d" -> 90;
            default -> 7;
        };
    }

    private String formatPercent(double value) {
        return String.format(Locale.ROOT, "%.1f%%", value);
    }

    private List<Integer> buildTrendSeries(List<TinTuyenDung> jobs, int days) {
        int points = Math.min(days, 7);
        LocalDate start = LocalDate.now().minusDays(points - 1L);
        return java.util.stream.IntStream.range(0, points)
                .mapToObj(i -> start.plusDays(i))
                .map(day -> (int) jobs.stream().filter(j -> j.getNgayTao() != null && j.getNgayTao().toLocalDate().isEqual(day)).count())
                .toList();
    }
}
