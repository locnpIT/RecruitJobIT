package com.phuocloc.projectfinal.recruit.domain.chat.repository;

import com.phuocloc.projectfinal.recruit.domain.chat.entity.TinNhan;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface TinNhanRepository extends JpaRepository<TinNhan, Integer> {

    // Lấy toàn bộ lịch sử tin theo thứ tự tăng dần để frontend render dạng timeline.
    @Query("""
            SELECT t FROM TinNhan t
            LEFT JOIN FETCH t.nguoiGui g
            WHERE t.cuocTroChuyen.id = :conversationId
            ORDER BY t.ngayTao ASC, t.id ASC
            """)
    List<TinNhan> findByConversationIdOrderByTimeAsc(Integer conversationId);

    // Truy vấn message mới nhất của room để hiển thị preview cho danh sách conversation.
    @Query("""
            SELECT t FROM TinNhan t
            LEFT JOIN FETCH t.nguoiGui g
            WHERE t.cuocTroChuyen.id = :conversationId
            ORDER BY t.ngayTao DESC, t.id DESC
            """)
    List<TinNhan> findLastMessageCandidatesByConversationId(Integer conversationId, Pageable pageable);

    // Đếm số tin chưa đọc (tin do đối phương gửi và daDoc=false) cho badge unread.
    @Query("""
            SELECT COUNT(t.id) FROM TinNhan t
            WHERE t.cuocTroChuyen.id = :conversationId
              AND t.nguoiGui.id <> :viewerId
              AND (t.daDoc = false OR t.daDoc IS NULL)
            """)
    long countUnreadByConversationIdAndViewerId(Integer conversationId, Integer viewerId);
}
