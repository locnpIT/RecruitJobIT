package com.phuocloc.projectfinal.recruit.auth.service;

import com.phuocloc.projectfinal.recruit.auth.dto.request.CreateOwnerRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.response.AuthResponse;
import com.phuocloc.projectfinal.recruit.auth.dto.response.CreateOwnerResponse;
import com.phuocloc.projectfinal.recruit.auth.enums.RoleName;
import com.phuocloc.projectfinal.recruit.auth.repository.RolesRepository;
import com.phuocloc.projectfinal.recruit.auth.repository.UsersRepository;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyProofTypeResponse;
import com.phuocloc.projectfinal.recruit.company.enums.CompanyProofDocumentStatus;
import com.phuocloc.projectfinal.recruit.company.enums.CompanyStatus;
import com.phuocloc.projectfinal.recruit.company.enums.EmployerCompanyRole;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyBranchRepository;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyProofDocumentRepository;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyRepository;
import com.phuocloc.projectfinal.recruit.company.repository.EmployerProfileRepository;
import com.phuocloc.projectfinal.recruit.company.repository.LoaiTaiLieuRepository;
import com.phuocloc.projectfinal.recruit.company.repository.VaiTroCongTyRepository;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ChiNhanhCongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.CongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.LoaiTaiLieu;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.TepMinhChungCongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ThanhVienCongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.VaiTroCongTy;
import com.phuocloc.projectfinal.recruit.domain.diadiem.entity.TinhThanh;
import com.phuocloc.projectfinal.recruit.domain.diadiem.entity.XaPhuong;
import com.phuocloc.projectfinal.recruit.domain.diadiem.repository.TinhThanhRepository;
import com.phuocloc.projectfinal.recruit.domain.diadiem.repository.XaPhuongRepository;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.VaiTroHeThong;
import com.phuocloc.projectfinal.recruit.infrastructure.cloudinary.CloudinaryStorageService;
import com.phuocloc.projectfinal.recruit.common.util.ServiceUtils;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
/**
 * Luồng đăng ký owner công ty.
 */
public class OwnerRegistrationService {

    private final UsersRepository usersRepository;
    private final RolesRepository rolesRepository;
    private final CompanyRepository companyRepository;
    private final CompanyBranchRepository companyBranchRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final CompanyProofDocumentRepository companyProofDocumentRepository;
    private final VaiTroCongTyRepository vaiTroCongTyRepository;
    private final LoaiTaiLieuRepository loaiTaiLieuRepository;
    private final TinhThanhRepository tinhThanhRepository;
    private final XaPhuongRepository xaPhuongRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CloudinaryStorageService cloudinaryStorageService;

    @Transactional
    public CreateOwnerResponse registerOwner(CreateOwnerRequest request) {
        String normalizedEmail = ServiceUtils.normalizeEmail(request.getEmail());
        ensureEmailNotExists(normalizedEmail);

        VaiTroHeThong userRole = requireRole(RoleName.USER);
        List<ResolvedOwnerProofInput> resolvedProofInputs = resolveOwnerProofInputs(request);

        NguoiDung owner = new NguoiDung();
        owner.setEmail(normalizedEmail);
        owner.setMatKhauBam(passwordEncoder.encode(request.getMatKhau()));
        owner.setTen(request.getTen().trim());
        owner.setHo(request.getHo().trim());
        owner.setSoDienThoai(ServiceUtils.trimToNull(request.getSoDienThoai()));
        owner.setDangHoatDong(true);
        owner.setVaiTroHeThong(userRole);
        owner = usersRepository.save(owner);

        CongTy congTy = new CongTy();
        congTy.setTen(request.getTenCongTy().trim());
        congTy.setMaSoThue(request.getMaSoThue().trim());
        congTy.setMoTa(ServiceUtils.trimToNull(request.getMoTaCongTy()));
        congTy.setWebsite(ServiceUtils.trimToNull(request.getWebsite()));
        congTy.setTrangThai(CompanyStatus.PENDING.name());
        congTy.setChuCongTy(owner);
        congTy = companyRepository.save(congTy);

        List<ChiNhanhCongTy> chiNhanhs = createBranches(congTy, request.getChiNhanhs());
        VaiTroCongTy vaiTroOwner = requireCompanyRole(EmployerCompanyRole.OWNER);

        ThanhVienCongTy ownerProfile = new ThanhVienCongTy();
        ownerProfile.setNguoiDung(owner);
        ownerProfile.setChiNhanh(chiNhanhs.stream()
                .filter(branch -> Boolean.TRUE.equals(branch.getLaTruSoChinh()))
                .findFirst()
                .orElseGet(chiNhanhs::getFirst));
        ownerProfile.setVaiTroCongTy(vaiTroOwner);
        ownerProfile.setTrangThai("ACTIVE");
        employerProfileRepository.save(ownerProfile);

        List<TepMinhChungCongTy> savedProofDocuments = new java.util.ArrayList<>();
        for (ResolvedOwnerProofInput resolvedProofInput : resolvedProofInputs) {
            TepMinhChungCongTy proofDocument = new TepMinhChungCongTy();
            proofDocument.setCongTy(congTy);
            proofDocument.setLoaiTaiLieu(resolvedProofInput.loaiTaiLieu());
            proofDocument.setDuongDanTep(resolvedProofInput.duongDanTep());
            proofDocument.setTenTep(resolvedProofInput.tenTep());
            proofDocument.setTrangThai(CompanyProofDocumentStatus.PENDING.name());
            proofDocument.setNgayXoa(null);
            savedProofDocuments.add(companyProofDocumentRepository.save(proofDocument));
        }

        String accessToken = jwtService.generateAccessToken(owner);
        String primaryProofUrl = savedProofDocuments.isEmpty() ? null : savedProofDocuments.getFirst().getDuongDanTep();
        return buildCreateOwnerResponse(owner, congTy, chiNhanhs, primaryProofUrl, accessToken);
    }

    @Transactional(readOnly = true)
    public List<CompanyProofTypeResponse> listOwnerProofTypes() {
        return loaiTaiLieuRepository.findAllByOrderByIdAsc().stream()
                .map(loaiTaiLieu -> CompanyProofTypeResponse.builder()
                        .id(ServiceUtils.toLong(loaiTaiLieu.getId()))
                        .ten(loaiTaiLieu.getTen())
                        .moTa(loaiTaiLieu.getMoTa())
                        .build())
                .toList();
    }

    private ThanhVienCongTy requireOwnerProfile(Long ownerUserId) {
        if (ownerUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Thiếu thông tin người dùng đăng nhập");
        }

        Integer ownerId = ServiceUtils.toIntId(ownerUserId, "ownerUserId");
        ThanhVienCongTy ownerProfile = employerProfileRepository
                .findFirstByNguoiDung_IdAndVaiTroCongTy_TenIgnoreCase(ownerId, EmployerCompanyRole.OWNER.name())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Không tìm thấy hồ sơ OWNER"));

        if (!Boolean.TRUE.equals(ownerProfile.getNguoiDung().getDangHoatDong())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Hồ sơ OWNER đang bị vô hiệu hóa");
        }
        return ownerProfile;
    }

    private CongTy requireOwnerCompany(ThanhVienCongTy ownerProfile) {
        if (ownerProfile.getChiNhanh() == null || ownerProfile.getChiNhanh().getCongTy() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hồ sơ OWNER chưa được gắn chi nhánh/công ty hợp lệ");
        }
        return ownerProfile.getChiNhanh().getCongTy();
    }

    private VaiTroHeThong requireRole(RoleName roleName) {
        return rolesRepository.findByTen(roleName.name())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Thiếu role trong DB: " + roleName));
    }

    private VaiTroCongTy requireCompanyRole(EmployerCompanyRole companyRole) {
        return vaiTroCongTyRepository.findByTenIgnoreCase(companyRole.name())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Thiếu vai trò công ty trong DB: " + companyRole));
    }

    private LoaiTaiLieu resolveLoaiTaiLieuOwnerProof(Long loaiTaiLieuId) {
        if (loaiTaiLieuId == null) {
            return loaiTaiLieuRepository.findAllByOrderByIdAsc().stream()
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chưa có loại tài liệu nào trong hệ thống"));
        }
        Integer safeId = ServiceUtils.toIntId(loaiTaiLieuId, "loaiTaiLieuId");
        return loaiTaiLieuRepository.findById(safeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy loại tài liệu"));
    }

    private void ensureEmailNotExists(String email) {
        if (usersRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email đã tồn tại");
        }
    }

    private String resolveProofUrl(CreateOwnerRequest request) {
        if (StringUtils.hasText(request.getDuongDanMinhChung())) {
            return request.getDuongDanMinhChung().trim();
        }

        MultipartFile proofFile = request.getTepMinhChung();
        if (proofFile == null || proofFile.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần tepMinhChung hoặc duongDanMinhChung");
        }
        return cloudinaryStorageService.uploadProof(proofFile);
    }

    private String resolveProofFileName(String proofUrl, MultipartFile proofFile, String providedFileName) {
        if (StringUtils.hasText(providedFileName)) {
            return providedFileName.trim();
        }
        if (proofFile != null && StringUtils.hasText(proofFile.getOriginalFilename())) {
            return proofFile.getOriginalFilename().trim();
        }
        try {
            String path = URI.create(proofUrl).getPath();
            if (!StringUtils.hasText(path)) {
                return "owner-proof";
            }
            int slashIndex = path.lastIndexOf('/');
            return slashIndex >= 0 ? path.substring(slashIndex + 1) : path;
        } catch (Exception ex) {
            return "owner-proof";
        }
    }

    private List<ResolvedOwnerProofInput> resolveOwnerProofInputs(CreateOwnerRequest request) {
        List<CreateOwnerRequest.ProofDocumentRequest> batchProofs = request.getMinhChungs();
        if (batchProofs != null && !batchProofs.isEmpty()) {
            List<ResolvedOwnerProofInput> result = new java.util.ArrayList<>();
            for (CreateOwnerRequest.ProofDocumentRequest proofItem : batchProofs) {
                if (proofItem == null || !StringUtils.hasText(proofItem.getDuongDanMinhChung())) {
                    continue;
                }

                String proofUrl = proofItem.getDuongDanMinhChung().trim();
                LoaiTaiLieu loaiTaiLieu = resolveLoaiTaiLieuOwnerProof(proofItem.getLoaiTaiLieuId());
                String fileName = resolveProofFileName(proofUrl, null, proofItem.getTenTep());
                result.add(new ResolvedOwnerProofInput(loaiTaiLieu, proofUrl, fileName));
            }
            if (!result.isEmpty()) {
                return result;
            }
        }

        String singleProofUrl = resolveProofUrl(request);
        LoaiTaiLieu singleProofType = resolveLoaiTaiLieuOwnerProof(request.getLoaiTaiLieuId());
        String singleFileName = resolveProofFileName(singleProofUrl, request.getTepMinhChung(), null);
        return List.of(new ResolvedOwnerProofInput(singleProofType, singleProofUrl, singleFileName));
    }

    private List<ChiNhanhCongTy> createBranches(CongTy congTy, List<CreateOwnerRequest.BranchRequest> branchRequests) {
        if (branchRequests == null || branchRequests.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần ít nhất một chi nhánh");
        }

        boolean hasPrimary = branchRequests.stream().anyMatch(branch -> Boolean.TRUE.equals(branch.getLaTruSoChinh()));
        if (!hasPrimary) {
            branchRequests.getFirst().setLaTruSoChinh(true);
        }

        List<ChiNhanhCongTy> savedBranches = new java.util.ArrayList<>();
        for (CreateOwnerRequest.BranchRequest branchRequest : branchRequests) {
            ChiNhanhCongTy chiNhanhCongTy = new ChiNhanhCongTy();
            chiNhanhCongTy.setCongTy(congTy);
            chiNhanhCongTy.setTen(branchRequest.getTenChiNhanh().trim());
            chiNhanhCongTy.setDiaChiChiTiet(branchRequest.getDiaChiChiTietChiNhanh().trim());
            chiNhanhCongTy.setXaPhuong(resolveOrCreateXaPhuong(branchRequest));
            chiNhanhCongTy.setLaTruSoChinh(Boolean.TRUE.equals(branchRequest.getLaTruSoChinh()));
            savedBranches.add(companyBranchRepository.save(chiNhanhCongTy));
        }
        return savedBranches;
    }

    private XaPhuong resolveOrCreateXaPhuong(CreateOwnerRequest.BranchRequest branchRequest) {
        if (branchRequest.getXaPhuongId() != null) {
            return resolveXaPhuong(branchRequest.getXaPhuongId());
        }

        if (!StringUtils.hasText(branchRequest.getTenXaPhuong()) || branchRequest.getTinhThanhId() == null) {
            return null;
        }

        Integer tinhThanhId = ServiceUtils.toIntId(branchRequest.getTinhThanhId(), "tinhThanhId");
        TinhThanh tinhThanh = tinhThanhRepository.findById(tinhThanhId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tỉnh/thành"));

        return xaPhuongRepository.findByTinhThanh_IdAndTenIgnoreCase(tinhThanhId, branchRequest.getTenXaPhuong().trim())
                .orElseGet(() -> {
                    XaPhuong xaPhuong = new XaPhuong();
                    xaPhuong.setTen(branchRequest.getTenXaPhuong().trim());
                    xaPhuong.setMoTa("Tự tạo từ luồng đăng ký công ty");
                    xaPhuong.setTinhThanh(tinhThanh);
                    return xaPhuongRepository.save(xaPhuong);
                });
    }

    private XaPhuong resolveXaPhuong(Long xaPhuongId) {
        if (xaPhuongId == null) {
            return null;
        }
        Integer id = ServiceUtils.toIntId(xaPhuongId, "xaPhuongId");
        return xaPhuongRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy xã/phường"));
    }

    private CreateOwnerResponse buildCreateOwnerResponse(
            NguoiDung owner,
            CongTy congTy,
            List<ChiNhanhCongTy> chiNhanhs,
            String duongDanMinhChung,
            String accessToken
    ) {
        CreateOwnerResponse.ThongTinChuSoHuu chuSoHuu = CreateOwnerResponse.ThongTinChuSoHuu.builder()
                .id(ServiceUtils.toLong(owner.getId()))
                .email(owner.getEmail())
                .ten(owner.getTen())
                .ho(owner.getHo())
                .duongDanMinhChung(duongDanMinhChung)
                .vaiTroHeThong(owner.getVaiTroHeThong() == null ? null : owner.getVaiTroHeThong().getTen())
                .vaiTroCongTy(ownerCompanyRole(owner))
                .dangHoatDong(owner.getDangHoatDong())
                .build();

        CreateOwnerResponse.ThongTinCongTy thongTinCongTy = CreateOwnerResponse.ThongTinCongTy.builder()
                .id(ServiceUtils.toLong(congTy.getId()))
                .ten(congTy.getTen())
                .maSoThue(congTy.getMaSoThue())
                .website(congTy.getWebsite())
                .moTa(congTy.getMoTa())
                .trangThai(congTy.getTrangThai())
                .build();

        List<CreateOwnerResponse.ThongTinChiNhanh> thongTinChiNhanhs = chiNhanhs.stream()
                .map(branch -> CreateOwnerResponse.ThongTinChiNhanh.builder()
                        .id(ServiceUtils.toLong(branch.getId()))
                        .ten(branch.getTen())
                        .diaChiChiTiet(branch.getDiaChiChiTiet())
                        .xaPhuongId(branch.getXaPhuong() == null ? null : ServiceUtils.toLong(branch.getXaPhuong().getId()))
                        .xaPhuongTen(branch.getXaPhuong() == null ? null : branch.getXaPhuong().getTen())
                        .laTruSoChinh(branch.getLaTruSoChinh())
                        .build())
                .toList();

        AuthResponse.ThongTinPhienDangNhap phienDangNhap = AuthResponse.ThongTinPhienDangNhap.builder()
                .accessToken(accessToken)
                .thoiHanTokenGiay(jwtService.getAccessTokenExpiresIn())
                .build();

        return CreateOwnerResponse.builder()
                .chuSoHuu(chuSoHuu)
                .congTy(thongTinCongTy)
                .chiNhanhs(thongTinChiNhanhs)
                .phienDangNhap(phienDangNhap)
                .build();
    }

    private String ownerCompanyRole(NguoiDung owner) {
        return employerProfileRepository.findFirstByNguoiDung_IdAndVaiTroCongTy_TenIgnoreCase(
                        owner.getId().intValue(),
                        EmployerCompanyRole.OWNER.name()
                )
                .map(profile -> profile.getVaiTroCongTy() == null ? null : profile.getVaiTroCongTy().getTen())
                .orElse(EmployerCompanyRole.OWNER.name());
    }

    private record ResolvedOwnerProofInput(LoaiTaiLieu loaiTaiLieu, String duongDanTep, String tenTep) {
    }
}
