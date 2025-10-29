# Live Battle System

## Overview

The RapGPT platform now supports real-time live battles where admins can control battles while viewers watch and participate in real-time. All updates (verse streaming, voting, commenting) are synchronized via WebSockets.

## Architecture

- **Custom Next.js Server**: Wraps Next.js with a WebSocket server (`server.ts`)
- **WebSocket Rooms**: Each battle has its own room for isolated communication
- **Admin Controls**: `/admin/battles/[id]/control` - Full control panel
- **Viewer Experience**: `/battle/[id]` - Automatically switches to live mode when battle is live
- **Real-time Broadcasting**: All battle events are broadcast to connected viewers

## Getting Started

### Development

Start the development server with WebSocket support:

```bash
pnpm dev
```

This runs the custom server (`tsx server.ts`) instead of the standard Next.js dev server.

### Production

The system works with Vercel's WebSocket support via upgrade requests. No special configuration needed.

## Admin Features

### Starting a Live Battle

1. Navigate to `/admin/battles/[id]/control`
2. Ensure the battle is in "ongoing" status
3. Click **"Go Live"** to start broadcasting

### Control Modes

#### Manual Mode

- **Generate Next Verse**: Manually trigger verse generation
- **Next Round**: Manually advance to the next round after voting
- Full control over battle pacing

#### Auto-Play Mode

- **Verse Delay**: Time between verses (5-120 seconds, default 30s)
- **Reading Phase**: Time for viewers to read verses (5-60 seconds, default 20s)
- **Voting Phase**: Time for viewers to vote (5-60 seconds, default 10s)
- **Auto-Advance**: Automatically advance rounds after voting completes
- Battle runs automatically with configurable timings

### Admin Controls

- **Start/Stop Live Mode**: Toggle broadcasting
- **Switch Control Modes**: Toggle between Manual and Auto-Play
- **View Viewer Count**: See how many people are watching
- **Monitor Connection Status**: Check WebSocket health
- **Participate**: Vote and comment like any viewer

## Viewer Experience

### Live Indicators

When a battle is live, viewers see:

- **🔴 LIVE** badge with pulsing animation
- **Viewer count** showing active viewers
- **Connection status** (connected, connecting, disconnected)

### Real-Time Features

1. **Verse Streaming**: Watch verses appear word-by-word in real-time
2. **Reading Phase**: 20-second countdown before voting opens
3. **Voting Phase**: 10-second window to cast votes
4. **Live Comments**: Comments appear instantly for all viewers
5. **Live Votes**: Vote counts update in real-time
6. **Round Advancement**: Smooth transitions between rounds

### Late Joiners

Viewers who join mid-battle are automatically synchronized:

- Receive current battle state
- See all verses delivered so far
- Can participate in ongoing voting and commenting

### Mobile Experience

- Floating action buttons for Comments and Voting
- Slide-up drawer for easy access
- Optimized for portrait viewing

## WebSocket Events

The system broadcasts these events:

| Event                 | Description                       |
| --------------------- | --------------------------------- |
| `battle:live_started` | Battle enters live mode           |
| `battle:live_ended`   | Battle exits live mode            |
| `verse:streaming`     | Verse text streaming in real-time |
| `verse:complete`      | Verse generation finished         |
| `phase:reading`       | Reading phase started (20s timer) |
| `phase:voting`        | Voting phase started (10s timer)  |
| `round:advanced`      | Battle moved to next round        |
| `battle:completed`    | Battle finished                   |
| `comment:added`       | New comment posted                |
| `vote:cast`           | New vote submitted                |
| `state:sync`          | Full state sync for late joiners  |
| `viewers:count`       | Viewer count updated              |

## API Routes

### Admin Control

- `POST /api/battle/[id]/live/start` - Start live mode
- `POST /api/battle/[id]/live/stop` - Stop live mode
- `POST /api/battle/[id]/live/control-mode` - Update control mode and config

### Battle Operations

- `POST /api/battle/generate-verse` - Generate next verse (broadcasts if live)
- `POST /api/battle/[id]/vote` - Submit vote (broadcasts if live)
- `POST /api/battle/[id]/comment` - Post comment (broadcasts if live)
- `GET /api/battle/[id]/sync` - Get current battle state for sync

## Database Schema

New fields added to the `battles` table:

```sql
is_live BOOLEAN DEFAULT false
live_started_at TIMESTAMP
admin_control_mode TEXT DEFAULT 'manual'
auto_play_config JSONB
```

## Edge Cases & Resilience

### Connection Issues

- **Auto-Reconnection**: Client automatically reconnects with exponential backoff
- **Max Attempts**: 5 reconnection attempts before giving up
- **Manual Reconnect**: Button appears if connection fails

### Admin Disconnect

- Battle remains live but actions pause
- Admin can reconnect and resume control
- Viewers continue to see existing content

### Multiple Admins

- Only one admin can control at a time (first connected)
- Other admins can view but not control
- Control panel shows warning if not controlling

### No WebSocket Support

- Graceful degradation to polling (future enhancement)
- Error messages guide users to modern browsers

## Testing Checklist

### Single Admin + Multiple Viewers

- [ ] Start live mode from admin panel
- [ ] Open battle link in multiple browsers/devices
- [ ] Verify viewer count is accurate
- [ ] Generate verse manually - appears on all screens
- [ ] Test voting in real-time - counts update everywhere
- [ ] Post comments - appear instantly for all
- [ ] Advance round - transitions smoothly

### Auto-Play Mode

- [ ] Enable auto-play with custom timings
- [ ] Battle runs automatically
- [ ] Pause/resume works correctly
- [ ] Switch to manual mid-battle

### Connection Resilience

- [ ] Refresh viewer page - reconnects and syncs
- [ ] Join battle mid-round - receives current state
- [ ] Temporarily disconnect network - reconnects automatically
- [ ] Close browser - cleanly disconnects

### Mobile Testing

- [ ] Floating action buttons work
- [ ] Drawer slides up smoothly
- [ ] Portrait orientation optimized
- [ ] Touch interactions responsive

## Performance Considerations

### Scalability

- **Room-based Broadcasting**: Messages only sent to relevant viewers
- **Heartbeat Monitoring**: Detects and cleans up dead connections
- **Efficient State Sync**: Only sends full state when needed

### Optimization

- **Debounced Updates**: Rapid events are batched
- **Minimal Payload**: Only essential data in WebSocket messages
- **Server-Side Rendering**: Initial page load is fast

## Future Enhancements

- [ ] Polling fallback for browsers without WebSocket
- [ ] Battle recording/replay of live events
- [ ] Chat reactions and emojis
- [ ] Multiple admin roles (host, moderator)
- [ ] Viewer analytics dashboard
- [ ] Pre-scheduled live battles
- [ ] SMS/email notifications when battles go live

## Troubleshooting

### WebSocket Not Connecting

1. Check server is running (`pnpm dev`)
2. Verify port 3000 is not blocked
3. Check browser console for errors
4. Try incognito mode to rule out extensions

### Admin Can't Control

1. Verify user has admin role in database
2. Check battle status is "ongoing"
3. Ensure WebSocket connection is "connected"
4. Refresh page and try again

### Viewers Not Seeing Updates

1. Verify battle is marked as live (`isLive: true`)
2. Check server logs for broadcast errors
3. Verify viewers are connected (check viewer count)
4. Test with manual reconnect button

### Auto-Play Not Working

1. Verify control mode is set to "auto"
2. Check auto-play config values are valid
3. Look for errors in server logs
4. Ensure battle state allows progression

## Support

For issues or questions:

1. Check server logs for error messages
2. Review browser console for client errors
3. Verify database schema is up to date
4. Test with a fresh battle

---

**Built with:**

- Next.js 15
- WebSocket (`ws` library)
- React hooks for state management
- Zustand for client state
- TypeScript for type safety
- Tailwind CSS for styling
