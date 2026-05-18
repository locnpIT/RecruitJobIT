"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { connectChatWebSocket } from "@/lib/chat-websocket";
import { chatService, type ChatConversation, type ChatMessage, type ChatRealtimeEvent } from "@/services/chat.service";

// Hook điều phối state + websocket realtime cho inbox recruiter.
export function useRecruiterInbox() {
  const searchParams = useSearchParams();

  const requestedConversationId = useMemo(() => {
    const raw = searchParams.get("cuocTroChuyenId");
    if (!raw) {
      return null;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [searchParams]);

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
          const preferred =
            requestedConversationId == null
              ? null
              : data.find((item) => item.id === requestedConversationId) ?? null;
          const fallback = data[0] ?? null;
          const selected = preferred ?? fallback;
          setLoadingMessages(true);
          setError("");
          setMessages([]);
          setSelectedConversation(selected);
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
  }, [requestedConversationId]);

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
          console.warn(`[chat-ws] Recruiter inbox socket closed (code=${event.code}, reason=${event.reason || "n/a"})`);
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
  }, [websocketConnected]);

  const selectConversation = (conversation: ChatConversation) => {
    setLoadingMessages(true);
    setError("");
    setMessages([]);
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
    conversations,
    selectedConversation,
    messages,
    loadingConversations,
    loadingMessages,
    sending,
    error,
    inputValue,
    setInputValue,
    currentUserId,
    selectConversation,
    handleSend,
  };
}
