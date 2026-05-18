import apiClient from "@/lib/api-client";

export type ChatConversation = {
  id: number;
  ungVienId: number | null;
  ungVienHienThiTen: string | null;
  ungVienAnhDaiDienUrl: string | null;
  nhaTuyenDungId: number | null;
  nhaTuyenDungHienThiTen: string | null;
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
    const response = await apiClient.post(`/chats/jobs/${jobId}/open`);
    return response.data.data as ChatConversation;
  },

  listConversations: async (): Promise<ChatConversation[]> => {
    const response = await apiClient.get("/chats/conversations");
    return response.data.data as ChatConversation[];
  },

  listMessages: async (cuocTroChuyenId: number | string): Promise<ChatMessage[]> => {
    const response = await apiClient.get(`/chats/conversations/${cuocTroChuyenId}/messages`);
    return response.data.data as ChatMessage[];
  },

  sendMessage: async (
    cuocTroChuyenId: number | string,
    payload: CreateChatMessagePayload
  ): Promise<ChatMessage> => {
    const response = await apiClient.post(`/chats/conversations/${cuocTroChuyenId}/messages`, payload);
    return response.data.data as ChatMessage;
  },
};
