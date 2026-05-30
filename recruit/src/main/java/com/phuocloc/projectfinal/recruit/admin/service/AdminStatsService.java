package com.phuocloc.projectfinal.recruit.admin.service;

import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminDashboardStatsResponse;
import com.phuocloc.projectfinal.recruit.auth.repository.UsersRepository;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
/**
 * Gom riêng số liệu tổng quan để AdminService không giữ trực tiếp repository logic.
 */
public class AdminStatsService {

    private final UsersRepository usersRepository;
    private final CompanyRepository companyRepository;

    @Transactional(readOnly = true)
    public AdminDashboardStatsResponse getStats() {
        return AdminDashboardStatsResponse.builder()
                .tongNguoiDung(usersRepository.countByNgayXoaIsNull())
                .nguoiDungHoatDong(usersRepository.countByNgayXoaIsNullAndDangHoatDongTrue())
                .nguoiDungKhongHoatDong(usersRepository.countByNgayXoaIsNullAndDangHoatDongFalse())
                .tongCongTy(companyRepository.countByNgayXoaIsNull())
                .congTyChoDuyet(companyRepository.countByNgayXoaIsNullAndTrangThai("PENDING"))
                .congTyDaDuyet(companyRepository.countByNgayXoaIsNullAndTrangThai("APPROVED"))
                .congTyBiTuChoi(companyRepository.countByNgayXoaIsNullAndTrangThai("REJECTED"))
                .build();
    }
}
