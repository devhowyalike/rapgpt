# Technical Requirements Document: Authentication System

**Project:** RapGPT Battle System  
**Document Version:** 1.0  
**Date:** October 23, 2025  
**Author:** Development Team

---

## 1. Executive Summary

This document outlines the technical requirements for implementing a user authentication system in RapGPT. The system will require users to authenticate before voting or commenting on battles, replacing the current anonymous system with persistent user accounts.

### 1.1 Objectives

- Implement user authentication (login/signup)
- Restrict voting and commenting to authenticated users only
- Associate votes and comments with authenticated user accounts
- Improve data integrity and prevent duplicate voting
- Enable future social features (profiles, reputation, etc.)

### 1.2 Success Criteria

- Users can create accounts and authenticate
- Anonymous users can view battles but cannot vote or comment
- All votes and comments are linked to authenticated users
- No duplicate votes per user per round
- Seamless user experience with proper session management

---

## 2. Current State Analysis

### 2.1 Existing Implementation

**Voting System:**

- Anonymous voting using generated `userId` stored in localStorage
- Basic vote tracking in database via `votes` table
- Vote counts aggregated in battle `scores` JSONB field

**Comment System:**

- Users manually enter username for each comment
- Comments stored in battle's `comments` JSONB array
- No persistent user identity

### 2.2 Pain Points

1. No reliable user identity (localStorage can be cleared)
2. Users can circumvent voting restrictions via incognito/clearing storage
3. Cannot build user profiles or track user history
4. No way to moderate or ban users
5. Username in comments is not verified

---

## 3. Technical Requirements

### 3.1 Authentication Provider

**Recommended: NextAuth.js (Auth.js v5)**

**Rationale:**

- Built for Next.js App Router
- Supports multiple providers (Google, GitHub, Email, etc.)
- Easy to integrate with existing codebase
- Handles sessions, tokens, and security
- Works seamlessly with Vercel Postgres

**Alternative: Clerk**

- Faster implementation
- Beautiful pre-built UI components
- Built-in user management dashboard
- Higher cost at scale

**Decision:** NextAuth.js for flexibility and cost-effectiveness

### 3.2 Authentication Methods

**Phase 1 (MVP):**

1. **Email/Password** - Basic registration and login
2. **Google OAuth** - Most common social login

**Phase 2 (Future):** 3. GitHub OAuth - Developer-friendly audience 4. Discord OAuth - Gaming/community focused 5. Magic Links - Passwordless email authentication

### 3.3 Protected Features

| Feature                 | Unauthenticated | Authenticated |
| ----------------------- | --------------- | ------------- |
| View Battles            | ✅ Yes          | ✅ Yes        |
| Watch Battle Generation | ✅ Yes          | ✅ Yes        |
| Create New Battles      | ✅ Yes\*        | ✅ Yes        |
| Vote on Rounds          | ❌ No           | ✅ Yes        |
| Comment on Battles      | ❌ No           | ✅ Yes        |
| View Archive            | ✅ Yes          | ✅ Yes        |

\*Note: Battle creation may be restricted to authenticated users in Phase 2

---

## 4. Database Schema Changes

### 4.1 New Tables

#### `users` Table

```typescript
export const users = pgTable("users", {
  id: text("id").primaryKey(), // NextAuth format: user_xxxxx
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"), // Profile picture URL
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});
```

#### `accounts` Table (NextAuth OAuth)

```typescript
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'oauth' | 'email' | 'credentials'
  provider: text("provider").notNull(), // 'google' | 'github' | 'credentials'
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});
```

#### `sessions` Table (NextAuth Sessions)

```typescript
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});
```

#### `verification_tokens` Table (Email Verification)

```typescript
export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(), // Email
  token: text("token").notNull().unique(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});
```

### 4.2 Modified Tables

#### `votes` Table - Add User Reference

```typescript
export const votes = pgTable("votes", {
  id: text("id").primaryKey(),
  battleId: text("battle_id")
    .notNull()
    .references(() => battles.id, { onDelete: "cascade" }),
  round: integer("round").notNull(),
  personaId: text("persona_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }), // Changed: reference users table
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// Add unique constraint: one vote per user per round
export const votesConstraint = pgIndex("unique_user_round_vote")
  .on(votes.battleId, votes.round, votes.userId)
  .unique();
```

#### `comments` - Move to Separate Table

Currently comments are stored in JSONB. Move to normalized table:

```typescript
export const comments = pgTable("comments", {
  id: text("id").primaryKey(),
  battleId: text("battle_id")
    .notNull()
    .references(() => battles.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  round: integer("round"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});
```

### 4.3 Migration Strategy

1. **Create new tables** (users, accounts, sessions, verification_tokens, comments)
2. **Migrate existing votes**: Update anonymous `userId` to a system user or delete
3. **Migrate existing comments**: Extract from JSONB to new table with system user
4. **Add foreign key constraints** to votes table
5. **Create indexes** for performance
6. **Remove comments JSONB field** from battles table (after migration)

---

## 5. API Changes

### 5.1 New API Routes

#### `/api/auth/[...nextauth]/route.ts`

NextAuth.js handler for all authentication endpoints

#### `/api/auth/signup/route.ts`

Custom email/password registration endpoint

### 5.2 Modified API Routes

#### `/api/battle/[id]/vote/route.ts`

```typescript
// Before
POST /api/battle/{id}/vote
Body: { round, personaId, userId }

// After
POST /api/battle/{id}/vote
Body: { round, personaId }
Headers: Authorization (via session)

// Changes:
// - Require authenticated session
// - Get userId from session instead of request body
// - Return 401 if not authenticated
```

#### `/api/battle/[id]/comment/route.ts`

```typescript
// Before
POST /api/battle/{id}/comment
Body: { username, content, round }

// After
POST /api/battle/{id}/comment
Body: { content, round }
Headers: Authorization (via session)

// Changes:
// - Require authenticated session
// - Get userId and username from session
// - Return 401 if not authenticated
// - Insert into comments table instead of JSONB array
```

#### `/api/battle/[id]/route.ts` (GET)

```typescript
// Changes:
// - Include user information in comments
// - Include user information in votes (if exposing)
// - Join comments table instead of reading from JSONB
```

### 5.3 New Utility: Session Validation

```typescript
// src/lib/auth/session.ts

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  return session.user;
}

export async function getOptionalAuth() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}
```

---

## 6. Frontend Changes

### 6.1 New Components

#### `AuthButton.tsx`

Sign in/Sign out button for header

- Shows "Sign In" button when not authenticated
- Shows user avatar/name + dropdown when authenticated
- Dropdown includes: Profile, Settings, Sign Out

#### `AuthModal.tsx`

Modal for authentication flows

- Tab switching between Login and Sign Up
- Email/password form
- OAuth provider buttons (Google, GitHub)
- Password reset link

#### `ProtectedAction.tsx`

Wrapper for protected actions

- Shows disabled state with tooltip for unauthenticated users
- Opens auth modal when clicked if not authenticated
- Executes action if authenticated

### 6.2 Modified Components

#### `site-header.tsx`

```typescript
// Add AuthButton to header
<SiteHeader>
  <Logo />
  <Navigation />
  <AuthButton /> {/* New */}
</SiteHeader>
```

#### `battle-sidebar.tsx`

```typescript
// Vote button changes
<ProtectedAction
  action={() => handleVote(round, personaId)}
  requireAuth={true}
>
  <button>Vote</button>
</ProtectedAction>

// Comment form changes
<ProtectedAction requireAuth={true}>
  <form onSubmit={handleComment}>
    {/* Remove username input */}
    <textarea placeholder="Add a comment..." />
    <button>Post</button>
  </form>
</ProtectedAction>
```

#### `battle-controller.tsx`

```typescript
// Remove userId generation logic
// Votes and comments will be handled via session
```

### 6.3 Session Management

```typescript
// app/providers.tsx
import { SessionProvider } from "next-auth/react";

export function Providers({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}

// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

## 7. Security Considerations

### 7.1 Authentication Security

1. **Password Storage**: Use bcrypt with salt for password hashing
2. **Session Tokens**: Use secure, httpOnly cookies for session management
3. **CSRF Protection**: Enable NextAuth.js built-in CSRF protection
4. **Rate Limiting**: Implement rate limiting on auth endpoints
5. **Email Verification**: Require email verification before voting/commenting

### 7.2 API Security

1. **Session Validation**: Validate session on all protected endpoints
2. **Input Validation**: Continue using Zod schemas for all inputs
3. **SQL Injection**: Use Drizzle ORM parameterized queries (already done)
4. **XSS Prevention**: Sanitize user-generated content (comments)

### 7.3 Data Privacy

1. **GDPR Compliance**: Allow users to export/delete their data
2. **Privacy Policy**: Update to reflect data collection
3. **Optional Profile**: Allow users to keep profile private
4. **Email Privacy**: Never expose user emails publicly

---

## 8. UI/UX Considerations

### 8.1 Unauthenticated User Experience

**Goal:** Clear communication about why features are locked

**Implementation:**

- Show vote buttons but make them disabled with tooltip
- Display "Sign in to vote" message
- Show comment box with "Sign in to comment" overlay
- Prominent "Sign In" button in header
- After sign in, redirect back to battle page

### 8.2 Authentication Flow

**Sign Up Flow:**

1. User clicks "Sign In" in header
2. Modal opens with Login tab active
3. User clicks "Sign Up" tab
4. User enters email, password, display name
5. System sends verification email
6. User verifies email
7. User is logged in and redirected back
8. Success toast: "Welcome! You can now vote and comment."

**Sign In Flow:**

1. User clicks "Sign In"
2. Modal opens
3. User enters credentials or clicks OAuth
4. User is authenticated
5. Modal closes, user stays on current page
6. Success toast: "Welcome back!"

### 8.3 First-Time User Onboarding

After first sign up, show brief tooltip tour:

1. "You can now vote on rounds" (highlight vote buttons)
2. "Leave comments on battles" (highlight comment form)
3. "Check your profile for stats" (highlight profile icon)

---

## 9. Implementation Plan

### 9.1 Phase 1: Core Authentication (Week 1)

**Days 1-2: Setup NextAuth.js**

- [ ] Install NextAuth.js and dependencies
- [ ] Create auth configuration
- [ ] Set up environment variables
- [ ] Create database schema for auth tables
- [ ] Run migrations

**Days 3-4: Build Auth UI**

- [ ] Create AuthButton component
- [ ] Create AuthModal component (email/password)
- [ ] Add Google OAuth provider
- [ ] Add session provider to app
- [ ] Update site header

**Days 5-7: Protect Features**

- [ ] Update vote API to require auth
- [ ] Update comment API to require auth
- [ ] Update frontend to handle auth state
- [ ] Add ProtectedAction component
- [ ] Update BattleSidebar for auth

### 9.2 Phase 2: Data Migration (Week 2)

**Days 1-2: Comments Migration**

- [ ] Create comments table migration
- [ ] Create migration script for existing comments
- [ ] Update GET battle API to fetch from new table
- [ ] Update comment display components
- [ ] Test migration with production data

**Days 3-5: Votes Migration**

- [ ] Add foreign key to votes table
- [ ] Create migration script for existing votes
- [ ] Update vote fetching logic
- [ ] Add unique constraint for user votes
- [ ] Test voting flow end-to-end

**Days 6-7: Cleanup**

- [ ] Remove localStorage userId logic
- [ ] Remove username input from comment form
- [ ] Remove deprecated code
- [ ] Update documentation

### 9.3 Phase 3: Polish & Testing (Week 3)

**Days 1-2: User Profile**

- [ ] Create basic profile page
- [ ] Show user's votes and comments
- [ ] Add edit profile functionality

**Days 3-4: Edge Cases**

- [ ] Handle session expiration gracefully
- [ ] Add loading states during auth
- [ ] Add error handling for auth failures
- [ ] Handle network errors

**Days 5-7: Testing & Launch**

- [ ] Manual testing all flows
- [ ] Test on multiple browsers
- [ ] Test OAuth providers
- [ ] Deploy to staging
- [ ] Deploy to production

---

## 10. Dependencies & Tools

### 10.1 NPM Packages

```json
{
  "dependencies": {
    "next-auth": "^5.0.0-beta.20",
    "@auth/drizzle-adapter": "^1.0.0",
    "bcrypt": "^5.1.1",
    "react-hook-form": "^7.49.0",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.4"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2"
  }
}
```

### 10.2 Environment Variables

```bash
# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generated-secret>

# Google OAuth
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>

# Email (for verification)
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=<email-user>
EMAIL_SERVER_PASSWORD=<email-password>
EMAIL_FROM=noreply@rapgpt.com

# Existing Postgres (already configured)
POSTGRES_URL=<vercel-postgres-url>
```

---

## 11. Testing Requirements

### 11.1 Unit Tests

- [ ] User registration validation
- [ ] Password hashing and verification
- [ ] Session token generation
- [ ] Vote duplicate prevention
- [ ] Comment content sanitization

### 11.2 Integration Tests

- [ ] Complete sign up flow
- [ ] Complete sign in flow
- [ ] OAuth authentication flow
- [ ] Voting while authenticated
- [ ] Commenting while authenticated
- [ ] Session expiration handling

### 11.3 E2E Tests

- [ ] New user can create account and vote
- [ ] Existing user can log in and comment
- [ ] Unauthenticated user cannot vote
- [ ] User can log out and log back in
- [ ] User profile displays correct data

---

## 12. Rollout Strategy

### 12.1 Pre-Launch

1. **Announcement**: Notify users via social media about upcoming auth requirement
2. **Grace Period**: Allow 1 week for users to create accounts
3. **Data Preservation**: Explain how existing comments will be migrated
4. **FAQ**: Create FAQ page about the change

### 12.2 Launch

1. **Soft Launch**: Deploy with auth optional (vote/comment work for both)
2. **Monitor**: Watch for issues, gather feedback
3. **Hard Launch**: Enforce authentication requirement after 1 week
4. **Support**: Provide help for users with login issues

### 12.3 Post-Launch

1. **Monitor Metrics**: Track signup rate, engagement
2. **Gather Feedback**: Survey users about auth experience
3. **Iterate**: Improve based on feedback

---

## 13. Success Metrics

### 13.1 Key Performance Indicators (KPIs)

| Metric                    | Target                 | Measurement                    |
| ------------------------- | ---------------------- | ------------------------------ |
| User Sign-Up Rate         | >70% of active users   | Track new accounts created     |
| Auth Success Rate         | >95% successful logins | Monitor auth failures          |
| Vote Participation        | Maintain or increase   | Compare pre/post auth votes    |
| Comment Activity          | Maintain or increase   | Compare pre/post auth comments |
| Session Duration          | >80% complete sessions | Track session validity         |
| Duplicate Vote Prevention | 100% prevented         | Monitor database constraints   |

### 13.2 User Satisfaction

- [ ] Conduct user survey 2 weeks post-launch
- [ ] Target: >4.0/5.0 satisfaction with auth experience
- [ ] Monitor support tickets/complaints

---

## 14. Risks & Mitigation

### 14.1 User Friction

**Risk:** Users may be frustrated by required authentication  
**Mitigation:**

- Clear communication before launch
- Smooth OAuth integration (1-click Google sign-in)
- Optional features remain accessible without auth

### 14.2 Technical Issues

**Risk:** Auth system bugs may block all users  
**Mitigation:**

- Extensive testing in staging environment
- Gradual rollout with monitoring
- Quick rollback plan if critical issues arise
- Keep anonymous viewing always available

### 14.3 Data Migration

**Risk:** Existing votes/comments may be lost or corrupted  
**Mitigation:**

- Backup database before migration
- Test migration on copy of production data
- Dry-run migration script multiple times
- Keep original data until migration verified

### 14.4 OAuth Provider Issues

**Risk:** Google/GitHub OAuth may have downtime  
**Mitigation:**

- Always keep email/password as fallback
- Show clear error messages if OAuth fails
- Monitor provider status pages

---

## 15. Future Enhancements (Post-MVP)

### 15.1 User Profiles & Reputation

- Public user profiles with battle history
- Reputation system based on votes received
- User badges and achievements
- Leaderboards for top voters/commenters

### 15.2 Social Features

- Follow other users
- Share battles on social media
- Receive notifications for replies
- Direct messaging between users

### 15.3 Moderation Tools

- Report abusive comments
- Moderator dashboard
- User bans and timeouts
- Comment flagging system

### 15.4 Advanced Auth

- Two-factor authentication (2FA)
- Account recovery via SMS
- Passkey support (WebAuthn)
- SSO for organizations

---

## 16. Open Questions

1. **Should battle creation require authentication?**

   - Pro: Prevents spam battles
   - Con: Reduces friction for new users trying the platform
   - **Recommendation:** Keep open initially, monitor for abuse

2. **Should we allow users to make existing anonymous votes/comments?**

   - **Recommendation:** Migrate to "Anonymous User" system account, not attributable

3. **Email verification required for voting?**

   - Pro: Reduces spam accounts
   - Con: Adds friction to sign-up
   - **Recommendation:** Require verification for commenting, not for voting

4. **Display real names or allow usernames?**
   - **Recommendation:** Allow users to set display name separate from email

---

## 17. References & Resources

### 17.1 Documentation

- [NextAuth.js v5 Docs](https://authjs.dev/)
- [Drizzle Adapter for NextAuth](https://authjs.dev/reference/adapter/drizzle)
- [Google OAuth Setup](https://console.cloud.google.com/)
- [Next.js App Router Auth Patterns](https://nextjs.org/docs/app/building-your-application/authentication)

### 17.2 Code Examples

- [NextAuth + Drizzle Example](https://github.com/nextauthjs/next-auth/tree/main/apps/examples/nextjs)
- [App Router Middleware Auth](https://nextjs.org/docs/app/building-your-application/routing/middleware#conditional-statements)

---

## Appendix A: Database Migration Scripts

### A.1 Create Auth Tables

```sql
-- Create users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL UNIQUE,
  email_verified TIMESTAMP,
  image TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create accounts table
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  session_token TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL
);

-- Create verification tokens table
CREATE TABLE verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires TIMESTAMP NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Create comments table
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  battle_id TEXT NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  round INTEGER,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_comments_battle_id ON comments(battle_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE UNIQUE INDEX idx_votes_unique ON votes(battle_id, round, user_id);
```

### A.2 Migrate Existing Comments

```typescript
// scripts/migrate-comments.ts
import { db } from "@/lib/db/client";
import { battles, comments, users } from "@/lib/db/schema";
import { nanoid } from "nanoid";

async function migrateComments() {
  // Create system user for anonymous comments
  const systemUser = await db
    .insert(users)
    .values({
      id: "system-anonymous",
      name: "Anonymous User",
      email: "system@rapgpt.internal",
      emailVerified: new Date(),
    })
    .returning();

  // Get all battles
  const allBattles = await db.select().from(battles);

  for (const battle of allBattles) {
    if (battle.comments && battle.comments.length > 0) {
      // Insert comments into new table
      for (const comment of battle.comments) {
        await db.insert(comments).values({
          id: comment.id || nanoid(),
          battleId: battle.id,
          userId: systemUser[0].id,
          round: comment.round || null,
          content: comment.content,
          createdAt: comment.timestamp
            ? new Date(comment.timestamp)
            : new Date(),
          updatedAt: new Date(),
        });
      }

      console.log(
        `Migrated ${battle.comments.length} comments for battle ${battle.id}`
      );
    }
  }

  console.log("Comment migration complete!");
}
```

---

## Appendix B: NextAuth Configuration

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db/client";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Verify user credentials
        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email),
        });

        if (!user) return null;

        // Verify password (requires storing hashed password in users table)
        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/", // Custom sign-in modal instead of page
    error: "/error",
  },
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

---

**Document Status:** Draft for Review  
**Next Steps:** Review with team, prioritize features, approve for implementation
