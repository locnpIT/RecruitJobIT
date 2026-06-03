package com.phuocloc.projectfinal.recruit.admin.service;

import com.phuocloc.projectfinal.recruit.admin.dto.request.UpsertCatalogItemRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminCatalogItemResponse;
import com.phuocloc.projectfinal.recruit.auth.enums.RoleName;
import com.phuocloc.projectfinal.recruit.auth.repository.RolesRepository;
import com.phuocloc.projectfinal.recruit.company.enums.EmployerCompanyRole;
import com.phuocloc.projectfinal.recruit.company.repository.LoaiTaiLieuRepository;
import com.phuocloc.projectfinal.recruit.company.repository.VaiTroCongTyRepository;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.LoaiTaiLieu;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.VaiTroCongTy;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.VaiTroHeThong;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.LoaiChungChi;
import com.phuocloc.projectfinal.recruit.candidate.repository.LoaiChungChiRepository;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
/**
 * Nghiệp vụ CRUD cho nhóm danh mục quản trị hệ thống.
 *
 * <p>Module này phục vụ các bảng danh mục có sẵn trong DB:
 * VaiTroHeThong, VaiTroCongTy, LoaiTaiLieu, LoaiChungChi.</p>
 */
public class AdminCatalogService {

    private final RolesRepository rolesRepository;
    private final VaiTroCongTyRepository vaiTroCongTyRepository;
    private final LoaiTaiLieuRepository loaiTaiLieuRepository;
    private final LoaiChungChiRepository loaiChungChiRepository;

    @Transactional(readOnly = true)
    public List<AdminCatalogItemResponse> listSystemRoles() {
        return rolesRepository.findAllByOrderByIdAsc().stream()
                .map(this::mapSystemRole)
                .toList();
    }

    @Transactional
    public AdminCatalogItemResponse createSystemRole(UpsertCatalogItemRequest request) {
        String ten = requireTen(request);
        if (rolesRepository.existsByTenIgnoreCase(ten)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên vai trò hệ thống đã tồn tại");
        }

        VaiTroHeThong role = VaiTroHeThong.builder()
                .ten(ten)
                .moTa(trimToNull(request.getMoTa()))
                .build();
        role = rolesRepository.save(role);
        return mapSystemRole(role);
    }

    @Transactional
    public AdminCatalogItemResponse updateSystemRole(Long id, UpsertCatalogItemRequest request) {
        VaiTroHeThong role = rolesRepository.findById(toIntId(id, "id"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy vai trò hệ thống"));
        String tenMoi = requireTen(request);

        // Các role lõi được code kiểm quyền trực tiếp bằng tên nên không cho đổi tên.
        if (isCoreSystemRole(role.getTen()) && !role.getTen().equalsIgnoreCase(tenMoi)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không được đổi tên vai trò hệ thống lõi");
        }
        if (!role.getTen().equalsIgnoreCase(tenMoi) && rolesRepository.existsByTenIgnoreCase(tenMoi)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên vai trò hệ thống đã tồn tại");
        }

        role.setTen(tenMoi);
        role.setMoTa(trimToNull(request.getMoTa()));
        role = rolesRepository.save(role);
        return mapSystemRole(role);
    }

    @Transactional
    public void deleteSystemRole(Long id) {
        VaiTroHeThong role = rolesRepository.findById(toIntId(id, "id"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy vai trò hệ thống"));
        if (isCoreSystemRole(role.getTen())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể xoá vai trò hệ thống lõi");
        }
        safeDelete(() -> rolesRepository.delete(role), "Vai trò hệ thống đang được sử dụng");
    }

    @Transactional(readOnly = true)
    public List<AdminCatalogItemResponse> listCompanyRoles() {
        return vaiTroCongTyRepository.findAllByOrderByIdAsc().stream()
                .map(this::mapCompanyRole)
                .toList();
    }

    @Transactional
    public AdminCatalogItemResponse createCompanyRole(UpsertCatalogItemRequest request) {
        String ten = requireTen(request);
        if (vaiTroCongTyRepository.existsByTenIgnoreCase(ten)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên vai trò công ty đã tồn tại");
        }
        VaiTroCongTy role = new VaiTroCongTy(null, ten, trimToNull(request.getMoTa()));
        role = vaiTroCongTyRepository.save(role);
        return mapCompanyRole(role);
    }

    @Transactional
    public AdminCatalogItemResponse updateCompanyRole(Long id, UpsertCatalogItemRequest request) {
        VaiTroCongTy role = vaiTroCongTyRepository.findById(toIntId(id, "id"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy vai trò công ty"));
        String tenMoi = requireTen(request);

        if (isCoreCompanyRole(role.getTen()) && !role.getTen().equalsIgnoreCase(tenMoi)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không được đổi tên vai trò công ty lõi");
        }
        if (!role.getTen().equalsIgnoreCase(tenMoi) && vaiTroCongTyRepository.existsByTenIgnoreCase(tenMoi)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên vai trò công ty đã tồn tại");
        }

        role.setTen(tenMoi);
        role.setMoTa(trimToNull(request.getMoTa()));
        role = vaiTroCongTyRepository.save(role);
        return mapCompanyRole(role);
    }

    @Transactional
    public void deleteCompanyRole(Long id) {
        VaiTroCongTy role = vaiTroCongTyRepository.findById(toIntId(id, "id"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy vai trò công ty"));
        if (isCoreCompanyRole(role.getTen())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể xoá vai trò công ty lõi");
        }
        safeDelete(() -> vaiTroCongTyRepository.delete(role), "Vai trò công ty đang được sử dụng");
    }

    @Transactional(readOnly = true)
    public List<AdminCatalogItemResponse> listProofTypes() {
        return loaiTaiLieuRepository.findAllByOrderByIdAsc().stream()
                .map(this::mapProofType)
                .toList();
    }

    @Transactional
    public AdminCatalogItemResponse createProofType(UpsertCatalogItemRequest request) {
        String ten = requireTen(request);
        if (loaiTaiLieuRepository.existsByTenIgnoreCase(ten)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên loại tài liệu đã tồn tại");
        }
        LoaiTaiLieu item = loaiTaiLieuRepository.save(new LoaiTaiLieu(null, ten, trimToNull(request.getMoTa())));
        return mapProofType(item);
    }

    @Transactional
    public AdminCatalogItemResponse updateProofType(Long id, UpsertCatalogItemRequest request) {
        LoaiTaiLieu item = loaiTaiLieuRepository.findById(toIntId(id, "id"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy loại tài liệu"));
        String tenMoi = requireTen(request);
        if (!item.getTen().equalsIgnoreCase(tenMoi) && loaiTaiLieuRepository.existsByTenIgnoreCase(tenMoi)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên loại tài liệu đã tồn tại");
        }

        item.setTen(tenMoi);
        item.setMoTa(trimToNull(request.getMoTa()));
        item = loaiTaiLieuRepository.save(item);
        return mapProofType(item);
    }

    @Transactional
    public void deleteProofType(Long id) {
        LoaiTaiLieu item = loaiTaiLieuRepository.findById(toIntId(id, "id"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy loại tài liệu"));
        safeDelete(() -> loaiTaiLieuRepository.delete(item), "Loại tài liệu đang được sử dụng");
    }

    @Transactional(readOnly = true)
    public List<AdminCatalogItemResponse> listCertificateTypes() {
        return loaiChungChiRepository.findAllByOrderByTenAsc().stream()
                .map(this::mapCertificateType)
                .toList();
    }

    @Transactional
    public AdminCatalogItemResponse createCertificateType(UpsertCatalogItemRequest request) {
        String ten = requireTen(request);
        if (loaiChungChiRepository.existsByTenIgnoreCase(ten)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên loại chứng chỉ đã tồn tại");
        }
        LoaiChungChi item = loaiChungChiRepository.save(new LoaiChungChi(null, ten, trimToNull(request.getMoTa())));
        return mapCertificateType(item);
    }

    @Transactional
    public AdminCatalogItemResponse updateCertificateType(Long id, UpsertCatalogItemRequest request) {
        LoaiChungChi item = loaiChungChiRepository.findById(toIntId(id, "id"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy loại chứng chỉ"));
        String tenMoi = requireTen(request);

        if (!item.getTen().equalsIgnoreCase(tenMoi) && loaiChungChiRepository.existsByTenIgnoreCase(tenMoi)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên loại chứng chỉ đã tồn tại");
        }
        item.setTen(tenMoi);
        item.setMoTa(trimToNull(request.getMoTa()));
        item = loaiChungChiRepository.save(item);
        return mapCertificateType(item);
    }

    @Transactional
    public void deleteCertificateType(Long id) {
        LoaiChungChi item = loaiChungChiRepository.findById(toIntId(id, "id"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy loại chứng chỉ"));
        safeDelete(() -> loaiChungChiRepository.delete(item), "Loại chứng chỉ đang được sử dụng");
    }

    private void safeDelete(Runnable action, String defaultMessage) {
        try {
            action.run();
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, defaultMessage);
        }
    }

    private String requireTen(UpsertCatalogItemRequest request) {
        String ten = trimToNull(request == null ? null : request.getTen());
        if (!StringUtils.hasText(ten)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên danh mục không được để trống");
        }
        return ten;
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private Integer toIntId(Long id, String fieldName) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " không được để trống");
        }
        return Math.toIntExact(id);
    }

    private boolean isCoreSystemRole(String ten) {
        if (!StringUtils.hasText(ten)) {
            return false;
        }
        String normalized = ten.trim().toUpperCase(Locale.ROOT);
        return normalized.equals(RoleName.ADMIN.name()) || normalized.equals(RoleName.CANDIDATE.name());
    }

    private boolean isCoreCompanyRole(String ten) {
        if (!StringUtils.hasText(ten)) {
            return false;
        }
        String normalized = ten.trim().toUpperCase(Locale.ROOT);
        return normalized.equals(EmployerCompanyRole.OWNER.name())
                || normalized.equals(EmployerCompanyRole.HR.name());
    }

    private AdminCatalogItemResponse mapSystemRole(VaiTroHeThong item) {
        return AdminCatalogItemResponse.builder()
                .id(item.getId() == null ? null : item.getId().longValue())
                .ten(item.getTen())
                .moTa(item.getMoTa())
                .build();
    }

    private AdminCatalogItemResponse mapCompanyRole(VaiTroCongTy item) {
        return AdminCatalogItemResponse.builder()
                .id(item.getId() == null ? null : item.getId().longValue())
                .ten(item.getTen())
                .moTa(item.getMoTa())
                .build();
    }

    private AdminCatalogItemResponse mapProofType(LoaiTaiLieu item) {
        return AdminCatalogItemResponse.builder()
                .id(item.getId() == null ? null : item.getId().longValue())
                .ten(item.getTen())
                .moTa(item.getMoTa())
                .build();
    }

    private AdminCatalogItemResponse mapCertificateType(LoaiChungChi item) {
        return AdminCatalogItemResponse.builder()
                .id(item.getId() == null ? null : item.getId().longValue())
                .ten(item.getTen())
                .moTa(item.getMoTa())
                .build();
    }
}
