package com.phuocloc.projectfinal.recruit.infrastructure.bootstrap;

import com.phuocloc.projectfinal.recruit.company.enums.CompanyProofDocumentType;
import com.phuocloc.projectfinal.recruit.company.repository.LoaiTaiLieuRepository;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.LoaiTaiLieu;
import java.util.Map;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class CompanyProofTypeSeeder implements ApplicationRunner {

    private final LoaiTaiLieuRepository loaiTaiLieuRepository;

    public CompanyProofTypeSeeder(LoaiTaiLieuRepository loaiTaiLieuRepository) {
        this.loaiTaiLieuRepository = loaiTaiLieuRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Map<CompanyProofDocumentType, String> descriptions = Map.of(
                CompanyProofDocumentType.BUSINESS_REGISTRATION, "Giấy đăng ký kinh doanh",
                CompanyProofDocumentType.TAX_CERTIFICATE, "Giấy chứng nhận mã số thuế",
                CompanyProofDocumentType.OWNER_ID_CARD, "CCCD/CMND người đại diện",
                CompanyProofDocumentType.OTHER, "Tài liệu khác"
        );

        for (CompanyProofDocumentType type : CompanyProofDocumentType.values()) {
            String ten = type.name();
            if (loaiTaiLieuRepository.findByTenIgnoreCase(ten).isPresent()) {
                continue;
            }

            loaiTaiLieuRepository.save(new LoaiTaiLieu(null, ten, descriptions.getOrDefault(type, ten)));
        }
    }
}
