# Battle Stage Consolidation

This document describes the unified `BattleStage` component architecture, which consolidates the previously separate `battle-stage.tsx` and `battle-replay.tsx` components into a single, mode-driven component.

## Overview

The battle view system was refactored to eliminate code duplication between active battle viewing and replay viewing. Both modes share the same core structure:

- A header section
- A split-screen stage with two personas/verses
- Optional bottom content (scores, controls)

The key difference is the header content and interactive features based on the battle state.

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                     BattleController                            │
│                    (page orchestrator)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │   Active Battle (status: "paused")                       │   │
│  │   └── BattleStage mode="active"                          │   │
│  │       ├── BattleHeader (Stage info, RoundTracker, Live)  │   │
│  │       ├── BattleSplitView (streaming support)            │   │
│  │       └── BattleScoreSection (when scores revealed)      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │   Completed Battle (status: "completed")                 │   │
│  │   └── CompletedBattleView (page wrapper)                 │   │
│  │       ├── BattleStage mode="replay"                      │   │
│  │       │   ├── BattleHeader (Winner, Creator, RoundNav)   │   │
│  │       │   └── BattleSplitView (static verses)            │   │
│  │       ├── BattleReplayControlBar                         │   │
│  │       └── Drawers (Scores, Song, Options)                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Usage

### Active Mode (Default)

For live/in-progress battles with full interactive features:

```tsx
import { BattleStage } from "@/components/battle-stage";

<BattleStage
  battle={battle}
  mode="active"
  streamingPersonaId={streamingPersonaId}
  streamingText={streamingVerse}
  streamingPosition={streamingPosition}
  isReadingPhase={isReadingPhase}
  isVotingPhase={isVotingPhase}
  votingCompletedRound={votingCompletedRound}
  scoreDelaySeconds={5}
  isLive={isLive}
  liveConnectionStatus={wsStatus}
  liveViewerCount={viewerCount}
  canManageLive={canManageBattle}
  onDisconnect={handleEndLive}
/>
```

### Replay Mode

For viewing completed battles:

```tsx
import { BattleStage } from "@/components/battle-stage";

<BattleStage
  battle={battle}
  mode="replay"
  mobileBottomPadding="80px" // Optional: for floating controls
/>
```

## Props Reference

### Base Props (Both Modes)

| Prop | Type | Description |
|------|------|-------------|
| `battle` | `Battle` | The battle object |
| `mobileBottomPadding` | `string?` | Extra bottom padding on mobile |
| `mode` | `"active" \| "replay"` | Component mode (default: `"active"`) |

### Active Mode Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `streamingPersonaId` | `string?` | `null` | ID of persona currently generating |
| `streamingText` | `string?` | `null` | Text being streamed |
| `streamingPosition` | `PersonaPosition?` | `null` | Position of streaming persona |
| `isReadingPhase` | `boolean` | `false` | Whether in reading countdown |
| `isVotingPhase` | `boolean` | `false` | Whether voting is active |
| `votingCompletedRound` | `number?` | `null` | Last round where voting completed |
| `scoreDelaySeconds` | `number` | `5` | Delay before revealing scores |
| `isLive` | `boolean` | `false` | Whether battle is live streaming |
| `liveConnectionStatus` | `ConnectionStatus` | `"disconnected"` | WebSocket status |
| `liveViewerCount` | `number` | `0` | Number of live viewers |
| `canManageLive` | `boolean` | `false` | User can manage live mode |
| `onDisconnect` | `() => void` | - | Callback to end live |

## Feature Comparison

| Feature | `mode="active"` | `mode="replay"` |
|---------|-----------------|-----------------|
| **Header Content** | Stage name, location, flag | Winner banner, creator |
| **Round Display** | RoundTracker (visual pips) | RoundControls (prev/next) |
| **Live Status Badge** | ✅ Shows when live | ❌ Not shown |
| **Battle Bell** | ✅ Animated bell | ❌ Not shown |
| **Streaming Text** | ✅ Word-by-word reveal | ❌ Not applicable |
| **Score Delay** | Configurable (default 5s) | Instant (0s) |
| **Mobile Active Side** | Tracks current performer | Shows both sides |
| **Sticky Personas** | During voting/reading | Never |
| **Bottom Scores** | ✅ Animated reveal | ❌ Shown in drawer |
| **Victory Confetti** | ✅ On battle completion | ❌ Not shown |
| **Collapsible Header** | ❌ Fixed | ✅ Collapses on scroll |
| **Sticky Header** | ✅ Sticks at `top-(--header-height)` | ❌ Not sticky (scrolls with content) |

## Header Rendering

### Active Mode Header

- **Positioning:** `sticky` at `top-(--header-height)` (below site header)
- **Content:** Stage info, battle bell, round tracker, live status

```
┌────────────────────────────────────────────────────────────┐
│  Stage: Sedgwick Avenue    🔔     🔴 LIVE  ●●●○○           │
│  🇺🇸 USA                         12 viewers   Round 3/5    │
├────────────────────────────────────────────────────────────┤
│              🏆 WINNER: MC Persona 🏆                      │
│                    (on completion)                         │
└────────────────────────────────────────────────────────────┘
```

### Replay Mode Header

- **Positioning:** `sticky={false}` - scrolls with content (prevents extra spacing at top)
- **Content:** Winner banner, creator attribution, round navigation
- **Behavior:** Collapses on mobile scroll to compact view

```
┌────────────────────────────────────────────────────────────┐
│   🏆 WINNER: MC Persona                    ◀ Round 2 ▶     │
│   By @username                                             │
└────────────────────────────────────────────────────────────┘
```

> **Note:** The replay header uses `sticky={false}` to prevent the `top-(--header-height)` offset from creating extra white space at the top of the battle view on mobile.

## Shared Components

Both modes utilize these shared components from `@/components/battle/`:

- `BattleHeader` - Sticky/collapsible header container
- `BattleSplitView` - Two-column persona/verse layout
- `BattleScoreSection` - Score breakdown display (used differently)

## Migration Notes

### Before (Two Components)

```tsx
// Active battles
import { BattleStage } from "@/components/battle-stage";
<BattleStage battle={battle} {...activeProps} />

// Completed battles  
import { BattleReplay } from "@/components/battle-replay";
<BattleReplay battle={battle} />
```

### After (Unified Component)

```tsx
import { BattleStage } from "@/components/battle-stage";

// Active battles (mode is optional, defaults to "active")
<BattleStage battle={battle} {...activeProps} />

// Completed battles
<BattleStage battle={battle} mode="replay" />
```

## Files Changed

| File | Change |
|------|--------|
| `src/components/battle-stage.tsx` | Extended with `mode` prop and replay features |
| `src/components/battle/completed-battle-view.tsx` | Updated to use `BattleStage` |
| `src/components/battle-replay.tsx` | **Deleted** |

## Benefits

1. **DRY Code** - Single source of truth for battle view layout
2. **Consistent Styling** - Both modes share the same base styles
3. **Easier Maintenance** - Changes to layout affect both modes
4. **Type Safety** - Discriminated union ensures correct props per mode
5. **Reduced Bundle** - One component instead of two similar ones

