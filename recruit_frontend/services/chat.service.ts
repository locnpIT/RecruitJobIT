import apiClient from "@/lib/api-client";
import { requirePathParam } from "./_shared/path-param";

export type ChatConversation = {
  id: number;
  ungVienId: number | null;
  ungVienHienThiTen: string | null;
  ungVienAnhDaiDienUrl: string | null;
  nhaTuyenDungId: number | null;
  nhaTuyenDungHienThiTen: string | null;
  nhaTuyenDungCongTyTen: string | null;
  nhaTuyenDungAnhDaiDienUrl: string | null;
  tinNhanGanNhat: string | null;
  tinNhanGanNhatLuc: string | null;
  soTinChuaDoc: number;
  ngayTao: string | null;
};

export type ChatMessage = {
  id: number;
  cuocTroChuyenId: number;
  nguoiGuiId: number;
  nguoiGuiHienThiTen: string | null;
  noiDung: string;
  daDoc: boolean;
  cuaToi: boolean;
  ngayTao: string | null;
};

export type ChatRealtimeEvent = {
  loai: "NEW_MESSAGE" | "MESSAGES_READ";
  cuocTroChuyenId: number;
  tinNhan?: ChatMessage | null;
  nguoiDocId?: number | null;
};

export type CreateChatMessagePayload = {
  noiDung: string;
};

// Service chat dùng chung cho candidate và recruiter.
// Luồng realtime dùng websocket; REST vẫn là nguồn chuẩn để:
// - mở conversation theo job
// - lấy lịch sử đầy đủ
// - gửi message có validation phía backend
export const chatService = {
  openByJob: async (jobId: number | string): Promise<ChatConversation> => {
    const safeJobId = requirePathParam(jobId, "jobId");
    const response = await apiClient.post(`/chats/jobs/${safeJobId}/open`);
    return response.data.data as ChatConversation;
  },

  openByApplication: async (applicationId: number | string): Promise<ChatConversation> => {
    const safeApplicationId = requirePathParam(applicationId, "applicationId");
    const response = await apiClient.post(`/chats/applications/${safeApplicationId}/open`);
    return response.data.data as ChatConversation;
  },

  openByCandidateProfile: async (jobId: number | string, profileId: number | string): Promise<ChatConversation> => {
    const safeJobId = requirePathParam(jobId, "jobId");
    const safeProfileId = requirePathParam(profileId, "profileId");
    const response = await apiClient.post(`/chats/jobs/${safeJobId}/candidate-profiles/${safeProfileId}/open`);
    return response.data.data as ChatConversation;
  },

  listConversations: async (): Promise<ChatConversation[]> => {
    const response = await apiClient.get("/chats/conversations");
    return response.data.data as ChatConversation[];
  },

  listMessages: async (cuocTroChuyenId: number | string): Promise<ChatMessage[]> => {
    const safeConversationId = requirePathParam(cuocTroChuyenId, "cuocTroChuyenId");
    const response = await apiClient.get(`/chats/conversations/${safeConversationId}/messages`);
    return response.data.data as ChatMessage[];
  },

  sendMessage: async (
    cuocTroChuyenId: number | string,
    payload: CreateChatMessagePayload
  ): Promise<ChatMessage> => {
    const safeConversationId = requirePathParam(cuocTroChuyenId, "cuocTroChuyenId");
    const response = await apiClient.post(`/chats/conversations/${safeConversationId}/messages`, payload);
    return response.data.data as ChatMessage;
  },
};
