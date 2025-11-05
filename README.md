# RapGPT - AI Freestyle Battle Platform

A monthly AI persona freestyle battle platform where two AI-powered rappers compete in 3 rounds of 8-bar verses, with automated scoring and user voting.

## Project Structure

```
rapgpt/               # Next.js web application
  src/
    app/                  # Next.js App Router pages
      api/                # API routes
      battle/[id]/        # Individual battle page
      archive/            # Battle archive
    components/           # React components
    lib/                  # Utilities and logic
      db/                 # Database schema and client (Drizzle ORM)
      validations/        # Zod validation schemas
      shared/             # Shared code (personas, types, etc.)
  scripts/
    create-battle.ts      # Interactive battle creation script
```

## Features

### Core Battle System

- **3 Rounds**: Each battle consists of 3 rounds
- **8 Bars Per Verse**: Each persona delivers exactly 8 bars per turn
- **Alternating Turns**: Personas alternate, responding to each other's verses
- **Split-Screen Stage**: Visual battle stage with both personas side-by-side

### Scoring System

- **Automated Scoring**: Analyzes rhyme scheme (30%), wordplay (25%), flow (20%), relevance (15%), and originality (10%)
- **User Voting**: Viewers can vote on each round
- **Combined Score**: Final scores combine automated analysis with user votes

### Interaction

- **Live Comments**: Users can comment during battles
- **Round Voting**: Vote for the winner of each round
- **Battle Archive**: Browse past battles and winners

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended)
- Anthropic API key

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
```

### Development

```bash
# Run dev server
pnpm dev

# Visit http://localhost:3000
```

### Creating a Battle

Use the interactive battle creation script:

```bash
pnpm create-battle
```

You'll be prompted to:

1. Enter a battle name (e.g., "Summer Showdown 2025")
2. Select the first persona
3. Select the second persona

The script creates a battle file in `data/battles/` and provides the URL to view it.

### Building for Production

```bash
pnpm build

# Start production server
pnpm start
```

## Architecture

### AI Personas

Personas are defined in `src/lib/shared/personas/`. Each persona has:

- **Name & Bio**: Identity and background
- **Style**: Musical style (e.g., "Boom Bap", "Trap")
- **System Prompt**: Detailed instructions for AI behavior
- **Accent Color**: Visual theming

**Included Personas:**

- **The Lyricist**: Brooklyn boom bap wordsmith with complex rhyme schemes
- **The Hustler**: Atlanta trap MC with aggressive delivery
- **Lady Muse**: Queen of the mic with poetic flow
- **Kenny K**: Smooth West Coast storyteller

### Battle Flow

1. Battle is initialized with two personas
2. Left persona goes first in Round 1
3. AI generates 8-bar verse via Claude API
4. Right persona responds with their verse
5. Round is scored (automated + user votes)
6. Process repeats for Rounds 2 and 3
7. Winner is determined by round victories

### Data Storage

Currently uses JSON file storage in `data/battles/`. Each battle is stored as a separate JSON file.

**For Production:** Migrate to PostgreSQL, Supabase, or similar database.

### API Routes

- `POST /api/battle/generate-verse` - Generate AI verse
- `GET /api/battle/[id]` - Fetch battle data
- `PUT /api/battle/[id]` - Update battle
- `POST /api/battle/[id]/vote` - Submit vote
- `POST /api/battle/[id]/comment` - Add comment

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4, Framer Motion
- **AI**: Claude (Anthropic) via AI SDK
- **State**: Zustand
- **Code Quality**: Biome

## Development Guide

### Creating New Personas

1. Create a new file in `src/lib/shared/personas/`
2. Define the persona with system prompt
3. Export from `personas/index.ts`
4. Use in battle creation

Example:

```typescript
export const myPersona: Persona = {
  id: "my-persona",
  name: "My Persona",
  bio: "Description...",
  style: "Musical Style",
  systemPrompt: "Detailed prompt...",
  accentColor: "#hexcolor",
};
```

### Customizing Scoring

Modify weights in `src/lib/scoring.ts`:

- `rhymeScheme`: 30 points max
- `wordplay`: 25 points max
- `flow`: 20 points max
- `relevance`: 15 points max
- `originality`: 10 points max

### Scripts

```bash
# Development
pnpm dev            # Start dev server
pnpm build          # Build for production
pnpm start          # Start production server

# Code Quality
pnpm lint           # Check code with Biome
pnpm format         # Format code with Biome

# Database
pnpm db:push        # Push schema to database (development)
pnpm db:generate    # Generate migration files
pnpm db:migrate     # Run migrations
pnpm db:studio      # Open Drizzle Studio

# Utilities
pnpm create-battle  # Create new battle
```

## Database Setup

This project uses **Vercel Postgres** with **Drizzle ORM** for data persistence.

### Quick Start

1. Create a Vercel Postgres database in your [Vercel Dashboard](https://vercel.com/dashboard)
2. Pull environment variables:
   ```bash
   pnpm vercel env pull .env.local
   ```
3. Push database schema:
   ```bash
   pnpm db:push
   ```

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions.

## Environment Variables

Create a `.env.local` file (or pull from Vercel):

```bash
# Anthropic API (for AI verse generation)
ANTHROPIC_API_KEY=your_api_key_here

# Vercel Postgres (automatically added when you connect database)
POSTGRES_URL=your_postgres_url
POSTGRES_PRISMA_URL=your_prisma_url
POSTGRES_URL_NO_SSL=your_no_ssl_url
POSTGRES_URL_NON_POOLING=your_non_pooling_url
POSTGRES_USER=your_user
POSTGRES_HOST=your_host
POSTGRES_PASSWORD=your_password
POSTGRES_DATABASE=your_database

# Feature Flags for User Battles
# These control voting and commenting on USER-CREATED battles only
# Live/featured battles (admin-created) ALWAYS have voting and commenting enabled
NEXT_PUBLIC_USER_BATTLE_VOTING=false        # Enable voting on user battles (default: false)
NEXT_PUBLIC_USER_BATTLE_COMMENTING=false    # Enable commenting on user battles (default: false)

# WebSocket Configuration
# Set to 'true' to disable WebSockets (required for Vercel deployments)
NEXT_PUBLIC_DISABLE_WEBSOCKETS=false        # Disable real-time WebSocket features (default: false)
```

### WebSockets on Vercel

**Important**: Vercel does not support WebSocket connections by default. You'll get 404 errors for the `/ws` endpoint.

To deploy on Vercel, you **must** disable WebSockets:

1. Add to Vercel environment variables: `NEXT_PUBLIC_DISABLE_WEBSOCKETS=true`
2. Redeploy your application

When disabled:
- ✅ All core features work normally
- ❌ Real-time updates disabled (users must refresh to see new content)
- ❌ Live viewer counts not available

**See [DISABLE_WEBSOCKETS.md](./DISABLE_WEBSOCKETS.md) for detailed setup instructions.**

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Vercel Postgres + Drizzle ORM
- **Validation**: Zod
- **AI**: Anthropic Claude (via AI SDK)
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **Animation**: Framer Motion

## Future Enhancements

- [x] Database migration (Vercel Postgres + Drizzle ORM)
- [x] Request validation with Zod
- [x] User authentication (Clerk)
- [x] Admin interface for battle management
- [x] WebSocket for real-time updates (with optional disable for Vercel)
- [ ] More personas (expand the roster)
- [ ] Tournament mode (bracket-style competitions)
- [ ] Custom persona creator
- [ ] Audio generation (text-to-speech for verses)
- [ ] Social sharing features
- [ ] Battle replays with commentary
- [ ] Vote tracking per user (prevent double voting)
- [ ] Battle scheduling system
- [ ] Persona stats and leaderboards

## License

MIT

# rapgpt
