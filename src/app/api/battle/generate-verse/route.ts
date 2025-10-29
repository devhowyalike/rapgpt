import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { getPersona } from '@/lib/shared';
import type { Battle, Verse } from '@/lib/shared';
import { buildSystemPrompt, getFirstVerseMessage } from '@/lib/context-overrides';
import { z } from 'zod';
import { broadcastEvent } from '@/lib/websocket/broadcast-helper';
import type { VerseStreamingEvent, VerseCompleteEvent } from '@/lib/websocket/types';

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
      console.error('[Generate Verse] Validation failed:', validation.error.issues);
      return new Response(JSON.stringify({ 
        error: 'Invalid request', 
        details: validation.error.issues 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const { battle, personaId, isLive } = validation.data;

    const persona = getPersona(personaId);
    if (!persona) {
      return new Response(JSON.stringify({ error: 'Persona not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build context from previous verses
    let userMessage = `Round ${battle.currentRound} of ${3}. `;
    
    // Get the opponent's persona
    const opponentPersona = battle.personas.left.id === personaId 
      ? battle.personas.right 
      : battle.personas.left;
    
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
            const versePersona = verse.personaId === personaId ? 'YOU' : opponentPersona.name;
            userMessage += `\n${versePersona}:\n${verse.fullText}\n`;
          }
        }
      }
      
      userMessage += `\n\nNow it's your turn. Drop your Round ${battle.currentRound} verse and respond to everything that's been said.`;
    } else {
      // Check for special first verse message based on match-up
      const specialMessage = getFirstVerseMessage(personaId, opponentPersona.id);
      if (specialMessage) {
        userMessage += `\n\n${specialMessage}`;
      } else {
        userMessage += `You're going first. Drop your opening verse.`;
      }
    }

    userMessage += `\n\nRemember: EXACTLY 8 bars, no more, no less. Make it count.`;

    // Build dynamic system prompt with opponent-specific context and overrides
    const systemPrompt = buildSystemPrompt(persona.systemPrompt, personaId, opponentPersona.id, opponentPersona.name);

    const result = streamText({
      model: anthropic('claude-3-5-haiku-latest'),
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.9,
    });

    // If live, create custom stream that broadcasts to WebSocket
    console.log('[Generate Verse] isLive:', isLive, 'battle.isLive:', battle.isLive);
    
    // Trust the isLive parameter from the client (admin might send stale battle object)
    if (isLive) {
      console.log('[Generate Verse] Using live broadcast mode');
      let fullText = '';
      let lastBroadcastTime = 0;
      const BROADCAST_THROTTLE_MS = 100; // Broadcast every 100ms max
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.textStream) {
              fullText += chunk;
              
              const now = Date.now();
              const shouldBroadcast = now - lastBroadcastTime >= BROADCAST_THROTTLE_MS;
              
              // Throttle broadcasts to prevent overwhelming clients
              if (shouldBroadcast) {
                lastBroadcastTime = now;
                await broadcastEvent(battle.id, {
                  type: 'verse:streaming',
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
              type: 'verse:streaming',
              battleId: battle.id,
              timestamp: Date.now(),
              personaId,
              text: fullText,
              isComplete: false,
            } as VerseStreamingEvent);
            
            // Small delay before completion
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Broadcast completion
            await broadcastEvent(battle.id, {
              type: 'verse:complete',
              battleId: battle.id,
              timestamp: Date.now(),
              personaId,
              verseText: fullText,
              round: battle.currentRound,
            } as VerseCompleteEvent);
            
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error generating verse:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate verse' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

