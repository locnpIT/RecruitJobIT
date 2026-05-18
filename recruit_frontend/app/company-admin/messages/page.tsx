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
  const [socketRetryTick, setSocketRetryTick] = useState(0);
  const [websocketConnected, setWebsocketConnected] = useState(false);
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
  const selectedConversationIdRef = useRef<number | null>(null);
  const refreshingConversationsRef = useRef(false);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const fallbackPollingInFlightRef = useRef(false);

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

    return () => {
      mounted = false;
    };
  }, [selectedConversation?.id]);

  useEffect(() => {
    // Giữ selectedConversationId trong ref để callback websocket đọc được giá trị mới nhất.
    selectedConversationIdRef.current = selectedConversation?.id ?? null;
  }, [selectedConversation?.id]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    const refreshConversationsFromServer = async (preferredConversationId: number) => {
      // Nếu event tới từ room chưa có trong state local thì refetch danh sách room.
      // Cách này đảm bảo recruiter thấy room mới ngay, không cần reload trang.
      if (refreshingConversationsRef.current) {
        return;
      }
      refreshingConversationsRef.current = true;
      try {
        const latest = await chatService.listConversations();
        setConversations(latest);
        setSelectedConversation((current) => {
          if (current?.id) {
            return latest.find((item) => item.id === current.id) ?? current;
          }
          return latest.find((item) => item.id === preferredConversationId) ?? latest[0] ?? null;
        });
      } catch {
        // Không chặn luồng chat realtime nếu refetch thất bại.
      } finally {
        refreshingConversationsRef.current = false;
      }
    };

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    let shouldReconnect = true;

    socketRef.current = connectChatWebSocket({
      token,
      onOpen: () => {
        setWebsocketConnected(true);
      },
      onEvent: (event: ChatRealtimeEvent) => {
        if (event.loai !== "NEW_MESSAGE" || !event.tinNhan) {
          return;
        }

        const activeConversationId = selectedConversationIdRef.current;
        const isMessageFromOtherSide = event.tinNhan.nguoiGuiId !== currentUserId;

        setConversations((current) => {
          let found = false;
          const updated = current.map((conversation) => {
            if (conversation.id !== event.cuocTroChuyenId) {
              return conversation;
            }

            found = true;
            const shouldIncreaseUnread =
              isMessageFromOtherSide && activeConversationId !== event.cuocTroChuyenId;

            return {
              ...conversation,
              tinNhanGanNhat: event.tinNhan?.noiDung ?? conversation.tinNhanGanNhat,
              tinNhanGanNhatLuc: event.tinNhan?.ngayTao ?? conversation.tinNhanGanNhatLuc,
              soTinChuaDoc: shouldIncreaseUnread ? conversation.soTinChuaDoc + 1 : conversation.soTinChuaDoc,
            };
          });

          if (!found) {
            void refreshConversationsFromServer(event.cuocTroChuyenId);
            return current;
          }

          // Đưa room vừa có hoạt động lên đầu danh sách.
          const target = updated.find((item) => item.id === event.cuocTroChuyenId);
          if (!target) {
            return updated;
          }
          return [target, ...updated.filter((item) => item.id !== target.id)];
        });

        if (event.cuocTroChuyenId !== activeConversationId) {
          return;
        }

        setMessages((current) => {
          const exists = current.some((item) => item.id === event.tinNhan?.id);
          if (exists) {
            return current;
          }
          return [...current, event.tinNhan];
        });
      },
      onClose: (event) => {
        // Kết nối có thể bị ngắt do idle timeout từ proxy/network.
        // Tự reconnect giúp recruiter không cần F5 để thấy tin mới.
        setWebsocketConnected(false);
        if (event) {
          console.warn(
            `[chat-ws] Recruiter inbox socket closed (code=${event.code}, reason=${event.reason || "n/a"})`
          );
        }
        if (!shouldReconnect) {
          return;
        }
        reconnectTimeoutRef.current = window.setTimeout(() => {
          setSocketRetryTick((current) => current + 1);
        }, 1500);
      },
      onError: () => {
        console.warn("[chat-ws] Recruiter inbox websocket gặp lỗi kết nối");
      },
    });

    return () => {
      shouldReconnect = false;
      setWebsocketConnected(false);
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [currentUserId, socketRetryTick]);

  useEffect(() => {
    if (websocketConnected) {
      return;
    }

    const pollDataWhenWsUnavailable = async () => {
      if (fallbackPollingInFlightRef.current) {
        return;
      }
      fallbackPollingInFlightRef.current = true;
      try {
        const latestConversations = await chatService.listConversations();
        setConversations(latestConversations);

        const activeConversationId = selectedConversationIdRef.current;
        if (activeConversationId) {
          const latestMessages = await chatService.listMessages(activeConversationId);
          setMessages(latestMessages);
          setSelectedConversation((current) =>
            latestConversations.find((item) => item.id === activeConversationId) ?? current
          );
        }
      } catch {
        // Backup polling không cần đẩy lỗi UI, tránh ảnh hưởng màn hình chat chính.
      } finally {
        fallbackPollingInFlightRef.current = false;
      }
    };

    void pollDataWhenWsUnavailable();
    const intervalId = window.setInterval(() => {
      void pollDataWhenWsUnavailable();
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [websocketConnected]);

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
