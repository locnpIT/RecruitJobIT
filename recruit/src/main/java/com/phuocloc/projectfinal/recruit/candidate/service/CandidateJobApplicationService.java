package com.phuocloc.projectfinal.recruit.candidate.service;

import com.phuocloc.projectfinal.recruit.candidate.dto.request.CreateJobApplicationRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.response.CandidateJobApplicationResponse;
import com.phuocloc.projectfinal.recruit.candidate.dto.response.CandidateJobApplicationStatusResponse;
import com.phuocloc.projectfinal.recruit.candidate.repository.CandidateProfileRepository;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.DonUngTuyen;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.DonUngTuyenRepository;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoUngVien;
import com.phuocloc.projectfinal.recruit.publicjob.service.PublicJobService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
/**
 * Service ứng tuyển của candidate.
 *
 * <p>Không thêm schema mới: đơn ứng tuyển dùng bảng {@code DonUngTuyen}.
 * Mọi đơn đều gắn {@code HoSoUngVien} để công ty biết ứng viên là ai.
 * Nếu tin có {@code batBuocCV = true}, backend bắt buộc request phải có {@code cvUrl}.</p>
 */
public class CandidateJobApplicationService {

    private static final String STATUS_PENDING = "PENDING";

    private final PublicJobService publicJobService;
    private final CandidateProfileRepository candidateProfileRepository;
    private final DonUngTuyenRepository donUngTuyenRepository;

    @Transactional
    public CandidateJobApplicationResponse apply(Long userId, Long jobId, CreateJobApplicationRequest request) {
        Integer candidateId = toIntId(userId, "userId");
        TinTuyenDung job = publicJobService.requirePublicJob(jobId);

        if (donUngTuyenRepository.existsByTinTuyenDung_IdAndHoSoUngVien_NguoiDung_IdAndNgayXoaIsNull(job.getId(), candidateId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã ứng tuyển tin tuyển dụng này");
        }

        if (request == null || request.getHoSoUngVienId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn hồ sơ ứng viên để ứng tuyển");
        }

        HoSoUngVien profile = candidateProfileRepository
                .findByIdAndNguoiDung_Id(toIntId(request.getHoSoUngVienId(), "hoSoUngVienId"), candidateId)
                .filter(item -> item.getNgayXoa() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ ứng viên"));

        String cvUrl = trimToNull(request.getCvUrl());
        if (Boolean.TRUE.equals(job.getBatBuocCV()) && cvUrl == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tin tuyển dụng này bắt buộc nộp file CV");
        }

        DonUngTuyen application = new DonUngTuyen();
        application.setTinTuyenDung(job);
        application.setHoSoUngVien(profile);
        application.setTrangThai(STATUS_PENDING);
        application.setCvUrl(cvUrl);
        return mapApplication(donUngTuyenRepository.save(application));
    }

    @Transactional(readOnly = true)
    public CandidateJobApplicationStatusResponse getStatus(Long userId, Long jobId) {
        Integer candidateId = toIntId(userId, "userId");
        Integer safeJobId = toIntId(jobId, "jobId");
        return donUngTuyenRepository
                .findByTinTuyenDung_IdAndHoSoUngVien_NguoiDung_IdAndNgayXoaIsNull(safeJobId, candidateId)
                .map(application -> CandidateJobApplicationStatusResponse.builder()
                        .jobId(jobId)
                        .applied(true)
                        .application(mapApplication(application))
                        .build())
                .orElseGet(() -> CandidateJobApplicationStatusResponse.builder()
                        .jobId(jobId)
                        .applied(false)
                        .application(null)
                        .build());
    }

    @Transactional(readOnly = true)
    public java.util.List<CandidateJobApplicationResponse> listMyApplications(Long userId) {
        Integer candidateId = toIntId(userId, "userId");
        return donUngTuyenRepository.findByHoSoUngVien_NguoiDung_IdAndNgayXoaIsNullOrderByNgayTaoDesc(candidateId).stream()
                .map(this::mapApplication)
                .toList();
    }

    private CandidateJobApplicationResponse mapApplication(DonUngTuyen application) {
        TinTuyenDung job = application.getTinTuyenDung();
        return CandidateJobApplicationResponse.builder()
                .id(application.getId() == null ? null : application.getId().longValue())
                .tinTuyenDungId(job == null || job.getId() == null ? null : job.getId().longValue())
                .tieuDeTinTuyenDung(job == null ? null : job.getTieuDe())
                .hoSoUngVienId(application.getHoSoUngVien() == null || application.getHoSoUngVien().getId() == null
                        ? null
                        : application.getHoSoUngVien().getId().longValue())
                .trangThai(application.getTrangThai())
                .cvUrl(application.getCvUrl())
                .batBuocCv(job == null ? null : Boolean.TRUE.equals(job.getBatBuocCV()))
                .mauCvUrl(job == null ? null : job.getMauCvUrl())
                .ngayTao(application.getNgayTao())
                .build();
    }

    private Integer toIntId(Long id, String fieldName) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " không được để trống");
        }
        return Math.toIntExact(id);
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
