import apiClient from "@/lib/api-client";

export type ChatConversation = {
  id: number;
  ungVienId: number | null;
  ungVienDisplayName: string | null;
  ungVienAvatarUrl: string | null;
  nhaTuyenDungId: number | null;
  nhaTuyenDungDisplayName: string | null;
  nhaTuyenDungAvatarUrl: string | null;
  tinNhanGanNhat: string | null;
  tinNhanGanNhatLuc: string | null;
  soTinChuaDoc: number;
  ngayTao: string | null;
};

export type ChatMessage = {
  id: number;
  conversationId: number;
  senderId: number;
  senderDisplayName: string | null;
  noiDung: string;
  daDoc: boolean;
  mine: boolean;
  ngayTao: string | null;
};

export type ChatRealtimeEvent = {
  type: "NEW_MESSAGE" | "MESSAGES_READ";
  conversationId: number;
  message?: ChatMessage | null;
  readerId?: number | null;
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

  listMessages: async (conversationId: number | string): Promise<ChatMessage[]> => {
    const response = await apiClient.get(`/chats/conversations/${conversationId}/messages`);
    return response.data.data as ChatMessage[];
  },

  sendMessage: async (
    conversationId: number | string,
    payload: CreateChatMessagePayload
  ): Promise<ChatMessage> => {
    const response = await apiClient.post(`/chats/conversations/${conversationId}/messages`, payload);
    return response.data.data as ChatMessage;
  },
};
