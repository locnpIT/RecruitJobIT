"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HomeFooter } from "@/app/components/home/HomeFooter";
import { HomeHeader } from "@/app/components/home/HomeHeader";
import { connectChatWebSocket } from "@/lib/chat-websocket";
import { clearAdminSession, getJwtExpiryMs } from "@/lib/admin-session";
import { chatService, type ChatConversation, type ChatMessage, type ChatRealtimeEvent } from "@/services/chat.service";
import { CandidateConversationList } from "./components/CandidateConversationList";
import { CandidateConversationThread } from "./components/CandidateConversationThread";

type LocalUser = {
  id: number;
  vaiTro: string;
};

// Inbox riêng cho candidate.
// Mục tiêu: thay thế mô hình chat modal ngắn hạn bằng màn quản lý conversation đầy đủ.
export default function CandidateMessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedConversationId = useMemo(() => {
    const raw = searchParams.get("conversationId");
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

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let mounted = true;

    // Candidate inbox là route private:
    // kiểm tra token + role trước khi gọi API để tránh màn nháy lỗi 401.
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

        // Nếu URL có conversationId thì ưu tiên mở đúng room đó.
        const preferred = requestedConversationId == null
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

    // Mỗi lần đổi conversation, đóng socket cũ để tránh nhận event chồng.
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
        if (event.type === "NEW_MESSAGE" && event.message) {
          // Update preview cho danh sách conversation bất kể room đang mở.
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <HomeHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <section className="space-y-4">
          <header>
            <h1 className="text-xl font-semibold text-slate-950">Tin nhắn của bạn</h1>
            <p className="mt-1 text-sm text-slate-600">
              Trao đổi trực tiếp với nhà tuyển dụng về công việc bạn quan tâm.
            </p>
          </header>

          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <CandidateConversationList
              conversations={conversations}
              selectedConversationId={selectedConversation?.id ?? null}
              currentUserId={currentUserId}
              loading={!ready || loadingConversations}
              onSelect={(conversation) => {
                setLoadingMessages(true);
                setError("");
                setMessages([]);
                setInputValue("");
                setSelectedConversation(conversation);
              }}
            />

            <CandidateConversationThread
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
      </main>
      <HomeFooter />
    </div>
  );
}
