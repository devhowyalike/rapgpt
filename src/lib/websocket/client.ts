/**
 * Client-side WebSocket hook for real-time battle updates
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { WebSocketEvent, ConnectionStatus, ClientMessage } from './types';

interface UseWebSocketOptions {
  battleId: string;
  isAdmin?: boolean;
  enabled?: boolean;
  onEvent?: (event: WebSocketEvent) => void;
}

interface UseWebSocketReturn {
  status: ConnectionStatus;
  viewerCount: number;
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
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [viewerCount, setViewerCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clientIdRef = useRef<string>(`${isAdmin ? 'admin' : 'viewer'}-${Date.now()}-${Math.random()}`);
  const isMountedRef = useRef(true);
  const onEventRef = useRef(onEvent);

  // Keep the ref updated with the latest onEvent callback
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
  }, []);

  const sendMessage = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const connect = useCallback(() => {
    if (!enabled || !isMountedRef.current) return;

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus('connecting');
    console.log('[WS Client] Connecting to WebSocket server...');

    try {
      const ws = new WebSocket(getWebSocketUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        
        console.log('[WS Client] Connected');
        setStatus('connected');
        reconnectAttemptsRef.current = 0;

        // Join the battle room
        sendMessage({
          type: 'join',
          battleId,
          clientId: clientIdRef.current,
          isAdmin,
        });
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;

        try {
          const wsEvent: WebSocketEvent = JSON.parse(event.data);
          console.log('[WS Client] Received event:', wsEvent.type);

          // Update viewer count if present
          if (wsEvent.type === 'viewers:count') {
            setViewerCount(wsEvent.count);
          } else if (wsEvent.type === 'connection:acknowledged') {
            setViewerCount(wsEvent.viewerCount);
          }

          // Call the event handler
          if (onEventRef.current) {
            onEventRef.current(wsEvent);
          }
        } catch (error) {
          console.error('[WS Client] Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[WS Client] Error:', error);
        if (isMountedRef.current) {
          setStatus('error');
        }
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;

        console.log('[WS Client] Disconnected');
        setStatus('disconnected');
        wsRef.current = null;

        // Attempt to reconnect
        if (enabled && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(
            INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current),
            MAX_RECONNECT_DELAY
          );

          console.log(`[WS Client] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('[WS Client] Failed to connect:', error);
      setStatus('error');
    }
  }, [enabled, battleId, isAdmin, getWebSocketUrl, sendMessage]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  useEffect(() => {
    isMountedRef.current = true;

    if (enabled) {
      connect();
    }

    return () => {
      isMountedRef.current = false;
      
      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Close WebSocket connection
      if (wsRef.current) {
        console.log('[WS Client] Cleaning up connection');
        
        // Send leave message before closing
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'leave',
            battleId,
          }));
        }
        
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [enabled, connect, battleId]);

  return {
    status,
    viewerCount,
    sendMessage,
    reconnect,
  };
}

