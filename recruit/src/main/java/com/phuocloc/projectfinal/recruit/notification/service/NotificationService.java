package com.phuocloc.projectfinal.recruit.notification.service;

import com.phuocloc.projectfinal.recruit.auth.repository.UsersRepository;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import com.phuocloc.projectfinal.recruit.domain.thongbao.entity.ThongBao;
import com.phuocloc.projectfinal.recruit.domain.thongbao.repository.ThongBaoRepository;
import com.phuocloc.projectfinal.recruit.notification.dto.response.NotificationItemResponse;
import com.phuocloc.projectfinal.recruit.notification.dto.response.NotificationListResponse;
import com.phuocloc.projectfinal.recruit.notification.dto.response.NotificationUnreadCountResponse;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
/**
 * Service quản lý thông báo trong hệ thống.
 *
 * <p>Thông báo được lưu theo từng người dùng, hỗ trợ list, đếm chưa đọc,
 * đánh dấu đã đọc và xóa mềm. Deep-link được nhúng trong cột noiDung dạng JSON string.</p>
 */
public class NotificationService {

    private static final int DEFAULT_SIZE = 20;
    private static final int MAX_SIZE = 100;

    private final ThongBaoRepository thongBaoRepository;
    private final UsersRepository usersRepository;

    @Transactional(readOnly = true)
    public NotificationListResponse listMyNotifications(Long userId, Integer page, Integer size) {
        Integer safeUserId = toIntId(userId, "userId");
        int safePage = page == null || page < 0 ? 0 : page;
        int safeSize = size == null || size <= 0 ? DEFAULT_SIZE : Math.min(size, MAX_SIZE);
        Pageable pageable = PageRequest.of(safePage, safeSize);

        Page<ThongBao> notificationPage = thongBaoRepository.findByNguoiDung_IdAndNgayXoaIsNullOrderByNgayTaoDesc(safeUserId, pageable);
        return NotificationListResponse.builder()
                .items(notificationPage.getContent().stream().map(this::mapItem).toList())
                .page(notificationPage.getNumber())
                .size(notificationPage.getSize())
                .totalElements(notificationPage.getTotalElements())
                .totalPages(notificationPage.getTotalPages())
                .hasNext(notificationPage.hasNext())
                .build();
    }

    @Transactional(readOnly = true)
    public NotificationUnreadCountResponse getUnreadCount(Long userId) {
        Integer safeUserId = toIntId(userId, "userId");
        long unread = thongBaoRepository.countUnreadByNguoiDungId(safeUserId);
        return new NotificationUnreadCountResponse(unread);
    }

    @Transactional
    public NotificationItemResponse markRead(Long userId, Long notificationId) {
        Integer safeUserId = toIntId(userId, "userId");
        Integer safeNotificationId = toIntId(notificationId, "notificationId");
        ThongBao notification = requireOwnedNotification(safeUserId, safeNotificationId);
        notification.setDaDoc(true);
        return mapItem(thongBaoRepository.save(notification));
    }

    @Transactional
    public long markAllRead(Long userId) {
        Integer safeUserId = toIntId(userId, "userId");
        var unreadItems = thongBaoRepository.findUnreadByNguoiDungId(safeUserId);
        if (unreadItems.isEmpty()) {
            return 0L;
        }
        unreadItems.forEach(item -> item.setDaDoc(true));
        thongBaoRepository.saveAll(unreadItems);
        return unreadItems.size();
    }

    @Transactional
    public void deleteNotification(Long userId, Long notificationId) {
        Integer safeUserId = toIntId(userId, "userId");
        Integer safeNotificationId = toIntId(notificationId, "notificationId");
        ThongBao notification = requireOwnedNotification(safeUserId, safeNotificationId);
        notification.setNgayXoa(LocalDateTime.now());
        thongBaoRepository.save(notification);
    }

    @Transactional
    public void createForUserId(Integer userId, String title, String text, String link) {
        if (userId == null) {
            return;
        }
        NguoiDung user = usersRepository.findById(userId).orElse(null);
        if (user == null || user.getNgayXoa() != null) {
            return;
        }
        createForUser(user, title, text, link);
    }

    @Transactional
    public void createForUser(NguoiDung user, String title, String text, String link) {
        if (user == null || user.getId() == null || user.getNgayXoa() != null) {
            return;
        }

        ThongBao entity = new ThongBao();
        entity.setNguoiDung(user);
        entity.setTieuDe(trimToFallback(title, "Thông báo hệ thống"));
        entity.setNoiDung(NotificationPayloadCodec.encode(text, link));
        entity.setDaDoc(false);
        thongBaoRepository.save(entity);
    }

    private NotificationItemResponse mapItem(ThongBao entity) {
        NotificationPayloadCodec.DecodedPayload payload = NotificationPayloadCodec.decode(entity.getNoiDung());
        return NotificationItemResponse.builder()
                .id(entity.getId() == null ? null : entity.getId().longValue())
                .tieuDe(entity.getTieuDe())
                .noiDung(payload.getText())
                .duongDan(payload.getLink())
                .daDoc(Boolean.TRUE.equals(entity.getDaDoc()))
                .ngayTao(entity.getNgayTao())
                .build();
    }

    private ThongBao requireOwnedNotification(Integer userId, Integer notificationId) {
        return thongBaoRepository.findByIdAndNguoiDung_IdAndNgayXoaIsNull(notificationId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thông báo"));
    }

    private Integer toIntId(Long value, String fieldName) {
        if (value == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " không được để trống");
        }
        return Math.toIntExact(value);
    }

    private String trimToFallback(String value, String fallback) {
        if (value == null) {
            return fallback;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? fallback : normalized;
    }
}
