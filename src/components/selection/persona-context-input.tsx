"use client";

import Image from "next/image";
import type { ClientPersona } from "@/lib/shared/personas/client";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

const MAX_CONTEXT_LENGTH = 120;

interface PersonaContextInputProps {
  persona: ClientPersona;
  playerNumber: 1 | 2;
  customContext: string;
  onContextChange: (context: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function PersonaContextInput({
  persona,
  playerNumber,
  customContext,
  onContextChange,
  onContinue,
  onBack,
}: PersonaContextInputProps) {
  const isPlayer1 = playerNumber === 1;
  const playerColor = isPlayer1
    ? "rgb(var(--player1-color))"
    : "rgb(var(--player2-color))";
  const playerColorClass = isPlayer1
    ? "text-[rgb(var(--player1-color))]"
    : "text-[rgb(var(--player2-color))]";
  const borderColorClass = isPlayer1
    ? "border-[rgb(var(--player1-color))]"
    : "border-[rgb(var(--player2-color))]";
  const focusBorderClass = isPlayer1
    ? "focus:border-[rgb(var(--player1-color))]"
    : "focus:border-[rgb(var(--player2-color))]";

  const handleContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CONTEXT_LENGTH) {
      onContextChange(value);
    }
  };

  const charactersRemaining = MAX_CONTEXT_LENGTH - customContext.length;
  const isNearLimit = charactersRemaining <= 20;

  return (
    <div className="flex-1 bg-black text-white selection:bg-yellow-500/30 pt-20 relative overflow-y-auto flex flex-col custom-scrollbar">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-purple-900/20 via-black to-black z-0" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10 flex flex-col flex-1 pb-44 md:pb-48">
        {/* Header Section */}
        <div className="text-center mb-4 md:mb-8 animate-slide-up">
          <h1 className="text-3xl md:text-6xl font-bold tracking-wide font-(family-name:--font-bebas-neue)">
            <span className="bg-linear-to-r from-white via-gray-200 to-gray-400 text-transparent bg-clip-text pr-2 uppercase">
              CHECK THE RHIME
            </span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm md:text-base">
            Give {persona.name} specific battle instructions
          </p>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col items-center justify-start max-w-2xl mx-auto w-full gap-4 md:gap-6 flex-1">
          {/* Persona Preview */}
          <div className="flex flex-col items-center gap-3 animate-slide-up [animation-delay:100ms]">
            {/* Avatar */}
            <div
              className={cn(
                "relative w-24 h-24 md:w-32 md:h-32 rounded-full border-4 overflow-hidden",
                borderColorClass
              )}
              style={{
                boxShadow: `0 0 30px ${playerColor}40`,
              }}
            >
              <Image
                src={persona.avatar}
                alt={persona.name}
                width={128}
                height={128}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            {/* Name */}
            <div className={cn("text-xl md:text-2xl font-black tracking-wider uppercase", playerColorClass)}>
              {persona.name}
            </div>
            {/* Player Badge */}
            <div
              className={cn(
                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                borderColorClass,
                playerColorClass
              )}
            >
              Player {playerNumber}
            </div>
          </div>

          {/* Context Input */}
          <div className="w-full animate-slide-up [animation-delay:200ms]">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-4 md:p-6 shadow-2xl">
              <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                Customize their Lyrics{" "}
                <span className="text-white/40 font-normal lowercase">(optional)</span>
              </label>
              <Textarea
                value={customContext}
                onChange={handleContextChange}
                placeholder={`e.g., "Diss their sneakers" or "Rap about the Philadelphia Eagles"`}
                className={cn(
                  "w-full bg-black/60 border-white/10 text-white placeholder:text-white/50 resize-none min-h-[120px] text-lg md:text-xl p-4 transition-all duration-200",
                  focusBorderClass,
                  "focus:ring-1 focus:ring-white/20 focus-visible:ring-0"
                )}
                maxLength={MAX_CONTEXT_LENGTH}
              />
              <div className="flex justify-between items-start gap-4 mt-3">
                <p className="text-[10px] md:text-xs text-white/50 flex items-start gap-1.5 italic leading-tight">
                  <span className="text-sm not-italic shrink-0">⚠️</span> 
                  <span>Inappropriate or explicit content will be automatically filtered.</span>
                </p>
                <span
                  className={cn(
                    "text-xs md:text-sm font-mono font-bold whitespace-nowrap pt-0.5",
                    isNearLimit ? "text-yellow-400" : "text-white/60",
                    charactersRemaining === 0 && "text-red-500"
                  )}
                >
                  {charactersRemaining}/{MAX_CONTEXT_LENGTH}
                </span>
              </div>
            </div>
          </div>

          {/* Example Prompts */}
          <div className="w-full animate-slide-up [animation-delay:300ms]">
            <p className="text-xs md:text-sm text-white/50 mb-3 text-center font-medium">Try these prompts:</p>
            <div className="flex flex-wrap justify-center gap-1.5 md:gap-2">
              {[
                "Diss their fashion sense",
                "Focus on their hometown",
                "Make it about food",
                "Rhyme in metaphors about Hanna-Barbera cartoons",
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => {
                    if (example.length <= MAX_CONTEXT_LENGTH) {
                      onContextChange(example);
                    }
                  }}
                  className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-white/10 hover:bg-white/20 border border-white/5 hover:border-white/20 rounded-full text-white/90 hover:text-white transition-all shadow-sm"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-linear-to-t from-black via-black/90 to-transparent pt-12 pointer-events-none">
        <div className="container mx-auto max-w-xl pointer-events-auto">
          <div className="flex flex-col gap-3">
            <button
              onClick={onContinue}
              className="w-full px-8 md:px-12 py-3.5 md:py-4 rounded-lg font-black text-lg tracking-wider transition-all duration-300 transform bg-linear-to-r from-yellow-400 via-orange-500 to-red-600 hover:scale-105 hover:shadow-[0_0_40px_rgba(251,191,36,0.8)] text-white shadow-lg shadow-yellow-500/20"
            >
              {customContext.trim() ? "CONTINUE" : "SKIP & CONTINUE"}
            </button>
            <button
              onClick={onBack}
              className="w-full px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              ← Back to character select
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
