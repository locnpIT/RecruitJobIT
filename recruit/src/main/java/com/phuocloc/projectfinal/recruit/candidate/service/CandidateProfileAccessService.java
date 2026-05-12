package com.phuocloc.projectfinal.recruit.candidate.service;

import com.phuocloc.projectfinal.recruit.candidate.repository.CandidateProfileRepository;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoUngVien;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
/**
 * Service chuyên trách kiểm tra quyền truy cập hồ sơ ứng viên.
 *
 * <p>Tách lớp này ra giúp nghiệp vụ trong {@code CandidateProfileService}
 * không bị lẫn với logic ownership/validation định danh.</p>
 */
public class CandidateProfileAccessService {

    private final CandidateProfileRepository candidateProfileRepository;

    @Transactional(readOnly = true)
    public HoSoUngVien requireProfile(Long userId) {
        // Dùng cho các luồng thao tác trên hồ sơ mặc định của user hiện tại.
        return candidateProfileRepository.findByNguoiDung_Id(toInt(userId, "userId"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ ứng viên"));
    }

    @Transactional(readOnly = true)
    public List<HoSoUngVien> listProfiles(Long userId) {
        return candidateProfileRepository.findAllByNguoiDung_IdOrderByNgayCapNhatDesc(toInt(userId, "userId"));
    }

    @Transactional(readOnly = true)
    public HoSoUngVien requireProfileById(Long userId, Long profileId) {
        // Truy vấn theo cả userId và profileId để đảm bảo candidate không thể đọc/sửa hồ sơ người khác.
        Integer uid = toInt(userId, "userId");
        Integer pid = toInt(profileId, "profileId");
        return candidateProfileRepository.findByIdAndNguoiDung_Id(pid, uid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ ứng viên"));
    }

    public void ensureOwner(HoSoUngVien expected, HoSoUngVien actual) {
        Integer expectedId = expected == null ? null : expected.getId();
        Integer actualId = actual == null ? null : actual.getId();
        if (!Objects.equals(expectedId, actualId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không có quyền thao tác dữ liệu này");
        }
    }

    public Integer toInt(Long value, String field) {
        if (value == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " không hợp lệ");
        }
        return Math.toIntExact(value);
    }

    public String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
