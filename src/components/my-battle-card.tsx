"use client";

import Link from "next/link";
import { Share2, Trash2, ExternalLink } from "lucide-react";

interface MyBattleCardProps {
  battle: {
    id: string;
    title: string;
    status: string;
    createdAt: Date;
    leftPersona: any;
    rightPersona: any;
  };
  shareUrl: string;
}

export function MyBattleCard({ battle, shareUrl }: MyBattleCardProps) {
  const personas = {
    left: battle.leftPersona as any,
    right: battle.rightPersona as any,
  };

  const battleUrl = `${shareUrl}/battle/${battle.id}`;

  const handleShare = () => {
    navigator.clipboard.writeText(battleUrl);
    alert("Link copied to clipboard!");
  };

  const handleDelete = async () => {
    if (
      confirm(
        "Are you sure you want to delete this battle? This will also delete all votes and comments."
      )
    ) {
      await fetch(`/api/battle/${battle.id}/delete`, {
        method: "DELETE",
      });
      window.location.reload();
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/40 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link
            href={`/battle/${battle.id}`}
            className="font-bebas text-3xl text-white hover:text-purple-400 transition-colors flex items-center gap-2"
          >
            {battle.title}
            <ExternalLink size={20} />
          </Link>
          <p className="text-gray-400 mt-1">
            {personas.left.name} vs {personas.right.name}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm mb-4">
        <span
          className={`px-3 py-1 rounded ${
            battle.status === "completed"
              ? "bg-green-600/30 text-green-300"
              : battle.status === "ongoing"
              ? "bg-yellow-600/30 text-yellow-300"
              : battle.status === "incomplete"
              ? "bg-orange-600/30 text-orange-300"
              : "bg-gray-600/30 text-gray-400"
          }`}
        >
          {battle.status === "incomplete" ? "paused" : battle.status}
        </span>
        <span className="text-gray-500">
          Created {new Date(battle.createdAt).toLocaleDateString()}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          <Share2 size={16} />
          Share Link
        </button>

        <Link
          href={`/battle/${battle.id}`}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          {battle.status === "incomplete" ? "Resume Battle" : "View Battle"}
        </Link>

        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors ml-auto"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </div>
  );
}
