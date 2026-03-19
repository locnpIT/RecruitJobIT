package com.phuocloc.projectfinal.recruit.notification.repository;

import com.phuocloc.projectfinal.recruit.notification.entity.Notification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUser_IdOrderByCreatedAtDesc(Long userId);

    List<Notification> findByUser_IdAndIsReadFalseOrderByCreatedAtDesc(Long userId);
}
