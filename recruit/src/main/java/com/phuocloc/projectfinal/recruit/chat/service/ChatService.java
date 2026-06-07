package com.phuocloc.projectfinal.recruit.chat.service;

import com.phuocloc.projectfinal.recruit.auth.repository.UsersRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.CandidateProfileRepository;
import com.phuocloc.projectfinal.recruit.chat.dto.request.CreateChatMessageRequest;
import com.phuocloc.projectfinal.recruit.chat.dto.response.ChatConversationResponse;
import com.phuocloc.projectfinal.recruit.chat.dto.response.ChatMessageResponse;
import com.phuocloc.projectfinal.recruit.chat.dto.response.ChatRealtimeEventResponse;
import com.phuocloc.projectfinal.recruit.chat.websocket.ChatRealtimePublisher;
import com.phuocloc.projectfinal.recruit.company.enums.EmployerCompanyRole;
import com.phuocloc.projectfinal.recruit.company.repository.ThanhVienCongTyRepository;
import com.phuocloc.projectfinal.recruit.company.service.CompanyAdminAccessService;
import com.phuocloc.projectfinal.recruit.domain.chat.entity.CuocTroChuyen;
import com.phuocloc.projectfinal.recruit.domain.chat.entity.TinNhan;
import com.phuocloc.projectfinal.recruit.domain.chat.repository.CuocTroChuyenRepository;
import com.phuocloc.projectfinal.recruit.domain.chat.repository.TinNhanRepository;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ThanhVienCongTy;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.DonUngTuyen;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.DonUngTuyenRepository;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.TinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoUngVien;
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
import com.phuocloc.projectfinal.recruit.common.util.ServiceUtils;

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
    private static final Set<String> COMPANY_CHAT_ROLES = Set.of(
            EmployerCompanyRole.OWNER.name(),
            EmployerCompanyRole.HR.name()
    );

    private final UsersRepository usersRepository;
    private final PublicJobService publicJobService;
    private final CompanyAdminAccessService companyAdminAccessService;
    private final CuocTroChuyenRepository cuocTroChuyenRepository;
    private final TinNhanRepository tinNhanRepository;
    private final DonUngTuyenRepository donUngTuyenRepository;
    private final TinTuyenDungRepository tinTuyenDungRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final ThanhVienCongTyRepository thanhVienCongTyRepository;
    private final ChatRealtimePublisher chatRealtimePublisher;
    private final ChatResponseMapper responseMapper;

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

        return responseMapper.mapConversation(conversation, viewerId);
    }

    @Transactional
    public ChatConversationResponse openConversationByApplicationForRecruiter(Long userId, Long applicationId) {
        Integer viewerId = toIntId(userId, "userId");
        Integer safeApplicationId = toIntId(applicationId, "applicationId");
        DonUngTuyen application = donUngTuyenRepository.findByIdAndNgayXoaIsNull(safeApplicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn ứng tuyển"));

        TinTuyenDung job = application.getTinTuyenDung();
        if (job == null || job.getChiNhanh() == null || job.getChiNhanh().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đơn ứng tuyển chưa gắn chi nhánh hợp lệ");
        }

        // Chỉ owner/hr của chi nhánh quản lý đơn mới được mở chat từ màn ứng viên.
        companyAdminAccessService.requireMembership(viewerId, job.getChiNhanh().getId(), COMPANY_CHAT_ROLES);

        Integer candidateId = application.getHoSoUngVien() != null && application.getHoSoUngVien().getNguoiDung() != null
                ? application.getHoSoUngVien().getNguoiDung().getId()
                : null;
        if (candidateId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đơn ứng tuyển chưa có ứng viên hợp lệ");
        }
        if (Objects.equals(viewerId, candidateId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn không thể tự chat với chính mình");
        }

        NguoiDung candidate = requireUser(candidateId);
        NguoiDung recruiter = requireUser(viewerId);
        CuocTroChuyen conversation = cuocTroChuyenRepository
                .findByUngVien_IdAndNhaTuyenDung_Id(candidateId, viewerId)
                .orElseGet(() -> cuocTroChuyenRepository.save(new CuocTroChuyen(null, null, candidate, recruiter)));

        return responseMapper.mapConversation(conversation, viewerId);
    }

    @Transactional
    public ChatConversationResponse openConversationByCandidateProfileForRecruiter(Long userId, Long jobId, Long profileId) {
        Integer viewerId = toIntId(userId, "userId");
        Integer safeJobId = toIntId(jobId, "jobId");
        Integer safeProfileId = toIntId(profileId, "profileId");

        TinTuyenDung job = tinTuyenDungRepository.findById(safeJobId)
                .filter(item -> item.getNgayXoa() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tin tuyển dụng"));
        if (job.getChiNhanh() == null || job.getChiNhanh().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tin tuyển dụng chưa gắn chi nhánh hợp lệ");
        }

        // Chỉ owner/hr của chi nhánh quản lý tin mới được chủ động mở chat với ứng viên.
        companyAdminAccessService.requireMembership(viewerId, job.getChiNhanh().getId(), COMPANY_CHAT_ROLES);

        HoSoUngVien profile = candidateProfileRepository.findById(safeProfileId)
                .filter(item -> item.getNgayXoa() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ ứng viên"));
        Integer candidateId = profile.getNguoiDung() == null ? null : profile.getNguoiDung().getId();
        if (candidateId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hồ sơ ứng viên chưa có người dùng hợp lệ");
        }
        if (Objects.equals(viewerId, candidateId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn không thể tự chat với chính mình");
        }

        NguoiDung candidate = requireUser(candidateId);
        NguoiDung recruiter = requireUser(viewerId);
        CuocTroChuyen conversation = cuocTroChuyenRepository
                .findByUngVien_IdAndNhaTuyenDung_Id(candidateId, viewerId)
                .orElseGet(() -> cuocTroChuyenRepository.save(new CuocTroChuyen(null, null, candidate, recruiter)));

        return responseMapper.mapConversation(conversation, viewerId);
    }

    @Transactional(readOnly = true)
    public List<ChatConversationResponse> listMyConversations(Long userId) {
        // Trả inbox đã map sẵn preview message + unread count.
        Integer viewerId = toIntId(userId, "userId");
        return cuocTroChuyenRepository.findAllByParticipantId(viewerId).stream()
                .map(conversation -> responseMapper.mapConversation(conversation, viewerId))
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
    public List<ChatMessageResponse> listMessages(Long userId, Long cuocTroChuyenId) {
        Integer viewerId = toIntId(userId, "userId");
        CuocTroChuyen conversation = requireConversationParticipant(viewerId, cuocTroChuyenId);
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
                            .loai("MESSAGES_READ")
                            .cuocTroChuyenId(cuocTroChuyenId)
                            .nguoiDocId(userId)
                            .build()
            );
        }

        return messages.stream()
                .map(message -> responseMapper.mapMessage(message, viewerId))
                .toList();
    }

    @Transactional
    public ChatMessageResponse sendMessage(Long userId, Long cuocTroChuyenId, CreateChatMessageRequest request) {
        Integer viewerId = toIntId(userId, "userId");
        CuocTroChuyen conversation = requireConversationParticipant(viewerId, cuocTroChuyenId);
        NguoiDung sender = requireUser(viewerId);
        String content = normalizeMessageContent(request == null ? null : request.getNoiDung());

        TinNhan message = new TinNhan();
        message.setCuocTroChuyen(conversation);
        message.setNguoiGui(sender);
        message.setNoiDung(content);
        message.setDaDoc(false);
        TinNhan saved = tinNhanRepository.save(message);

        ChatMessageResponse senderView = responseMapper.mapMessage(saved, viewerId);
        // Quan trọng: mỗi phía cần nhận payload "cuaToi" theo chính họ.
        // Nếu broadcast cùng một object cho cả 2 user thì phía nhận sẽ hiển thị bubble sai hướng
        // (tin từ đối phương nhưng vẫn nằm bên phải cho tới khi reload).
        for (Long participantUserId : resolveParticipantIds(conversation)) {
            Integer participantViewerId = Math.toIntExact(participantUserId);
            ChatMessageResponse participantView = responseMapper.mapMessage(saved, participantViewerId);
            chatRealtimePublisher.publishToUsers(
                    Set.of(participantUserId),
                    ChatRealtimeEventResponse.builder()
                            .loai("NEW_MESSAGE")
                            .cuocTroChuyenId(cuocTroChuyenId)
                            .tinNhan(participantView)
                            .build()
            );
        }
        return senderView;
    }

    private CuocTroChuyen requireConversationParticipant(Integer viewerId, Long cuocTroChuyenId) {
        Integer safeConversationId = toIntId(cuocTroChuyenId, "cuocTroChuyenId");
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
        Long candidateId = conversation.getUngVien() == null ? null : ServiceUtils.toLong(conversation.getUngVien().getId());
        Long recruiterId = conversation.getNhaTuyenDung() == null ? null : ServiceUtils.toLong(conversation.getNhaTuyenDung().getId());
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
