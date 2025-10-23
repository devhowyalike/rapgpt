/**
 * Score display component
 */

"use client";

import { useState } from "react";
import type { RoundScore, Persona } from "@/lib/shared";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ScoreDisplayProps {
  roundScore: RoundScore;
  leftPersona: Persona;
  rightPersona: Persona;
  className?: string;
}

export function ScoreDisplay({
  roundScore,
  leftPersona,
  rightPersona,
  className = "",
}: ScoreDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const leftScore = roundScore.personaScores[leftPersona.id];
  const rightScore = roundScore.personaScores[rightPersona.id];

  if (!leftScore || !rightScore) return null;

  return (
    <div className={className}>
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center gap-2 mb-3 text-gray-400 hover:text-white transition-colors group"
      >
        <span className="text-sm font-medium">
          {isExpanded ? "Hide Details" : "Show Details"}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 group-hover:transform group-hover:-translate-y-0.5 transition-transform" />
        ) : (
          <ChevronDown className="w-4 h-4 group-hover:transform group-hover:translate-y-0.5 transition-transform" />
        )}
      </button>

      {isExpanded ? (
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          {/* Left Score - Expanded */}
          <div
            className="bg-gray-900/50 rounded-lg p-2 md:p-4 border-2"
            style={{ borderColor: leftPersona.accentColor + "40" }}
          >
            <div className="text-center">
              <div
                className="text-xs font-medium mb-1 md:mb-2 opacity-80"
                style={{ color: leftPersona.accentColor }}
              >
                {leftPersona.name}
              </div>
              <div
                className="text-xl md:text-2xl font-bold font-(family-name:--font-bebas-neue)"
                style={{ color: leftPersona.accentColor }}
              >
                {leftScore.totalScore.toFixed(1)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Auto: {leftScore.automated.total.toFixed(1)} | Votes:{" "}
                {leftScore.userVotes}
              </div>

              {/* Score Breakdown */}
              <div className="mt-2 md:mt-3 space-y-0.5 md:space-y-1 text-xs text-left">
                <div className="flex justify-between">
                  <span className="text-gray-400">Rhyme:</span>
                  <span className="text-white">
                    {leftScore.automated.rhymeScheme.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Wordplay:</span>
                  <span className="text-white">
                    {leftScore.automated.wordplay.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Flow:</span>
                  <span className="text-white">
                    {leftScore.automated.flow.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Score - Expanded */}
          <div
            className="bg-gray-900/50 rounded-lg p-2 md:p-4 border-2"
            style={{ borderColor: rightPersona.accentColor + "40" }}
          >
            <div className="text-center">
              <div
                className="text-xs font-medium mb-1 md:mb-2 opacity-80"
                style={{ color: rightPersona.accentColor }}
              >
                {rightPersona.name}
              </div>
              <div
                className="text-xl md:text-2xl font-bold font-(family-name:--font-bebas-neue)"
                style={{ color: rightPersona.accentColor }}
              >
                {rightScore.totalScore.toFixed(1)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Auto: {rightScore.automated.total.toFixed(1)} | Votes:{" "}
                {rightScore.userVotes}
              </div>

              {/* Score Breakdown */}
              <div className="mt-2 md:mt-3 space-y-0.5 md:space-y-1 text-xs text-left">
                <div className="flex justify-between">
                  <span className="text-gray-400">Rhyme:</span>
                  <span className="text-white">
                    {rightScore.automated.rhymeScheme.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Wordplay:</span>
                  <span className="text-white">
                    {rightScore.automated.wordplay.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Flow:</span>
                  <span className="text-white">
                    {rightScore.automated.flow.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          {/* Left Score - Collapsed */}
          <div
            className="bg-gray-900/50 rounded-lg p-2 md:p-4 border-2 flex flex-col items-center justify-center"
            style={{ borderColor: leftPersona.accentColor + "40" }}
          >
            <div
              className="text-xs font-medium mb-1 md:mb-2 opacity-80"
              style={{ color: leftPersona.accentColor }}
            >
              {leftPersona.name}
            </div>
            <div
              className="text-xl md:text-2xl font-bold font-(family-name:--font-bebas-neue)"
              style={{ color: leftPersona.accentColor }}
            >
              {leftScore.totalScore.toFixed(1)}
            </div>
          </div>

          {/* Right Score - Collapsed */}
          <div
            className="bg-gray-900/50 rounded-lg p-2 md:p-4 border-2 flex flex-col items-center justify-center"
            style={{ borderColor: rightPersona.accentColor + "40" }}
          >
            <div
              className="text-xs font-medium mb-1 md:mb-2 opacity-80"
              style={{ color: rightPersona.accentColor }}
            >
              {rightPersona.name}
            </div>
            <div
              className="text-xl md:text-2xl font-bold font-(family-name:--font-bebas-neue)"
              style={{ color: rightPersona.accentColor }}
            >
              {rightScore.totalScore.toFixed(1)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
