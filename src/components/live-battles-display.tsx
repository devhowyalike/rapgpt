"use client";

import { MessageSquare, Play, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GridBackground } from "@/components/grid-background";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Battle } from "@/lib/shared";
import { getDisplayRound, ROUNDS_PER_BATTLE } from "@/lib/shared";
import type { WebSocketEvent } from "@/lib/websocket/types";
import { generateClientId, isWebSocketActive } from "@/lib/websocket/utils";

// Extended Battle type with optional ws counts for live tracking
// This avoids creating placeholder verses/comments that accumulate
type LiveBattle = Battle & { wsVerseCount?: number; wsCommentCount?: number };

interface LiveBattlesDisplayProps {
  initialBattles: Battle[];
  currentUserId?: string | null;
}

export function LiveBattlesDisplay({
  initialBattles,
  currentUserId,
}: LiveBattlesDisplayProps) {
  const [liveBattles, setLiveBattles] = useState<LiveBattle[]>(initialBattles);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  // Stable client ID that persists across reconnections
  const clientIdRef = useRef(generateClientId("homepage"));

  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // Connect to WebSocket for global homepage updates
    const connectWebSocket = () => {
      // Don't connect if unmounted or already connected/connecting
      if (!isMountedRef.current) return;
      if (isWebSocketActive(wsRef.current)) return;

      const ws = new WebSocket(getWebSocketUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) {
          ws.close();
          return;
        }
        console.log("[Homepage WS] Connected");

        // Join the global homepage room with stable client ID
        ws.send(
          JSON.stringify({
            type: "join",
            battleId: "__homepage__",
            clientId: clientIdRef.current,
            isAdmin: false,
          })
        );
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;

        try {
          const wsEvent: WebSocketEvent = JSON.parse(event.data);
          // console.log("[Homepage WS] Received event:", wsEvent.type);

          switch (wsEvent.type) {
            case "battle:live_started": {
              // Add or update battle in the list
              setLiveBattles((prev) => {
                const exists = prev.find((b) => b.id === wsEvent.battle.id);
                if (exists) {
                  return prev.map((b) =>
                    b.id === wsEvent.battle.id ? wsEvent.battle : b
                  );
                }
                return [wsEvent.battle, ...prev];
              });
              break;
            }

            case "battle:live_ended": {
              // Remove battle from the list
              setLiveBattles((prev) =>
                prev.filter((b) => b.id !== wsEvent.battleId)
              );
              break;
            }

            case "state:sync": {
              // Handle state sync if needed
              if (wsEvent.battle && wsEvent.battle.isLive) {
                setLiveBattles((prev) => {
                  const exists = prev.find((b) => b.id === wsEvent.battle.id);
                  if (exists) {
                    return prev.map((b) =>
                      b.id === wsEvent.battle.id ? wsEvent.battle : b
                    );
                  }
                  return [wsEvent.battle, ...prev];
                });
              }
              break;
            }

            case "homepage:battle_progress": {
              // Lightweight update: update round and increment wsVerseCount or wsCommentCount
              // These track live counts without creating placeholders
              setLiveBattles((prev) =>
                prev.map((b) => {
                  if (b.id !== wsEvent.battleId) return b;

                  const updates: Partial<LiveBattle> = {
                    currentRound: wsEvent.currentRound,
                  };

                  // If commentCount is present, increment comment count
                  if (wsEvent.commentCount !== undefined) {
                    updates.wsCommentCount =
                      (b.wsCommentCount ?? b.comments.length) +
                      wsEvent.commentCount;
                  } else {
                    // Otherwise, increment verse count (default behavior)
                    updates.wsVerseCount =
                      (b.wsVerseCount ?? b.verses.length) + 1;
                  }

                  return { ...b, ...updates };
                })
              );
              break;
            }
          }
        } catch (error) {
          console.error("[Homepage WS] Error parsing message:", error);
        }
      };

      ws.onerror = () => {
        // Only log if still mounted - errors during cleanup are expected
        if (isMountedRef.current) {
          console.warn("[Homepage WS] Connection error");
        }
      };

      ws.onclose = () => {
        console.log("[Homepage WS] Disconnected");

        // Only attempt to reconnect if still mounted
        if (isMountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 5000);
        }
      };
    };

    connectWebSocket();

    return () => {
      isMountedRef.current = false;

      // Clear any pending reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [getWebSocketUrl]);

  if (liveBattles.length === 0) {
    return null; // Parent component will show the "coming soon" message
  }

  return (
    <div className="w-full bg-gray-900/50 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md relative">
      <GridBackground intensity="subtle" />

      <div className="p-6 border-b border-white/10 flex items-center gap-3 relative z-10">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Live Battles
          <span className="text-sm font-normal text-gray-400 ml-2">
            ({liveBattles.length} active)
          </span>
        </h2>
      </div>

      <div className="relative z-10">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-gray-400 w-[40%]">Matchup</TableHead>
              <TableHead className="text-gray-400 text-center">Round</TableHead>
              <TableHead className="text-gray-400 text-center">Stats</TableHead>
              <TableHead className="text-gray-400 text-center">
                Creator
              </TableHead>
              <TableHead className="text-gray-400 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {liveBattles.map((battle) => (
              <TableRow
                key={battle.id}
                className="border-white/10 hover:bg-white/5 transition-colors"
              >
                <TableCell>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[rgb(var(--player1-color))]">
                        <Image
                          src={battle.personas.player1.avatar}
                          alt={battle.personas.player1.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="font-bold text-white truncate max-w-[100px] sm:max-w-[150px]">
                        {battle.personas.player1.name}
                      </span>
                    </div>
                    <span className="text-gray-500 font-bold text-sm">VS</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white truncate max-w-[100px] sm:max-w-[150px] text-right">
                        {battle.personas.player2.name}
                      </span>
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[rgb(var(--player2-color))]">
                        <Image
                          src={battle.personas.player2.avatar}
                          alt={battle.personas.player2.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-black/20 px-2.5 py-0.5 text-xs font-semibold text-white transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    {getDisplayRound(battle)} / {ROUNDS_PER_BATTLE}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-center gap-1 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>
                        {battle.wsVerseCount ?? battle.verses.length} verses
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      <span>
                        {battle.wsCommentCount ?? battle.comments.length}{" "}
                        comments
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {battle.creator ? (
                    <div className="flex flex-col items-center gap-1">
                      {battle.creator.imageUrl && (
                        <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/10">
                          <Image
                            src={battle.creator.imageUrl}
                            alt={battle.creator.displayName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <span className="text-xs text-gray-400 max-w-[100px] truncate">
                        {battle.creator.displayName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 italic">
                      Anonymous
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {currentUserId &&
                  (battle.creator?.userId === currentUserId ||
                    currentUserId === "user_2oE8sL5Z2Yx4X9Z9Z9Z9Z9Z9Z9") ? (
                    <Button
                      asChild
                      size="sm"
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      <Link href={`/battle/${battle.id}`}>
                        <Play className="w-3 h-3 mr-2 fill-current" />
                        Control
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Link href={`/battle/${battle.id}`}>
                        <Play className="w-3 h-3 mr-2 fill-current" />
                        Watch
                      </Link>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
