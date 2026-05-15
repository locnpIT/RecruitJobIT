package com.phuocloc.projectfinal.recruit.publicjob.service;

import com.phuocloc.projectfinal.recruit.auth.repository.UsersRepository;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.NguoiDungTinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.NguoiDungTinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.publicjob.dto.response.FavoriteJobStatusResponse;
import com.phuocloc.projectfinal.recruit.publicjob.dto.response.PublicJobSummaryResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
/**
 * Service quản lý danh sách tin yêu thích của ứng viên.
 *
 * <p>Dữ liệu được lưu bằng bảng liên kết có sẵn {@code NguoiDungTinTuyenDung}.
 * Không thêm trạng thái mới vì hiện tại PM đã chốt bảng này dùng cho mục yêu thích.</p>
 */
public class CandidateFavoriteJobService {

    private final UsersRepository usersRepository;
    private final PublicJobService publicJobService;
    private final NguoiDungTinTuyenDungRepository favoriteRepository;

    @Transactional(readOnly = true)
    public List<PublicJobSummaryResponse> listFavorites(Long userId) {
        Integer candidateId = toIntId(userId);
        return favoriteRepository.findByNguoiDung_IdOrderByNgayTaoDesc(candidateId).stream()
                .map(NguoiDungTinTuyenDung::getTinTuyenDung)
                .filter(publicJobService::isPublicVisible)
                .map(publicJobService::mapSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public FavoriteJobStatusResponse getStatus(Long userId, Long jobId) {
        Integer candidateId = toIntId(userId);
        Integer safeJobId = toIntId(jobId);
        boolean favorite = favoriteRepository.existsByNguoiDung_IdAndTinTuyenDung_Id(candidateId, safeJobId);
        return FavoriteJobStatusResponse.builder()
                .tinTuyenDungId(jobId)
                .daYeuThich(favorite)
                .build();
    }

    @Transactional
    public FavoriteJobStatusResponse addFavorite(Long userId, Long jobId) {
        Integer candidateId = toIntId(userId);
        Integer safeJobId = toIntId(jobId);
        if (!favoriteRepository.existsByNguoiDung_IdAndTinTuyenDung_Id(candidateId, safeJobId)) {
            NguoiDung user = usersRepository.findById(candidateId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
            TinTuyenDung job = publicJobService.requirePublicJob(jobId);
            favoriteRepository.save(new NguoiDungTinTuyenDung(user, job, null));
        }
        return FavoriteJobStatusResponse.builder()
                .tinTuyenDungId(jobId)
                .daYeuThich(true)
                .build();
    }

    @Transactional
    public FavoriteJobStatusResponse removeFavorite(Long userId, Long jobId) {
        Integer candidateId = toIntId(userId);
        Integer safeJobId = toIntId(jobId);
        favoriteRepository.findByNguoiDung_IdAndTinTuyenDung_Id(candidateId, safeJobId)
                .ifPresent(favoriteRepository::delete);
        return FavoriteJobStatusResponse.builder()
                .tinTuyenDungId(jobId)
                .daYeuThich(false)
                .build();
    }

    private Integer toIntId(Long id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "id không được để trống");
        }
        return Math.toIntExact(id);
    }
}
