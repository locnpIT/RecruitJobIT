package com.phuocloc.projectfinal.recruit.chat.repository;

import com.phuocloc.projectfinal.recruit.chat.entity.Conversation;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findByCandidate_IdAndEmployer_IdAndJob_Id(Long candidateId, Long employerId, Long jobId);

    List<Conversation> findByCandidate_Id(Long candidateId);

    List<Conversation> findByEmployer_Id(Long employerId);
}
