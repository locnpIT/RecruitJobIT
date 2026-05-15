package com.phuocloc.projectfinal.recruit.chat.service;

import com.phuocloc.projectfinal.recruit.auth.repository.UsersRepository;
import com.phuocloc.projectfinal.recruit.chat.dto.request.CreateChatMessageRequest;
import com.phuocloc.projectfinal.recruit.chat.dto.response.ChatConversationResponse;
import com.phuocloc.projectfinal.recruit.chat.dto.response.ChatMessageResponse;
import com.phuocloc.projectfinal.recruit.chat.dto.response.ChatRealtimeEventResponse;
import com.phuocloc.projectfinal.recruit.chat.websocket.ChatRealtimePublisher;
import com.phuocloc.projectfinal.recruit.domain.chat.entity.CuocTroChuyen;
import com.phuocloc.projectfinal.recruit.domain.chat.entity.TinNhan;
import com.phuocloc.projectfinal.recruit.domain.chat.repository.CuocTroChuyenRepository;
import com.phuocloc.projectfinal.recruit.domain.chat.repository.TinNhanRepository;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import com.phuocloc.projectfinal.recruit.publicjob.service.PublicJobService;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
/**
 * Service chat realtime giữa ứng viên và nhà tuyển dụng đăng tin.
 *
 * <p>Schema chat hiện tại không gắn với đơn ứng tuyển; vì vậy conversation được định danh
 * theo cặp (ungVienId, nhaTuyenDungId) và được mở từ ngữ cảnh một tin public.</p>
 */
public class ChatService {

    private static final int MAX_MESSAGE_LENGTH = 2000;

    private final UsersRepository usersRepository;
    private final PublicJobService publicJobService;
    private final CuocTroChuyenRepository cuocTroChuyenRepository;
    private final TinNhanRepository tinNhanRepository;
    private final ChatRealtimePublisher chatRealtimePublisher;

    @Transactional
    public ChatConversationResponse openConversationByPublicJob(Long userId, Long jobId) {
        // Xác định người mở chat (candidate) và người nhận chat (nguoiDang của job).
        Integer viewerId = toIntId(userId, "userId");
        NguoiDung viewer = requireUser(viewerId);
        TinTuyenDung job = publicJobService.requirePublicJob(jobId);

        if (job.getNguoiDang() == null || job.getNguoiDang().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tin tuyển dụng chưa có thông tin nhà tuyển dụng");
        }

        Integer recruiterId = job.getNguoiDang().getId();
        if (Objects.equals(viewerId, recruiterId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn không thể tự chat với chính mình");
        }

        NguoiDung recruiter = requireUser(recruiterId);
        CuocTroChuyen conversation = cuocTroChuyenRepository
                // DB model hiện tại xem room là unique theo cặp candidate-recruiter.
                .findByUngVien_IdAndNhaTuyenDung_Id(viewerId, recruiterId)
                .orElseGet(() -> cuocTroChuyenRepository.save(new CuocTroChuyen(null, null, viewer, recruiter)));

        return mapConversation(conversation, viewerId);
    }

    @Transactional(readOnly = true)
    public List<ChatConversationResponse> listMyConversations(Long userId) {
        // Trả inbox đã map sẵn preview message + unread count.
        Integer viewerId = toIntId(userId, "userId");
        return cuocTroChuyenRepository.findAllByParticipantId(viewerId).stream()
                .map(conversation -> mapConversation(conversation, viewerId))
                .sorted(Comparator.comparing(
                        ChatConversationResponse::getTinNhanGanNhatLuc,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ).thenComparing(
                        ChatConversationResponse::getNgayTao,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .toList();
    }

    @Transactional
    public List<ChatMessageResponse> listMessages(Long userId, Long conversationId) {
        Integer viewerId = toIntId(userId, "userId");
        CuocTroChuyen conversation = requireConversationParticipant(viewerId, conversationId);
        List<TinNhan> messages = tinNhanRepository.findByConversationIdOrderByTimeAsc(conversation.getId());

        // Khi mở room, đánh dấu các tin nhắn từ phía còn lại là đã đọc.
        List<TinNhan> unreadMessages = messages.stream()
                .filter(item -> item.getNguoiGui() != null && item.getNguoiGui().getId() != null)
                .filter(item -> !Objects.equals(item.getNguoiGui().getId(), viewerId))
                .filter(item -> !Boolean.TRUE.equals(item.getDaDoc()))
                .peek(item -> item.setDaDoc(true))
                .toList();

        if (!unreadMessages.isEmpty()) {
            tinNhanRepository.saveAll(unreadMessages);
            // Push event cho hai phía để UI có thể đồng bộ trạng thái đã đọc theo realtime.
            chatRealtimePublisher.publishToUsers(
                    resolveParticipantIds(conversation),
                    ChatRealtimeEventResponse.builder()
                            .type("MESSAGES_READ")
                            .conversationId(conversationId)
                            .readerId(userId)
                            .build()
            );
        }

        return messages.stream()
                .map(message -> mapMessage(message, viewerId))
                .toList();
    }

    @Transactional
    public ChatMessageResponse sendMessage(Long userId, Long conversationId, CreateChatMessageRequest request) {
        Integer viewerId = toIntId(userId, "userId");
        CuocTroChuyen conversation = requireConversationParticipant(viewerId, conversationId);
        NguoiDung sender = requireUser(viewerId);
        String content = normalizeMessageContent(request == null ? null : request.getNoiDung());

        TinNhan message = new TinNhan();
        message.setCuocTroChuyen(conversation);
        message.setNguoiGui(sender);
        message.setNoiDung(content);
        message.setDaDoc(false);
        TinNhan saved = tinNhanRepository.save(message);

        ChatMessageResponse mapped = mapMessage(saved, viewerId);
        // Sau khi lưu DB thành công mới broadcast để tránh client nhận tin "ảo".
        chatRealtimePublisher.publishToUsers(
                resolveParticipantIds(conversation),
                ChatRealtimeEventResponse.builder()
                        .type("NEW_MESSAGE")
                        .conversationId(conversationId)
                        .message(mapped)
                        .build()
        );
        return mapped;
    }

    private ChatConversationResponse mapConversation(CuocTroChuyen conversation, Integer viewerId) {
        // pageRequest(0,1) để lấy message cuối làm snippet inbox.
        List<TinNhan> lastMessageCandidates = tinNhanRepository.findLastMessageCandidatesByConversationId(
                conversation.getId(),
                PageRequest.of(0, 1)
        );
        TinNhan lastMessage = lastMessageCandidates.isEmpty() ? null : lastMessageCandidates.getFirst();
        long unreadCount = tinNhanRepository.countUnreadByConversationIdAndViewerId(conversation.getId(), viewerId);

        return ChatConversationResponse.builder()
                .id(toLong(conversation.getId()))
                .ungVienId(conversation.getUngVien() == null ? null : toLong(conversation.getUngVien().getId()))
                .ungVienDisplayName(resolveDisplayName(conversation.getUngVien()))
                .ungVienAvatarUrl(conversation.getUngVien() == null ? null : conversation.getUngVien().getAnhDaiDienUrl())
                .nhaTuyenDungId(conversation.getNhaTuyenDung() == null ? null : toLong(conversation.getNhaTuyenDung().getId()))
                .nhaTuyenDungDisplayName(resolveDisplayName(conversation.getNhaTuyenDung()))
                .nhaTuyenDungAvatarUrl(conversation.getNhaTuyenDung() == null ? null : conversation.getNhaTuyenDung().getAnhDaiDienUrl())
                .tinNhanGanNhat(lastMessage == null ? null : lastMessage.getNoiDung())
                .tinNhanGanNhatLuc(lastMessage == null ? null : lastMessage.getNgayTao())
                .soTinChuaDoc(unreadCount)
                .ngayTao(conversation.getNgayTao())
                .build();
    }

    private ChatMessageResponse mapMessage(TinNhan message, Integer viewerId) {
        Integer senderId = message.getNguoiGui() == null ? null : message.getNguoiGui().getId();
        return ChatMessageResponse.builder()
                .id(toLong(message.getId()))
                .conversationId(message.getCuocTroChuyen() == null ? null : toLong(message.getCuocTroChuyen().getId()))
                .senderId(senderId == null ? null : senderId.longValue())
                .senderDisplayName(resolveDisplayName(message.getNguoiGui()))
                .noiDung(message.getNoiDung())
                .daDoc(Boolean.TRUE.equals(message.getDaDoc()))
                .mine(senderId != null && senderId.equals(viewerId))
                .ngayTao(message.getNgayTao())
                .build();
    }

    private CuocTroChuyen requireConversationParticipant(Integer viewerId, Long conversationId) {
        Integer safeConversationId = toIntId(conversationId, "conversationId");
        CuocTroChuyen conversation = cuocTroChuyenRepository.findDetailedById(safeConversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy cuộc trò chuyện"));

        // Guard quyền: chỉ 2 participant của room mới được đọc/ghi.
        Integer candidateId = conversation.getUngVien() == null ? null : conversation.getUngVien().getId();
        Integer recruiterId = conversation.getNhaTuyenDung() == null ? null : conversation.getNhaTuyenDung().getId();
        if (!Objects.equals(viewerId, candidateId) && !Objects.equals(viewerId, recruiterId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập cuộc trò chuyện này");
        }
        return conversation;
    }

    private NguoiDung requireUser(Integer userId) {
        return usersRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
    }

    private Set<Long> resolveParticipantIds(CuocTroChuyen conversation) {
        // Trả tập userId duy nhất để publish realtime cho cả hai phía.
        Long candidateId = conversation.getUngVien() == null || conversation.getUngVien().getId() == null
                ? null
                : conversation.getUngVien().getId().longValue();
        Long recruiterId = conversation.getNhaTuyenDung() == null || conversation.getNhaTuyenDung().getId() == null
                ? null
                : conversation.getNhaTuyenDung().getId().longValue();
        java.util.Set<Long> participantIds = new java.util.HashSet<>();
        if (candidateId != null) {
            participantIds.add(candidateId);
        }
        if (recruiterId != null) {
            participantIds.add(recruiterId);
        }
        return participantIds;
    }

    private Integer toIntId(Long value, String fieldName) {
        if (value == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " không được để trống");
        }
        return Math.toIntExact(value);
    }

    private Long toLong(Integer value) {
        return value == null ? null : value.longValue();
    }

    private String resolveDisplayName(NguoiDung user) {
        if (user == null) {
            return "Người dùng";
        }
        String fullName = ((user.getHo() == null ? "" : user.getHo().trim()) + " " + (user.getTen() == null ? "" : user.getTen().trim())).trim();
        return StringUtils.hasText(fullName) ? fullName : (user.getEmail() == null ? "Người dùng" : user.getEmail());
    }

    private String normalizeMessageContent(String content) {
        // Chuẩn hóa nội dung trước khi lưu: bắt buộc có text + giới hạn độ dài.
        if (!StringUtils.hasText(content)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nội dung tin nhắn không được để trống");
        }
        String normalized = content.trim();
        if (normalized.length() > MAX_MESSAGE_LENGTH) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Nội dung tin nhắn vượt quá " + MAX_MESSAGE_LENGTH + " ký tự"
            );
        }
        return normalized;
    }
}
