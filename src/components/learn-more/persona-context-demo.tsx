"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// Types & Data
// =============================================================================

interface Persona {
  id: string;
  name: string;
  avatar: string;
  playerNumber: 1 | 2;
}

const DEMO_PERSONA: Persona = {
  id: "tyler",
  name: "Tyler, the Creator",
  avatar: "/avatars/tyler.webp",
  playerNumber: 1,
};

const DEMO_PHRASES = [
  "Diss their sneakers",
  "Rhyme in metaphors about Hanna-Barbera cartoons",
  "Call them out on their lack of hygiene",
  "It's a sunny day and you're feeling pretty good so all of your lyrics should be positive and vibey",
];

// The phrase index that will be shown via voice demo instead of typing
const VOICE_DEMO_PHRASE_INDEX = 2;

const MAX_CONTEXT_LENGTH = 120;

// =============================================================================
// UI Components (Simplified versions of PersonaContextInput)
// =============================================================================

interface DemoContentProps {
  isMobile: boolean;
  text: string;
  isListening: boolean;
  interimText?: string;
}

function DemoContent({ isMobile, text, isListening, interimText }: DemoContentProps) {
  const persona = DEMO_PERSONA;
  const playerColor = "rgb(var(--player1-color))";
  const playerColorClass = "text-[rgb(var(--player1-color))]";
  const borderColorClass = "border-[rgb(var(--player1-color))]";
  
  const charactersRemaining = MAX_CONTEXT_LENGTH - text.length;
  const isNearLimit = charactersRemaining <= 20;

  return (
    <div className="absolute inset-0 flex flex-col bg-black overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-purple-900/20 via-black to-black z-0" />
      
      <div className={cn(
        "relative z-10 flex flex-col flex-1 items-center w-full",
        isMobile ? "p-4 pt-8" : "p-8 pt-12"
      )}>
        {/* Header Section */}
        <div className="text-center mb-6 animate-slide-up">
          <h1 className={cn(
            "font-bold tracking-wide uppercase font-(family-name:--font-bebas-neue)",
            isMobile ? "text-3xl" : "text-5xl"
          )}>
            <span className="bg-linear-to-r from-white via-gray-200 to-gray-400 text-transparent bg-clip-text pr-2">
              CHECK THE RHIME
            </span>
          </h1>
          <p className="text-gray-400 mt-1 text-xs md:text-sm">
            Give {persona.name} specific battle instructions
          </p>
        </div>

        {/* Main Content Area */}
        <div className={cn(
          "flex flex-col items-center justify-start w-full gap-4 md:gap-6 flex-1 max-w-lg mx-auto",
        )}>
          {/* Persona Preview */}
          <div className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "relative rounded-full border-2 overflow-hidden",
                isMobile ? "w-16 h-16" : "w-24 h-24",
                borderColorClass
              )}
              style={{
                boxShadow: `0 0 20px ${playerColor}40`,
              }}
            >
              <Image
                src={persona.avatar}
                alt={persona.name}
                width={96}
                height={96}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div className={cn("font-black tracking-wider uppercase", isMobile ? "text-sm" : "text-lg", playerColorClass)}>
              {persona.name}
            </div>
          </div>

          {/* Context Input */}
          <div className="w-full">
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4 shadow-2xl">
              <label className="block text-[10px] md:text-xs font-bold text-white uppercase tracking-wider mb-2">
                Customize their Lyrics <span className="text-white/40 font-normal lowercase">(optional)</span>
              </label>
              
              <div className="relative">
                <div className={cn(
                  "w-full bg-black/60 border border-white/10 text-white min-h-[100px] md:min-h-[120px] rounded-lg p-3 text-sm md:text-base transition-all duration-200",
                  isListening && "border-red-500/50 bg-red-950/20"
                )}>
                  {text}
                  {isListening && interimText && (
                    <span className="text-white/40 italic ml-1">{interimText}</span>
                  )}
                </div>

                {/* Mic Button */}
                <div className={cn(
                  "absolute bottom-3 right-3 flex items-center justify-center rounded-full transition-all duration-300",
                  isMobile ? "w-8 h-8" : "w-10 h-10",
                  isListening
                    ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]"
                    : "bg-white/10 border border-white/10"
                )}>
                  {isListening ? (
                    <MicOff className={cn("text-white", isMobile ? "w-4 h-4" : "w-5 h-5")} />
                  ) : (
                    <Mic className={cn("text-white/60", isMobile ? "w-4 h-4" : "w-5 h-5")} />
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-start gap-4 mt-2">
                <div className="flex flex-col gap-1">
                  {isListening && (
                    <p className="text-[10px] text-red-400 flex items-center gap-1 font-medium animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      Listening...
                    </p>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-mono font-bold",
                  isNearLimit ? "text-yellow-400" : "text-white/60"
                )}>
                  {text.length}/{MAX_CONTEXT_LENGTH}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

interface PersonaContextDemoProps {
  isActive?: boolean;
}

export function PersonaContextDemo({ isActive = true }: PersonaContextDemoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  
  // Calculate which phrase and state based on single animation step
  const totalSteps = DEMO_PHRASES.length; // One full typing cycle per phrase
  const phraseIndex = animationStep % DEMO_PHRASES.length;
  const currentPhrase = DEMO_PHRASES[phraseIndex];

  // Handle mobile detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkMobile = () => {
      setIsMobile(container.offsetWidth < 500);
    };

    checkMobile();
    const resizeObserver = new ResizeObserver(checkMobile);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // Main animation effect
  useEffect(() => {
    if (!isActive) return;

    let timeoutId: NodeJS.Timeout;
    let typeInterval: NodeJS.Timeout;
    let interimInterval: NodeJS.Timeout;
    let currentIndex = 0;

    // Reset display state
    setDisplayedText("");
    setInterimText("");
    setIsListening(false);

    // For the voice demo phrase, skip typing and show voice input simulation only
    if (phraseIndex === VOICE_DEMO_PHRASE_INDEX) {
      // Go directly to voice demo - build up the phrase word by word
      setIsListening(true);
      const words = currentPhrase.split(' ');
      let wordIndex = 0;
      
      interimInterval = setInterval(() => {
        if (wordIndex < words.length) {
          wordIndex++;
          // Show words progressively
          setInterimText(words.slice(0, wordIndex).join(' '));
        } else {
          clearInterval(interimInterval);
          // After voice demo, show final text then advance
          timeoutId = setTimeout(() => {
            setIsListening(false);
            setInterimText("");
            setDisplayedText(currentPhrase);
            // Wait, then advance to next phrase
            timeoutId = setTimeout(() => {
              setAnimationStep(prev => prev + 1);
            }, 1500);
          }, 600);
        }
      }, 300);
    } else {
      // For other phrases, just type and display
      typeInterval = setInterval(() => {
        if (currentIndex <= currentPhrase.length) {
          setDisplayedText(currentPhrase.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
          // After typing completes, wait then advance
          timeoutId = setTimeout(() => {
            setAnimationStep(prev => prev + 1);
          }, 1500);
        }
      }, 40);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (typeInterval) clearInterval(typeInterval);
      if (interimInterval) clearInterval(interimInterval);
    };
  }, [animationStep, phraseIndex, isActive, currentPhrase]);

  // Reset when becoming active
  useEffect(() => {
    if (isActive) {
      setAnimationStep(0);
    }
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-black flex flex-col overflow-hidden"
    >
      <DemoContent
        isMobile={isMobile}
        text={displayedText}
        isListening={isListening}
        interimText={interimText}
      />
    </div>
  );
}
