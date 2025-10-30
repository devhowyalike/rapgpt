# Dialog Component Refactoring

## Summary

Extracted repeated dialog patterns throughout the application into reusable UI components. This improves code maintainability, consistency, and reduces duplication.

## New Components Created

### 1. `ConfirmationDialog` (`src/components/ui/confirmation-dialog.tsx`)

A reusable confirmation dialog component based on Radix UI Dialog.

**Features:**

- Configurable title, description, and button labels
- Support for 3 variants: `danger` (red), `warning` (orange), `info` (blue)
- Optional custom icon (defaults to AlertTriangle)
- Loading state support
- Error message display
- Consistent styling and animations

**Props:**

```typescript
interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  variant?: "danger" | "warning" | "info";
  icon?: LucideIcon;
  errorMessage?: string;
}
```

### 2. `MobileDrawer` (`src/components/ui/mobile-drawer.tsx`)

A reusable mobile bottom drawer component based on Radix UI Dialog.

**Features:**

- Slides up from bottom on mobile devices
- Consistent header with close button
- Configurable title
- Flexible content area (children)
- Consistent styling and animations

**Props:**

```typescript
interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}
```

## Files Updated

### Components Using ConfirmationDialog

1. **`src/components/admin/delete-battle-button.tsx`**

   - Delete battle confirmation

2. **`src/components/my-battle-card.tsx`**

   - Delete battle confirmation

3. **`src/components/profile-privacy-toggle.tsx`**

   - Profile privacy change confirmation
   - Uses `warning` variant for making private, `info` variant for making public

4. **`src/components/profile-header-menu.tsx`**

   - Profile privacy change confirmation (in dropdown menu)
   - Uses `warning` variant for making private, `info` variant for making public

5. **`src/components/battle-controller.tsx`**

   - Pause battle confirmation
   - Uses `warning` variant

6. **`src/components/admin/battles-table.tsx`**
   - Single battle delete confirmation
   - Bulk battle delete confirmation

### Components Using MobileDrawer

1. **`src/components/battle-controller.tsx`**

   - Comments/Voting mobile drawer (2 instances)

2. **`src/components/live-battle-viewer.tsx`**
   - Comments/Voting mobile drawer

## Benefits

### Code Reduction

- Removed ~250+ lines of duplicated dialog markup
- Centralized dialog styling in one place
- Reduced maintenance burden

### Consistency

- All dialogs now have consistent:
  - Visual styling
  - Animation behavior
  - Icon placement
  - Button layouts
  - Error handling

### Maintainability

- Single source of truth for dialog behavior
- Easy to update all dialogs by modifying one component
- Type-safe props with TypeScript

### Developer Experience

- Simple, intuitive API
- No need to remember complex Radix UI Dialog structure
- Autocomplete support for variants and props

## Usage Examples

### Basic Confirmation Dialog

```typescript
<ConfirmationDialog
  open={showDialog}
  onOpenChange={setShowDialog}
  title="Delete Item?"
  description="Are you sure you want to delete this item?"
  confirmLabel="Delete"
  onConfirm={handleDelete}
  isLoading={isDeleting}
  variant="danger"
/>
```

### Custom Icon and Error

```typescript
<ConfirmationDialog
  open={showDialog}
  onOpenChange={setShowDialog}
  title="Make Changes?"
  description="This action will affect multiple items."
  confirmLabel="Continue"
  onConfirm={handleAction}
  variant="warning"
  icon={Settings}
  errorMessage={error}
/>
```

### Mobile Drawer

```typescript
<MobileDrawer open={showDrawer} onOpenChange={setShowDrawer} title="Comments">
  <div className="p-4">{/* Your content here */}</div>
</MobileDrawer>
```

## Testing Checklist

- [x] TypeScript compilation passes
- [ ] No runtime errors
- [ ] All dialogs render correctly
- [ ] All dialogs function as expected (open/close/confirm)
- [ ] Mobile drawers work on mobile devices
- [ ] Error messages display properly
- [ ] Loading states work correctly
- [ ] All variants render with correct colors

## Future Improvements

1. Add animation customization options
2. Add size variants (small, medium, large)
3. Add support for custom footer actions
4. Add accessibility tests
5. Add Storybook stories for documentation
