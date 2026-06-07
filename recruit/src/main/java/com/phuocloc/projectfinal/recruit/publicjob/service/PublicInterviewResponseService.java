package com.phuocloc.projectfinal.recruit.publicjob.service;

import com.phuocloc.projectfinal.recruit.auth.service.JwtService;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.DonUngTuyen;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.DonUngTuyenRepository;
import io.jsonwebtoken.Claims;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import com.phuocloc.projectfinal.recruit.common.util.ServiceUtils;

@Service
@RequiredArgsConstructor
public class PublicInterviewResponseService {

    private final JwtService jwtService;
    private final DonUngTuyenRepository donUngTuyenRepository;

    @Transactional
    public InterviewResponseResult respond(String token, String action) {
        if (!StringUtils.hasText(token)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu token phản hồi phỏng vấn");
        }

        Claims claims = jwtService.parsePublicToken(token);
        Long applicationId = extractApplicationId(claims);
        String tokenAction = normalizeAction(String.valueOf(claims.get("action")));
        String requestedAction = normalizeAction(action);

        if (!tokenAction.equals(requestedAction)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hành động không khớp với token");
        }

        DonUngTuyen application = donUngTuyenRepository.findByIdAndNgayXoaIsNull(Math.toIntExact(applicationId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn ứng tuyển"));

        if (!"ACCEPTED".equalsIgnoreCase(application.getTrangThai())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đơn ứng tuyển chưa ở trạng thái chờ xác nhận phỏng vấn");
        }

        String nextStatus = switch (requestedAction) {
            case "CONFIRM" -> "CONFIRMED";
            case "DECLINE" -> "DECLINED";
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hành động không hợp lệ");
        };

        application.setTrangThai(nextStatus);
        donUngTuyenRepository.save(application);

        return new InterviewResponseResult(application.getId() == null ? applicationId : ServiceUtils.toLong(application.getId()), nextStatus);
    }

    private Long extractApplicationId(Claims claims) {
        Object raw = claims.get("applicationId");
        if (raw instanceof Integer i) {
            return i.longValue();
        }
        if (raw instanceof Long l) {
            return l;
        }
        return Long.parseLong(String.valueOf(raw));
    }

    private String normalizeAction(String action) {
        if (!StringUtils.hasText(action)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu action phản hồi phỏng vấn");
        }
        return action.trim().toUpperCase(Locale.ROOT);
    }

    public record InterviewResponseResult(Long applicationId, String nextStatus) {
    }
}
