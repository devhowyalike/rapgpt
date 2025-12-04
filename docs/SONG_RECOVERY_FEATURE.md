# Song Generation Recovery Feature

## Problem

When a user generates a song and the request times out after 5 minutes, the song may still successfully generate on Suno's servers. However, when the user refreshes the battle page, there was no way to:

1. Resume polling to check if the song completed
2. Recover the generated song
3. Retry the generation

This resulted in a poor user experience where users couldn't access songs that had successfully generated.

## Solution

Implemented a comprehensive recovery system with three layers:

### 1. API-Level Resume Support

**File:** `src/app/api/battle/[id]/generate-song/route.ts`

- Changed validation from blocking ANY `generatedSong` to only blocking if `audioUrl` exists
- When an incomplete song (has `sunoTaskId` but no `audioUrl`) is detected, return the existing taskId
- This allows the client to resume polling without creating a new generation request

```typescript
// Before: Blocked if generatedSong exists at all
if (battle.generatedSong) {
  return NextResponse.json(
    { error: "Song already generated" },
    { status: 400 }
  );
}

// After: Only block if song is complete
if (battle.generatedSong?.audioUrl) {
  return NextResponse.json(
    { error: "Song already generated" },
    { status: 400 }
  );
}

// Resume support for incomplete songs
if (existingTaskId) {
  return NextResponse.json({
    taskId: existingTaskId,
    status: "processing",
    isResume: true,
  });
}
```

### 2. Automatic Resume Polling

**File:** `src/components/song-generator.tsx`

Enhanced the SongGenerator component with:

- **Auto-detection:** Checks on mount if there's an incomplete song
- **Auto-resume:** Automatically starts polling if incomplete song detected
- **Smart UI:** Shows different UI states for new generation vs. resuming
- **Improved error messages:** Better timeout messaging explaining the song may still be processing

```typescript
// Auto-resume on mount
useEffect(() => {
  if (hasIncompleteSong && incompleteSong?.sunoTaskId) {
    console.log(
      "[SongGenerator] Found incomplete song, auto-resuming polling..."
    );
    setIsResuming(true);
    pollSongStatus(incompleteSong.sunoTaskId)
      .then(() => onSongGenerated?.())
      .catch((err) => setError(err.message))
      .finally(() => setIsResuming(false));
  }
}, [hasIncompleteSong, incompleteSong?.sunoTaskId]);
```

**UI States:**

- **Resuming:** Shows spinner with "Checking song generation status..."
- **Incomplete (not generating):** Shows blue info box with "Check Song Status" button
- **New generation:** Shows normal beat style selection

### 3. Manual Completion Fallback (Admin Only)

**Files:**

- `src/components/song-manual-complete.tsx` (existing)
- `src/app/api/battle/[id]/manual-song-complete/route.ts` (new)

Added a manual completion option that appears after multiple timeouts **for administrators only**:

- Admin can visit Suno dashboard directly
- Find the task by ID
- Copy the audio URL when ready
- Paste it into the form to complete the song

**Security Note:** This feature is restricted to admins because it allows manually setting arbitrary URLs. Regular users will see the timeout error and can contact support or wait for the song to complete on subsequent refreshes.

### 4. Battle Replay Integration

**File:** `src/components/battle-replay.tsx`

- Updated to pass the full `battle` object to `SongGenerator`
- This allows the generator to detect incomplete songs
- No change to visibility logic (already correct)

## User Experience Flow

### Scenario 1: Song completes during initial generation

1. User clicks "Generate Track"
2. Polling completes successfully within 5 minutes
3. Song appears in player ✅

### Scenario 2: Song times out, completes later

1. User clicks "Generate Track"
2. Polling times out after 5 minutes
3. Error shown: "Song generation timed out..."
4. User refreshes page
5. **NEW:** Song generator automatically resumes polling
6. If song is ready, it completes automatically ✅

### Scenario 3: Song takes very long (>10 minutes) - Admin Flow

1. Admin clicks "Generate Track"
2. Times out after 5 minutes
3. Admin refreshes and auto-resume times out again
4. **NEW:** Manual completion form appears (admin only)
5. Admin can paste URL from Suno dashboard
6. Song completes successfully ✅

### Scenario 4: Song takes very long (>10 minutes) - Regular User

1. User clicks "Generate Track"
2. Times out after 5 minutes
3. User refreshes and auto-resume times out again
4. Error message shown: "Song generation timed out..."
5. User can refresh again later or contact support
6. Song will complete automatically when it's ready ✅

## Technical Details

### State Detection

An incomplete song is identified by:

```typescript
const hasIncompleteSong = !!(
  battle.generatedSong?.sunoTaskId && !battle.generatedSong?.audioUrl
);
```

### Polling Strategy

- Initial attempt: 60 attempts × 5 seconds = 5 minutes
- Resume attempt: Another 60 attempts × 5 seconds = 5 minutes
- Total automated: Up to 10 minutes of polling
- After that: Manual completion option

### Database State

The `generatedSong` object evolves through states:

1. **Initial (after API call):**

   ```typescript
   {
     audioUrl: '',          // Empty
     sunoTaskId: 'task123', // Populated
     beatStyle: 'boom-bap',
     title: '...',
     generatedAt: timestamp
   }
   ```

2. **Complete (after successful poll):**
   ```typescript
   {
     audioUrl: 'https://...', // Populated
     sunoTaskId: 'task123',
     beatStyle: 'boom-bap',
     title: '...',
     generatedAt: timestamp
   }
   ```

## Benefits

1. **No Lost Songs:** Users can always recover successfully generated songs
2. **Better UX:** Clear status indicators and automatic retry
3. **Failsafe:** Admin manual completion ensures no permanent failures
4. **No Wasted Credits:** Songs already started aren't regenerated
5. **Transparent:** Users understand what's happening at each stage
6. **Secure:** Manual URL input restricted to administrators only

## Testing Recommendations

1. **Happy Path:** Generate song that completes in <5 min
2. **Timeout + Resume:** Generate song, wait for timeout, refresh page
3. **Long Generation:** Test manual completion flow
4. **Failed Generation:** Ensure error states work correctly
5. **Multiple Users:** Verify permissions work correctly

## Future Improvements

Consider:

- Websocket notification when song completes (avoid polling)
- Email notification for long-running generations
- Background polling service (server-side)
- Retry with exponential backoff
- Show estimated time remaining based on Suno queue
