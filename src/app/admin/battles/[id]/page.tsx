import {
  ArrowLeft,
  Calendar,
  Eye,
  Hash,
  MessageSquare,
  Mic2,
  Music,
  Radio,
  Shield,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BattleRoundsDisplay } from "@/components/admin/battle-rounds-display";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { checkRole } from "@/lib/auth/roles";
import { getBattleById } from "@/lib/battle-storage";
import { getDisplayRound, ROUNDS_PER_BATTLE } from "@/lib/shared";
import { getBattleTokenTotals } from "@/lib/usage-storage";

export const dynamic = "force-dynamic";

export default async function AdminBattleDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const isAdmin = await checkRole("admin");
  if (!isAdmin) {
    redirect("/");
  }

  const battle = await getBattleById(id);
  if (!battle) {
    redirect("/admin/battles-list");
  }

  const tokenTotals = await getBattleTokenTotals(id);

  const fmt = (n: number | string | undefined | null) =>
    n == null ? "0" : Number(n).toLocaleString();

  return (
    <div className="min-h-dvh bg-linear-to-br from-gray-900 via-purple-900 to-black">
      <SiteHeader />
      <div className="max-w-[1400px] mx-auto px-4 py-24">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-bebas text-6xl text-white mb-2 flex items-center gap-3">
              <Shield className="text-purple-400" size={48} />
              Battle Details
            </h1>
            <p className="text-gray-400 text-lg">{battle.title}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link
                href="/admin/dashboard"
                className="text-purple-400 border-purple-400 bg-gray-900/50 hover:bg-purple-400/10"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link
                href={`/battle/${battle.id}`}
                className="text-green-400 border-green-400 bg-gray-900/50 hover:bg-green-400/10"
              >
                <Eye className="mr-2 h-4 w-4" />
                View Battle
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link
                href={`/admin/battles/${battle.id}/usage`}
                className="text-blue-400 border-blue-400 bg-gray-900/50 hover:bg-blue-400/10"
              >
                <Hash className="mr-2 h-4 w-4" />
                View Token Usage
              </Link>
            </Button>
          </div>
        </div>

        {/* Battle Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  battle.status === "completed"
                    ? "bg-green-500"
                    : battle.status === "paused"
                      ? "bg-orange-500"
                      : battle.status === "upcoming"
                        ? "bg-yellow-500"
                        : "bg-gray-500"
                }`}
              />
              <span className="text-gray-400 text-sm uppercase font-semibold">
                Status
              </span>
            </div>
            <p className="text-2xl font-bold text-white capitalize">
              {battle.status}
            </p>
            {battle.isLive && (
              <div className="flex items-center gap-2 mt-2">
                <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                <span className="text-red-400 text-sm font-semibold">LIVE</span>
              </div>
            )}
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Mic2 className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400 text-sm uppercase font-semibold">
                Round
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {getDisplayRound(battle)} / {ROUNDS_PER_BATTLE}
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <span className="text-gray-400 text-sm uppercase font-semibold">
                Verses
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {battle.verses.length}
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Hash className="w-5 h-5 text-green-400" />
              <span className="text-gray-400 text-sm uppercase font-semibold">
                Comments
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {battle.comments.length}
            </p>
          </div>
        </div>

        {/* Matchup and Creator Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Matchup */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
            <h2 className="text-white text-2xl font-bebas mb-4">Matchup</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg">
                <div className="relative w-16 h-16 shrink-0">
                  <Image
                    src={battle.personas.player1.avatar}
                    alt={battle.personas.player1.name}
                    fill
                    className="rounded-full border-2 object-cover"
                    style={{ borderColor: battle.personas.player1.accentColor }}
                  />
                </div>
                <div>
                  <h3
                    className="text-xl font-bold"
                    style={{ color: battle.personas.player1.accentColor }}
                  >
                    {battle.personas.player1.name}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {battle.personas.player1.style}
                  </p>
                </div>
              </div>
              <div className="text-center text-gray-500 font-bold">VS</div>
              <div className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg">
                <div className="relative w-16 h-16 shrink-0">
                  <Image
                    src={battle.personas.player2.avatar}
                    alt={battle.personas.player2.name}
                    fill
                    className="rounded-full border-2 object-cover"
                    style={{ borderColor: battle.personas.player2.accentColor }}
                  />
                </div>
                <div>
                  <h3
                    className="text-xl font-bold"
                    style={{ color: battle.personas.player2.accentColor }}
                  >
                    {battle.personas.player2.name}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {battle.personas.player2.style}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Creator and Metadata */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
            <h2 className="text-white text-2xl font-bebas mb-4">Information</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-purple-400 mt-0.5" />
                <div>
                  <p className="text-gray-400 text-sm">Creator</p>
                  <p className="text-white font-semibold">
                    {battle.creator?.displayName || "Unknown"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-purple-400 mt-0.5" />
                <div>
                  <p className="text-gray-400 text-sm">Created</p>
                  <p className="text-white font-semibold">
                    {new Date(battle.createdAt).toLocaleString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-purple-400 mt-0.5" />
                <div>
                  <p className="text-gray-400 text-sm">Battle Type</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        battle.isFeatured
                          ? "bg-purple-600/30 text-purple-300"
                          : "bg-gray-600/30 text-gray-400"
                      }`}
                    >
                      {battle.isFeatured ? "Featured" : "User Battle"}
                    </span>
                    {battle.votingEnabled !== false && (
                      <span className="px-2 py-1 rounded text-xs bg-green-600/20 text-green-400">
                        Voting Enabled
                      </span>
                    )}
                    {battle.commentsEnabled !== false && (
                      <span className="px-2 py-1 rounded text-xs bg-blue-600/20 text-blue-400">
                        Comments Enabled
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {battle.generatedSong && (
                <div className="flex items-start gap-3">
                  <Music className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <p className="text-gray-400 text-sm">Generated Song</p>
                    <p className="text-white font-semibold">
                      {battle.generatedSong.title || "Untitled"}
                    </p>
                    {battle.generatedSong.audioUrl && (
                      <a
                        href={battle.generatedSong.audioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 text-sm hover:underline"
                      >
                        Play Audio
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Token Usage Summary */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6 mb-8">
          <h2 className="text-white text-2xl font-bebas mb-4">Token Usage</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Input Tokens</p>
              <p className="text-2xl font-bold text-blue-400">
                {fmt(tokenTotals.inputTokens)}
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Output Tokens</p>
              <p className="text-2xl font-bold text-green-400">
                {fmt(tokenTotals.outputTokens)}
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Cached Tokens</p>
              <p className="text-2xl font-bold text-orange-400">
                {fmt(tokenTotals.cachedInputTokens)}
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Total Tokens</p>
              <p className="text-2xl font-bold text-purple-400">
                {fmt(tokenTotals.totalTokens)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href={`/admin/battles/${battle.id}/usage`}
              className="text-purple-400 hover:text-purple-300 text-sm hover:underline"
            >
              View detailed token usage →
            </Link>
          </div>
        </div>

        {/* Verses List */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
          <h2 className="text-white text-2xl font-bebas mb-4">
            Verses ({battle.verses.length})
          </h2>
          <BattleRoundsDisplay battle={battle} />
        </div>
      </div>
    </div>
  );
}
