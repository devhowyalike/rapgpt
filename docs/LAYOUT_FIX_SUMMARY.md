# Layout Fix Summary - Header Overlap Issue

## Problem Solved

The win screen's first persona card was hidden behind the sticky header, and content throughout the app was being obscured by fixed/sticky headers due to hardcoded spacing values scattered across multiple files.

## Solution Implemented

Created a **centralized CSS variable system** for all layout heights, making the app scalable and preventing content from being hidden behind headers.

## Changes Made

### 1. CSS Variables Added (`src/app/globals.css`)

```css
:root {
  /* Layout heights - centralized for scalability */
  --header-height: 52px;
  --header-height-md: 3.5rem; /* 56px */
  --live-banner-height: 60px;
  --battle-stage-header-height: 120px; /* mobile */
  --battle-stage-header-height-md: 140px; /* tablet+ */
}
```

### 2. Components Updated

**Fixed the core issue:**
- `battle-stage.tsx` - Added `scrollMarginTop` to persona cards so they're not hidden
- `battle-replay.tsx` - Added `scrollMarginTop` to persona cards in replay view

**Migrated to CSS variables:**
- `site-header.tsx` - Uses `--header-height`
- `battle-controller.tsx` - Uses CSS variables for spacing
- `live-battle-viewer.tsx` - Uses CSS variables for combined headers
- `character-select.tsx` - Migrated from hardcoded heights
- `admin-battle-control.tsx` - Migrated from hardcoded heights
- `page.tsx` (home) - Migrated from hardcoded heights
- `archive/page.tsx` - Migrated from hardcoded heights

### 3. Key Techniques Used

**`scrollMarginTop`** - Prevents content from being hidden when scrolled into view:
```tsx
<div style={{ scrollMarginTop: 'calc(var(--battle-stage-header-height) + 8px)' }}>
  {/* Persona card won't be hidden behind sticky header */}
</div>
```

**Responsive height calculations:**
```tsx
<div className="h-[calc(100vh-var(--header-height))] md:h-[calc(100vh-var(--header-height-md))]">
  {/* Automatically adjusts for mobile vs desktop header sizes */}
</div>
```

## Benefits

✅ **Single source of truth** - All header heights defined in one place  
✅ **No more hidden content** - Proper scroll margins prevent overlap  
✅ **Easy to maintain** - Change header size once, updates everywhere  
✅ **Responsive by default** - Mobile and desktop variants built-in  
✅ **Scalable** - Easy to add new fixed elements without breaking layouts  

## Testing

- ✅ TypeScript compilation passes
- ✅ No linter errors
- ✅ All hardcoded values replaced with CSS variables
- ✅ Persona cards now visible on win screen
- ✅ Content properly spaced across all pages

## Documentation

Created comprehensive documentation in `LAYOUT_SYSTEM.md` with:
- Complete usage guide
- Best practices
- Examples for common scenarios
- Migration checklist
- Troubleshooting tips

## Next Steps

The layout system is now fully optimized and scalable. Any future fixed or sticky headers should follow the patterns documented in `LAYOUT_SYSTEM.md`.

If you need to adjust header heights in the future, simply update the CSS variable in `globals.css` and all layouts will automatically adjust.

