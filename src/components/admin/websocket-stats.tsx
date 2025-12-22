"use client";

import {
  Activity,
  AlertTriangle,
  Clock,
  Info,
  Radio,
  RefreshCw,
  Server,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BattleRoomStats {
  battleId: string;
  viewerCount: number;
  adminConnected: boolean;
  createdAt: number;
  lastActivityAt: number;
  adminDisconnectedAt: number | null;
}

interface WebSocketStatsData {
  available: boolean;
  totalConnections?: number;
  totalRooms?: number;
  rooms?: BattleRoomStats[];
  serverStartedAt?: number;
  config?: {
    heartbeatInterval: number;
    roomInactivityTimeout: number;
    adminGracePeriod: number;
    maxRoomLifetime: number;
  };
  message?: string;
}

interface BattleInfo {
  id: string;
  title: string;
  isLive: boolean;
  liveStartedAt: string | null;
  currentRound: number;
  status: string;
  player1: string;
  player2: string;
}

interface StatsResponse {
  websocket: WebSocketStatsData;
  battleInfo: Record<string, BattleInfo>;
  liveBattles: {
    count: number;
    battles: BattleInfo[];
  };
  timestamp: number;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  return formatDuration(diff) + " ago";
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="text-gray-500 hover:text-gray-400 transition-colors">
          <Info size={14} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-sm">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

export function WebSocketStats() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/websocket-stats");
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      const data = await response.json();
      setStats(data);
      setError(null);
      setLastRefresh(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading && !stats) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-2 text-gray-400">
          <RefreshCw className="animate-spin" size={20} />
          <span>Loading WebSocket stats...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 rounded-xl p-6 border border-red-700">
        <div className="flex items-center gap-2 text-red-400">
          <AlertTriangle size={20} />
          <span>Error loading stats: {error}</span>
        </div>
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const ws = stats?.websocket;
  const liveBattles = stats?.liveBattles;
  const battleInfo = stats?.battleInfo ?? {};

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {/* Header with refresh */}
        <div className="flex items-center justify-between">
          <h2 className="font-bebas text-3xl text-white flex items-center gap-2">
            <Activity className="text-green-400" size={28} />
            Live System Stats
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Updated {formatTimeAgo(lastRefresh)}
            </span>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* WebSocket Status */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <div className="flex items-center gap-2">
                {ws?.available ? (
                  <Wifi className="text-green-400" size={18} />
                ) : (
                  <WifiOff className="text-red-400" size={18} />
                )}
                <span className="text-sm">WebSocket Server</span>
              </div>
              <InfoTooltip text="The custom Node.js server handling real-time WebSocket connections for live battles." />
            </div>
            <p className="text-2xl font-bold text-white">
              {ws?.available ? "Online" : "Offline"}
            </p>
            {ws?.serverStartedAt && (
              <p className="text-xs text-gray-500 mt-1">
                Uptime: {formatDuration(Date.now() - ws.serverStartedAt)}
              </p>
            )}
          </div>

          {/* Total Connections */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <div className="flex items-center gap-2">
                <Users className="text-blue-400" size={18} />
                <span className="text-sm">Connections</span>
              </div>
              <InfoTooltip text="Total number of active WebSocket connections across all battles. Includes admins and viewers." />
            </div>
            <p className="text-2xl font-bold text-white">
              {ws?.totalConnections ?? 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">Active WebSocket clients</p>
          </div>

          {/* Active Rooms */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <div className="flex items-center gap-2">
                <Server className="text-purple-400" size={18} />
                <span className="text-sm">Active Rooms</span>
              </div>
              <InfoTooltip text="Battle rooms in server memory. A room is created when anyone visits a battle page, even if not live." />
            </div>
            <p className="text-2xl font-bold text-white">
              {ws?.totalRooms ?? 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">Battle rooms in memory</p>
          </div>

          {/* Live Battles */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <div className="flex items-center gap-2">
                <Radio className="text-red-400 animate-pulse" size={18} />
                <span className="text-sm">Live Battles</span>
              </div>
              <InfoTooltip text="Battles marked as live in the database. Set when an admin clicks 'Go Live' on the battle control panel." />
            </div>
            <p className="text-2xl font-bold text-white">
              {liveBattles?.count ?? 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">Currently broadcasting</p>
          </div>
        </div>

      {/* Timeout Configuration */}
      {ws?.config && (
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
          <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <Clock size={16} />
            Cleanup Configuration
            <InfoTooltip text="Configurable timeouts for automatic cleanup of stale connections and rooms. Set via environment variables." />
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Heartbeat:</span>
              <span className="text-white ml-1">
                {formatDuration(ws.config.heartbeatInterval)}
              </span>
              <InfoTooltip text="How often the server pings clients to detect dead connections." />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Inactivity:</span>
              <span className="text-white ml-1">
                {formatDuration(ws.config.roomInactivityTimeout)}
              </span>
              <InfoTooltip text="Time without activity before a room is auto-closed and the live battle ends." />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Admin Grace:</span>
              <span className="text-white ml-1">
                {formatDuration(ws.config.adminGracePeriod)}
              </span>
              <InfoTooltip text="Time after admin disconnects before the live battle automatically ends." />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Max Lifetime:</span>
              <span className="text-white ml-1">
                {ws.config.maxRoomLifetime > 0
                  ? formatDuration(ws.config.maxRoomLifetime)
                  : "Disabled"}
              </span>
              <InfoTooltip text="Maximum duration a room can exist regardless of activity. 0 = no limit." />
            </div>
          </div>
        </div>
      )}

      {/* Combined Active Rooms & Live Battles */}
      {((ws?.rooms && ws.rooms.length > 0) || (liveBattles && liveBattles.battles.length > 0)) && (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Activity size={20} />
            Active Connections ({ws?.rooms?.length ?? 0})
            <InfoTooltip text="WebSocket rooms in server memory. Shows who's connected to each battle page right now, whether the battle is live or not." />
          </h3>
          <div className="space-y-2">
            {ws?.rooms?.map((room) => {
              // Look up battle info from the map
              const battle = battleInfo[room.battleId];
              const isSpecialRoom = room.battleId.startsWith("__");
              const isLive = battle?.isLive ?? false;
              
              return (
                <div
                  key={room.battleId}
                  className={`flex items-center justify-between bg-gray-900/50 rounded-lg p-3 ${
                    isLive ? "border border-red-900/30" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isLive
                          ? "bg-red-400 animate-pulse"
                          : room.adminConnected
                          ? "bg-green-400"
                          : "bg-gray-500"
                      }`}
                    />
                    <div>
                      {isSpecialRoom ? (
                        <span className="text-gray-400 text-sm">
                          {room.battleId === "__homepage__" ? "Homepage listeners" : room.battleId}
                        </span>
                      ) : battle ? (
                        <Link
                          href={`/battle/${room.battleId}`}
                          className="text-white hover:text-purple-400 transition-colors"
                        >
                          {battle.title}
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-sm">Unknown battle</span>
                      )}
                      <p className="text-xs text-gray-500">
                        {battle 
                          ? `${battle.player1} vs ${battle.player2} • Round ${battle.currentRound}`
                          : isSpecialRoom
                          ? `${room.viewerCount} connected`
                          : `Room active ${formatTimeAgo(room.createdAt)}`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {!isSpecialRoom && (
                      <div className="flex items-center gap-1 text-gray-400">
                        <Users size={14} />
                        <span>{room.viewerCount}</span>
                      </div>
                    )}
                    {isLive && (
                      <span className="px-2 py-0.5 bg-red-900/50 text-red-400 rounded text-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                        LIVE
                      </span>
                    )}
                    {!isSpecialRoom && (
                      room.adminConnected ? (
                        <span className="px-2 py-0.5 bg-green-900/50 text-green-400 rounded text-xs">
                          Admin
                        </span>
                      ) : room.adminDisconnectedAt ? (
                        <span className="px-2 py-0.5 bg-yellow-900/50 text-yellow-400 rounded text-xs">
                          Grace: {formatTimeAgo(room.adminDisconnectedAt)}
                        </span>
                      ) : !isLive ? (
                        <span className="px-2 py-0.5 bg-gray-700 text-gray-400 rounded text-xs">
                          {battle?.status === "completed" ? "Replay" : "Viewing"}
                        </span>
                      ) : null
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Show live battles that don't have active rooms (edge case - shouldn't happen normally) */}
            {liveBattles?.battles
              .filter(battle => !ws?.rooms?.some(room => room.battleId === battle.id))
              .map((battle) => (
                <div
                  key={battle.id}
                  className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3 border border-orange-900/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-400" />
                    <div>
                      <Link
                        href={`/battle/${battle.id}`}
                        className="text-white hover:text-purple-400 transition-colors"
                      >
                        {battle.title}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {battle.player1} vs {battle.player2} • Round {battle.currentRound}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="px-2 py-0.5 bg-red-900/50 text-red-400 rounded text-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                      LIVE
                    </span>
                    <span className="px-2 py-0.5 bg-orange-900/50 text-orange-400 rounded text-xs">
                      No Viewers
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {ws?.available &&
        (ws.totalRooms === 0 || !ws.rooms?.length) &&
        liveBattles?.count === 0 && (
          <div className="bg-gray-800/30 rounded-xl p-8 border border-gray-700/50 text-center">
            <WifiOff className="text-gray-600 mx-auto mb-3" size={32} />
            <p className="text-gray-500">No active battles or rooms</p>
            <p className="text-xs text-gray-600 mt-1">
              Start a live battle to see real-time stats here
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

