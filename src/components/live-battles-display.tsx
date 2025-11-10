"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Radio, Users } from "lucide-react";
import type { Battle } from "@/lib/shared";
import { ROUNDS_PER_BATTLE, getDisplayRound } from "@/lib/shared";
import type { WebSocketEvent } from "@/lib/websocket/types";

interface LiveBattlesDisplayProps {
  initialBattles: Battle[];
}

export function LiveBattlesDisplay({
  initialBattles,
}: LiveBattlesDisplayProps) {
  const [liveBattles, setLiveBattles] = useState<Battle[]>(initialBattles);
  const wsRef = useRef<WebSocket | null>(null);

  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
  }, []);

  useEffect(() => {
    // Skip websocket connection if disabled
    if (process.env.NEXT_PUBLIC_DISABLE_WEBSOCKETS === 'true') {
      console.log('[Homepage WS] WebSockets are disabled');
      return;
    }

    // Connect to WebSocket for global homepage updates
    const connectWebSocket = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      const ws = new WebSocket(getWebSocketUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[Homepage WS] Connected");

        // Join the global homepage room
        ws.send(
          JSON.stringify({
            type: "join",
            battleId: "__homepage__",
            clientId: `homepage-${Date.now()}`,
            isAdmin: false,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const wsEvent: WebSocketEvent = JSON.parse(event.data);
          console.log("[Homepage WS] Received event:", wsEvent.type);

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
          }
        } catch (error) {
          console.error("[Homepage WS] Error parsing message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("[Homepage WS] Error:", error);
      };

      ws.onclose = () => {
        console.log("[Homepage WS] Disconnected");

        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };
    };

    connectWebSocket();

    return () => {
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
    <div className="space-y-6 mt-12">
      {liveBattles.map((battle) => (
        <div
          key={battle.id}
          className="bg-linear-to-br from-red-900/30 via-gray-900/50 to-gray-900/50 border-2 border-red-500/50 rounded-lg p-8 shadow-2xl hover:border-red-400/70 transition-all"
        >
          {/* Live Indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-red-600/20 rounded-full">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-500 font-bold text-lg">
                🔴 LIVE NOW
              </span>
            </div>
          </div>

          {/* Battle Title */}
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 text-transparent bg-clip-text bg-linear-to-r from-red-400 via-yellow-400 to-purple-500">
            {battle.title}
          </h2>

          {/* Matchup */}
          <div className="flex items-center justify-center gap-4 md:gap-8 mb-6 flex-wrap">
            <div className="text-center">
              <div className="mb-2 flex justify-center">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-blue-500">
                  <Image
                    src={battle.personas.left.avatar}
                    alt={battle.personas.left.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="text-lg font-bold text-white">
                {battle.personas.left.name}
              </div>
              <div className="text-sm text-gray-400">
                {battle.personas.left.style}
              </div>
            </div>

            <div className="text-4xl font-bold text-red-500">VS</div>

            <div className="text-center">
              <div className="mb-2 flex justify-center">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-red-500">
                  <Image
                    src={battle.personas.right.avatar}
                    alt={battle.personas.right.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="text-lg font-bold text-white">
                {battle.personas.right.name}
              </div>
              <div className="text-sm text-gray-400">
                {battle.personas.right.style}
              </div>
            </div>
          </div>

          {/* Battle Stats */}
          <div className="flex items-center justify-center gap-6 mb-6 flex-wrap text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>
                Round {getDisplayRound(battle)}/{ROUNDS_PER_BATTLE}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{battle.verses.length} verses</span>
            </div>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4" />
              <span>{battle.comments.length} comments</span>
            </div>
          </div>

          {/* Watch Button */}
          <div className="flex justify-center">
            <Link
              href={`/battle/${battle.id}`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg text-white font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              <Radio className="w-5 h-5" />
              Watch Live
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
