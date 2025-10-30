# Song Generation Test Page

## ⚠️ DELETE THIS ENTIRE DIRECTORY BEFORE PRODUCTION

This test page is for QA/development purposes only.

## How to Use

1. **Access the page:**
   ```
   http://localhost:3000/test-song
   ```

2. **What it does:**
   - Automatically finds a completed battle from your database
   - Shows the SongGenerator component for testing generation
   - Shows the SongPlayer component (with mock data if no song generated yet)
   - Displays battle info and testing instructions
   - Checks environment variables

3. **Testing Flow:**
   - Select a beat style (G-Funk, Boom-Bap, or Trap)
   - Click "Generate Song"
   - Wait 1-3 minutes for Suno API to generate
   - Player will update automatically when complete
   - Test all player controls (play/pause, seek, volume, download)

4. **Requirements:**
   - Must have at least one completed battle in database
   - Must be signed in (page requires authentication)
   - SUNO_API_KEY must be set in .env.local
   - Database migration must be run

## Troubleshooting

**"No completed battles found"**
- Create and complete a battle first, or
- Manually set a battle status to 'completed' in the database

**Song generation fails**
- Check SUNO_API_KEY is valid
- Check API credits/quota
- Check network connectivity
- Check browser console for errors

**Player doesn't load**
- If no song generated, it will show mock audio player
- Generate a real song to test with actual Suno output

## Clean Up

Before deploying to production:

```bash
# Delete this entire directory
rm -rf src/app/test-song/
```

Or just delete the `src/app/test-song/` folder in your IDE.

