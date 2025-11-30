import { z } from "zod";
import { getActiveModelConfig } from "@/lib/ai/model-config";
import { generateVerse } from "@/lib/ai/verse-generator";
import { addVerseToBattle } from "@/lib/battle-engine";
import { getBattleById, saveBattle } from "@/lib/battle-storage";
import {
  buildSystemPrompt,
  getFirstVerseMessage,
} from "@/lib/context-overrides";
import type { Verse } from "@/lib/shared";
import { getPersona } from "@/lib/shared";
import { recordBattleTokenUsage } from "@/lib/usage-storage";
import { broadcastEvent } from "@/lib/websocket/broadcast-helper";
import type {
  VerseCompleteEvent,
  VerseStreamingEvent,
} from "@/lib/websocket/types";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const generateVerseRequestSchema = z.object({
  battle: z.any(), // Accept any battle object - type checking is done at runtime
  personaId: z.string(),
  isLive: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate input with Zod
    const validation = generateVerseRequestSchema.safeParse(body);

    if (!validation.success) {
      console.error(
        "[Generate Verse] Validation failed:",
        validation.error.issues,
      );
      return new Response(
        JSON.stringify({
          error: "Invalid request",
          details: validation.error.issues,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const { battle, personaId, isLive } = validation.data;

    const persona = getPersona(personaId);
    if (!persona) {
      return new Response(JSON.stringify({ error: "Persona not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build context from previous verses
    let userMessage = `Round ${battle.currentRound} of ${3}. `;

    // Get the opponent's persona
    const opponentPersona =
      battle.personas.player1.id === personaId
        ? battle.personas.player2
        : battle.personas.player1;

    // If there are previous verses, show the full battle history
    if (battle.verses.length > 0) {
      userMessage += `\n\nHere's the battle so far:\n`;

      // Group verses by round
      const versesByRound: { [round: number]: Verse[] } = {};
      for (const verse of battle.verses) {
        if (!versesByRound[verse.round]) {
          versesByRound[verse.round] = [];
        }
        versesByRound[verse.round].push(verse);
      }

      // Show each round's verses
      for (let round = 1; round <= battle.currentRound; round++) {
        const roundVerses = versesByRound[round] || [];
        if (roundVerses.length > 0) {
          userMessage += `\n--- Round ${round} ---\n`;

          // Sort by timestamp to maintain order
          roundVerses.sort((a, b) => a.timestamp - b.timestamp);

          for (const verse of roundVerses) {
            const versePersona =
              verse.personaId === personaId ? "YOU" : opponentPersona.name;
            userMessage += `\n${versePersona}:\n${verse.fullText}\n`;
          }
        }
      }

      userMessage += `\n\nNow it's your turn. Drop your Round ${battle.currentRound} verse and respond to everything that's been said.`;
    } else {
      // Check for special first verse message based on match-up
      const specialMessage = getFirstVerseMessage(
        personaId,
        opponentPersona.id,
      );
      if (specialMessage) {
        userMessage += `\n\n${specialMessage}`;
      } else {
        userMessage += `You're going first. Drop your opening verse.`;
      }
    }

    userMessage += `\n\nRemember: EXACTLY 8 bars, no more, no less. Make it count.`;

    // Build dynamic system prompt with opponent-specific context and overrides
    const systemPrompt = buildSystemPrompt(
      persona.systemPrompt,
      personaId,
      opponentPersona.id,
      opponentPersona.name,
    );

    // Get active model configuration
    const modelConfig = getActiveModelConfig();
    console.log(
      `[Generate Verse] Using model: ${modelConfig.modelName} (${modelConfig.provider})`,
    );
    console.log(
      `[Generate Verse] Caching enabled: ${modelConfig.supportsCaching}`,
    );

    // Generate verse using unified interface
    const result = await generateVerse({
      systemPrompt,
      userMessage,
      model: modelConfig,
    });

    // If live, create custom stream that broadcasts to WebSocket
    console.log(
      "[Generate Verse] isLive:",
      isLive,
      "battle.isLive:",
      battle.isLive,
    );

    // Trust the isLive parameter from the client (admin might send stale battle object)
    if (isLive) {
      console.log("[Generate Verse] Using live broadcast mode");
      let fullText = "";
      let lastBroadcastTime = 0;
      const BROADCAST_THROTTLE_MS = 100; // Broadcast every 100ms max

      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.textStream) {
              fullText += chunk;

              const now = Date.now();
              const shouldBroadcast =
                now - lastBroadcastTime >= BROADCAST_THROTTLE_MS;

              // Throttle broadcasts to prevent overwhelming clients
              if (shouldBroadcast) {
                lastBroadcastTime = now;
                await broadcastEvent(battle.id, {
                  type: "verse:streaming",
                  battleId: battle.id,
                  timestamp: now,
                  personaId,
                  text: fullText,
                  isComplete: false,
                } as VerseStreamingEvent);
              }

              // Send to client
              controller.enqueue(new TextEncoder().encode(chunk));
            }

            // Broadcast final streaming update with complete text
            await broadcastEvent(battle.id, {
              type: "verse:streaming",
              battleId: battle.id,
              timestamp: Date.now(),
              personaId,
              text: fullText,
              isComplete: false,
            } as VerseStreamingEvent);

            // Small delay before completion
            await new Promise((resolve) => setTimeout(resolve, 200));

            // Broadcast completion
            await broadcastEvent(battle.id, {
              type: "verse:complete",
              battleId: battle.id,
              timestamp: Date.now(),
              personaId,
              verseText: fullText,
              round: battle.currentRound,
            } as VerseCompleteEvent);

            // Save verse to database (important for voting to work)
            try {
              const latestBattle = await getBattleById(battle.id);
              if (latestBattle) {
                const updatedBattle = addVerseToBattle(
                  latestBattle,
                  personaId,
                  fullText,
                );
                await saveBattle(updatedBattle);
                console.log(
                  "[Generate Verse] Saved verse to database for battle:",
                  battle.id,
                );
              }
            } catch (saveErr) {
              console.error(
                "[Generate Verse] Failed to save verse to database:",
                saveErr,
              );
            }

            // Record usage after streaming completes
            try {
              const usage = await result.getUsage();
              await recordBattleTokenUsage({
                id: crypto.randomUUID(),
                battleId: battle.id,
                round: battle.currentRound,
                personaId,
                provider: modelConfig.provider,
                model: modelConfig.modelName,
                inputTokens: usage.inputTokens,
                outputTokens: usage.outputTokens,
                totalTokens: usage.totalTokens,
                cachedInputTokens: usage.cachedInputTokens,
                status: "completed",
              });
            } catch (err) {
              console.error(
                "[Generate Verse] Failed to record token usage:",
                err,
              );
            }

            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    // Standard streaming - return as ReadableStream with usage tracking
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            controller.enqueue(new TextEncoder().encode(chunk));
          }

          // Record usage after streaming completes
          try {
            const usage = await result.getUsage();
            await recordBattleTokenUsage({
              id: crypto.randomUUID(),
              battleId: battle.id,
              round: battle.currentRound,
              personaId,
              provider: modelConfig.provider,
              model: modelConfig.modelName,
              inputTokens: usage.inputTokens,
              outputTokens: usage.outputTokens,
              totalTokens: usage.totalTokens,
              cachedInputTokens: usage.cachedInputTokens,
              status: "completed",
            });
          } catch (err) {
            console.error(
              "[Generate Verse] Failed to record token usage:",
              err,
            );
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error generating verse:", error);
    return new Response(JSON.stringify({ error: "Failed to generate verse" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
