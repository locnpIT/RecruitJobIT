"use client";

import { type Dispatch, type RefObject, type SetStateAction, useEffect, useRef, useState } from "react";
import { connectChatWebSocket } from "@/lib/chat-websocket";
import { chatService, type ChatConversation, type ChatMessage, type ChatRealtimeEvent } from "@/services/chat/chat.service";

type UseChatConnectionOptions = {
  ready: boolean;
  currentUserId: number | null;
  selectedConversationIdRef: RefObject<number | null>;
  setConversations: Dispatch<SetStateAction<ChatConversation[]>>;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  setSelectedConversation: Dispatch<SetStateAction<ChatConversation | null>>;
  logLabel?: string;
};

// Quản lý vòng đời WebSocket (kết nối, tự reconnect) và fallback polling khi WS không khả dụng.
// Dùng chung cho cả candidate inbox và recruiter inbox.
export function useChatConnection({
  ready,
  currentUserId,
  selectedConversationIdRef,
  setConversations,
  setMessages,
  setSelectedConversation,
  logLabel = "Chat",
}: UseChatConnectionOptions) {
  const [socketRetryTick, setSocketRetryTick] = useState(0);
  const [websocketConnected, setWebsocketConnected] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const refreshingRef = useRef(false);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const pollingInFlightRef = useRef(false);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    const refreshConversations = async (preferredId: number) => {
      if (refreshingRef.current) {
        return;
      }
      refreshingRef.current = true;
      try {
        const latest = await chatService.listConversations();
        setConversations(latest);
        setSelectedConversation((current) => {
          if (current?.id) {
            return latest.find((item) => item.id === current.id) ?? current;
          }
          return latest.find((item) => item.id === preferredId) ?? latest[0] ?? null;
        });
      } catch {
        // keep silent
      } finally {
        refreshingRef.current = false;
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
        if (event.loai !== "NEW_MESSAGE") {
          return;
        }
        const incomingMessage = event.tinNhan;
        if (!incomingMessage) {
          return;
        }

        const activeId = selectedConversationIdRef.current;
        const isFromOther = incomingMessage.nguoiGuiId !== currentUserId;

        setConversations((current) => {
          let found = false;
          const updated = current.map((conv) => {
            if (conv.id !== event.cuocTroChuyenId) {
              return conv;
            }
            found = true;
            return {
              ...conv,
              tinNhanGanNhat: incomingMessage.noiDung ?? conv.tinNhanGanNhat,
              tinNhanGanNhatLuc: incomingMessage.ngayTao ?? conv.tinNhanGanNhatLuc,
              soTinChuaDoc:
                isFromOther && activeId !== event.cuocTroChuyenId
                  ? conv.soTinChuaDoc + 1
                  : conv.soTinChuaDoc,
            };
          });

          if (!found) {
            void refreshConversations(event.cuocTroChuyenId);
            return current;
          }

          const target = updated.find((item) => item.id === event.cuocTroChuyenId);
          if (!target) {
            return updated;
          }
          return [target, ...updated.filter((item) => item.id !== target.id)];
        });

        if (event.cuocTroChuyenId !== activeId) {
          return;
        }

        setMessages((current) => {
          if (current.some((item) => item.id === incomingMessage.id)) {
            return current;
          }
          return [...current, incomingMessage];
        });
      },
      onClose: (event) => {
        setWebsocketConnected(false);
        if (event) {
          console.warn(
            `[chat-ws] ${logLabel} socket closed (code=${event.code}, reason=${event.reason || "n/a"})`
          );
        }
        if (!shouldReconnect) {
          return;
        }
        reconnectTimeoutRef.current = window.setTimeout(() => {
          setSocketRetryTick((t) => t + 1);
        }, 1500);
      },
      onError: () => {
        console.warn(`[chat-ws] ${logLabel} websocket gặp lỗi kết nối`);
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
  }, [ready, currentUserId, socketRetryTick, selectedConversationIdRef, setConversations, setMessages, setSelectedConversation, logLabel]);

  // Fallback polling khi WebSocket không kết nối được.
  useEffect(() => {
    if (!ready || websocketConnected) {
      return;
    }

    const poll = async () => {
      if (pollingInFlightRef.current) {
        return;
      }
      pollingInFlightRef.current = true;
      try {
        const latestConversations = await chatService.listConversations();
        setConversations(latestConversations);

        const activeId = selectedConversationIdRef.current;
        if (activeId) {
          const latestMessages = await chatService.listMessages(activeId);
          setMessages(latestMessages);
          setSelectedConversation(
            (current) => latestConversations.find((item) => item.id === activeId) ?? current
          );
        }
      } catch {
        // keep silent
      } finally {
        pollingInFlightRef.current = false;
      }
    };

    void poll();
    const id = window.setInterval(() => void poll(), 3000);
    return () => window.clearInterval(id);
  }, [ready, websocketConnected, selectedConversationIdRef, setConversations, setMessages, setSelectedConversation]);

  return { websocketConnected };
}
