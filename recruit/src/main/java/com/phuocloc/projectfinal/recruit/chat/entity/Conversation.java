package com.phuocloc.projectfinal.recruit.chat.entity;

import com.phuocloc.projectfinal.recruit.candidate.entity.CandidateProfile;
import com.phuocloc.projectfinal.recruit.company.entity.EmployerProfile;
import com.phuocloc.projectfinal.recruit.job.entity.Job;
import com.phuocloc.projectfinal.recruit.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "cuocTroChuyen",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_conversation_candidate_employer_key",
                columnNames = {"ungVienId", "nhaTuyenDungId", "maCuocTroChuyen"}
        )
)
public class Conversation extends BaseEntity {

    private static final String GENERAL_CONVERSATION_KEY = "GENERAL";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ungVienId", nullable = false)
    private CandidateProfile candidate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nhaTuyenDungId", nullable = false)
    private EmployerProfile employer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tinTuyenDungId")
    private Job job;

    @Column(name = "maCuocTroChuyen", nullable = false, length = 40)
    private String conversationKey;

    @Column(name = "tinNhanGanNhatLuc")
    private LocalDateTime lastMessageAt;

    @OneToMany(mappedBy = "conversation", fetch = FetchType.LAZY)
    private List<Message> messages;

    @PrePersist
    @PreUpdate
    private void syncConversationKey() {
        if (job == null) {
            conversationKey = GENERAL_CONVERSATION_KEY;
            return;
        }
        Long jobId = job.getId();
        if (jobId == null) {
            throw new IllegalStateException("Conversation.job must be persisted before being associated.");
        }
        conversationKey = "JOB_" + jobId;
    }
}
