# Suno AI Music Generation Setup Guide

This guide will help you set up the Suno API integration for AI-powered song generation from battle verses.

## What is Suno API?

Suno API provides advanced AI music generation capabilities that allow you to create full songs from lyrics. In this application, we use it to transform rap battle verses into complete tracks with custom beats.

## Getting Your API Key

1. **Visit Suno API Website**
   - Go to [https://sunoapi.org](https://sunoapi.org)
   - Create an account or sign in

2. **Access Dashboard**
   - Navigate to the API Dashboard
   - Go to "API Key Management" section

3. **Generate API Key**
   - Click "Create New API Key"
   - Copy your API key (you won't be able to see it again)
   - Store it securely

## Environment Setup

1. **Create/Update `.env.local` File**
   
   Add the following environment variables:
   
   ```bash
   SUNO_API_KEY=your_actual_api_key_here
   SUNO_API_BASE_URL=https://api.sunoapi.org
   ```

2. **Verify Configuration**
   
   Make sure both variables are set correctly in your environment file.

## Cost Estimates

Suno API pricing typically works on a credit system:

- **Music Generation**: ~5-10 credits per song
- **Song Length**: Up to 4-8 minutes depending on model
- **Average Cost**: ~$0.50-$1.00 per song (varies by plan)

Check the [Suno API Pricing Page](https://sunoapi.org/pricing) for current rates.

## Features in This Integration

### Beat Styles

Three beat styles are available for users to choose from:

1. **G-Funk** (🎹)
   - West Coast hip-hop style
   - Smooth funky basslines
   - Synthesizer leads
   - 90s California rap aesthetic

2. **Boom-Bap** (🥁)
   - 90s East Coast hip-hop style
   - Hard-hitting drums
   - Jazz samples
   - Classic breakbeats

3. **Trap** (🔊)
   - Modern Atlanta trap sound
   - Heavy 808 bass
   - Rapid hi-hats
   - Contemporary rap style

### Generation Process

1. User completes a battle (3 rounds)
2. Battle creator can access song generation
3. Creator selects a beat style
4. System formats all verses with persona labels
5. API generates song (typically 2-3 minutes)
6. Client polls for completion with real-time progress bar
7. Song is saved with metadata to database when complete
8. Audio player appears for playback and download

**Real-time Progress**: The UI displays a progress bar that updates every 5 seconds while the song generates, giving users accurate feedback on generation status.

## Rate Limits

Default Suno API rate limits:

- **Free Tier**: Limited generations per day
- **Paid Tier**: Higher limits based on plan
- **Timeout**: 5 minutes per generation request

### Handling Timeouts

If generation exceeds 5 minutes:
- Partial song data is saved
- User receives notification
- Can check back later for completion

## API Endpoints Used

### Generate Music
```
POST https://api.sunoapi.org/api/v1/generate
```

**Documentation**: [Generate Suno AI Music](https://docs.sunoapi.org/suno-api/generate-music)

### Check Status
```
GET https://api.sunoapi.org/api/v1/generate/record-info?taskId={taskId}
```

**Documentation**: [Get Music Generation Details](https://docs.sunoapi.org/suno-api/get-music-generation-details)

## Troubleshooting

### "SUNO_API_KEY is not configured"

**Solution**: Ensure your `.env.local` file contains the `SUNO_API_KEY` variable and restart your development server.

### "Song generation timeout"

**Causes**:
- High server load on Suno's side
- Network connectivity issues
- API rate limits reached

**Solution**: 
- Wait a few minutes and try again
- Check your API credit balance
- Verify your network connection

### "Failed to start song generation"

**Causes**:
- Invalid API key
- Insufficient credits
- API service down

**Solution**:
- Verify API key is correct
- Check credit balance on Suno dashboard
- Check [Suno API Status](https://status.sunoapi.org)

### "Invalid beat style"

**Solution**: Ensure you're using one of the three valid styles: `g-funk`, `boom-bap`, or `trap`.

## Best Practices

1. **Credit Monitoring**
   - Regularly check your API credit balance
   - Set up alerts for low credits
   - Consider upgrading plan if needed

2. **Error Handling**
   - Always inform users of generation status
   - Provide clear error messages
   - Allow retry on failures

3. **Performance**
   - Generation takes 1-3 minutes typically
   - Don't allow concurrent generations
   - Cache generated songs (already implemented)

4. **User Experience**
   - Show progress indicators
   - Set expectations for wait time
   - Provide download option after generation

## Security Notes

- **Never commit** `.env.local` to version control
- Store API keys in environment variables only
- Use server-side API calls only (never expose keys to client)
- Rotate API keys periodically

## Database Migration

After setup, run the migration to add the `generated_song` field:

```bash
# Development
pnpm db:push:dev

# Production
pnpm db:push:prod
```

## Testing

To test the integration:

1. Create a test battle as an authenticated user
2. Complete all 3 rounds
3. View the completed battle
4. Click "Generate AI Song"
5. Select a beat style
6. Wait for generation
7. Test audio playback and download

## Support

For Suno API support:
- Email: support@sunoapi.org
- Documentation: https://docs.sunoapi.org
- Status Page: https://status.sunoapi.org

For application-specific issues:
- Check application logs
- Review error messages in browser console
- Contact your development team

## Additional Resources

- [Suno API Documentation](https://docs.sunoapi.org)
- [API Quick Start Guide](https://docs.sunoapi.org/quick-start)
- [Model Versions](https://docs.sunoapi.org#ai-model-versions)
- [Community Forum](https://community.sunoapi.org)

