# Battle Position Utilities - Quick Reference

## Import

```typescript
import {
  getPersonaPosition,
  getPersonaByPosition,
  getWinnerPersonaId,
  getRoundScoreForPersona,
  isPersonaRoundWinner,
  getPositionInfo,
  getAllPositionInfo,
  calculateTotalScores,
} from "@/lib/battle-position-utils";
```

## Common Use Cases

### 1. Convert Persona ID to Position

```typescript
// When you have a persona ID and need to know their position
const position = getPersonaPosition(battle, personaId);
// Returns: 'player1' | 'player2' | null
```

### 2. Get Persona from Position

```typescript
// When you know the position and need the persona object
const persona = getPersonaByPosition(battle, "player1");
// Returns: Persona object
```

### 3. Get Round Winner's Persona ID

```typescript
// Convert round winner position to persona ID for display
const winnerId = getWinnerPersonaId(battle, roundScore);
// Returns: string | null
```

### 4. Check if Persona Won a Round

```typescript
// Useful for showing crowns/trophies
if (isPersonaRoundWinner(battle, roundScore, personaId)) {
  // Show winner indicator
}
```

### 5. Get Score for a Persona

```typescript
// Access score by persona ID (handles position lookup)
const score = getRoundScoreForPersona(battle, roundScore, personaId);
// Returns: { personaId, automated, userVotes, totalScore } | null
```

### 6. Calculate Total Scores

```typescript
// Works with either Battle or RoundScore[]
const totals = calculateTotalScores(battle);
// Or
const totals = calculateTotalScores(battle.scores);
// Returns: { player1: number, player2: number }
```

### 7. Get Position Info Bundle

```typescript
// Get all info for a position at once
const info = getPositionInfo(battle, "player1");
// Returns: { position, persona, personaId }

// Or get both at once
const { player1, player2 } = getAllPositionInfo(battle);
```

## When to Use What

| Need to...                      | Use this function                             |
| ------------------------------- | --------------------------------------------- |
| Convert persona ID → position   | `getPersonaPosition()`                        |
| Convert position → persona      | `getPersonaByPosition()`                      |
| Show round winner name          | `getWinnerPersonaId()`                        |
| Display crown for winner        | `isPersonaRoundWinner()`                      |
| Get score by persona ID         | `getRoundScoreForPersona()`                   |
| Calculate battle totals         | `calculateTotalScores()`                      |
| Get comprehensive position data | `getPositionInfo()` or `getAllPositionInfo()` |

## Benefits

✅ **No duplicate code** - Write conversion logic once  
✅ **Type-safe** - TypeScript ensures correct usage  
✅ **Same persona battles** - Works correctly when both positions use the same persona  
✅ **Flexible** - Functions handle edge cases and null checks  
✅ **Testable** - Centralized logic is easier to test

## Examples from Codebase

### Voting (API Route)

```typescript
const position = getPersonaPosition(battle, personaId);
if (!position) {
  return errorResponse("Invalid persona");
}
const updatedScore = updateScoreWithVotes(roundScore, position, votes);
```

### Score Display (Component)

```typescript
const totals = calculateTotalScores(battle.scores);
return (
  <div>
    Player 1: {totals.player1}
    Player 2: {totals.player2}
  </div>
);
```

### Winner Display (Admin)

```typescript
const winnerId = getWinnerPersonaId(battle, roundScore);
if (winnerId) {
  const winner = getPersonaById(winnerId);
  return <WinnerBadge name={winner.name} />;
}
```
