package com.phuocloc.projectfinal.recruit.domain.chat.repository;

import com.phuocloc.projectfinal.recruit.domain.chat.entity.CuocTroChuyen;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CuocTroChuyenRepository extends JpaRepository<CuocTroChuyen, Integer> {

    // Conversation là duy nhất theo cặp (ứng viên, nhà tuyển dụng) theo thiết kế DB hiện tại.
    Optional<CuocTroChuyen> findByUngVien_IdAndNhaTuyenDung_Id(Integer ungVienId, Integer nhaTuyenDungId);

    @Query("""
            SELECT c FROM CuocTroChuyen c
            LEFT JOIN FETCH c.ungVien uv
            LEFT JOIN FETCH c.nhaTuyenDung nt
            WHERE c.id = :conversationId
            """)
    Optional<CuocTroChuyen> findDetailedById(Integer conversationId);

    @Query("""
            SELECT c FROM CuocTroChuyen c
            LEFT JOIN FETCH c.ungVien uv
            LEFT JOIN FETCH c.nhaTuyenDung nt
            WHERE uv.id = :userId OR nt.id = :userId
            ORDER BY c.ngayTao DESC
            """)
    // Dùng cho màn inbox: lấy toàn bộ room user tham gia và sort theo ngày tạo gần nhất.
    List<CuocTroChuyen> findAllByParticipantId(Integer userId);
}
