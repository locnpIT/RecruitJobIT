package com.phuocloc.projectfinal.recruit.chat.repository;

import com.phuocloc.projectfinal.recruit.chat.entity.Message;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByConversation_IdOrderByCreatedAtAsc(Long conversationId);

    List<Message> findByConversation_IdAndIsReadFalse(Long conversationId);
}
