# Creator Privacy Model

## Overview

This document describes how user privacy settings interact with battle sharing and creator attribution.

## Privacy Concepts

There are two separate concepts for battles:

| Concept | What it controls |
|---------|-----------------|
| **Profile Privacy** (`isProfilePublic`) | Whether the user appears on the community page and whether their profile page is linkable |
| **Battle Publishing** (`isPublic`) | Whether a battle appears on the community page and user's public profile |

## Sharing vs Publishing

**Sharing** and **Publishing** are distinct actions:

- **Sharing** = Copying the battle URL. Anyone with the link can view the battle.
- **Publishing** = Making the battle discoverable on the community page. Requires a public profile.

## Creator Attribution Behavior

When viewing a battle, the creator attribution shows:

| Profile Privacy | What's Shown | Linkable? |
|-----------------|--------------|-----------|
| **Public** | Real display name + avatar | ✅ Links to `/profile/{userId}` |
| **Private** | Real display name only | ❌ No link (just plain text) |
| **No creator** (legacy) | "Anonymous" | ❌ N/A |

### Why Show Names for Private Profiles?

When a user shares a battle URL, they're implicitly okay with being credited for that specific battle. Profile privacy is about **discoverability**, not **identity**:

- **Private profile** = "Don't list me on the community page or make my profile browsable"
- **Shared battle** = "I'm okay with people seeing this battle I created"

This is similar to how Twitter/X handles private accounts - if someone retweets your content, your name is visible on that tweet, but people can't browse your full timeline.

## Implementation Details

### Battle Type

```typescript
// src/lib/shared/battle-types.ts
creator?: {
  userId: string;
  displayName: string;
  imageUrl?: string | null;
  isProfilePublic?: boolean; // Controls whether to link to profile
} | null;
```

### Storage Layer

The `buildCreatorInfo()` helper in `battle-storage.ts`:
- Always decrypts and returns the real `displayName`
- Only includes `imageUrl` if profile is public
- Passes `isProfilePublic` flag to UI layer

### UI Layer

`CreatorAttribution` component:
- Renders as a `<Link>` if `isProfilePublic` is true
- Renders as a `<span>` if profile is private (no link)

## Restrictions

Publishing battles still requires a public profile:

```typescript
// src/app/api/battle/[id]/toggle-public/route.ts
if (!battle.isPublic && !user.isProfilePublic) {
  return { error: "Cannot publish battles with a private profile..." };
}
```

This ensures private profile users can:
- ✅ Create battles
- ✅ Share battle URLs directly
- ✅ Be credited by name on shared battles
- ❌ Have battles listed on community page (requires publishing + public profile)

## Future Considerations

- Consider adding a "Share anonymously" option that strips creator info entirely
- Consider allowing private profiles to publish battles with reduced attribution (e.g., "A private user")

