# Disabling WebSockets for Vercel Deployment

## Why Disable WebSockets?

Vercel's standard deployment does not support WebSocket connections through the standard Next.js server. WebSocket requests result in 404 errors.

To enable WebSockets on Vercel, you would need to:
- Use a separate WebSocket provider (like Pusher, Ably, or Socket.io with external hosting)
- Use Vercel Edge Functions with specific WebSocket support
- Deploy the WebSocket server separately

## How to Disable WebSockets

To disable WebSockets and run the app without real-time features:

1. **Set the environment variable in Vercel:**
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add: `NEXT_PUBLIC_DISABLE_WEBSOCKETS` = `true`
   - Deploy or redeploy your application

2. **For local testing:**
   Add to your `.env.local` file:
   ```
   NEXT_PUBLIC_DISABLE_WEBSOCKETS=true
   ```

## What Happens When WebSockets Are Disabled?

When WebSockets are disabled:

✅ **Still Works:**
- Viewing battles
- Creating battles
- All static content
- Initial data loading
- User authentication
- Profile pages

❌ **Disabled Features:**
- Real-time battle updates
- Live viewer count
- Real-time comments appearing without refresh
- Real-time vote updates
- Live battle indicators on homepage
- Admin battle control panel real-time sync

## User Experience Impact

Users will see:
- Battle pages load normally but without live updates
- No "LIVE" indicators or viewer counts
- Comments and votes require page refresh to see updates
- Admin controls will work but won't broadcast to viewers in real-time

## Re-enabling WebSockets

To re-enable WebSockets:

1. Remove the environment variable or set it to `false`
2. Ensure you have a WebSocket-compatible hosting environment
3. Redeploy the application

## Alternative: Setting Up External WebSocket Provider

If you need real-time features on Vercel, consider:
1. **Pusher**: Easy integration, generous free tier
2. **Ably**: Real-time messaging platform
3. **Socket.io with separate hosting**: Deploy the server.ts separately on a platform that supports WebSockets (Railway, Render, Heroku)

