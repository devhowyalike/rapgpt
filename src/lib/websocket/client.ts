/**
 * Client-side WebSocket hook for real-time battle updates
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientMessage, ConnectionStatus, WebSocketEvent } from "./types";
import { generateClientId, isWebSocketActive, isWebSocketConnected } from "./utils";

interface UseWebSocketOptions {
  battleId: string;
  isAdmin?: boolean;
  enabled?: boolean;
  onEvent?: (event: WebSocketEvent) => void;
}

export interface BattleWarning {
  reason: "inactivity" | "admin_timeout" | "server_shutdown" | "max_lifetime";
  secondsRemaining: number;
  timestamp: number;
  message?: string;
}

interface UseWebSocketReturn {
  status: ConnectionStatus;
  viewerCount: number;
  warning: BattleWarning | null;
  sendMessage: (message: ClientMessage) => void;
  reconnect: () => void;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

export function useWebSocket({
  battleId,
  isAdmin = false,
  enabled = true,
  onEvent,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [viewerCount, setViewerCount] = useState(0);
  const [warning, setWarning] = useState<BattleWarning | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const statusDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const isReconnectingRef = useRef(false);
  const clientIdRef = useRef<string>(
    generateClientId(isAdmin ? "admin" : "viewer"),
  );
  const isMountedRef = useRef(true);
  const onEventRef = useRef(onEvent);

  // Keep the ref updated with the latest onEvent callback
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
  }, []);

  // Debounced status setter to prevent flickering during rapid reconnection attempts
  const setStatusDebounced = useCallback(
    (newStatus: ConnectionStatus, immediate = false) => {
      // Clear any pending status update
      if (statusDebounceRef.current) {
        clearTimeout(statusDebounceRef.current);
        statusDebounceRef.current = null;
      }

      // Immediate updates for successful connections and user-initiated disconnects
      if (immediate || newStatus === "connected") {
        setStatus(newStatus);
        isReconnectingRef.current = false;
        return;
      }

      // For disconnections during reconnect attempts, delay the status update
      // to avoid flickering between "connecting" and "disconnected"
      if (isReconnectingRef.current && newStatus === "connecting") {
        // Don't update to "connecting" if we're already reconnecting
        // Just stay in the current state to avoid flicker
        return;
      }

      if (newStatus === "disconnected" || newStatus === "error") {
        // Mark that we're in reconnection mode
        isReconnectingRef.current = true;
        
        // Debounce disconnection status to avoid flickering
        // Only update if we stay disconnected for a bit
        statusDebounceRef.current = setTimeout(() => {
          setStatus(newStatus);
        }, 300);
      } else {
        setStatus(newStatus);
      }
    },
    []
  );

  const sendMessage = useCallback((message: ClientMessage) => {
    if (isWebSocketConnected(wsRef.current)) {
      wsRef.current!.send(JSON.stringify(message));
    }
  }, []);

  const connect = useCallback(() => {
    if (!enabled || !isMountedRef.current) return;

    // Prevent duplicate connection attempts - check if already connecting or connected
    if (isWebSocketActive(wsRef.current)) {
      console.log("[WS Client] Connection already in progress or open, skipping");
      return;
    }
    
    // Clean up any existing connection that isn't active
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatusDebounced("connecting");
    console.log("[WS Client] Connecting to WebSocket server...");

    try {
      const ws = new WebSocket(getWebSocketUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;

        console.log("[WS Client] Connected");
        setStatusDebounced("connected", true);
        reconnectAttemptsRef.current = 0;

        // Join the battle room
        sendMessage({
          type: "join",
          battleId,
          clientId: clientIdRef.current,
          isAdmin,
        });
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;

        try {
          const wsEvent: WebSocketEvent = JSON.parse(event.data);
          console.log("[WS Client] Received event:", wsEvent.type);

          // Update viewer count if present
          if (wsEvent.type === "viewers:count") {
            setViewerCount(wsEvent.count);
          } else if (wsEvent.type === "connection:acknowledged") {
            setViewerCount(wsEvent.viewerCount);
          }

          // Handle warning events
          if (wsEvent.type === "battle:ending_soon") {
            const warningData: BattleWarning = {
              reason: wsEvent.reason,
              secondsRemaining: wsEvent.secondsRemaining,
              timestamp: wsEvent.timestamp,
            };
            setWarning(warningData);

            // Clear warning after countdown expires
            if (warningTimerRef.current) {
              clearTimeout(warningTimerRef.current);
            }
            warningTimerRef.current = setTimeout(() => {
              if (isMountedRef.current) {
                setWarning(null);
              }
            }, wsEvent.secondsRemaining * 1000 + 5000); // Extra 5s buffer
          } else if (wsEvent.type === "server:shutdown") {
            // Set a special warning for server shutdown
            setWarning({
              reason: "server_shutdown",
              secondsRemaining: 0,
              timestamp: wsEvent.timestamp,
              message: wsEvent.message,
            });
          } else if (wsEvent.type === "battle:live_ended") {
            // Clear any active warnings when battle ends
            setWarning(null);
            if (warningTimerRef.current) {
              clearTimeout(warningTimerRef.current);
              warningTimerRef.current = null;
            }
          }

          // Call the event handler
          if (onEventRef.current) {
            onEventRef.current(wsEvent);
          }
        } catch (error) {
          console.error("[WS Client] Error parsing message:", error);
        }
      };

      ws.onerror = (error) => {
        // Only log errors if not closing/reconnecting intentionally
        // When navigating away, the connection might be closed abruptly which is fine
        if (isMountedRef.current) {
           // Use console.debug instead of error to avoid cluttering production logs
           // for expected disconnections
           console.debug("[WS Client] Connection warning:", error);
           setStatusDebounced("error");
        }
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;

        console.log("[WS Client] Disconnected");
        setStatusDebounced("disconnected");
        wsRef.current = null;

        // Attempt to reconnect
        if (enabled && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(
            INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current),
            MAX_RECONNECT_DELAY,
          );

          console.log(
            `[WS Client] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`,
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error("[WS Client] Failed to connect:", error);
      setStatusDebounced("error");
    }
  }, [enabled, battleId, isAdmin, getWebSocketUrl, sendMessage, setStatusDebounced]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  useEffect(() => {
    isMountedRef.current = true;

    if (enabled) {
      connect();
    }

    // Retry connection when page becomes visible or gains focus
    // This handles the case where reconnect attempts were exhausted while server was down
    const retryConnectionOnActivity = (reason: string) => {
      // Skip if disabled, unmounted, or already connected
      if (!enabled || !isMountedRef.current) return;
      if (isWebSocketConnected(wsRef.current)) return;
      
      console.log(`[WS Client] ${reason} - retrying connection`);
      reconnectAttemptsRef.current = 0; // Reset attempts
      connect();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        retryConnectionOnActivity("Page visible");
      }
    };

    const handleFocus = () => {
      retryConnectionOnActivity("Window focused");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      isMountedRef.current = false;

      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);

      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Clear status debounce timeout
      if (statusDebounceRef.current) {
        clearTimeout(statusDebounceRef.current);
        statusDebounceRef.current = null;
      }

      // Clear warning timer
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }

      // Close WebSocket connection
      if (wsRef.current) {
        console.log("[WS Client] Cleaning up connection");

        // Send leave message before closing
        if (isWebSocketConnected(wsRef.current)) {
          wsRef.current.send(
            JSON.stringify({
              type: "leave",
              battleId,
            }),
          );
        }

        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [enabled, connect, battleId]);

  return {
    status,
    viewerCount,
    warning,
    sendMessage,
    reconnect,
  };
}
