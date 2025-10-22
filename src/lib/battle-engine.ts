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

  // Take up to 8 bars
  const bars: Bar[] = lines.slice(0, BARS_PER_VERSE).map((text, index) => ({
    text,
    index,
  }));

  // Pad with empty bars if needed
  while (bars.length < BARS_PER_VERSE) {
    bars.push({ text: '', index: bars.length });
  }

  return bars;
}

/**
 * Validate a verse has exactly 8 bars
 */
export function validateVerse(bars: Bar[]): boolean {
  return bars.length === BARS_PER_VERSE && bars.every(bar => bar.text.trim().length > 0);
}

/**
 * Calculate scores for a completed round
 */
export function calculateRoundScore(
  battle: Battle,
  round: number,
  verses: Verse[]
): RoundScore {
  const roundVerses = verses.filter(v => v.round === round);
  
  const leftVerse = roundVerses.find(v => v.personaId === battle.personas.left.id);
  const rightVerse = roundVerses.find(v => v.personaId === battle.personas.right.id);

  const personaScores: RoundScore['personaScores'] = {};

  if (leftVerse) {
    const automated = calculateScore(leftVerse.bars, battle.personas.right.name);
    personaScores[battle.personas.left.id] = {
      automated,
      userVotes: 0,
      totalScore: automated.total,
    };
  }

  if (rightVerse) {
    const automated = calculateScore(rightVerse.bars, battle.personas.left.name);
    personaScores[battle.personas.right.id] = {
      automated,
      userVotes: 0,
      totalScore: automated.total,
    };
  }

  // Determine round winner (will be updated with user votes later)
  const leftScore = personaScores[battle.personas.left.id]?.totalScore || 0;
  const rightScore = personaScores[battle.personas.right.id]?.totalScore || 0;
  
  let winner: string | null = null;
  if (leftScore > rightScore) {
    winner = battle.personas.left.id;
  } else if (rightScore > leftScore) {
    winner = battle.personas.right.id;
  }

  return {
    round,
    personaScores,
    winner,
  };
}

/**
 * Determine if a round is complete
 */
export function isRoundComplete(battle: Battle, round: number): boolean {
  const roundVerses = battle.verses.filter(v => v.round === round);
  return (
    roundVerses.filter(v => v.personaId === battle.personas.left.id).length > 0 &&
    roundVerses.filter(v => v.personaId === battle.personas.right.id).length > 0
  );
}

/**
 * Determine if the entire battle is complete
 */
export function isBattleComplete(battle: Battle): boolean {
  return battle.currentRound > ROUNDS_PER_BATTLE;
}

/**
 * Get the next persona to perform
 */
export function getNextPerformer(battle: Battle): PersonaPosition | null {
  if (isBattleComplete(battle)) return null;

  const currentRoundVerses = battle.verses.filter(v => v.round === battle.currentRound);
  
  // If no verses in current round, left goes first
  if (currentRoundVerses.length === 0) {
    return 'left';
  }

  // If left has performed but right hasn't, right goes next
  const leftPerformed = currentRoundVerses.some(v => v.personaId === battle.personas.left.id);
  const rightPerformed = currentRoundVerses.some(v => v.personaId === battle.personas.right.id);

  if (leftPerformed && !rightPerformed) {
    return 'right';
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
    throw new Error('Invalid verse: must have exactly 8 non-empty bars');
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
 * Determine overall winner based on round victories
 */
export function determineOverallWinner(battle: Battle): string | null {
  const wins: Record<string, number> = {
    [battle.personas.left.id]: 0,
    [battle.personas.right.id]: 0,
  };

  battle.scores.forEach(roundScore => {
    if (roundScore.winner) {
      wins[roundScore.winner] = (wins[roundScore.winner] || 0) + 1;
    }
  });

  const leftWins = wins[battle.personas.left.id];
  const rightWins = wins[battle.personas.right.id];

  if (leftWins > rightWins) return battle.personas.left.id;
  if (rightWins > leftWins) return battle.personas.right.id;

  // Tie-breaker: total score across all rounds
  let leftTotal = 0;
  let rightTotal = 0;

  battle.scores.forEach(roundScore => {
    leftTotal += roundScore.personaScores[battle.personas.left.id]?.totalScore || 0;
    rightTotal += roundScore.personaScores[battle.personas.right.id]?.totalScore || 0;
  });

  if (leftTotal > rightTotal) return battle.personas.left.id;
  if (rightTotal > leftTotal) return battle.personas.right.id;

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
 */
export function getRoundVerses(battle: Battle, round: number): { left?: Verse; right?: Verse } {
  const roundVerses = battle.verses.filter(v => v.round === round);
  
  return {
    left: roundVerses.find(v => v.personaId === battle.personas.left.id),
    right: roundVerses.find(v => v.personaId === battle.personas.right.id),
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
    updatedBattle.currentTurn = 'left';
  }
  
  updatedBattle.updatedAt = Date.now();
  
  return updatedBattle;
}

