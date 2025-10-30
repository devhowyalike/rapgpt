/**
 * Client component for test song page
 */

"use client";

import { SongGenerator } from "@/components/song-generator";
import { SongPlayer } from "@/components/song-player";
import { useRouter } from "next/navigation";
import type { Battle } from "@/lib/shared";

interface TestSongClientProps {
  battle: Battle;
}

export function TestSongClient({ battle }: TestSongClientProps) {
  const router = useRouter();
  // Only consider it "generated" if audioUrl exists (not just partial/failed data)
  const hasGeneratedSong = !!battle.generatedSong?.audioUrl;

  return (
    <>
      {/* Song Generator Component */}
      {!hasGeneratedSong ? (
        <div>
          <h2 className="text-2xl font-bold mb-4">Test Song Generator:</h2>
          <SongGenerator
            battleId={battle.id}
            onSongGenerated={() => {
              // Refresh the page to show generated song
              router.refresh();
            }}
          />
        </div>
      ) : (
        <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
          <p className="text-green-400">
            ✓ This battle already has a generated song. See player below.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            To test generation again, delete the generatedSong field from this
            battle in the database, or use a different completed battle.
          </p>
        </div>
      )}

      {/* Song Player Component */}
      <div>
        <h2 className="text-2xl font-bold mb-4">
          Test Song Player:
          {!hasGeneratedSong && (
            <span className="text-sm text-gray-400 ml-2">(Mock Data)</span>
          )}
        </h2>

        {hasGeneratedSong && battle.generatedSong ? (
          <SongPlayer song={battle.generatedSong} />
        ) : (
          <SongPlayer
            song={{
              audioUrl:
                "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
              videoUrl: "",
              imageUrl: "",
              title: "Mock Test Song - Replace with real generation",
              beatStyle: "boom-bap",
              generatedAt: Date.now(),
            }}
          />
        )}
      </div>
    </>
  );
}

