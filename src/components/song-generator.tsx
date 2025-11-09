/**
 * Song Generator Component
 * Allows battle creators to generate AI songs from battle verses
 */

"use client";

import { useState, useEffect } from "react";
import { Music2, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import type {
  SongGenerationBeatStyle,
  Battle,
} from "@/lib/shared/battle-types";
import { APP_TITLE } from "@/lib/constants";
import { SongManualComplete } from "./song-manual-complete";
import { useAuth } from "@clerk/nextjs";

interface SongGeneratorProps {
  battleId: string;
  battle?: Battle; // Optional battle object to check for incomplete songs
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
  battle,
  onSongGenerated,
}: SongGeneratorProps) {
  const { sessionClaims, isLoaded } = useAuth();
  const [selectedStyle, setSelectedStyle] =
    useState<SongGenerationBeatStyle | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isResuming, setIsResuming] = useState(false);
  const [showManualComplete, setShowManualComplete] = useState(false);

  // Check if user is admin (manual completion is admin-only)
  const isAdmin = isLoaded && sessionClaims?.metadata?.role === "admin";

  // Check if there's an incomplete song on mount
  const incompleteSong = battle?.generatedSong;
  const hasIncompleteSong = !!(
    incompleteSong?.sunoTaskId && !incompleteSong?.audioUrl
  );

  // Shared function to poll song status
  const pollSongStatus = async (taskId: string): Promise<boolean> => {
    const maxAttempts = 60; // 5 minutes (60 * 5 seconds)
    let attempts = 0;

    const pollStatus = async (): Promise<boolean> => {
      attempts++;
      setProgress(Math.round(Math.min(20 + (attempts / maxAttempts) * 70, 90)));

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
        // Show manual complete option after timeout
        setShowManualComplete(true);
        throw new Error(
          "Song generation timed out. The song may still be processing. You can manually complete it using the form below or refresh later."
        );
      }

      // Continue polling
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return pollStatus();
    };

    return pollStatus();
  };

  const handleGenerate = async () => {
    if (!selectedStyle && !hasIncompleteSong) return;

    setIsGenerating(true);
    setError(null);
    setProgress(10);

    try {
      // Start generation (or resume if incomplete)
      const response = await fetch(`/api/battle/${battleId}/generate-song`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          beatStyle: selectedStyle || incompleteSong?.beatStyle,
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
      await pollSongStatus(taskId);

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
      setIsResuming(false);
    }
  };

  // Auto-resume polling on mount if there's an incomplete song
  useEffect(() => {
    if (
      hasIncompleteSong &&
      incompleteSong?.sunoTaskId &&
      !isGenerating &&
      !isResuming
    ) {
      console.log(
        "[SongGenerator] Found incomplete song, auto-resuming polling..."
      );
      setIsResuming(true);
      setIsGenerating(true);
      setProgress(10);

      // Start polling immediately
      pollSongStatus(incompleteSong.sunoTaskId)
        .then(() => {
          if (onSongGenerated) {
            onSongGenerated();
          }
        })
        .catch((err) => {
          setError(
            err instanceof Error ? err.message : "An unexpected error occurred"
          );
          setProgress(0);
        })
        .finally(() => {
          setIsGenerating(false);
          setIsResuming(false);
        });
    }
  }, [hasIncompleteSong, incompleteSong?.sunoTaskId]);

  return (
    <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-sm">
      <CardHeader>
        <CardDescription className="text-gray-400 text-center">
          {hasIncompleteSong && isResuming
            ? "Checking song generation status..."
            : hasIncompleteSong
            ? "Your song is still being generated. Click below to check its status."
            : `Turn this battle into a full song! Choose your beat style and let ${APP_TITLE} create the track.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Beat Style Selection - Hidden when resuming incomplete song */}
        {!hasIncompleteSong && (
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
        )}

        {/* Incomplete Song Status */}
        {hasIncompleteSong && !isGenerating && (
          <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/50">
            <div className="flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-blue-300 font-semibold mb-1">
                  Song Generation In Progress
                </p>
                <p className="text-xs text-blue-400/80">
                  Beat Style: {incompleteSong?.beatStyle?.toUpperCase()}
                  <br />
                  Your song is being generated by Suno. This can take 1-5
                  minutes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Generate/Check Status Button */}
        <div className="space-y-3">
          <Button
            onClick={handleGenerate}
            disabled={(!selectedStyle && !hasIncompleteSong) || isGenerating}
            className={`
              w-full h-12 text-lg font-bold
              ${
                hasIncompleteSong
                  ? "bg-linear-to-r from-blue-600 to-cyan-600 hover:opacity-90"
                  : selectedStyle
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
                <span>
                  {isResuming ? "Checking Status" : "Generating Song"}...{" "}
                  {progress}%
                </span>
              </div>
            ) : hasIncompleteSong ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                <span>Check Song Status</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Music2 className="w-5 h-5" />
                <span>Generate Track</span>
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

        {/* Manual Complete Fallback - Admin Only */}
        {showManualComplete && incompleteSong?.sunoTaskId && isAdmin && (
          <div className="mt-4">
            <SongManualComplete
              battleId={battleId}
              taskId={incompleteSong.sunoTaskId}
              onComplete={() => {
                if (onSongGenerated) {
                  onSongGenerated();
                }
              }}
            />
          </div>
        )}

        {/* Info Text */}
        <div className="text-xs text-gray-500 text-center">
          {hasIncompleteSong
            ? "Song generation can take 1-5 minutes. Check back in a few minutes."
            : `Song generation typically takes 3-5 minutes. ${APP_TITLE} will create a unique song blending both personas' styles and your chosen beat.`}
        </div>
      </CardContent>
    </Card>
  );
}
