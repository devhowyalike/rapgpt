# Stage Dynamic Implementation Summary

## Overview
Implemented dynamic stage selection for battles. When a user selects a stage in the stage select screen, that stage will now appear dynamically in the battle arena instead of being hardcoded.

## Changes Made

### 1. Type System Updates
- **`src/lib/shared/battle-types.ts`**: Added `stageId: string` field to the `Battle` interface

### 2. Validation Schema Updates
- **`src/lib/validations/battle.ts`**: 
  - Added `stageId` to `battleSchema`
  - Added `stageId` to `createBattleRequestSchema`

### 3. Database Schema Updates
- **`src/lib/db/schema.ts`**: Added `stageId` column to battles table with default value 'canada'
- **`drizzle/0005_add_stage_id.sql`**: Created migration to add the `stage_id` column

### 4. API Updates
- **`src/app/api/battle/create/route.ts`**: 
  - Now accepts `stageId` from the request
  - Includes `stageId` when creating new Battle objects

### 5. Storage Layer Updates
- **`src/lib/battle-storage.ts`**: 
  - Added `stageId` to all Battle transformations in:
    - `getBattleById()`
    - `saveBattle()`
    - `getAllBattles()`
    - `getFeaturedBattles()`
    - `getLiveBattles()`

### 6. UI Component Updates
- **`src/components/battle-stage.tsx`**: 
  - Imports `getStage()` function
  - Dynamically looks up stage from `battle.stageId`
  - Displays stage name, flag, and country dynamically in battle header

### 7. Script Updates
- **`scripts/create-battle.ts`**: 
  - Added stage selection prompt
  - Includes `stageId` when creating battles via script

## Migration Instructions

1. **Run the database migration**:
   ```bash
   # Option 1: Using drizzle-kit (requires DB connection)
   pnpm drizzle-kit push
   
   # Option 2: Manually apply the migration
   psql -d your_database -f drizzle/0005_add_stage_id.sql
   ```

2. **Existing battles**: All existing battles will default to 'canada' stage (Futur's Den) due to the default value in the schema.

## Data Flow

1. User selects stage in `StageSelect` component
2. Selected stage ID is sent to `/api/battle/create` endpoint
3. API creates Battle with `stageId` field
4. Battle is saved to database with `stage_id` column
5. When battle is loaded, `stageId` is included in Battle object
6. `BattleStage` component looks up stage details using `getStage(battle.stageId)`
7. Stage information (name, flag, country) is displayed dynamically in the battle header

## Available Stages

Currently configured stages:
- `canada`: Futur's Den 🇨🇦 (Canada)
- `bronx`: 1520 Sedgwick Avenue 🇺🇸 (Bronx, NY)

To add more stages, update `src/lib/shared/stages.ts` and add corresponding images to `public/stages/`.

## Testing Checklist

- [x] Battle type includes stageId field
- [x] Database schema includes stage_id column
- [x] API accepts and saves stageId
- [x] Battle creation flow includes stage selection
- [x] Battle display shows selected stage dynamically
- [x] Scripts updated to include stageId
- [x] All storage functions handle stageId
- [ ] Database migration applied (requires DB access)
- [ ] Create new battle and verify stage appears correctly
- [ ] Verify existing battles show default stage

## Notes

- The stage background image is not directly displayed in the battle view - only the stage metadata (name, flag, country) is shown in the header
- The default stage for all existing and new battles (if not specified) is 'canada' (Futur's Den)
- Stage images are stored in `/public/stages/` directory

