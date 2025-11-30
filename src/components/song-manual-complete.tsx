/**
 * Manual song completion component
 * Used when polling isn't available - lets user paste audio URL from Suno dashboard
 */

"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SongManualCompleteProps {
  battleId: string;
  taskId: string;
  onComplete: () => void;
}

export function SongManualComplete({
  battleId,
  taskId,
  onComplete,
}: SongManualCompleteProps) {
  const [audioUrl, setAudioUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!audioUrl.trim()) {
      setError("Please enter an audio URL");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/battle/${battleId}/manual-song-complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            audioUrl: audioUrl.trim(),
            taskId,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save song");
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-yellow-600 bg-yellow-900/20">
      <CardHeader>
        <CardTitle className="text-yellow-400">
          ⚠️ Manual Completion Required
        </CardTitle>
        <CardDescription className="text-yellow-200">
          The song is generating but polling isn't available. Complete manually:
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm space-y-2">
            <p>
              <strong>Task ID:</strong>{" "}
              <code className="bg-gray-800 px-2 py-1 rounded">{taskId}</code>
            </p>
            <p>
              <strong>Steps:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>
                Go to{" "}
                <a
                  href="https://sunoapi.org/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Suno Dashboard
                </a>
              </li>
              <li>
                Find task ID: <code>{taskId}</code>
              </li>
              <li>
                Wait for status: <span className="text-green-400">success</span>
              </li>
              <li>Click "Result" button to get audio URL</li>
              <li>Paste URL below:</li>
            </ol>
          </div>
        </div>

        <div className="space-y-2">
          <input
            type="url"
            placeholder="https://..."
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !audioUrl.trim()}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md font-medium transition-colors"
          >
            {isSubmitting ? "Saving..." : "Complete Song"}
          </button>
        </div>

        <div className="text-xs text-gray-400 border-t border-gray-700 pt-3">
          <p>
            <strong>Note:</strong> This manual step is temporary. The Suno API
            polling endpoint needs to be identified from their documentation.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
