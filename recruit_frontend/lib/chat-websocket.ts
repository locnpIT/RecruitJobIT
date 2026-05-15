import type { ChatRealtimeEvent } from "@/services/chat.service";

type ChatWebSocketOptions = {
  token: string;
  onEvent: (event: ChatRealtimeEvent) => void;
  onOpen?: () => void;
  onClose?: () => void;
};

// Build websocket URL từ biến môi trường backend API để tránh hard-code host.
function resolveWebSocketBaseUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
  const origin = apiUrl.replace(/\/api\/v1\/?$/, "");
  if (origin.startsWith("https://")) {
    return origin.replace("https://", "wss://");
  }
  if (origin.startsWith("http://")) {
    return origin.replace("http://", "ws://");
  }
  return "ws://localhost:8080";
}

export function connectChatWebSocket(options: ChatWebSocketOptions): WebSocket {
  const wsUrl = `${resolveWebSocketBaseUrl()}/ws/chat?token=${encodeURIComponent(options.token)}`;
  const socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    options.onOpen?.();
  };

  socket.onmessage = (event) => {
    try {
      // Payload realtime được backend gửi dưới dạng ChatRealtimeEventResponse (JSON).
      const data = JSON.parse(String(event.data)) as ChatRealtimeEvent;
      if (!data?.type || !data?.conversationId) {
        return;
      }
      options.onEvent(data);
    } catch {
      // Ignore invalid websocket payload.
    }
  };

  socket.onclose = () => {
    options.onClose?.();
  };

  return socket;
}
