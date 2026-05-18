package com.phuocloc.projectfinal.recruit.auth.security;

import com.phuocloc.projectfinal.recruit.auth.dto.shared.CompanyMemberInfo;
import com.phuocloc.projectfinal.recruit.auth.repository.UsersRepository;
import com.phuocloc.projectfinal.recruit.company.repository.ThanhVienCongTyRepository;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

/**
 * Tải thông tin người dùng cho Spring Security.
 * Ngoài role hệ thống, service này còn gắn thêm thông tin thành viên công ty
 * để các luồng company-admin có thể kiểm tra quyền theo công ty/chi nhánh.
 */
@Service
@RequiredArgsConstructor
public class AppUserDetailsService implements UserDetailsService {

    private final UsersRepository usersRepository;
    private final ThanhVienCongTyRepository thanhVienCongTyRepository;

    /**
     * Tìm người dùng theo email và map sang principal dùng trong toàn bộ phiên đăng nhập.
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        NguoiDung user = usersRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Email không tồn tại " + email));

        List<CompanyMemberInfo> memberships = thanhVienCongTyRepository.findActiveMembershipsByUserId(user.getId()).stream()
                .map(m -> CompanyMemberInfo.builder()
                        .congTyId(m.getChiNhanh().getCongTy().getId())
                        .chiNhanhId(m.getChiNhanh().getId())
                        .vaiTroCongTy(m.getVaiTroCongTy().getTen())
                        .build())
                .collect(Collectors.toList());

        return AppUserPrinciple.fromUser(user, memberships);
    }
}
