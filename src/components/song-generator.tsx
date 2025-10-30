/**
 * Song Generator Component
 * Allows battle creators to generate AI songs from battle verses
 */

"use client";

import { useState } from "react";
import { Music2, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import type { SongGenerationBeatStyle } from "@/lib/shared/battle-types";
import { APP_TITLE } from "@/lib/constants";

interface SongGeneratorProps {
  battleId: string;
  onSongGenerated?: () => void;
}

const BEAT_STYLES = [
  {
    id: "g-funk" as SongGenerationBeatStyle,
    name: "G-Funk",
    description: "West Coast smooth vibes",
    icon: "🎹",
    color: "from-purple-600 to-pink-600",
  },
  {
    id: "boom-bap" as SongGenerationBeatStyle,
    name: "Boom-Bap",
    description: "90s East Coast classic",
    icon: "🥁",
    color: "from-orange-600 to-red-600",
  },
  {
    id: "trap" as SongGenerationBeatStyle,
    name: "Trap",
    description: "Modern Atlanta sound",
    icon: "🔊",
    color: "from-blue-600 to-cyan-600",
  },
];

export function SongGenerator({
  battleId,
  onSongGenerated,
}: SongGeneratorProps) {
  const [selectedStyle, setSelectedStyle] =
    useState<SongGenerationBeatStyle | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!selectedStyle) return;

    setIsGenerating(true);
    setError(null);
    setProgress(10);

    try {
      // Start generation
      const response = await fetch(`/api/battle/${battleId}/generate-song`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          beatStyle: selectedStyle,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate song");
      }

      const data = await response.json();
      const taskId = data.taskId;

      if (!taskId) {
        throw new Error("No task ID received");
      }

      setProgress(20);

      // Poll for completion
      const maxAttempts = 60; // 5 minutes (60 * 5 seconds)
      let attempts = 0;

      const pollStatus = async (): Promise<boolean> => {
        attempts++;
        setProgress(Math.min(20 + (attempts / maxAttempts) * 70, 90));

        const statusResponse = await fetch(
          `/api/battle/${battleId}/song-status?taskId=${taskId}`
        );

        if (!statusResponse.ok) {
          throw new Error("Failed to check song status");
        }

        const statusData = await statusResponse.json();

        if (statusData.status === "complete") {
          setProgress(100);
          return true;
        } else if (statusData.status === "error") {
          throw new Error(statusData.errorMessage || "Song generation failed");
        } else if (attempts >= maxAttempts) {
          throw new Error("Song generation timeout - check back later");
        }

        // Continue polling
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return pollStatus();
      };

      await pollStatus();

      // Success!
      if (onSongGenerated) {
        onSongGenerated();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setProgress(0);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl text-white">
          <Sparkles className="w-6 h-6 text-yellow-400" />
          Generate Song
        </CardTitle>
        <CardDescription className="text-gray-400">
          Turn this battle into a full song! Choose your beat style and let AI
          create the track.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Beat Style Selection */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            Choose Your Beat Style
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {BEAT_STYLES.map((style) => (
              <motion.button
                key={style.id}
                onClick={() => !isGenerating && setSelectedStyle(style.id)}
                disabled={isGenerating}
                className={`
                  relative p-4 rounded-lg border-2 transition-all text-left
                  ${
                    selectedStyle === style.id
                      ? "border-yellow-400 bg-yellow-400/10"
                      : "border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800"
                  }
                  ${
                    isGenerating
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }
                `}
                whileHover={!isGenerating ? { scale: 1.02 } : {}}
                whileTap={!isGenerating ? { scale: 0.98 } : {}}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{style.icon}</span>
                  <div className="flex-1">
                    <div className="font-bold text-white text-lg">
                      {style.name}
                    </div>
                    <div className="text-sm text-gray-400">
                      {style.description}
                    </div>
                  </div>
                  {selectedStyle === style.id && (
                    <Zap className="w-5 h-5 text-yellow-400 absolute top-2 right-2" />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="space-y-3">
          <Button
            onClick={handleGenerate}
            disabled={!selectedStyle || isGenerating}
            className={`
              w-full h-12 text-lg font-bold
              ${
                selectedStyle
                  ? `bg-linear-to-r ${
                      BEAT_STYLES.find((s) => s.id === selectedStyle)?.color
                    } hover:opacity-90`
                  : "bg-gray-700"
              }
            `}
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating Song... {progress}%</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Music2 className="w-5 h-5" />
                <span>Generate Song</span>
              </div>
            )}
          </Button>

          {/* Progress Bar */}
          {isGenerating && (
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-linear-to-r from-yellow-400 to-orange-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-red-900/20 border border-red-500/50 text-red-400"
          >
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        {/* Info Text */}
        <div className="text-xs text-gray-500 text-center">
          Song generation typically takes 1-3 minutes.
          <br />
          {APP_TITLE} will create a unique track combining both personas' styles
          & lyrics with your selected beat.
        </div>
      </CardContent>
    </Card>
  );
}
