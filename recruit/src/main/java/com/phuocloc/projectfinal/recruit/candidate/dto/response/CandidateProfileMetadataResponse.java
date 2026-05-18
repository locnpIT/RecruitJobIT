package com.phuocloc.projectfinal.recruit.candidate.dto.response;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

/**
 * DTO trả dữ liệu từ server cho API CandidateProfileMetadataResponse.
 * Giữ response rõ ràng để frontend dễ hiển thị và bảo trì.
 */
@Getter
@Builder
public class CandidateProfileMetadataResponse {
    private List<OptionItem> kyNangs;
    private List<OptionItem> nganhNghes;
    private List<OptionItem> loaiChungChis;

    @Getter
    @Builder
    public static class OptionItem {
        private Long id;
        private String ten;
    }
}
