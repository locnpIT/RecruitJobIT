package com.phuocloc.projectfinal.recruit.ai.service;

import java.util.List;

record CandidateMatchExplanation(
        double diemPhuHop,
        String lyDoPhuHop,
        List<String> tinHieuKhop,
        List<String> diemManh,
        List<String> kinhNghiemLienQuan,
        List<String> canKiemTraThem,
        String goiYHanhDong
) {
}
