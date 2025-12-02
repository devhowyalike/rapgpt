/**
 * Automated scoring system for battle verses
 */

import type { AutomatedScore, Bar } from "@/lib/shared";

interface RhymeAnalysis {
  endRhymes: number;
  internalRhymes: number;
  multiSyllabicRhymes: number;
}

interface FlowAnalysis {
  syllableConsistency: number;
  rhythmScore: number;
}

/**
 * Analyze rhyme scheme in a verse
 */
function analyzeRhymes(bars: Bar[]): RhymeAnalysis {
  const endWords = bars.map((bar) => {
    const words = bar.text.trim().toLowerCase().split(/\s+/);
    return words[words.length - 1]?.replace(/[^a-z]/g, "") || "";
  });

  let endRhymes = 0;
  let internalRhymes = 0;
  let multiSyllabicRhymes = 0;

  // Check end rhymes (consecutive and non-consecutive)
  for (let i = 0; i < endWords.length; i++) {
    for (let j = i + 1; j < endWords.length; j++) {
      if (endsWithSameSound(endWords[i], endWords[j])) {
        endRhymes++;
        if (endWords[i].length > 4 || endWords[j].length > 4) {
          multiSyllabicRhymes++;
        }
      }
    }
  }

  // Check internal rhymes
  bars.forEach((bar) => {
    const words = bar.text
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.replace(/[^a-z]/g, ""));
    for (let i = 0; i < words.length - 1; i++) {
      for (let j = i + 1; j < words.length; j++) {
        if (words[i].length > 2 && endsWithSameSound(words[i], words[j])) {
          internalRhymes++;
        }
      }
    }
  });

  return { endRhymes, internalRhymes, multiSyllabicRhymes };
}

/**
 * Simple phonetic ending check
 */
function endsWithSameSound(word1: string, word2: string): boolean {
  if (word1 === word2 || word1.length < 2 || word2.length < 2) return false;

  const ending1 = word1.slice(-3);
  const ending2 = word2.slice(-3);

  // Check if they share similar endings
  if (ending1 === ending2) return true;

  // Check for vowel rhymes
  const vowels = "aeiou";
  const lastVowel1 = [...word1].reverse().find((c) => vowels.includes(c));
  const lastVowel2 = [...word2].reverse().find((c) => vowels.includes(c));

  if (lastVowel1 && lastVowel1 === lastVowel2) {
    return word1.slice(-2) === word2.slice(-2);
  }

  return false;
}

/**
 * Analyze syllable consistency and rhythm
 */
function analyzeFlow(bars: Bar[]): FlowAnalysis {
  const syllableCounts = bars.map((bar) => estimateSyllables(bar.text));
  const avgSyllables =
    syllableCounts.reduce((a, b) => a + b, 0) / syllableCounts.length;

  // Calculate consistency (lower variance = better)
  const variance =
    syllableCounts.reduce((sum, count) => {
      return sum + Math.pow(count - avgSyllables, 2);
    }, 0) / syllableCounts.length;

  const syllableConsistency = Math.max(0, 100 - variance * 5);

  // Rhythm score based on average syllable count (sweet spot around 8-12)
  const rhythmScore = 100 - Math.abs(avgSyllables - 10) * 8;

  return {
    syllableConsistency: Math.min(100, syllableConsistency),
    rhythmScore: Math.max(0, Math.min(100, rhythmScore)),
  };
}

/**
 * Estimate syllable count in text
 */
function estimateSyllables(text: string): number {
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/);
  return words.reduce((total, word) => {
    if (word.length === 0) return total;

    // Simple syllable counting
    const vowelGroups = word.match(/[aeiouy]+/g);
    let count = vowelGroups ? vowelGroups.length : 1;

    // Adjust for silent e
    if (word.endsWith("e") && count > 1) count--;

    return total + Math.max(1, count);
  }, 0);
}

/**
 * Analyze wordplay quality
 */
function analyzeWordplay(bars: Bar[]): number {
  const fullText = bars
    .map((b) => b.text)
    .join(" ")
    .toLowerCase();
  let score = 0;

  // Check for metaphor indicators
  const metaphorWords = ["like", "as", "than", "similar", "resemble"];
  metaphorWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "g");
    const matches = fullText.match(regex);
    if (matches) score += matches.length * 10;
  });

  // Check for clever comparisons and contrasts
  if (
    fullText.includes("but") ||
    fullText.includes("while") ||
    fullText.includes("whereas")
  ) {
    score += 15;
  }

  // Reward unique/complex vocabulary
  const words = fullText.split(/\s+/);
  const uniqueWords = new Set(words);
  const vocabularyRichness = (uniqueWords.size / words.length) * 100;
  score += vocabularyRichness * 0.5;

  // Check for alliteration
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i][0] && words[i][0] === words[i + 1][0]) {
      score += 5;
    }
  }

  return Math.min(100, score);
}

/**
 * Analyze relevance to battle context
 */
function analyzeRelevance(bars: Bar[], opponentName?: string): number {
  const fullText = bars
    .map((b) => b.text)
    .join(" ")
    .toLowerCase();
  let score = 50; // Base score

  // Battle-specific language
  const battleWords = [
    "battle",
    "beat",
    "destroy",
    "murder",
    "kill",
    "bury",
    "defeat",
    "winner",
    "loser",
    "weak",
    "fake",
  ];
  battleWords.forEach((word) => {
    if (fullText.includes(word)) score += 5;
  });

  // Direct address (you, your, etc.)
  const directAddress = ["you", "your", "you're", "yours"];
  directAddress.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "g");
    const matches = fullText.match(regex);
    if (matches) score += matches.length * 3;
  });

  // Opponent name mention
  if (opponentName && fullText.includes(opponentName.toLowerCase())) {
    score += 20;
  }

  return Math.min(100, score);
}

/**
 * Analyze originality
 */
function analyzeOriginality(bars: Bar[]): number {
  const fullText = bars
    .map((b) => b.text)
    .join(" ")
    .toLowerCase();
  let score = 50; // Base score

  // Penalize common cliches
  const cliches = [
    "know what i mean",
    "feel me",
    "you know",
    "check it",
    "listen up",
  ];
  cliches.forEach((cliche) => {
    if (fullText.includes(cliche)) score -= 10;
  });

  // Reward creative language patterns
  const words = fullText.split(/\s+/);
  const avgWordLength =
    words.reduce((sum, word) => sum + word.length, 0) / words.length;

  if (avgWordLength > 5) score += 20; // Longer words = more complex
  if (avgWordLength > 6) score += 10;

  // Check for varied sentence structure
  const sentences = bars.map((b) => b.text);
  const lengthVariety = new Set(sentences.map((s) => s.split(/\s+/).length))
    .size;
  score += lengthVariety * 5;

  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate automated score for a verse
 */
export function calculateScore(
  bars: Bar[],
  opponentName?: string,
): AutomatedScore {
  if (bars.length !== 8) {
    throw new Error("Verse must contain exactly 8 bars");
  }

  const rhymeAnalysis = analyzeRhymes(bars);
  const flowAnalysis = analyzeFlow(bars);
  const wordplayScore = analyzeWordplay(bars);
  const relevanceScore = analyzeRelevance(bars, opponentName);
  const originalityScore = analyzeOriginality(bars);

  // Calculate weighted scores
  const rhymeSchemeScore = Math.min(
    30,
    rhymeAnalysis.endRhymes * 3 +
      rhymeAnalysis.internalRhymes * 1.5 +
      rhymeAnalysis.multiSyllabicRhymes * 2,
  );
  const wordplayFinalScore = (wordplayScore / 100) * 25;
  const flowScore =
    ((flowAnalysis.syllableConsistency + flowAnalysis.rhythmScore) / 200) * 20;
  const relevanceFinalScore = (relevanceScore / 100) * 15;
  const originalityFinalScore = (originalityScore / 100) * 10;

  const total =
    rhymeSchemeScore +
    wordplayFinalScore +
    flowScore +
    relevanceFinalScore +
    originalityFinalScore;

  return {
    rhymeScheme: Math.round(rhymeSchemeScore * 10) / 10,
    wordplay: Math.round(wordplayFinalScore * 10) / 10,
    flow: Math.round(flowScore * 10) / 10,
    relevance: Math.round(relevanceFinalScore * 10) / 10,
    originality: Math.round(originalityFinalScore * 10) / 10,
    total: Math.round(total * 10) / 10,
    breakdown: {
      rhymeScheme: `${rhymeAnalysis.endRhymes} end rhymes, ${rhymeAnalysis.internalRhymes} internal`,
      wordplay: `Metaphors, comparisons, and vocabulary richness`,
      flow: `Syllable consistency: ${Math.round(flowAnalysis.syllableConsistency)}%`,
      relevance: `Battle context and direct address`,
      originality: `Creative language and unique phrasing`,
    },
  };
}
