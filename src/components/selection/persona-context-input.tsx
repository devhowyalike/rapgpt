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

      <div className="container mx-auto px-4 relative z-10 flex flex-col flex-1 pb-48">
        {/* Header Section */}
        <div className="text-center mb-6 lg:mb-8 animate-slide-up">
          <h1 className="text-4xl md:text-6xl font-bold tracking-wide font-(family-name:--font-bebas-neue)">
            <span className="bg-linear-to-r from-white via-gray-200 to-gray-400 text-transparent bg-clip-text pr-2">
              CUSTOM CONTEXT
            </span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm md:text-base">
            Optional: Give {persona.name} specific battle instructions
          </p>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col items-center justify-start max-w-2xl mx-auto w-full gap-6 flex-1">
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
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 md:p-6">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Battle Context{" "}
                <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <Textarea
                value={customContext}
                onChange={handleContextChange}
                placeholder={`e.g., "Rap about the Philadelphia Eagles" or "Diss their sneakers"`}
                className={cn(
                  "w-full bg-black/50 border-white/20 text-white placeholder:text-gray-500 resize-none min-h-[100px]",
                  focusBorderClass,
                  "focus:ring-0 focus-visible:ring-0"
                )}
                maxLength={MAX_CONTEXT_LENGTH}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  This context will be used to guide the AI during the battle
                </p>
                <span
                  className={cn(
                    "text-xs font-mono",
                    isNearLimit ? "text-yellow-500" : "text-gray-500",
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
            <p className="text-xs text-gray-500 mb-2 text-center">Example prompts:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "Rap about tech startups",
                "Diss their fashion sense",
                "Focus on their hometown",
                "Make it about food",
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => {
                    if (example.length <= MAX_CONTEXT_LENGTH) {
                      onContextChange(example);
                    }
                  }}
                  className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full text-gray-400 hover:text-white transition-all"
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
              className="w-full px-8 md:px-12 py-4 rounded-lg font-black text-lg tracking-wider transition-all duration-300 transform bg-linear-to-r from-yellow-400 via-orange-500 to-red-600 hover:scale-105 hover:shadow-[0_0_40px_rgba(251,191,36,0.8)] text-white shadow-lg shadow-yellow-500/20"
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
