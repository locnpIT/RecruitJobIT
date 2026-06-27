"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { chatService, type ChatConversation, type ChatMessage } from "@/services/chat/chat.service";
import { useChatConnection } from "@/app/hooks/useChatConnection";
import { useMessagesAuthGuard } from "./useMessagesAuthGuard";

// Điều phối state inbox cho candidate: auth → load conversations/messages → realtime.
export function useCandidateInbox() {
  const searchParams = useSearchParams();
  const { ready, currentUserId } = useMessagesAuthGuard();

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
  const [messagesReloadKey, setMessagesReloadKey] = useState(0);

  const selectedConversationIdRef = useRef<number | null>(null);

  useChatConnection({
    ready,
    currentUserId,
    selectedConversationIdRef,
    setConversations,
    setMessages,
    setSelectedConversation,
    logLabel: "Candidate inbox",
  });

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
        const selected = preferred ?? data[0] ?? null;
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
