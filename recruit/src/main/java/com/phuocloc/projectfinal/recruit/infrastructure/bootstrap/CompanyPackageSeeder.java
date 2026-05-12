package com.phuocloc.projectfinal.recruit.infrastructure.bootstrap;

import com.phuocloc.projectfinal.recruit.company.repository.DanhMucGoiRepository;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.DanhMucGoi;
import java.util.List;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class CompanyPackageSeeder implements ApplicationRunner {

    private final DanhMucGoiRepository danhMucGoiRepository;

    public CompanyPackageSeeder(DanhMucGoiRepository danhMucGoiRepository) {
        this.danhMucGoiRepository = danhMucGoiRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (danhMucGoiRepository.count() > 0) {
            return;
        }

        List<DanhMucGoi> packages = List.of(
                new DanhMucGoi(null, "GOI_30_NGAY", "Gói 30 ngày", "Đăng tin trong 30 ngày", 990000F),
                new DanhMucGoi(null, "GOI_90_NGAY", "Gói 90 ngày", "Đăng tin trong 90 ngày", 2490000F),
                new DanhMucGoi(null, "GOI_365_NGAY", "Gói 365 ngày", "Đăng tin trong 365 ngày", 7990000F)
        );
        danhMucGoiRepository.saveAll(packages);
    }
}
