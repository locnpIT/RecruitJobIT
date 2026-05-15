"use client";

import { useEffect, useRef, useState } from "react";
import { connectChatWebSocket } from "@/lib/chat-websocket";
import { chatService, type ChatConversation, type ChatMessage, type ChatRealtimeEvent } from "@/services/chat.service";
import { ConversationList } from "./components/ConversationList";
import { ConversationThread } from "./components/ConversationThread";

// Trang chat cho recruiter/company-admin:
// - quản lý danh sách hội thoại
// - nhận/gửi tin nhắn realtime qua websocket
export default function CompanyAdminMessagesPage() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [currentUserId] = useState<number | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    try {
      const rawUser = localStorage.getItem("user");
      if (!rawUser) {
        return null;
      }
      const parsed = JSON.parse(rawUser) as { id?: number };
      return typeof parsed.id === "number" ? parsed.id : null;
    } catch {
      return null;
    }
  });
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let mounted = true;
    chatService
      .listConversations()
      .then((data) => {
        if (!mounted) {
          return;
        }
        setConversations(data);
        if (data.length > 0) {
          setLoadingMessages(true);
          setError("");
          setMessages([]);
          setSelectedConversation(data[0]);
        }
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setError("Không thể tải danh sách cuộc trò chuyện.");
      })
      .finally(() => {
        if (mounted) {
          setLoadingConversations(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedConversation?.id) {
      return;
    }

    let mounted = true;
    // Mỗi lần đổi room: load lịch sử mới và mở websocket listener cho room đó.
    chatService
      .listMessages(selectedConversation.id)
      .then((data) => {
        if (mounted) {
          setMessages(data);
        }
      })
      .catch(() => {
        if (mounted) {
          setError("Không thể tải tin nhắn của cuộc trò chuyện.");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoadingMessages(false);
        }
      });

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      return () => {
        mounted = false;
      };
    }

    socketRef.current = connectChatWebSocket({
      token,
      onEvent: (event: ChatRealtimeEvent) => {
        // Dù đang đứng room nào, preview danh sách conversation vẫn cần cập nhật message mới nhất.
        if (event.type === "NEW_MESSAGE" && event.message) {
          setConversations((current) =>
            current.map((conversation) =>
              conversation.id === event.conversationId
                ? {
                    ...conversation,
                    tinNhanGanNhat: event.message?.noiDung ?? conversation.tinNhanGanNhat,
                    tinNhanGanNhatLuc: event.message?.ngayTao ?? conversation.tinNhanGanNhatLuc,
                  }
                : conversation
            )
          );
        }

        if (event.conversationId !== selectedConversation.id) {
          return;
        }
        // Chỉ append vào thread hiện tại khi event thuộc đúng room đang mở.
        if (event.type === "NEW_MESSAGE" && event.message) {
          setMessages((current) => {
            const exists = current.some((item) => item.id === event.message?.id);
            if (exists) {
              return current;
            }
            return [...current, event.message];
          });
        }
      },
    });

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [selectedConversation?.id]);

  const handleSend = async () => {
    if (!selectedConversation?.id) {
      return;
    }
    const content = inputValue.trim();
    if (!content) {
      return;
    }

    setSending(true);
    try {
      const sent = await chatService.sendMessage(selectedConversation.id, { noiDung: content });
      setInputValue("");
      // Append optimistic-safe: nếu websocket cũng trả cùng id thì guard exists sẽ tránh duplicate.
      setMessages((current) => {
        const exists = current.some((item) => item.id === sent.id);
        if (exists) {
          return current;
        }
        return [...current, sent];
      });
    } catch {
      setError("Không thể gửi tin nhắn.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-slate-950">Tin nhắn ứng viên</h1>
        <p className="mt-1 text-sm text-slate-600">
          Trao đổi trực tiếp với ứng viên quan tâm tin tuyển dụng của công ty.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversation?.id ?? null}
          currentUserId={currentUserId}
          loading={loadingConversations}
          onSelect={(conversation) => {
            setLoadingMessages(true);
            setError("");
            setMessages([]);
            setSelectedConversation(conversation);
          }}
        />
        <ConversationThread
          conversation={selectedConversation}
          messages={messages}
          loading={loadingMessages}
          error={error}
          inputValue={inputValue}
          sending={sending}
          onInputChange={setInputValue}
          onSend={handleSend}
        />
      </div>
    </section>
  );
}
