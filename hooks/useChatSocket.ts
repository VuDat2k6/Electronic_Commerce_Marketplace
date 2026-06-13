"use client";

import config from "@/lib/config";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useChatSocket(enabled: boolean) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    let connection: Socket | null = null;

    fetch("/api/chat-token", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) return null;
      const data = await response.json();
      return data.token as string | null;
    }).then((token) => {
      if (!active || !token) return;

      connection = io(config.apiBaseUrl, {
        auth: { token },
        transports: ["websocket", "polling"],
      });
      connection.on("connect", () => setConnected(true));
      connection.on("disconnect", () => setConnected(false));
      setSocket(connection);
    });

    return () => {
      active = false;
      connection?.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [enabled]);

  return { socket, connected };
}
