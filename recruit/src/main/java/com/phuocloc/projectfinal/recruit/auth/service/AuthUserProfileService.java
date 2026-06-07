package com.phuocloc.projectfinal.recruit.auth.service;

import com.phuocloc.projectfinal.recruit.auth.dto.request.UpdateAvatarRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.request.UpdateUserProfileRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.response.UserProfileResponse;
import com.phuocloc.projectfinal.recruit.auth.repository.UsersRepository;
import com.phuocloc.projectfinal.recruit.domain.diadiem.entity.XaPhuong;
import com.phuocloc.projectfinal.recruit.domain.diadiem.repository.XaPhuongRepository;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;
import com.phuocloc.projectfinal.recruit.common.util.ServiceUtils;

@Service
@Transactional
@RequiredArgsConstructor
public class AuthUserProfileService {

    private final UsersRepository usersRepository;
    private final XaPhuongRepository xaPhuongRepository;

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile(Long userId) {
        return mapUserProfile(requireUser(userId));
    }

    public UserProfileResponse updateAvatar(Long userId, UpdateAvatarRequest request) {
        if (request == null || !StringUtils.hasText(request.getAnhDaiDienUrl())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "anhDaiDienUrl không hợp lệ");
        }

        NguoiDung user = requireUser(userId);
        user.setAnhDaiDienUrl(request.getAnhDaiDienUrl().trim());
        return mapUserProfile(usersRepository.save(user));
    }

    public UserProfileResponse updateCurrentUserProfile(Long userId, UpdateUserProfileRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payload cập nhật không hợp lệ");
        }

        NguoiDung user = requireUser(userId);
        // Chỉ cập nhật field client gửi lên; field null được giữ nguyên trừ xaPhuongId được thiết kế để clear.
        if (request.getSoDienThoai() != null) {
            user.setSoDienThoai(trimToNull(request.getSoDienThoai()));
        }
        if (request.getGioiTinh() != null) {
            user.setGioiTinh(trimToNull(request.getGioiTinh()));
        }
        if (request.getDiaChiChiTiet() != null) {
            user.setDiaChiChiTiet(trimToNull(request.getDiaChiChiTiet()));
        }
        if (request.getNgaySinh() != null) {
            user.setNgaySinh(request.getNgaySinh());
        }
        if (request.getXaPhuongId() == null) {
            user.setXaPhuong(null);
        } else {
            user.setXaPhuong(resolveXaPhuong(request.getXaPhuongId()));
        }

        return mapUserProfile(usersRepository.save(user));
    }

    private NguoiDung requireUser(Long userId) {
        return usersRepository.findDetailedById(toIntId(userId, "userId"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
    }

    private XaPhuong resolveXaPhuong(Long xaPhuongId) {
        if (xaPhuongId == null) {
            return null;
        }
        Integer id = toIntId(xaPhuongId, "xaPhuongId");
        return xaPhuongRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy xã/phường"));
    }

    private UserProfileResponse mapUserProfile(NguoiDung user) {
        return UserProfileResponse.builder()
                .id(ServiceUtils.toLong(user.getId()))
                .email(user.getEmail())
                .ten(user.getTen())
                .ho(user.getHo())
                .soDienThoai(user.getSoDienThoai())
                .ngaySinh(user.getNgaySinh())
                .gioiTinh(user.getGioiTinh())
                .diaChiChiTiet(user.getDiaChiChiTiet())
                .xaPhuongId(user.getXaPhuong() == null ? null : ServiceUtils.toLong(user.getXaPhuong().getId()))
                .xaPhuongTen(user.getXaPhuong() == null ? null : user.getXaPhuong().getTen())
                .tinhThanhId(user.getXaPhuong() == null
                        || user.getXaPhuong().getTinhThanh() == null ? null : ServiceUtils.toLong(user.getXaPhuong().getTinhThanh().getId()))
                .tinhThanhTen(user.getXaPhuong() == null || user.getXaPhuong().getTinhThanh() == null
                        ? null
                        : user.getXaPhuong().getTinhThanh().getTen())
                .vaiTro(user.getVaiTroHeThong() == null ? null : user.getVaiTroHeThong().getTen())
                .dangHoatDong(user.getDangHoatDong())
                .anhDaiDienUrl(user.getAnhDaiDienUrl())
                .build();
    }

    private Integer toIntId(Long id, String fieldName) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " không được để trống");
        }
        if (id > Integer.MAX_VALUE || id < Integer.MIN_VALUE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " vượt phạm vi Integer");
        }
        return id.intValue();
    }

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }
}
