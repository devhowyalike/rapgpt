# Battle Components Refactor - Migration Guide

## Overview

This guide helps developers understand the changes and how to work with the new shared components.

## What Changed?

### New Components Created

1. **`BattleHeader`** - Unified header wrapper
2. **`BattleSplitView`** - Shared split-screen layout
3. **`PersonaSection`** - Persona card + verse wrapper
4. **`BattleBottomControls`** - Fixed bottom bar wrapper
5. **`useRoundData`** - Data fetching hook

### Files Modified

- `battle-stage.tsx` - Now uses shared components
- `battle-replay.tsx` - Now uses shared components

## Import Changes

### Before
```typescript
import { PersonaCard } from "./persona-card";
import { VerseDisplay } from "./verse-display";
import { getRoundVerses } from "@/lib/battle-engine";
```

### After
```typescript
// Shared components
import { BattleHeader, BattleSplitView, BattleBottomControls } from "./battle";
// Or individually:
import { BattleHeader } from "./battle/battle-header";
import { BattleSplitView } from "./battle/battle-split-view";

// Data hook
import { useRoundData } from "@/lib/hooks/use-round-data";
```

## Usage Patterns

### Pattern 1: Using BattleHeader

**Before:**
```tsx
<div className="sticky left-0 right-0 z-20 px-4 py-2 md:px-6 md:py-4 border-b border-gray-800 bg-stage-darker/95 backdrop-blur-sm top-0">
  <div className="max-w-7xl mx-auto">
    {/* Your header content */}
  </div>
</div>
```

**After:**
```tsx
<BattleHeader sticky={true} variant="blur">
  {/* Your header content */}
</BattleHeader>
```

### Pattern 2: Using BattleSplitView

**Before (85+ lines):**
```tsx
<div className="flex-1">
  <div className="relative max-w-7xl mx-auto h-full">
    <div className="hidden md:block pointer-events-none absolute inset-y-0 left-1/2 w-px bg-gray-800" />
    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 divide-gray-800 h-full">
      <div className="flex flex-col md:min-h-0">
        <div className="p-3 md:p-4 border-b border-gray-800">
          <PersonaCard persona={battle.personas.left} ... />
        </div>
        <div className="flex-1 stage-spotlight">
          <VerseDisplay verse={leftVerse} ... />
        </div>
      </div>
      {/* Right side - similar structure */}
    </div>
  </div>
</div>
```

**After (10 lines):**
```tsx
<BattleSplitView
  battle={battle}
  leftVerse={verses.left}
  rightVerse={verses.right}
  roundScore={score}
  showRoundWinner={true}
  mobileActiveSide={activeSide}
  streamingPersonaId={streamingId}
  streamingText={text}
/>
```

### Pattern 3: Using useRoundData

**Before:**
```tsx
const verses = getRoundVerses(battle, selectedRound);
const score = battle.scores.find(s => s.round === selectedRound);
const bothComplete = verses.left && verses.right;
```

**After:**
```tsx
const { verses, score, hasBothVerses } = useRoundData(battle, selectedRound);
```

## Common Scenarios

### Scenario 1: Building a New Battle View

If you're creating a new battle view component:

```tsx
import { BattleHeader, BattleSplitView } from "@/components/battle";
import { useRoundData } from "@/lib/hooks/use-round-data";

export function MyBattleView({ battle }: { battle: Battle }) {
  const [selectedRound, setSelectedRound] = useState(1);
  const { verses, score } = useRoundData(battle, selectedRound);

  return (
    <div className="flex flex-col h-full">
      <BattleHeader>
        {/* Your custom header */}
      </BattleHeader>

      <BattleSplitView
        battle={battle}
        leftVerse={verses.left}
        rightVerse={verses.right}
        roundScore={score}
      />
    </div>
  );
}
```

### Scenario 2: Customizing Card Padding

```tsx
// Default padding (stage view)
<BattleSplitView cardPadding="p-3 md:p-4" {...props} />

// Larger padding (replay view)
<BattleSplitView cardPadding="p-6" {...props} />
```

### Scenario 3: Controlling Mobile Visibility

```tsx
// Show only left side on mobile
<BattleSplitView mobileActiveSide="left" {...props} />

// Show only right side on mobile
<BattleSplitView mobileActiveSide="right" {...props} />

// Show both sides (default)
<BattleSplitView mobileActiveSide={null} {...props} />
```

### Scenario 4: Live Streaming Support

```tsx
<BattleSplitView
  battle={battle}
  leftVerse={verses.left}
  rightVerse={verses.right}
  streamingPersonaId={currentStreamingId} // Which persona is streaming
  streamingText={partialText}             // Partial verse text
  {...otherProps}
/>
```

## Props Reference

### BattleHeader Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sticky` | `boolean` | `true` | Whether header should stick to top |
| `variant` | `"blur"` \| `"solid"` \| `"transparent"` | `"blur"` | Background style |
| `className` | `string` | `""` | Additional CSS classes |
| `children` | `ReactNode` | required | Header content |

### BattleSplitView Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `battle` | `Battle` | required | Full battle data |
| `leftVerse` | `Verse \| null` | required | Left persona verse |
| `rightVerse` | `Verse \| null` | required | Right persona verse |
| `roundScore` | `RoundScore` | `undefined` | Round scoring data |
| `showRoundWinner` | `boolean` | `false` | Show winner badge |
| `mobileActiveSide` | `PersonaPosition \| null` | `null` | Mobile visibility control |
| `streamingPersonaId` | `string \| null` | `undefined` | Streaming persona ID |
| `streamingText` | `string \| null` | `undefined` | Streaming text content |
| `mobileTopOffset` | `number` | `0` | Top margin offset |
| `cardPadding` | `string` | `"p-3 md:p-4"` | Card container padding |
| `className` | `string` | `""` | Container classes |
| `contentClassName` | `string` | `""` | Content wrapper classes |
| `style` | `CSSProperties` | `undefined` | Inline styles |

### useRoundData Return Value

| Property | Type | Description |
|----------|------|-------------|
| `verses` | `{ left: Verse \| null, right: Verse \| null }` | Round verses |
| `score` | `RoundScore \| undefined` | Round score |
| `isComplete` | `boolean` | Both verses + score exist |
| `hasVerses` | `boolean` | At least one verse exists |
| `hasBothVerses` | `boolean` | Both verses exist |

## Debugging Tips

### Linter Errors

If you see errors about missing components:

```bash
# Make sure imports are correct
import { BattleSplitView } from "./battle/battle-split-view";
# or
import { BattleSplitView } from "./battle";
```

### TypeScript Errors

If you see prop type errors:

```tsx
// Ensure all required props are provided
<BattleSplitView
  battle={battle}         // ✅ Required
  leftVerse={verses.left} // ✅ Required
  rightVerse={verses.right} // ✅ Required
  // All other props are optional
/>
```

### Layout Issues

If mobile visibility isn't working:

```tsx
// Check mobileActiveSide prop
<BattleSplitView
  mobileActiveSide={selectedSide} // Should be "left", "right", or null
  {...props}
/>
```

## Breaking Changes

**None!** This refactor is 100% backwards compatible.

- Old components still work
- No API changes to battle-stage or battle-replay
- All existing functionality preserved

## Performance Notes

### useRoundData Hook

The hook uses `useMemo` to prevent unnecessary recalculations:

```typescript
// Memoized - only recomputes when battle or round changes
const { verses, score } = useRoundData(battle, selectedRound);
```

### Component Re-renders

The shared components follow React best practices:
- Props are passed down explicitly
- No unnecessary context subscriptions
- Minimal component depth

## Testing

### Unit Testing Shared Components

```typescript
import { render } from "@testing-library/react";
import { BattleSplitView } from "@/components/battle/battle-split-view";

test("renders both personas", () => {
  const { getByText } = render(
    <BattleSplitView
      battle={mockBattle}
      leftVerse={mockLeftVerse}
      rightVerse={mockRightVerse}
    />
  );
  
  expect(getByText("Left Persona")).toBeInTheDocument();
  expect(getByText("Right Persona")).toBeInTheDocument();
});
```

### Integration Testing

```typescript
import { render } from "@testing-library/react";
import { BattleReplay } from "@/components/battle-replay";

test("battle replay uses shared components", () => {
  const { container } = render(<BattleReplay battle={mockBattle} />);
  
  // BattleSplitView is used
  expect(container.querySelector(".grid.md\\:grid-cols-2")).toBeInTheDocument();
});
```

## FAQ

### Q: Can I still use PersonaCard and VerseDisplay directly?

**A:** Yes! The leaf components remain unchanged. BattleSplitView uses them internally, but you can still use them directly if needed.

### Q: Do I need to update existing code?

**A:** No. The refactor only affects battle-stage and battle-replay, which now use shared components internally. External usage remains the same.

### Q: Can I customize the split view layout?

**A:** Yes, through props:
- `cardPadding` - Adjust padding
- `className` - Add container classes
- `contentClassName` - Add content wrapper classes
- `style` - Inline styles

### Q: Is this more performant?

**A:** Yes, slightly:
- Reduced bundle duplication
- Memoized round data hook
- Cleaner component tree

### Q: Can I create new battle views easily?

**A:** Absolutely! That's the main benefit. Import the shared components and compose them as needed.

## Support

For questions or issues:

1. Check the documentation files:
   - `BATTLE_COMPONENTS_REFACTOR.md` - Overview
   - `REFACTOR_COMPARISON.md` - Before/After
   - `COMPONENT_ARCHITECTURE.md` - Architecture details

2. Review the component source code:
   - `src/components/battle/` - Shared components
   - `src/lib/hooks/use-round-data.ts` - Data hook

3. Look at the existing usage:
   - `src/components/battle-stage.tsx` - Live battle example
   - `src/components/battle-replay.tsx` - Replay example

---

**Version:** 1.0.0  
**Status:** Production Ready  
**Last Updated:** November 2025


