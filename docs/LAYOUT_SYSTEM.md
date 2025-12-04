# Layout System - CSS Variables for Scalable Headers

## Overview

This project uses a centralized CSS variable system to manage layout dimensions, particularly for fixed and sticky headers. This approach prevents content from being hidden behind headers and makes it easy to adjust spacing across the entire application.

## The Problem We Solved

Previously, the app had:

- Hardcoded header heights scattered across multiple files (`52px`, `3.5rem`)
- Content getting hidden behind sticky/fixed headers
- Difficult maintenance when header sizes needed to change
- Inconsistent spacing calculations

## The Solution

We implemented CSS variables in `src/app/globals.css` that define all header heights in one place:

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

## Usage

### 1. Header Spacers

When using the `SiteHeader` component, add a spacer div immediately after:

```tsx
<SiteHeader />
<div style={{ height: "var(--header-height)" }} />
```

### 2. Viewport Height Calculations

Use CSS variables in `calc()` functions for viewport-relative heights:

```tsx
{
  /* Mobile and Desktop responsive */
}
<div className="h-[calc(100vh-var(--header-height))] md:h-[calc(100vh-var(--header-height-md))]">
  {/* content */}
</div>;
```

### 3. Scroll Margin for Sticky Headers

When content can scroll behind sticky headers, use `scrollMarginTop`:

```tsx
<div
  className="persona-card"
  style={{ scrollMarginTop: "calc(var(--battle-stage-header-height) + 8px)" }}
>
  {/* This content won't be hidden when scrolled into view */}
</div>
```

### 4. Multiple Headers (Live Battle View)

For pages with multiple fixed headers (e.g., live battles with banner):

```tsx
<SiteHeader />
<div style={{ height: "var(--header-height)" }} />

<div style={{ height: 'var(--live-banner-height)' }}>
  {/* Live indicator banner */}
</div>

{/* Main content with combined header heights */}
<div className="h-[calc(100vh-var(--header-height-md)-var(--live-banner-height))]">
  {/* content */}
</div>
```

## Updated Components

The following components now use CSS variables:

- ✅ `src/components/site-header.tsx` - Main navigation header
- ✅ `src/components/battle-controller.tsx` - Battle control layout
- ✅ `src/components/live-battle-viewer.tsx` - Live battle view with banner
- ✅ `src/components/battle-stage.tsx` - Sticky battle header
- ✅ `src/components/battle-replay.tsx` - Replay view with persona cards
- ✅ `src/components/character-select.tsx` - Character selection page
- ✅ `src/components/admin/admin-battle-control.tsx` - Admin control panel
- ✅ `src/app/page.tsx` - Home page
- ✅ `src/app/archive/page.tsx` - Archive page

## CSS Variables Reference

| Variable                          | Value           | Use Case                           |
| --------------------------------- | --------------- | ---------------------------------- |
| `--header-height`                 | `52px`          | Mobile site header height          |
| `--header-height-md`              | `3.5rem` (56px) | Desktop site header height         |
| `--live-banner-height`            | `60px`          | Live battle indicator banner       |
| `--battle-stage-header-height`    | `120px`         | Mobile battle stage sticky header  |
| `--battle-stage-header-height-md` | `140px`         | Desktop battle stage sticky header |

## Adding New Layout Variables

When you need to add a new fixed/sticky element:

1. **Add the variable to `globals.css`:**

   ```css
   :root {
     --new-element-height: 80px;
   }
   ```

2. **Apply it to your component:**

   ```tsx
   <div style={{ height: "var(--new-element-height)" }}>
     {/* Fixed/sticky content */}
   </div>
   ```

3. **Update dependent layouts:**
   ```tsx
   <div className="h-[calc(100vh-var(--header-height)-var(--new-element-height))]">
     {/* This content now accounts for both headers */}
   </div>
   ```

## Benefits

### ✨ Single Source of Truth

All header dimensions defined in one place (`globals.css`)

### 🎯 Consistent Spacing

No more content hidden behind headers

### 🔧 Easy Maintenance

Change header size once, updates everywhere automatically

### 📱 Responsive by Default

Built-in support for mobile vs desktop breakpoints

### 🚀 Scalable

Easy to add new fixed/sticky elements without breaking existing layouts

## Best Practices

1. **Always use CSS variables** for any fixed or sticky element heights
2. **Don't hardcode pixel values** for layout calculations
3. **Use `scrollMarginTop`** when content can be hidden by sticky headers
4. **Test on mobile** to ensure content isn't hidden (common issue on small screens)
5. **Document new variables** when adding them to the system

## Troubleshooting

### Content still hidden behind header?

Check:

1. Is the spacer div present after `<SiteHeader />`?
2. Are you using the CSS variable or a hardcoded value?
3. Does the element need `scrollMarginTop`?
4. Are multiple headers stacked? Add all heights together.

### Header height changed but layout didn't update?

1. Make sure you're using the CSS variable, not a hardcoded value
2. Clear your browser cache
3. Restart the dev server

### Mobile layout broken?

1. Check if you're using responsive variants (`--header-height` vs `--header-height-md`)
2. Test with mobile breakpoint (`md:` prefix)
3. Verify `scrollMarginTop` calculations for mobile

## Migration Checklist

When updating existing components:

- [ ] Replace hardcoded `52px` with `var(--header-height)`
- [ ] Replace hardcoded `3.5rem` with `var(--header-height-md)`
- [ ] Update `calc()` expressions to use variables
- [ ] Add `scrollMarginTop` to elements that can scroll behind sticky headers
- [ ] Test on mobile and desktop
- [ ] Verify nothing is hidden behind headers

## Examples

### Basic Page Layout

```tsx
<>
  <SiteHeader />
  <div style={{ height: "var(--header-height)" }} />
  <main className="min-h-[calc(100vh-var(--header-height-md))]">
    {/* Page content */}
  </main>
</>
```

### Battle Stage with Sticky Header

```tsx
<div className="overflow-y-auto">
  <div
    className="sticky top-0 z-20"
    style={{ minHeight: "var(--battle-stage-header-height)" }}
  >
    {/* Battle header with round tracker */}
  </div>

  <div
    style={{ scrollMarginTop: "calc(var(--battle-stage-header-height) + 8px)" }}
  >
    {/* Persona cards - won't be hidden */}
  </div>
</div>
```

### Multiple Stacked Headers

```tsx
<>
  <SiteHeader />
  <div style={{ height: "var(--header-height)" }} />

  <div style={{ height: "var(--live-banner-height)" }}>
    {/* Secondary header */}
  </div>

  <main className="h-[calc(100vh-var(--header-height-md)-var(--live-banner-height))]">
    {/* Content accounts for both headers */}
  </main>
</>
```

---

**Last Updated:** 2025-11-02  
**Maintainer:** Development Team
