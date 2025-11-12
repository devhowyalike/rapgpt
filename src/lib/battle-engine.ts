/**
 * Battle orchestration logic
 */

import type { Battle, Verse, Bar, RoundScore, PersonaPosition, Persona } from '@/lib/shared';
import { ROUNDS_PER_BATTLE, BARS_PER_VERSE } from '@/lib/shared';
import { calculateScore } from './scoring';

/**
 * Parse raw verse text into bars
 */
export function parseVerseToBars(verseText: string): Bar[] {
  const lines = verseText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // Take only up to BARS_PER_VERSE bars (don't pad with empty bars)
  const bars: Bar[] = lines.slice(0, BARS_PER_VERSE).map((text, index) => ({
    text,
    index,
  }));

  return bars;
}

/**
 * Validate a verse has exactly 8 bars
 */
export function validateVerse(bars: Bar[]): boolean {
  return bars.length === BARS_PER_VERSE && bars.every(bar => bar.text.trim().length > 0);
}

/**
 * Helper: Get sorted verses for a specific round
 * @returns Verses sorted by timestamp (chronological order)
 */
function getSortedRoundVerses(battle: Battle, round: number): Verse[] {
  const roundVerses = battle.verses.filter(v => v.round === round);
  return roundVerses.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Helper: Determine winner based on player1 and player2 scores
 */
function determineWinnerFromScores(
  player1Score: number,
  player2Score: number,
  player1PersonaId: string,
  player2PersonaId: string
): string | null {
  if (player1Score > player2Score) return player1PersonaId;
  if (player2Score > player1Score) return player2PersonaId;
  return null; // Tie
}

/**
 * Calculate scores for a completed round
 * Uses verse order to determine position since player1 always performs first
 */
export function calculateRoundScore(
  battle: Battle,
  round: number,
  verses: Verse[]
): RoundScore {
  const sortedVerses = getSortedRoundVerses(battle, round);
  const [player1Verse, player2Verse] = sortedVerses;

  const personaScores: RoundScore['personaScores'] = {};

  if (player1Verse) {
    const automated = calculateScore(player1Verse.bars, battle.personas.player2.name);
    personaScores[battle.personas.player1.id] = {
      automated,
      userVotes: 0,
      totalScore: automated.total,
    };
  }

  if (player2Verse) {
    const automated = calculateScore(player2Verse.bars, battle.personas.player1.name);
    personaScores[battle.personas.player2.id] = {
      automated,
      userVotes: 0,
      totalScore: automated.total,
    };
  }

  // Determine round winner (will be updated with user votes later)
  const player1Score = personaScores[battle.personas.player1.id]?.totalScore || 0;
  const player2Score = personaScores[battle.personas.player2.id]?.totalScore || 0;
  
  const winner = determineWinnerFromScores(
    player1Score,
    player2Score,
    battle.personas.player1.id,
    battle.personas.player2.id
  );

  return {
    round,
    personaScores,
    winner,
  };
}

/**
 * Determine if a round is complete
 * A round is complete when it has exactly 2 verses (one from each side)
 */
export function isRoundComplete(battle: Battle, round: number): boolean {
  const roundVerses = battle.verses.filter(v => v.round === round);
  return roundVerses.length >= 2;
}

/**
 * Determine if the entire battle is complete
 */
export function isBattleComplete(battle: Battle): boolean {
  return battle.currentRound > ROUNDS_PER_BATTLE;
}

/**
 * Determine if a battle is archived (completed)
 * Archived battles should not accept new comments or votes
 */
export function isBattleArchived(battle: Battle): boolean {
  return battle.status === 'completed';
}

/**
 * Get the next persona to perform
 * Uses verse count to determine who's next since player1 always goes first
 */
export function getNextPerformer(battle: Battle): PersonaPosition | null {
  if (isBattleComplete(battle)) return null;

  const currentRoundVerses = battle.verses.filter(v => v.round === battle.currentRound);
  
  // If no verses in current round, player1 goes first
  if (currentRoundVerses.length === 0) {
    return 'player1';
  }

  // If only one verse exists, player2 goes next
  if (currentRoundVerses.length === 1) {
    return 'player2';
  }

  // Round is complete, move to next round
  return null;
}

/**
 * Add a verse to the battle and update state
 */
export function addVerseToBattle(
  battle: Battle,
  personaId: string,
  verseText: string
): Battle {
  const bars = parseVerseToBars(verseText);
  
  if (!validateVerse(bars)) {
    const barCount = bars.length;
    const emptyBars = bars.filter(bar => bar.text.trim().length === 0).length;
    throw new Error(
      `Invalid verse: must have exactly ${BARS_PER_VERSE} non-empty bars. ` +
      `Received ${barCount} bars with ${emptyBars} empty.`
    );
  }

  const verse: Verse = {
    id: `${battle.id}-r${battle.currentRound}-${personaId}-${Date.now()}`,
    personaId,
    round: battle.currentRound,
    bars,
    timestamp: Date.now(),
    fullText: verseText,
  };

  const updatedBattle = {
    ...battle,
    verses: [...battle.verses, verse],
    updatedAt: Date.now(),
  };

  // Check if round is now complete
  if (isRoundComplete(updatedBattle, battle.currentRound)) {
    // Calculate round score
    const roundScore = calculateRoundScore(updatedBattle, battle.currentRound, updatedBattle.verses);
    updatedBattle.scores = [...battle.scores, roundScore];

    // Set turn to null to indicate round is complete and needs manual advancement
    updatedBattle.currentTurn = null;
  } else {
    // Update turn
    const nextPerformer = getNextPerformer(updatedBattle);
    updatedBattle.currentTurn = nextPerformer;
  }

  return updatedBattle;
}

/**
 * Get the winner's position (player1 or player2) by analyzing scores
 * This works even when both sides use the same persona
 * Note: This is a pure function, not a React hook - it doesn't need to be one
 * since it only performs calculations without any React-specific logic
 */
export function getWinnerPosition(battle: Battle): PersonaPosition | null {
  if (!battle.winner) return null;

  // Count wins per position by analyzing each round
  let player1Wins = 0;
  let player2Wins = 0;

  battle.scores.forEach(roundScore => {
    const player1Score = roundScore.personaScores[battle.personas.player1.id]?.totalScore || 0;
    const player2Score = roundScore.personaScores[battle.personas.player2.id]?.totalScore || 0;
    
    if (player1Score > player2Score) {
      player1Wins++;
    } else if (player2Score > player1Score) {
      player2Wins++;
    }
  });

  if (player1Wins > player2Wins) return 'player1';
  if (player2Wins > player1Wins) return 'player2';

  // Tie-breaker: total score across all rounds
  let player1Total = 0;
  let player2Total = 0;

  battle.scores.forEach(roundScore => {
    player1Total += roundScore.personaScores[battle.personas.player1.id]?.totalScore || 0;
    player2Total += roundScore.personaScores[battle.personas.player2.id]?.totalScore || 0;
  });

  if (player1Total > player2Total) return 'player1';
  if (player2Total > player1Total) return 'player2';

  return null; // Perfect tie
}

/**
 * Determine overall winner based on round victories
 */
export function determineOverallWinner(battle: Battle): string | null {
  const wins: Record<string, number> = {
    [battle.personas.player1.id]: 0,
    [battle.personas.player2.id]: 0,
  };

  battle.scores.forEach(roundScore => {
    if (roundScore.winner) {
      wins[roundScore.winner] = (wins[roundScore.winner] || 0) + 1;
    }
  });

  const player1Wins = wins[battle.personas.player1.id];
  const player2Wins = wins[battle.personas.player2.id];

  if (player1Wins > player2Wins) return battle.personas.player1.id;
  if (player2Wins > player1Wins) return battle.personas.player2.id;

  // Tie-breaker: total score across all rounds
  let player1Total = 0;
  let player2Total = 0;

  battle.scores.forEach(roundScore => {
    player1Total += roundScore.personaScores[battle.personas.player1.id]?.totalScore || 0;
    player2Total += roundScore.personaScores[battle.personas.player2.id]?.totalScore || 0;
  });

  if (player1Total > player2Total) return battle.personas.player1.id;
  if (player2Total > player1Total) return battle.personas.player2.id;

  return null; // Perfect tie
}

/**
 * Update round score with user votes
 */
export function updateScoreWithVotes(
  roundScore: RoundScore,
  personaId: string,
  votes: number
): RoundScore {
  const updated = { ...roundScore };
  
  if (updated.personaScores[personaId]) {
    updated.personaScores[personaId] = {
      ...updated.personaScores[personaId],
      userVotes: votes,
      totalScore: updated.personaScores[personaId].automated.total + (votes * 0.5), // Each vote adds 0.5 points
    };
  }

  // Recalculate winner
  const scores = Object.entries(updated.personaScores).map(([id, score]) => ({
    id,
    score: score.totalScore,
  }));

  scores.sort((a, b) => b.score - a.score);

  if (scores.length > 1 && scores[0].score > scores[1].score) {
    updated.winner = scores[0].id;
  } else {
    updated.winner = null;
  }

  return updated;
}

/**
 * Get verses for a specific round
 * Uses verse order to determine position since player1 always performs first
 */
export function getRoundVerses(battle: Battle, round: number): { player1?: Verse; player2?: Verse } {
  const [player1Verse, player2Verse] = getSortedRoundVerses(battle, round);
  
  return {
    player1: player1Verse,
    player2: player2Verse,
  };
}

/**
 * Get current battle progress
 */
export function getBattleProgress(battle: Battle): {
  completedRounds: number;
  totalRounds: number;
  percentage: number;
} {
  const completedRounds = Math.min(battle.scores.length, ROUNDS_PER_BATTLE);
  
  return {
    completedRounds,
    totalRounds: ROUNDS_PER_BATTLE,
    percentage: (completedRounds / ROUNDS_PER_BATTLE) * 100,
  };
}

/**
 * Advance to the next round after reviewing scores
 */
export function advanceToNextRound(battle: Battle): Battle {
  // Only advance if current round is complete
  if (!isRoundComplete(battle, battle.currentRound)) {
    return battle;
  }

  const updatedBattle = { ...battle };
  
  // Move to next round or complete battle
  updatedBattle.currentRound += 1;
  
  if (updatedBattle.currentRound > ROUNDS_PER_BATTLE) {
    updatedBattle.status = 'completed';
    updatedBattle.winner = determineOverallWinner(updatedBattle);
    updatedBattle.currentTurn = null;
  } else {
    updatedBattle.currentTurn = 'player1';
  }
  
  updatedBattle.updatedAt = Date.now();
  
  return updatedBattle;
}

