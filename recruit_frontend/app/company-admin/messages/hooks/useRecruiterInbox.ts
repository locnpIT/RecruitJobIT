"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { chatService, type ChatConversation, type ChatMessage } from "@/services/chat/chat.service";
import { useChatConnection } from "@/app/hooks/useChatConnection";

// Điều phối state inbox cho recruiter: load conversations/messages → realtime.
// Auth được xử lý ở layout level, hook này không cần guard.
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

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [messagesReloadKey, setMessagesReloadKey] = useState(0);

  const selectedConversationIdRef = useRef<number | null>(null);

  useChatConnection({
    ready: true,
    currentUserId,
    selectedConversationIdRef,
    setConversations,
    setMessages,
    setSelectedConversation,
    logLabel: "Recruiter inbox",
  });

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
          const selected = preferred ?? data[0] ?? null;
          setLoadingMessages(true);
          setError("");
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
  }, [selectedConversation?.id, messagesReloadKey]);

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversation?.id ?? null;
  }, [selectedConversation?.id]);

  const selectConversation = (conversation: ChatConversation) => {
    setLoadingMessages(true);
    setError("");
    setMessages([]);
    setInputValue("");
    setMessagesReloadKey((current) => current + 1);
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
        if (current.some((item) => item.id === sent.id)) {
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
