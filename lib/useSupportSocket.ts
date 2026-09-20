"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { WS_URL, getStoredToken } from "./api";

interface SupportSocketHandlers {
  onSessionCreated?: (session: unknown) => void;
  onSessionUpdated?: (session: unknown) => void;
  onQueueChanged?: (queue: unknown) => void;
}

export function useSupportSocket(handlers: SupportSocketHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const socket: Socket = io(`${WS_URL}/support-ws`, {
      transports: ["websocket", "polling"],
      reconnection: true,
      auth: {
        token: getStoredToken(),
      },
    });

    socket.on("session:created", (payload) => {
      handlersRef.current.onSessionCreated?.(payload);
    });
    socket.on("session:updated", (payload) => {
      handlersRef.current.onSessionUpdated?.(payload);
    });
    socket.on("queue:changed", (payload) => {
      handlersRef.current.onQueueChanged?.(payload);
    });

    return () => {
      socket.disconnect();
    };
  }, []);
}
