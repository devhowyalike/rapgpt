# ⚡ Quick Fix: Stop WebSocket 404 Errors on Vercel

## Your Exact Steps:

### Step 1: Open Vercel Dashboard

Go to: https://vercel.com/dashboard
Click on your `rapgpt` project

### Step 2: Add Environment Variable

1. Click **Settings** (left sidebar)
2. Click **Environment Variables**
3. Click **Add New**
4. Enter:
   ```
   Name:  NEXT_PUBLIC_DISABLE_WEBSOCKETS
   Value: true
   ```
5. Check all three environments: ☑️ Production ☑️ Preview ☑️ Development
6. Click **Save**

### Step 3: Redeploy

Two options:

- **Option A**: Push any commit to your repo (triggers auto-deploy)
- **Option B**: In Vercel → Deployments → click ⋯ → **Redeploy**

### Step 4: Verify (after deploy completes)

1. Check Vercel logs → No more `/ws` 404 errors ✅
2. Visit your site → Everything works ✅
3. Browser console → Should see: "WebSockets are disabled" ✅

---

## That's It! 🎉

Your site will work perfectly, just without real-time updates. Users will need to refresh to see new content.

---

## What Changed in Your Code?

I updated 2 files to check for this environment variable:

- `src/lib/websocket/client.ts` - Main WebSocket client
- `src/components/live-battles-display.tsx` - Homepage live battles

When the env var is set to `true`, WebSocket connections are never attempted.

---

## Need Help?

See these files for more details:

- `DISABLE_WEBSOCKETS.md` - Full setup guide
- `WEBSOCKET_DISABLE_GUIDE.md` - What works/doesn't work
- `WEBSOCKET_DISABLE_IMPLEMENTATION.md` - Technical details
