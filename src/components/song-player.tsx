/**
 * Song Player Component
 * Audio player with controls for AI-generated battle songs
 */

"use client";

import { motion } from "framer-motion";
import { Download, Pause, Play, Share2, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ClientDate } from "@/components/client-date";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { APP_TITLE } from "@/lib/constants";
import type { SongGenerationBeatStyle } from "@/lib/shared/battle-types";
import { copyToClipboard } from "@/lib/utils";

interface SongPlayerProps {
  song: {
    audioUrl: string;
    videoUrl?: string;
    imageUrl?: string;
    title: string;
    beatStyle: SongGenerationBeatStyle;
    generatedAt: number;
  };
  onPlayStateChange?: (isPlaying: boolean) => void;
  externalIsPlaying?: boolean;
  onTogglePlay?: () => void;
  /** Optional external audio ref - when provided, SongPlayer won't render its own audio element */
  audioRef?: React.RefObject<HTMLAudioElement | null>;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function SongPlayer({
  song,
  onPlayStateChange,
  externalIsPlaying,
  onTogglePlay,
  audioRef: externalAudioRef,
}: SongPlayerProps) {
  const internalAudioRef = useRef<HTMLAudioElement>(null);
  const audioRef = externalAudioRef || internalAudioRef;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isSeeking, setIsSeeking] = useState(false);

  // Sync with external play state if controlled
  useEffect(() => {
    if (externalIsPlaying !== undefined && externalIsPlaying !== isPlaying) {
      setIsPlaying(externalIsPlaying);
      const audio = audioRef.current;
      if (audio) {
        if (externalIsPlaying) {
          audio.play().catch(console.error);
        } else {
          audio.pause();
        }
      }
    }
  }, [externalIsPlaying]);

  // Update current time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      if (!isSeeking) {
        setCurrentTime(audio.currentTime);
      }
    };

    const updateDuration = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onPlayStateChange?.(false);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [isSeeking, onPlayStateChange]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = async () => {
    if (onTogglePlay) {
      onTogglePlay();
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      onPlayStateChange?.(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
        onPlayStateChange?.(true);
      } catch (error) {
        console.error("Error playing audio:", error);
      }
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = value[0];
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = song.audioUrl;
    link.download = `${song.title}.mp3`;
    link.click();
  };

  const handleShare = async () => {
    // Build share URL with #song fragment to auto-open song drawer
    const shareUrl = `${window.location.origin}${window.location.pathname}#song`;

    // Prefer native share sheet on supported devices (mobile Safari/Chrome)
    const isSecure = typeof window !== "undefined" ? window.isSecureContext : false;

    if (
      typeof navigator !== "undefined" &&
      typeof window !== "undefined" &&
      "share" in navigator &&
      isSecure
    ) {
      try {
        const shareData = {
          title: `${song.title} - ${APP_TITLE}`,
          url: shareUrl,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const canShare = (navigator as any).canShare
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (navigator as any).canShare(shareData)
          : true;
        if (!canShare) throw new Error("canShare returned false");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (navigator as any).share(shareData);
        return;
      } catch (err) {
        // User canceled the sheet — no further action
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Fall through to clipboard copy
      }
    }

    const ok = await copyToClipboard(shareUrl);
    if (ok) {
      toast.success("Link copied to clipboard");
    } else {
      toast.error("Couldn't copy link—please copy it manually from the address bar.");
    }
  };

  const beatStyleColors: Record<SongGenerationBeatStyle, string> = {
    "g-funk": "from-purple-600 to-pink-600",
    "boom-bap": "from-orange-600 to-red-600",
    trap: "from-blue-600 to-cyan-600",
  };

  const beatStyleEmojis: Record<SongGenerationBeatStyle, string> = {
    "g-funk": "🎹",
    "boom-bap": "🥁",
    trap: "🔊",
  };

  return (
    <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-sm">
      <CardContent className="space-y-4 pt-0">
        {/* Album Art & Info */}
        <div className="flex gap-4 items-center">
          {song.imageUrl ? (
            <motion.img
              src={song.imageUrl}
              alt={song.title}
              className="w-20 h-20 rounded-lg object-cover"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            />
          ) : (
            <div
              className={`w-20 h-20 rounded-lg bg-linear-to-br ${
                beatStyleColors[song.beatStyle]
              } flex items-center justify-center text-3xl`}
            >
              {beatStyleEmojis[song.beatStyle]}
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-bold text-white text-lg line-clamp-2">
              {song.title}
            </h3>
            <p className="text-sm text-gray-400 capitalize">
              {song.beatStyle.replace("-", " ")} Style
            </p>
          </div>
        </div>

        {/* Audio Element - only render if using internal ref */}
        {!externalAudioRef && (
          <audio ref={internalAudioRef} src={song.audioUrl} preload="metadata" />
        )}

        {/* Play/Pause Button */}
        <div className="flex items-center gap-3">
          <Button
            onClick={togglePlay}
            size="lg"
            className={`w-16 h-16 rounded-full bg-linear-to-r ${
              beatStyleColors[song.beatStyle]
            } hover:opacity-90 transition-all`}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-white" />
            ) : (
              <Play className="w-7 h-7 fill-white ml-1" />
            )}
          </Button>

          {/* Time Display */}
          <div className="flex-1">
            <div className="text-sm text-gray-400 mb-2 flex justify-between">
              <span>{formatTime(currentTime)}</span>
              <span>{duration ? formatTime(duration) : "--:--"}</span>
            </div>

            {/* Seek Bar */}
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              onPointerDown={() => setIsSeeking(true)}
              onPointerUp={() => setIsSeeking(false)}
              className="cursor-pointer"
            />
          </div>
        </div>

        {/* Volume Control & Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-3">
            <Volume2 className="w-4 h-4 text-gray-400" />
            <Slider
              value={[volume * 100]}
              max={100}
              step={1}
              onValueChange={(value) => setVolume(value[0] / 100)}
              className="w-24 cursor-pointer **:data-[slot=slider-range]:bg-white **:data-[slot=slider-track]:bg-gray-700"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Download Button */}
            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
              className="w-9 h-9 rounded-full bg-blue-600 border-blue-500 hover:bg-blue-700 hover:border-blue-400 text-white"
              title="Download song"
            >
              <Download className="w-4 h-4" />
            </Button>
            {/* Share Button */}
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="w-9 h-9 rounded-full bg-green-600 border-green-500 hover:bg-green-700 hover:border-green-400 text-white"
              title="Share song"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Generated Info */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-800">
          Generated on{" "}
          <ClientDate
            date={song.generatedAt}
            options={{ month: "long", day: "numeric", year: "numeric" }}
          />{" "}
          • Quality
          Matters&trade;
        </div>
      </CardContent>
    </Card>
  );
}
