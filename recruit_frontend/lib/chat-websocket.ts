import type { ChatRealtimeEvent } from "@/services/chat.service";

type ChatWebSocketOptions = {
  token: string;
  onEvent: (event: ChatRealtimeEvent) => void;
  onOpen?: () => void;
  onClose?: (event?: CloseEvent) => void;
  onError?: (event: Event) => void;
};

// Sinh danh sách URL websocket theo nhiều kiểu deploy:
// - backend route thuần: /ws/chat
// - backend có context path /api/v1: /api/v1/ws/chat
// - backend qua reverse-proxy prefix: /<prefix>/ws/chat
function resolveWebSocketUrls() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
  try {
    const parsed = new URL(apiUrl);
    const protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
    const origin = `${protocol}//${parsed.host}`;
    const rawPath = (parsed.pathname || "/").replace(/\/+$/, "");
    const apiPath = rawPath === "" ? "/" : rawPath;
    const removedApiV1 = apiPath.replace(/\/api\/v1$/i, "") || "/";

    const candidates = [
      `${origin}${apiPath === "/" ? "" : apiPath}/ws/chat`,
      `${origin}${removedApiV1 === "/" ? "" : removedApiV1}/ws/chat`,
      `${origin}/ws/chat`,
    ];
    return Array.from(new Set(candidates));
  } catch {
    // Fallback cho trường hợp NEXT_PUBLIC_API_URL không phải URL đầy đủ.
    if (typeof window !== "undefined") {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      return [`${protocol}//${window.location.host}/ws/chat`];
    }
  }
  return ["ws://localhost:8080/ws/chat"];
}

export function connectChatWebSocket(options: ChatWebSocketOptions): WebSocket {
  const candidateUrls = resolveWebSocketUrls().map(
    (baseUrl) => `${baseUrl}?token=${encodeURIComponent(options.token)}`
  );
  let connected = false;
  let currentIndex = 0;
  let hadErrorInAttempt = false;

  const openCandidate = (index: number) => {
    const socket = new WebSocket(candidateUrls[index]);

    socket.onopen = () => {
      connected = true;
      options.onOpen?.();
    };

    socket.onmessage = (event) => {
      try {
        // Payload realtime được backend gửi dưới dạng ChatRealtimeEventResponse (JSON).
        const data = JSON.parse(String(event.data)) as ChatRealtimeEvent;
        if (!data?.loai || !data?.cuocTroChuyenId) {
          return;
        }
        options.onEvent(data);
      } catch {
        // Ignore invalid websocket payload.
      }
    };

    socket.onerror = (event) => {
      hadErrorInAttempt = true;
      // Chỉ report lỗi khi đây là candidate cuối cùng.
      if (index === candidateUrls.length - 1) {
        options.onError?.(event);
      }
    };

    socket.onclose = (event) => {
      // Nếu chưa connect thành công và vẫn còn candidate khác, thử endpoint kế tiếp.
      if (!connected && index < candidateUrls.length - 1) {
        currentIndex = index + 1;
        openCandidate(currentIndex);
        return;
      }
      // Có một số môi trường không bắn onerror nhưng vẫn close bất thường khi fail handshake.
      // Trường hợp đó, report lỗi ở candidate cuối để caller có thể fallback/polling.
      if (!connected && index === candidateUrls.length - 1 && !hadErrorInAttempt) {
        options.onError?.(new Event("error"));
      }
      options.onClose?.(event);
    };

    return socket;
  };

  return openCandidate(currentIndex);
}
