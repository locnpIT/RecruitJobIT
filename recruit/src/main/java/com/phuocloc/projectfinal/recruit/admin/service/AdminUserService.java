package com.phuocloc.projectfinal.recruit.admin.service;

import com.phuocloc.projectfinal.recruit.admin.dto.request.UpdateUserStatusRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminUserResponse;
import com.phuocloc.projectfinal.recruit.auth.repository.UsersRepository;
import com.phuocloc.projectfinal.recruit.company.repository.ThanhVienCongTyRepository;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ThanhVienCongTy;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
/**
 * Nghiệp vụ quản lý user ở khu admin.
 *
 * <p>Phục vụ list/filter user, khóa mở tài khoản và xóa mềm người dùng.</p>
 */
public class AdminUserService {

    private final UsersRepository usersRepository;
    private final ThanhVienCongTyRepository thanhVienCongTyRepository;

    @Transactional(readOnly = true)
    public List<AdminUserResponse> listUsers(String keyword, String role, String status) {
        // Lọc hiện đang thực hiện in-memory trên tập user hiện có.
        String normalizedKeyword = normalize(keyword);
        String normalizedRole = normalize(role);
        String normalizedStatus = normalize(status);

        return usersRepository.findAll(Sort.by(Sort.Direction.DESC, "ngayTao")).stream()
                .filter(user -> user.getNgayXoa() == null)
                .filter(user -> matchesKeyword(user, normalizedKeyword))
                .filter(user -> matchesRole(user, normalizedRole))
                .filter(user -> matchesStatus(user, normalizedStatus))
                .map(this::mapUser)
                .toList();
    }

    @Transactional
    public AdminUserResponse updateUserStatus(Long userId, UpdateUserStatusRequest request) {
        NguoiDung user = usersRepository.findById(toIntId(userId, "userId"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));

        user.setDangHoatDong(request.getDangHoatDong());
        user = usersRepository.save(user);
        return mapUser(user);
    }

    @Transactional
    public void deleteUser(Long userId) {
        // Xóa mềm để vẫn giữ lịch sử dữ liệu liên quan thay vì xóa cứng.
        NguoiDung user = usersRepository.findById(toIntId(userId, "userId"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
        user.setDangHoatDong(false);
        user.setNgayXoa(LocalDateTime.now());
        usersRepository.save(user);
    }

    private AdminUserResponse mapUser(NguoiDung user) {
        List<ThanhVienCongTy> memberships = thanhVienCongTyRepository.findActiveMembershipsByUserId(user.getId());
        ThanhVienCongTy firstMembership = memberships.stream().findFirst().orElse(null);

        return AdminUserResponse.builder()
                .id(user.getId() == null ? null : user.getId().longValue())
                .hoTen(buildFullName(user.getHo(), user.getTen()))
                .email(user.getEmail())
                .soDienThoai(user.getSoDienThoai())
                .vaiTroHeThong(user.getVaiTroHeThong() == null ? null : user.getVaiTroHeThong().getTen())
                .dangHoatDong(Boolean.TRUE.equals(user.getDangHoatDong()))
                .trangThai(resolveUserStatus(user))
                .congTyTen(firstMembership == null || firstMembership.getChiNhanh() == null || firstMembership.getChiNhanh().getCongTy() == null
                        ? null
                        : firstMembership.getChiNhanh().getCongTy().getTen())
                .vaiTroCongTy(firstMembership == null || firstMembership.getVaiTroCongTy() == null
                        ? null
                        : firstMembership.getVaiTroCongTy().getTen())
                .chiNhanhTen(firstMembership == null || firstMembership.getChiNhanh() == null
                        ? null
                        : firstMembership.getChiNhanh().getTen())
                .ngayTao(user.getNgayTao())
                .ngayCapNhat(user.getNgayCapNhat())
                .build();
    }

    private boolean matchesKeyword(NguoiDung user, String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return true;
        }

        String fullName = normalize(buildFullName(user.getHo(), user.getTen()));
        return contains(fullName, keyword)
                || contains(normalize(user.getEmail()), keyword)
                || contains(normalize(user.getSoDienThoai()), keyword);
    }

    private boolean matchesRole(NguoiDung user, String role) {
        if (!StringUtils.hasText(role)) {
            return true;
        }
        return user.getVaiTroHeThong() != null && role.equalsIgnoreCase(user.getVaiTroHeThong().getTen());
    }

    private boolean matchesStatus(NguoiDung user, String status) {
        if (!StringUtils.hasText(status)) {
            return true;
        }

        String normalized = status.toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "ACTIVE" -> Boolean.TRUE.equals(user.getDangHoatDong());
            case "INACTIVE" -> Boolean.FALSE.equals(user.getDangHoatDong());
            case "DELETED" -> user.getNgayXoa() != null;
            default -> true;
        };
    }

    private String resolveUserStatus(NguoiDung user) {
        if (user.getNgayXoa() != null) {
            return "DELETED";
        }
        return Boolean.TRUE.equals(user.getDangHoatDong()) ? "ACTIVE" : "INACTIVE";
    }

    private Integer toIntId(Long id, String fieldName) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " không được để trống");
        }
        return Math.toIntExact(id);
    }

    private String buildFullName(String ho, String ten) {
        String fullName = (StringUtils.hasText(ho) ? ho.trim() : "") + " " + (StringUtils.hasText(ten) ? ten.trim() : "");
        return fullName.trim();
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private boolean contains(String source, String keyword) {
        return StringUtils.hasText(source) && source.contains(keyword);
    }
}
