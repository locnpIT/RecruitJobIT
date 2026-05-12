package com.phuocloc.projectfinal.recruit.infrastructure.bootstrap;

import com.phuocloc.projectfinal.recruit.auth.enums.RoleName;
import com.phuocloc.projectfinal.recruit.auth.repository.RolesRepository;
import com.phuocloc.projectfinal.recruit.company.enums.EmployerCompanyRole;
import com.phuocloc.projectfinal.recruit.company.repository.VaiTroCongTyRepository;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.VaiTroCongTy;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.VaiTroHeThong;
import java.util.Map;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class RoleDataSeeder implements ApplicationRunner {

    private final RolesRepository rolesRepository;
    private final VaiTroCongTyRepository vaiTroCongTyRepository;

    public RoleDataSeeder(
            RolesRepository rolesRepository,
            VaiTroCongTyRepository vaiTroCongTyRepository
    ) {
        this.rolesRepository = rolesRepository;
        this.vaiTroCongTyRepository = vaiTroCongTyRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedSystemRoles();
        seedCompanyRoles();
    }

    private void seedSystemRoles() {
        Map<RoleName, String> descriptions = Map.of(
                RoleName.ADMIN, "Quản trị hệ thống",
                RoleName.CANDIDATE, "Ứng viên"
        );

        for (RoleName roleName : RoleName.values()) {
            String ten = roleName.name();
            if (rolesRepository.findByTenIgnoreCase(ten).isPresent()) {
                continue;
            }
            rolesRepository.save(
                    VaiTroHeThong.builder()
                            .ten(ten)
                            .moTa(descriptions.getOrDefault(roleName, ten))
                            .build()
            );
        }
    }

    private void seedCompanyRoles() {
        Map<EmployerCompanyRole, String> descriptions = Map.of(
                EmployerCompanyRole.OWNER, "Chủ công ty",
                EmployerCompanyRole.HR, "Nhân sự công ty",
                EmployerCompanyRole.MASTER_BRANCH, "Chủ chi nhánh"
        );

        for (EmployerCompanyRole role : EmployerCompanyRole.values()) {
            String ten = role.name();
            if (vaiTroCongTyRepository.findByTenIgnoreCase(ten).isPresent()) {
                continue;
            }
            vaiTroCongTyRepository.save(
                    new VaiTroCongTy(null, ten, descriptions.getOrDefault(role, ten))
            );
        }
    }
}
