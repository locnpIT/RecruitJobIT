"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { connectChatWebSocket } from "@/lib/chat-websocket";
import { clearAdminSession, getJwtExpiryMs } from "@/lib/admin-session";
import { chatService, type ChatConversation, type ChatMessage, type ChatRealtimeEvent } from "@/services/chat.service";

type LocalUser = {
  id: number;
  vaiTro: string;
};

// Hook điều phối toàn bộ state + realtime cho inbox candidate.
export function useCandidateInbox() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedConversationId = useMemo(() => {
    const raw = searchParams.get("cuocTroChuyenId");
    if (!raw) {
      return null;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [searchParams]);

  const [ready, setReady] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
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

  const socketRef = useRef<WebSocket | null>(null);
  const selectedConversationIdRef = useRef<number | null>(null);
  const refreshingConversationsRef = useRef(false);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const fallbackPollingInFlightRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    // Route private: kiểm tra token + role trước khi gọi API.
    Promise.resolve().then(() => {
      if (!mounted) {
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const expiresAt = token ? getJwtExpiryMs(token) : null;
        const rawUser = localStorage.getItem("user");
        const user = rawUser ? (JSON.parse(rawUser) as LocalUser) : null;
        const isCandidate = user?.vaiTro?.toUpperCase() === "CANDIDATE";

        if (!token || (expiresAt !== null && expiresAt <= Date.now()) || !isCandidate) {
          clearAdminSession();
          router.replace("/auth/login?redirect=/messages");
          return;
        }

        setCurrentUserId(typeof user?.id === "number" ? user.id : null);
        setReady(true);
      } catch {
        clearAdminSession();
        router.replace("/auth/login?redirect=/messages");
      }
    });

    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    let mounted = true;
    chatService
      .listConversations()
      .then((data) => {
        if (!mounted) {
          return;
        }

        setConversations(data);
        if (data.length === 0) {
          setSelectedConversation(null);
          setMessages([]);
          return;
        }

        const preferred =
          requestedConversationId == null
            ? null
            : data.find((item) => item.id === requestedConversationId) ?? null;
        const fallback = data[0] ?? null;
        const selected = preferred ?? fallback;

        setLoadingMessages(true);
        setError("");
        setSelectedConversation(selected);
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
  }, [ready, requestedConversationId]);

  useEffect(() => {
    if (!selectedConversation?.id) {
      return;
    }

    let mounted = true;

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
    selectedConversationIdRef.current = selectedConversation?.id ?? null;
  }, [selectedConversation?.id]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    const refreshConversationsFromServer = async (preferredConversationId: number) => {
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
        // keep silent
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
        setWebsocketConnected(false);
        if (event) {
          console.warn(`[chat-ws] Candidate inbox socket closed (code=${event.code}, reason=${event.reason || "n/a"})`);
        }
        if (!shouldReconnect) {
          return;
        }
        reconnectTimeoutRef.current = window.setTimeout(() => {
          setSocketRetryTick((current) => current + 1);
        }, 1500);
      },
      onError: () => {
        console.warn("[chat-ws] Candidate inbox websocket gặp lỗi kết nối");
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
  }, [ready, currentUserId, socketRetryTick]);

  useEffect(() => {
    if (!ready || websocketConnected) {
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
        // keep silent
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
  }, [ready, websocketConnected]);

  const selectConversation = (conversation: ChatConversation) => {
    setLoadingMessages(true);
    setError("");
    setMessages([]);
    setInputValue("");
    setSelectedConversation(conversation);
  };

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

  return {
    ready,
    currentUserId,
    conversations,
    selectedConversation,
    messages,
    loadingConversations,
    loadingMessages,
    sending,
    error,
    inputValue,
    setInputValue,
    selectConversation,
    handleSend,
  };
}
