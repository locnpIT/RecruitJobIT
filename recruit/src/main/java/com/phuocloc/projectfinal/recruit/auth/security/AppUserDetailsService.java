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

@Service
@RequiredArgsConstructor
public class AppUserDetailsService implements UserDetailsService {

    private final UsersRepository usersRepository;
    private final ThanhVienCongTyRepository thanhVienCongTyRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        NguoiDung user = usersRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Email không tồn tại " + email));

        List<CompanyMemberInfo> memberships = thanhVienCongTyRepository.findActiveMembershipsByUserId(user.getId()).stream()
                .map(m -> CompanyMemberInfo.builder()
                        .companyId(m.getChiNhanh().getCongTy().getId())
                        .branchId(m.getChiNhanh().getId())
                        .companyRole(m.getVaiTroCongTy().getTen())
                        .build())
                .collect(Collectors.toList());

        return AppUserPrinciple.fromUser(user, memberships);
    }
}
