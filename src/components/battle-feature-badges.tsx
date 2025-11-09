import { ThumbsUp, MessageSquare, Music2 } from "lucide-react";

interface BattleFeatureBadgesProps {
  votingEnabled?: boolean;
  commentsEnabled?: boolean;
  hasGeneratedSong?: boolean;
}

export function BattleFeatureBadges({
  votingEnabled = true,
  commentsEnabled = true,
  hasGeneratedSong = false,
}: BattleFeatureBadgesProps) {
  return (
    <>
      {votingEnabled !== false && (
        <span
          className="px-2 py-1 rounded bg-blue-600/20 text-blue-400 flex items-center gap-1.5 text-xs border border-blue-500/30"
          title="Voting enabled"
        >
          <ThumbsUp size={12} />
          <span className="hidden md:inline">Voting</span>
        </span>
      )}
      {commentsEnabled !== false && (
        <span
          className="px-2 py-1 rounded bg-purple-600/20 text-purple-400 flex items-center gap-1.5 text-xs border border-purple-500/30"
          title="Comments enabled"
        >
          <MessageSquare size={12} />
          <span className="hidden md:inline">Comments</span>
        </span>
      )}
      {hasGeneratedSong && (
        <span
          className="px-2 py-1 rounded bg-green-500/15 text-green-400 flex items-center gap-1.5 text-xs border border-green-500/30"
          title="Song generated"
        >
          <Music2 size={12} />
          <span className="hidden md:inline">MP3</span>
        </span>
      )}
    </>
  );
}
