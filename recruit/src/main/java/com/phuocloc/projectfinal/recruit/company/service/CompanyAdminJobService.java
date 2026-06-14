package com.phuocloc.projectfinal.recruit.company.service;

import com.phuocloc.projectfinal.recruit.ai.service.JobEmbeddingIndexService;
import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.company.dto.request.CreateCompanyJobRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.JobPayloadRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.UpdateCompanyJobRequest;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyAdminJobResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyJobMetadataResponse;
import com.phuocloc.projectfinal.recruit.company.enums.EmployerCompanyRole;
import com.phuocloc.projectfinal.recruit.candidate.repository.KyNangRepository;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyBranchRepository;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ChiNhanhCongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.CongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ThanhVienCongTy;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.CapDoKinhNghiem;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.KyNang;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.LoaiHinhLamViec;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.NganhNghe;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.repository.CapDoKinhNghiemRepository;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.repository.LoaiHinhLamViecRepository;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.repository.NganhNgheRepository;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.KyNangTinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.KyNangTinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.TinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.publicjob.service.PublicJobElasticsearchIndexService;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import com.phuocloc.projectfinal.recruit.common.util.ServiceUtils;

@Service
@RequiredArgsConstructor
public class CompanyAdminJobService {

    private static final Set<String> COMPANY_ADMIN_ROLES = Set.of(
            EmployerCompanyRole.OWNER.name(),
            EmployerCompanyRole.HR.name()
    );

    private final CompanyAdminAccessService accessService;
    private final CompanyAdminProfileService profileService;
    private final CompanyAdminPackageService packageService;
    private final TinTuyenDungRepository tinTuyenDungRepository;
    private final KyNangTinTuyenDungRepository kyNangTinTuyenDungRepository;
    private final KyNangRepository kyNangRepository;
    private final NganhNgheRepository nganhNgheRepository;
    private final LoaiHinhLamViecRepository loaiHinhLamViecRepository;
    private final CapDoKinhNghiemRepository capDoKinhNghiemRepository;
    private final CompanyBranchRepository companyBranchRepository;
    private final JobEmbeddingIndexService chiMucNhungTinTuyenDungService;
    private final PublicJobElasticsearchIndexService publicJobElasticsearchIndexService;

    @Transactional(readOnly = true)
    public CompanyJobMetadataResponse getJobMetadata() {
        // Metadata cho form tạo/sửa tin tuyển dụng, bao gồm kỹ năng để lưu bảng mapping.
        return CompanyJobMetadataResponse.builder()
                .nganhNghes(nganhNgheRepository.findAll().stream().map(e -> mapMetadataOption(e.getId(), e.getTen())).toList())
                .loaiHinhLamViecs(loaiHinhLamViecRepository.findAll().stream().map(e -> mapMetadataOption(e.getId(), e.getTen())).toList())
                .capDoKinhNghiems(capDoKinhNghiemRepository.findAll().stream().map(e -> mapMetadataOption(e.getId(), e.getTen())).toList())
                .kyNangs(kyNangRepository.findAllByOrderByTenAsc().stream().map(e -> mapMetadataOption(e.getId(), e.getTen())).toList())
                .build();
    }

    @Transactional(readOnly = true)
    public List<CompanyAdminJobResponse> listJobs(AppUserPrinciple principal, Integer chiNhanhId) {
        accessService.requireMembership(principal.getUserId().intValue(), chiNhanhId, COMPANY_ADMIN_ROLES);
        List<TinTuyenDung> jobs = tinTuyenDungRepository.findByChiNhanhs_IdAndNgayXoaIsNullOrderByNgayTaoDesc(chiNhanhId);
        Map<Integer, List<CompanyAdminJobResponse.KyNangItem>> jobSkillMap = mapJobSkillsByJobIds(jobs);
        return jobs.stream()
                .map(job -> mapJob(job, jobSkillMap.getOrDefault(job.getId(), List.of())))
                .toList();
    }

    @Transactional
    public CompanyAdminJobResponse createJob(AppUserPrinciple principal, CreateCompanyJobRequest request) {
        Integer userId = principal.getUserId().intValue();
        CongTy congTy = profileService.resolveApprovedManagedCompany(userId);
        ensureActivePostingPackage(congTy);
        List<ChiNhanhCongTy> branches = resolveJobBranches(congTy, request.getChiNhanhIds());
        ThanhVienCongTy membership = requireMembershipForAllJobBranches(userId, branches);

        TinTuyenDung tinTuyenDung = new TinTuyenDung();
        tinTuyenDung.setNguoiDang(membership.getNguoiDung());
        applyJobPayload(tinTuyenDung, request);
        tinTuyenDung.getChiNhanhs().clear();
        tinTuyenDung.getChiNhanhs().addAll(branches);
        tinTuyenDung.setTrangThai("DRAFT");
        tinTuyenDung = tinTuyenDungRepository.save(tinTuyenDung);

        // Sau khi lưu skill mapping, index semantic/full-text mới có đủ dữ liệu để search chính xác.
        replaceJobSkills(tinTuyenDung, request.getKyNangIds());
        syncJobIndexes(tinTuyenDung);
        return mapJob(tinTuyenDung, mapJobSkills(tinTuyenDung.getId()));
    }

    @Transactional
    public CompanyAdminJobResponse updateJob(AppUserPrinciple principal, Long jobId, UpdateCompanyJobRequest request) {
        Integer userId = principal.getUserId().intValue();
        TinTuyenDung tinTuyenDung = requireManagedJob(principal, jobId);
        CongTy congTy = profileService.resolveApprovedManagedCompany(userId);
        List<ChiNhanhCongTy> branches = resolveJobBranches(congTy, request.getChiNhanhIds());
        requireMembershipForAllJobBranches(userId, branches);
        applyJobPayload(tinTuyenDung, request);
        tinTuyenDung.getChiNhanhs().clear();
        tinTuyenDung.getChiNhanhs().addAll(branches);
        tinTuyenDung = tinTuyenDungRepository.save(tinTuyenDung);

        replaceJobSkills(tinTuyenDung, request.getKyNangIds());
        syncJobIndexes(tinTuyenDung);
        return mapJob(tinTuyenDung, mapJobSkills(tinTuyenDung.getId()));
    }

    @Transactional
    public void deleteJob(AppUserPrinciple principal, Long jobId) {
        TinTuyenDung tinTuyenDung = requireManagedJob(principal, jobId);
        tinTuyenDung.setNgayXoa(LocalDateTime.now());
        TinTuyenDung saved = tinTuyenDungRepository.save(tinTuyenDung);
        syncJobIndexes(saved);
    }

    @Transactional(readOnly = true)
    public TinTuyenDung requireManagedJob(AppUserPrinciple principal, Long jobId) {
        if (jobId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "jobId không được để trống");
        }
        TinTuyenDung tinTuyenDung = tinTuyenDungRepository.findById(Math.toIntExact(jobId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tin tuyển dụng"));
        if (tinTuyenDung.getNgayXoa() != null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tin tuyển dụng");
        }
        if (tinTuyenDung.getChiNhanhs() == null || tinTuyenDung.getChiNhanhs().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tin tuyển dụng không hợp lệ");
        }
        boolean allowed = tinTuyenDung.getChiNhanhs().stream()
                .filter(Objects::nonNull)
                .filter(branch -> branch.getId() != null)
                .anyMatch(branch -> {
                    try {
                        accessService.requireMembership(principal.getUserId().intValue(), branch.getId(), COMPANY_ADMIN_ROLES);
                        return true;
                    } catch (ResponseStatusException ex) {
                        return false;
                    }
                });
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền thao tác trên tin tuyển dụng này");
        }
        return tinTuyenDung;
    }

    private void applyJobPayload(TinTuyenDung tinTuyenDung, JobPayloadRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dữ liệu tin tuyển dụng không hợp lệ");
        }
        NganhNghe nganhNghe = nganhNgheRepository.findById(request.getNganhNgheId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ngành nghề"));
        List<LoaiHinhLamViec> loaiHinhLamViecs = resolveWorkTypes(request.getLoaiHinhLamViecIds());
        CapDoKinhNghiem capDoKinhNghiem = capDoKinhNghiemRepository.findById(request.getCapDoKinhNghiemId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy cấp độ kinh nghiệm"));

        tinTuyenDung.setTieuDe(request.getTieuDe().trim());
        tinTuyenDung.setNganhNghe(nganhNghe);
        tinTuyenDung.setMoTa(request.getMoTa().trim());
        tinTuyenDung.setYeuCau(request.getYeuCau().trim());
        tinTuyenDung.setPhucLoi(trimToNull(request.getPhucLoi()));
        tinTuyenDung.setBatBuocCV(Boolean.TRUE.equals(request.getBatBuocCV()));
        tinTuyenDung.setMauCvUrl(trimToNull(request.getMauCvUrl()));
        tinTuyenDung.getLoaiHinhLamViecs().clear();
        tinTuyenDung.getLoaiHinhLamViecs().addAll(loaiHinhLamViecs);
        tinTuyenDung.setLoaiHinhLamViec(loaiHinhLamViecs.getFirst());
        tinTuyenDung.setCapDoKinhNghiem(capDoKinhNghiem);
        tinTuyenDung.setLuongToiThieu(request.getLuongToiThieu());
        tinTuyenDung.setLuongToiDa(request.getLuongToiDa());
        tinTuyenDung.setSoLuongTuyen(request.getSoLuongTuyen());
        tinTuyenDung.setDenHanLuc(request.getDenHanLuc());
    }

    private CompanyAdminJobResponse mapJob(TinTuyenDung tinTuyenDung, List<CompanyAdminJobResponse.KyNangItem> kyNangs) {
        List<ChiNhanhCongTy> branches = tinTuyenDung.getChiNhanhs() == null ? List.of() : new ArrayList<>(tinTuyenDung.getChiNhanhs());
        List<CompanyAdminJobResponse.BranchItem> branchItems = branches.stream()
                .filter(Objects::nonNull)
                .filter(branch -> branch.getId() != null)
                .map(branch -> CompanyAdminJobResponse.BranchItem.builder()
                        .chiNhanhId(ServiceUtils.toLong(branch.getId()))
                        .chiNhanhTen(branch.getTen())
                        .build())
                .toList();
        ChiNhanhCongTy firstBranch = branches.stream().filter(Objects::nonNull).findFirst().orElse(null);
        List<LoaiHinhLamViec> workTypes = resolveJobWorkTypes(tinTuyenDung);
        List<CompanyAdminJobResponse.WorkTypeItem> workTypeItems = workTypes.stream()
                .map(item -> CompanyAdminJobResponse.WorkTypeItem.builder()
                        .id(ServiceUtils.toLong(item.getId()))
                        .ten(item.getTen())
                        .build())
                .toList();
        LoaiHinhLamViec firstWorkType = workTypes.stream().findFirst().orElse(null);
        return CompanyAdminJobResponse.builder()
                .id(ServiceUtils.toLong(tinTuyenDung.getId()))
                .tieuDe(tinTuyenDung.getTieuDe())
                .trangThai(tinTuyenDung.getTrangThai())
                .congTyId(firstBranch == null || firstBranch.getCongTy() == null ? null : ServiceUtils.toLong(firstBranch.getCongTy().getId()))
                .congTyTen(firstBranch == null || firstBranch.getCongTy() == null ? null : firstBranch.getCongTy().getTen())
                .chiNhanhs(branchItems)
                .moTa(tinTuyenDung.getMoTa())
                .yeuCau(tinTuyenDung.getYeuCau())
                .phucLoi(tinTuyenDung.getPhucLoi())
                .batBuocCV(tinTuyenDung.getBatBuocCV())
                .mauCvUrl(tinTuyenDung.getMauCvUrl())
                .nganhNgheId(tinTuyenDung.getNganhNghe() == null ? null : ServiceUtils.toLong(tinTuyenDung.getNganhNghe().getId()))
                .nganhNgheTen(tinTuyenDung.getNganhNghe() == null ? null : tinTuyenDung.getNganhNghe().getTen())
                .loaiHinhLamViecId(firstWorkType == null ? null : ServiceUtils.toLong(firstWorkType.getId()))
                .loaiHinhLamViecTen(joinWorkTypeNames(workTypes))
                .loaiHinhLamViecs(workTypeItems)
                .capDoKinhNghiemId(tinTuyenDung.getCapDoKinhNghiem() == null ? null : ServiceUtils.toLong(tinTuyenDung.getCapDoKinhNghiem().getId()))
                .capDoKinhNghiemTen(tinTuyenDung.getCapDoKinhNghiem() == null ? null : tinTuyenDung.getCapDoKinhNghiem().getTen())
                .luongToiThieu(tinTuyenDung.getLuongToiThieu())
                .luongToiDa(tinTuyenDung.getLuongToiDa())
                .soLuongTuyen(tinTuyenDung.getSoLuongTuyen())
                .lyDoTuChoi(tinTuyenDung.getLyDoTuChoi())
                .denHanLuc(tinTuyenDung.getDenHanLuc())
                .ngayTao(tinTuyenDung.getNgayTao())
                .kyNangs(kyNangs)
                .build();
    }

    private CompanyJobMetadataResponse.OptionItem mapMetadataOption(Integer id, String ten) {
        return CompanyJobMetadataResponse.OptionItem.builder()
                .id(ServiceUtils.toLong(id))
                .ten(ten)
                .build();
    }

    private Map<Integer, List<CompanyAdminJobResponse.KyNangItem>> mapJobSkillsByJobIds(List<TinTuyenDung> jobs) {
        List<Integer> jobIds = jobs.stream()
                .map(TinTuyenDung::getId)
                .filter(Objects::nonNull)
                .toList();
        if (jobIds.isEmpty()) {
            return Map.of();
        }

        Map<Integer, List<CompanyAdminJobResponse.KyNangItem>> result = new HashMap<>();
        List<KyNangTinTuyenDung> links = kyNangTinTuyenDungRepository.findByTinTuyenDungIdsOrderByKyNangTenAsc(jobIds);
        for (KyNangTinTuyenDung link : links) {
            if (link.getTinTuyenDung() == null || link.getTinTuyenDung().getId() == null || link.getKyNang() == null) {
                continue;
            }
            Integer jobId = link.getTinTuyenDung().getId();
            result.computeIfAbsent(jobId, ignored -> new ArrayList<>())
                    .add(CompanyAdminJobResponse.KyNangItem.builder()
                            .id(ServiceUtils.toLong(link.getKyNang().getId()))
                            .ten(link.getKyNang().getTen())
                            .build());
        }
        return result;
    }

    private List<CompanyAdminJobResponse.KyNangItem> mapJobSkills(Integer jobId) {
        if (jobId == null) {
            return List.of();
        }
        return kyNangTinTuyenDungRepository.findByTinTuyenDungIdOrderByKyNangTenAsc(jobId).stream()
                .filter(link -> link.getKyNang() != null)
                .map(link -> CompanyAdminJobResponse.KyNangItem.builder()
                        .id(ServiceUtils.toLong(link.getKyNang().getId()))
                        .ten(link.getKyNang().getTen())
                        .build())
                .toList();
    }

    private void replaceJobSkills(TinTuyenDung tinTuyenDung, List<Integer> requestedSkillIds) {
        if (tinTuyenDung == null || tinTuyenDung.getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tin tuyển dụng không hợp lệ");
        }

        List<KyNang> skills = resolveSkills(requestedSkillIds);
        kyNangTinTuyenDungRepository.deleteByTinTuyenDung_Id(tinTuyenDung.getId());
        if (skills.isEmpty()) {
            return;
        }

        List<KyNangTinTuyenDung> links = skills.stream()
                .map(skill -> new KyNangTinTuyenDung(tinTuyenDung, skill))
                .toList();
        kyNangTinTuyenDungRepository.saveAll(links);
    }

    private List<KyNang> resolveSkills(List<Integer> skillIds) {
        LinkedHashSet<Integer> dedup = skillIds == null
                ? new LinkedHashSet<>()
                : skillIds.stream()
                .filter(Objects::nonNull)
                .map(id -> Math.max(id, 0))
                .filter(id -> id > 0)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
        if (dedup.isEmpty()) {
            return List.of();
        }

        List<KyNang> skills = kyNangRepository.findAllById(dedup);
        if (skills.size() != dedup.size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Một hoặc nhiều kỹ năng không tồn tại");
        }

        Map<Integer, KyNang> byId = skills.stream()
                .filter(skill -> skill.getId() != null)
                .collect(java.util.stream.Collectors.toMap(KyNang::getId, skill -> skill));
        List<KyNang> ordered = new ArrayList<>();
        for (Integer requestedId : dedup) {
            KyNang skill = byId.get(requestedId);
            if (skill != null) {
                ordered.add(skill);
            }
        }
        return ordered;
    }

    private List<LoaiHinhLamViec> resolveWorkTypes(List<Integer> workTypeIds) {
        LinkedHashSet<Integer> dedup = workTypeIds == null
                ? new LinkedHashSet<>()
                : workTypeIds.stream()
                .filter(Objects::nonNull)
                .map(id -> Math.max(id, 0))
                .filter(id -> id > 0)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
        if (dedup.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phải chọn ít nhất một loại hình làm việc");
        }

        List<LoaiHinhLamViec> workTypes = loaiHinhLamViecRepository.findAllById(dedup);
        if (workTypes.size() != dedup.size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Một hoặc nhiều loại hình làm việc không tồn tại");
        }

        Map<Integer, LoaiHinhLamViec> byId = workTypes.stream()
                .filter(item -> item.getId() != null)
                .collect(java.util.stream.Collectors.toMap(LoaiHinhLamViec::getId, item -> item));
        List<LoaiHinhLamViec> ordered = new ArrayList<>();
        for (Integer requestedId : dedup) {
            LoaiHinhLamViec item = byId.get(requestedId);
            if (item != null) {
                ordered.add(item);
            }
        }
        return ordered;
    }

    private List<LoaiHinhLamViec> resolveJobWorkTypes(TinTuyenDung tinTuyenDung) {
        if (tinTuyenDung == null) {
            return List.of();
        }
        if (tinTuyenDung.getLoaiHinhLamViecs() != null && !tinTuyenDung.getLoaiHinhLamViecs().isEmpty()) {
            return new ArrayList<>(tinTuyenDung.getLoaiHinhLamViecs());
        }
        return tinTuyenDung.getLoaiHinhLamViec() == null ? List.of() : List.of(tinTuyenDung.getLoaiHinhLamViec());
    }

    private String joinWorkTypeNames(List<LoaiHinhLamViec> workTypes) {
        return workTypes.stream()
                .filter(Objects::nonNull)
                .map(LoaiHinhLamViec::getTen)
                .filter(StringUtils::hasText)
                .distinct()
                .collect(java.util.stream.Collectors.joining(", "));
    }

    private void ensureActivePostingPackage(CongTy congTy) {
        if (!packageService.hasActivePostingPackage(congTy)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Công ty chưa có gói đăng bài đang hoạt động");
        }
    }

    private void syncJobIndexes(TinTuyenDung tinTuyenDung) {
        chiMucNhungTinTuyenDungService.syncOrDeactivateIndex(tinTuyenDung);
        publicJobElasticsearchIndexService.syncOrDelete(tinTuyenDung);
    }

    private List<ChiNhanhCongTy> resolveJobBranches(CongTy congTy, List<Integer> branchIds) {
        if (congTy == null || congTy.getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Công ty không hợp lệ");
        }
        if (branchIds == null || branchIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phải chọn ít nhất một chi nhánh");
        }
        LinkedHashSet<Integer> dedup = branchIds.stream()
                .filter(Objects::nonNull)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
        if (dedup.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phải chọn ít nhất một chi nhánh");
        }
        return dedup.stream()
                .map(branchId -> companyBranchRepository.findByIdAndCongTy_Id(branchId, congTy.getId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chi nhánh không hợp lệ hoặc không thuộc công ty")))
                .toList();
    }

    private ThanhVienCongTy requireMembershipForAllJobBranches(Integer userId, List<ChiNhanhCongTy> branches) {
        if (branches == null || branches.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phải chọn ít nhất một chi nhánh");
        }

        ThanhVienCongTy firstMembership = null;
        for (ChiNhanhCongTy branch : branches) {
            if (branch == null || branch.getId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chi nhánh không hợp lệ");
            }
            ThanhVienCongTy membership = accessService.requireMembership(userId, branch.getId(), COMPANY_ADMIN_ROLES);
            if (firstMembership == null) {
                firstMembership = membership;
            }
        }
        return firstMembership;
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
