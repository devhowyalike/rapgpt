/**
 * Song Player Component
 * Audio player with controls for AI-generated battle songs
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Download, Music2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";
import type { SongGenerationBeatStyle } from "@/lib/shared/battle-types";

interface SongPlayerProps {
  song: {
    audioUrl: string;
    videoUrl?: string;
    imageUrl?: string;
    title: string;
    beatStyle: SongGenerationBeatStyle;
    generatedAt: number;
  };
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function SongPlayer({ song }: SongPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isSeeking, setIsSeeking] = useState(false);

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
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [isSeeking]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl text-white">
          <Music2 className="w-5 h-5 text-green-400" />
          Generated Song
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {/* Audio Element */}
        <audio ref={audioRef} src={song.audioUrl} preload="metadata" />

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

          {/* Download Button */}
          <Button
            onClick={handleDownload}
            variant="outline"
            size="lg"
            className="w-16 h-16 rounded-full border-gray-700 hover:bg-gray-800"
          >
            <Download className="w-6 h-6" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3 pt-2">
          <Volume2 className="w-4 h-4 text-gray-400" />
          <Slider
            value={[volume * 100]}
            max={100}
            step={1}
            onValueChange={(value) => setVolume(value[0] / 100)}
            className="w-24 cursor-pointer"
          />
        </div>

        {/* Generated Info */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-800">
          Generated on {new Date(song.generatedAt).toLocaleDateString()} •
          Powered by Suno AI
        </div>
      </CardContent>
    </Card>
  );
}
