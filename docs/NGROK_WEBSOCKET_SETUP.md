# ngrok WebSocket Setup for Live Battles

## Problem
WebSocket connections fail through ngrok with errors like:
- "There was a bad response from the server"
- "WebSocket connection failed"
- 502 errors

## Root Cause
ngrok needs proper configuration to handle WebSocket upgrade requests. By default, ngrok may not correctly proxy the WebSocket protocol handshake.

## Solution

### 1. Use the Correct ngrok Command
The `package.json` has been updated with the correct flags:

```bash
pnpm run ngrok
```

This runs: `ngrok http --host-header=rewrite --domain=yameen.ngrok.app 3000`

**Key flags:**
- `--host-header=rewrite` - Rewrites the Host header so your server receives the correct hostname
- `--domain=yameen.ngrok.app` - Uses your reserved ngrok domain

### 2. Verify ngrok is Running Correctly
When you start ngrok, you should see:

```
Session Status                online
Account                       [Your Account]
Version                       [Version]
Region                        [Region]
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://yameen.ngrok.app -> http://localhost:3000
```

**Important:** The Web Interface at `http://127.0.0.1:4040` shows real-time traffic and any errors.

### 3. Testing WebSocket Connection

#### Method 1: Check ngrok Inspector
1. Open `http://127.0.0.1:4040` in your browser
2. Create a live battle and start broadcasting
3. Look for WebSocket upgrade requests (status 101)
4. If you see 502 or 400 errors, ngrok isn't properly configured

#### Method 2: Browser Console
Open DevTools Console and look for:
- ✅ `[WS Client] Connected successfully` - Working!
- ❌ `[WS Client] Error:` - Check ngrok configuration

### 4. Alternative: ngrok Configuration File
If the command-line flags don't work, create `ngrok.yml`:

```yaml
version: "2"
authtoken: YOUR_NGROK_AUTH_TOKEN
tunnels:
  rapgpt:
    proto: http
    addr: 3000
    domain: yameen.ngrok.app
    host_header: rewrite
    inspect: true
```

Then run: `ngrok start rapgpt`

## Troubleshooting

### Issue: Still getting 502 errors

**Solution 1: Check ngrok account plan**
Free ngrok accounts have WebSocket limitations. If you're on a free plan, upgrade to a paid plan for full WebSocket support.

**Solution 2: Check server is running**
Make sure `pnpm dev` is running BEFORE starting ngrok.

**Solution 3: Check port**
Verify your server is running on port 3000:
```bash
lsof -i :3000
```

### Issue: Connection timeout

**Solution: Increase timeouts in ngrok.yml**
```yaml
tunnels:
  rapgpt:
    proto: http
    addr: 3000
    domain: yameen.ngrok.app
    host_header: rewrite
    inspect: true
    # Add WebSocket-specific settings
    websocket_compression: true
```

### Issue: Works locally but not through ngrok

**Verification:**
1. Test locally first: Open `http://localhost:3000` and create a live battle
2. Check browser console - should see `[WS Client] Connecting to WebSocket server at: ws://localhost:3000/ws`
3. Should connect immediately
4. If local works but ngrok doesn't, the issue is ngrok configuration

## Running Order

Always start services in this order:

```bash
# Terminal 1: Start the Next.js app with WebSocket server
pnpm dev

# Terminal 2: Start ngrok (after server is running)
pnpm run ngrok
```

## Testing

### Test 1: Local WebSocket (no ngrok)
1. Open `http://localhost:3000`
2. Create a live battle
3. Browser console should show: `[WS Client] Connected successfully`

### Test 2: ngrok WebSocket
1. Start both `pnpm dev` and `pnpm run ngrok`
2. Open `https://yameen.ngrok.app`
3. Create a live battle
4. Browser console should show: `[WS Client] Connected successfully`
5. ngrok inspector at `http://127.0.0.1:4040` should show WebSocket upgrade (HTTP 101)

## ngrok WebSocket Support by Plan

- **Free**: Limited WebSocket support (may have issues)
- **Personal ($10/month)**: Full WebSocket support ✅
- **Pro**: Full WebSocket support with more concurrent connections ✅

If you're experiencing persistent issues and you're on the free plan, consider upgrading or testing locally without ngrok.


