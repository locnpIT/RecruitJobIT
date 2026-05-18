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

        // Nếu URL có cuocTroChuyenId thì ưu tiên mở đúng room đó.
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

    return () => {
      mounted = false;
    };
  }, [selectedConversation?.id]);

  useEffect(() => {
    // Ref dùng để websocket callback luôn đọc đúng room đang mở,
    // tránh stale closure khi effect socket không re-run theo selectedConversation.
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
      // Event NEW_MESSAGE có thể đến trước khi room xuất hiện trong state local.
      // Khi đó refetch inbox 1 lần để kéo room mới từ server, không cần user reload trang.
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
        // Không chặn UX realtime vì lỗi refetch danh sách.
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

          // Đưa conversation có hoạt động mới nhất lên đầu danh sách.
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
        // Socket có thể bị đóng bởi mạng/proxy. Tự reconnect để giữ realtime ổn định.
        // Ghi thêm code/reason để QA dễ xác định lỗi handshake/network.
        setWebsocketConnected(false);
        if (event) {
          console.warn(
            `[chat-ws] Candidate inbox socket closed (code=${event.code}, reason=${event.reason || "n/a"})`
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
        // Log nhẹ để QA dễ truy dấu khi socket handshake/connect lỗi.
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
        // Fallback polling chỉ là backup path, không hiển thị lỗi để tránh nhiễu UX.
      } finally {
        fallbackPollingInFlightRef.current = false;
      }
    };

    // Poll ngay 1 lần để user thấy dữ liệu mới nhanh hơn sau khi websocket vừa fail.
    void pollDataWhenWsUnavailable();
    const intervalId = window.setInterval(() => {
      void pollDataWhenWsUnavailable();
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [ready, websocketConnected]);

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
