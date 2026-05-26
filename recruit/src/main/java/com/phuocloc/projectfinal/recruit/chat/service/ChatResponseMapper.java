package com.phuocloc.projectfinal.recruit.chat.service;

import com.phuocloc.projectfinal.recruit.chat.dto.response.ChatConversationResponse;
import com.phuocloc.projectfinal.recruit.chat.dto.response.ChatMessageResponse;
import com.phuocloc.projectfinal.recruit.company.repository.ThanhVienCongTyRepository;
import com.phuocloc.projectfinal.recruit.domain.chat.entity.CuocTroChuyen;
import com.phuocloc.projectfinal.recruit.domain.chat.entity.TinNhan;
import com.phuocloc.projectfinal.recruit.domain.chat.repository.TinNhanRepository;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ThanhVienCongTy;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.TinTuyenDungRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
public class ChatResponseMapper {

    private final TinNhanRepository tinNhanRepository;
    private final ThanhVienCongTyRepository thanhVienCongTyRepository;
    private final TinTuyenDungRepository tinTuyenDungRepository;

    public ChatConversationResponse mapConversation(CuocTroChuyen conversation, Integer viewerId) {
        // Lấy message cuối bằng page size 1 để tránh load toàn bộ lịch sử chat vào inbox.
        List<TinNhan> lastMessageCandidates = tinNhanRepository.findLastMessageCandidatesByConversationId(
                conversation.getId(),
                PageRequest.of(0, 1)
        );
        TinNhan lastMessage = lastMessageCandidates.isEmpty() ? null : lastMessageCandidates.getFirst();
        long unreadCount = tinNhanRepository.countUnreadByConversationIdAndViewerId(conversation.getId(), viewerId);
        Integer recruiterId = conversation.getNhaTuyenDung() == null ? null : conversation.getNhaTuyenDung().getId();

        return ChatConversationResponse.builder()
                .id(toLong(conversation.getId()))
                .ungVienId(conversation.getUngVien() == null ? null : toLong(conversation.getUngVien().getId()))
                .ungVienHienThiTen(resolveDisplayName(conversation.getUngVien()))
                .ungVienAnhDaiDienUrl(conversation.getUngVien() == null ? null : conversation.getUngVien().getAnhDaiDienUrl())
                .nhaTuyenDungId(recruiterId == null ? null : toLong(recruiterId))
                .nhaTuyenDungHienThiTen(resolveDisplayName(conversation.getNhaTuyenDung()))
                .nhaTuyenDungCongTyTen(resolveRecruiterCompanyName(recruiterId))
                .nhaTuyenDungAnhDaiDienUrl(conversation.getNhaTuyenDung() == null ? null : conversation.getNhaTuyenDung().getAnhDaiDienUrl())
                .tinNhanGanNhat(lastMessage == null ? null : lastMessage.getNoiDung())
                .tinNhanGanNhatLuc(lastMessage == null ? null : lastMessage.getNgayTao())
                .soTinChuaDoc(unreadCount)
                .ngayTao(conversation.getNgayTao())
                .build();
    }

    public ChatMessageResponse mapMessage(TinNhan message, Integer viewerId) {
        Integer senderId = message.getNguoiGui() == null ? null : message.getNguoiGui().getId();
        return ChatMessageResponse.builder()
                .id(toLong(message.getId()))
                .cuocTroChuyenId(message.getCuocTroChuyen() == null ? null : toLong(message.getCuocTroChuyen().getId()))
                .nguoiGuiId(senderId == null ? null : senderId.longValue())
                .nguoiGuiHienThiTen(resolveDisplayName(message.getNguoiGui()))
                .noiDung(message.getNoiDung())
                .daDoc(Boolean.TRUE.equals(message.getDaDoc()))
                .cuaToi(senderId != null && senderId.equals(viewerId))
                .ngayTao(message.getNgayTao())
                .build();
    }

    private String resolveRecruiterCompanyName(Integer recruiterId) {
        if (recruiterId == null) {
            return null;
        }

        List<ThanhVienCongTy> memberships = thanhVienCongTyRepository.findActiveMembershipsByUserId(recruiterId);

        String activeCompanyName = memberships.stream()
                .filter(membership -> "ACTIVE".equalsIgnoreCase(membership.getTrangThai()))
                .map(this::extractCompanyName)
                .filter(StringUtils::hasText)
                .findFirst()
                .orElse(null);
        if (StringUtils.hasText(activeCompanyName)) {
            return activeCompanyName;
        }

        String companyNameFromMembership = memberships.stream()
                .map(this::extractCompanyName)
                .filter(StringUtils::hasText)
                .findFirst()
                .orElse(null);
        if (StringUtils.hasText(companyNameFromMembership)) {
            return companyNameFromMembership;
        }

        return tinTuyenDungRepository.findCompanyNamesByRecruiterId(recruiterId, PageRequest.of(0, 1)).stream()
                .filter(StringUtils::hasText)
                .findFirst()
                .orElse(null);
    }

    private String extractCompanyName(ThanhVienCongTy membership) {
        if (membership == null || membership.getChiNhanh() == null || membership.getChiNhanh().getCongTy() == null) {
            return null;
        }
        return membership.getChiNhanh().getCongTy().getTen();
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
}
