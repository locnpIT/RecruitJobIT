package com.phuocloc.projectfinal.recruit.publicjob.service;

import com.phuocloc.projectfinal.recruit.infrastructure.gemini.GeminiProperties;
import com.phuocloc.projectfinal.recruit.publicjob.dto.response.PublicJobSearchResponse;
import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.SystemMessage;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Slf4j
public class PublicJobAiSearchService {

    private static final int DEFAULT_LIMIT = 12;
    private static final int MAX_LIMIT = 30;

    private final PublicJobService publicJobService;
    private final GeminiProperties geminiProperties;

    @Transactional(readOnly = true)
    public PublicJobSearchResponse searchByPrompt(String prompt, Integer gioiHan) {
        String safePrompt = normalizePrompt(prompt);
        int safeLimit = normalizeLimit(gioiHan);

        if (!isGeminiReady()) {
            // Local/dev fallback: vẫn trả kết quả public bằng keyword thường khi chưa cấu hình Gemini.
            return fallbackSearch(safePrompt, safeLimit);
        }

        PublicJobDatabaseTool tool = new PublicJobDatabaseTool(publicJobService, safeLimit);
        try {
            JobSearchAssistant assistant = AiServices.builder(JobSearchAssistant.class)
                    .chatModel(buildChatModel())
                    .tools(tool)
                    .build();
            assistant.search(safePrompt);
        } catch (Exception ex) {
            log.warn("Không gọi được Gemini AI search, fallback sang search thường: {}", ex.getMessage());
            return fallbackSearch(safePrompt, safeLimit);
        }

        PublicJobSearchResponse aiResult = tool.getLastResult();
        return aiResult == null ? fallbackSearch(safePrompt, safeLimit) : aiResult;
    }

    private ChatModel buildChatModel() {
        return GoogleAiGeminiChatModel.builder()
                .apiKey(geminiProperties.getApiKey())
                .modelName(geminiProperties.getModelName())
                .temperature(0.0)
                .timeout(Duration.ofMillis(geminiProperties.getTimeoutMillis()))
                .build();
    }

    private PublicJobSearchResponse fallbackSearch(String prompt, int limit) {
        return publicJobService.searchJobs(prompt, null, null, null, null, 0, limit);
    }

    private boolean isGeminiReady() {
        return geminiProperties.isEnabled() && StringUtils.hasText(geminiProperties.getApiKey());
    }

    private String normalizePrompt(String prompt) {
        if (!StringUtils.hasText(prompt)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Prompt tìm kiếm không được để trống");
        }
        return prompt.trim();
    }

    private int normalizeLimit(Integer limit) {
        if (limit == null || limit <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(limit, MAX_LIMIT);
    }

    private interface JobSearchAssistant {

        @SystemMessage("""
                Bạn là trợ lý tìm việc trong hệ thống tuyển dụng.
                Nhiệm vụ duy nhất: đọc yêu cầu của ứng viên và gọi tool timKiemTinTuyenDungTrongDatabase.
                Không tự bịa tin tuyển dụng, không trả dữ liệu ngoài database.
                Hãy giữ lại các từ/cụm quan trọng để search toàn bộ nội dung tin: vị trí, kỹ năng, công nghệ, mô tả công việc, yêu cầu, phúc lợi hoặc ngành nghề.
                Không chỉ ưu tiên tên công ty/ngành nghề; nếu có kỹ năng như Java, Kafka, React, CI/CD thì phải giữ trong từ khóa.
                Nếu người dùng có nhắc địa điểm, truyền địa điểm đó vào tham số diaDiem.
                Nếu người dùng nhắc cấp độ/kinh nghiệm, truyền vào capDoKinhNghiemText:
                intern/thực tập, fresher, junior, senior, lead, manager, hoặc cụm "không yêu cầu kinh nghiệm".
                Nếu người dùng nhắc loại hình làm việc, truyền vào loaiHinhLamViecText:
                full-time/toàn thời gian, part-time/bán thời gian, internship/thực tập, hybrid, remote.
                Nếu người dùng muốn remote/làm ở nhà/từ xa, đặt remote = true.
                Nếu người dùng nói chưa có kinh nghiệm, mới ra trường, fresher, intern, không yêu cầu kinh nghiệm, đặt khongYeuCauKinhNghiem = true.
                Nếu người dùng phủ định điều gì, ví dụ "không sale", "không telesales", "không yêu cầu tiếng Anh", truyền phần bị loại trừ vào tuKhoaLoaiTru, phân cách bằng dấu phẩy.
                Hiểu từ viết tắt phổ biến:
                js = JavaScript, ts = TypeScript, reactjs = React, node = Node.js, spring = Spring Boot, ci cd/cicd = CI/CD,
                hcm/sài gòn = TP Hồ Chí Minh, dn = Đà Nẵng, hn = Hà Nội, 10tr/10 củ/10m = 10000000.
                Nếu người dùng nhắc lương, hãy truyền số tiền theo đơn vị VND:
                - "từ 10 triệu trở lên" => luongToiThieuMongMuon = 10000000
                - "15 đến 20 triệu" => luongToiThieuMongMuon = 15000000, luongToiDaMongMuon = 20000000
                - "dưới 20 triệu" => luongToiDaMongMuon = 20000000
                """)
        String search(String userPrompt);
    }

    /**
     * Tool LangChain4j gọi lại service public search hiện có.
     * Cách này giữ nguyên rule nghiệp vụ: chỉ thấy tin APPROVED, còn hạn, công ty đã duyệt.
     */
    private static class PublicJobDatabaseTool {

        private final PublicJobService publicJobService;
        private final int defaultLimit;
        private PublicJobSearchResponse lastResult;

        private PublicJobDatabaseTool(PublicJobService publicJobService, int defaultLimit) {
            this.publicJobService = publicJobService;
            this.defaultLimit = defaultLimit;
        }

        @Tool("Tìm kiếm tin tuyển dụng trong database public của hệ thống")
        String timKiemTinTuyenDungTrongDatabase(
                @P("Các từ/cụm quan trọng để quét toàn bộ tin tuyển dụng: tiêu đề, mô tả, yêu cầu, phúc lợi, kỹ năng, công ty, ngành nghề") String tuKhoa,
                @P("Địa điểm ứng viên muốn tìm, có thể để trống") String diaDiem,
                @P("Mức lương tối thiểu mong muốn, đơn vị VND. Ví dụ 10 triệu là 10000000. Có thể để null") Integer luongToiThieuMongMuon,
                @P("Mức lương tối đa mong muốn, đơn vị VND. Ví dụ 20 triệu là 20000000. Có thể để null") Integer luongToiDaMongMuon,
                @P("Cấp độ/kinh nghiệm mong muốn: intern, fresher, junior, senior, lead, manager, hoặc không yêu cầu kinh nghiệm. Có thể để null") String capDoKinhNghiemText,
                @P("Loại hình làm việc mong muốn: full-time, part-time, hybrid, remote, internship, toàn thời gian, bán thời gian. Có thể để null") String loaiHinhLamViecText,
                @P("True nếu user muốn remote/từ xa/làm ở nhà/work from home") Boolean remote,
                @P("True nếu user muốn việc không yêu cầu kinh nghiệm, fresher, intern, mới ra trường") Boolean khongYeuCauKinhNghiem,
                @P("Các keyword user muốn loại trừ, ví dụ: sale, telesales, tiếng Anh. Phân cách bằng dấu phẩy. Có thể để null") String tuKhoaLoaiTru,
                @P("Số lượng kết quả tối đa, không quá 30") Integer gioiHan
        ) {
            int limit = gioiHan == null || gioiHan <= 0 ? defaultLimit : Math.min(gioiHan, MAX_LIMIT);
            lastResult = publicJobService.searchJobsForAi(
                    tuKhoa,
                    normalizeLocation(diaDiem),
                    normalizeSalaryAmount(luongToiThieuMongMuon),
                    normalizeSalaryAmount(luongToiDaMongMuon),
                    capDoKinhNghiemText,
                    loaiHinhLamViecText,
                    remote,
                    khongYeuCauKinhNghiem,
                    tuKhoaLoaiTru,
                    limit
            );
            return "Đã tìm thấy " + lastResult.getTongSo() + " tin tuyển dụng phù hợp trong database.";
        }

        private PublicJobSearchResponse getLastResult() {
            return lastResult;
        }

        private Integer normalizeSalaryAmount(Integer value) {
            if (value == null || value <= 0) {
                return null;
            }
            // Gemini đôi khi truyền "10" thay vì "10000000" cho câu "10 triệu".
            if (value < 1_000) {
                return value * 1_000_000;
            }
            return value;
        }

        private String normalizeLocation(String value) {
            if (!StringUtils.hasText(value)) {
                return value;
            }
            String normalized = value.trim();
            String lower = normalized.toLowerCase();
            if (lower.equals("hcm") || lower.equals("sg") || lower.contains("sài gòn") || lower.contains("sai gon")) {
                return "Hồ Chí Minh";
            }
            if (lower.equals("hn")) {
                return "Hà Nội";
            }
            if (lower.equals("dn")) {
                return "Đà Nẵng";
            }
            return normalized;
        }
    }
}
