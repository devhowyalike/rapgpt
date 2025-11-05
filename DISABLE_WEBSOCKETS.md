# 🚀 Quick Guide: Disable WebSockets on Vercel

## The Problem
Vercel production deployments don't support WebSocket connections by default, causing 404 errors for `/ws` endpoint.

## The Solution
I've added a feature flag to disable WebSockets. The app will continue to work, just without real-time updates.

## Setup Steps for Vercel

### 1. Add Environment Variable in Vercel Dashboard

1. Go to your Vercel project: https://vercel.com/dashboard
2. Click on your project (`rapgpt`)
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name**: `NEXT_PUBLIC_DISABLE_WEBSOCKETS`
   - **Value**: `true`
   - **Environment**: Select all (Production, Preview, Development)
5. Click **Save**

### 2. Redeploy

After adding the environment variable, redeploy your application:
- Either push a new commit to trigger automatic deployment
- Or manually redeploy from the Vercel dashboard (Deployments → ⋯ → Redeploy)

### 3. Verify

After deployment:
- Check Vercel logs - you should see no more `/ws` 404 errors
- Visit your site - everything should work except real-time features
- Check browser console - you should see: `[WS Client] WebSockets are disabled via environment variable`

## What Still Works

✅ All battles load and display correctly
✅ Creating new battles
✅ Viewing verses and songs
✅ User authentication
✅ Comments and voting (but require page refresh to see updates)
✅ All admin features (but without live broadcasting)

## What Doesn't Work

❌ Real-time battle updates (viewers need to refresh)
❌ Live viewer count
❌ Automatic comment/vote updates
❌ "LIVE" battle indicators on homepage
❌ Real-time admin control panel sync

## Local Testing

To test this locally, add to your `.env.local`:
```
NEXT_PUBLIC_DISABLE_WEBSOCKETS=true
```

Then restart your dev server:
```bash
pnpm dev
```

## Re-enabling WebSockets (Future)

To re-enable websockets when you move to a WebSocket-compatible host:

1. Remove the environment variable from Vercel
2. Or set `NEXT_PUBLIC_DISABLE_WEBSOCKETS=false`
3. Redeploy

See `WEBSOCKET_DISABLE_GUIDE.md` for more details about WebSocket alternatives.

