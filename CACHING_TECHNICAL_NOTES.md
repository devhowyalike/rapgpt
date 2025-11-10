# Prompt Caching Technical Notes

## Current Status

### Token Count Requirements
**Anthropic's Prompt Caching Minimum**: 1024 tokens per cache block

**Current System Prompt Size** (estimated):
- Persona-specific content: ~200 tokens (Kenny K, Lady Muse, etc.)
- Battle Context: ~65 tokens
- Battle Rules: ~65 tokens
- Response Format: ~40 tokens
- **Total per request: ~370 tokens**

**Result**: Too small for caching to activate (need 1024+ tokens)

### What This Means Now

Your implementation is **fully functional** but caching isn't active yet:

```
✅ Code routes to Anthropic SDK
✅ cache_control marker is set
✅ Verses generate normally
✅ Token usage tracked correctly
❌ cachedInputTokens = 0 (prompt too small)
💰 Paying full price for all input tokens
```

**No errors, no issues** - Anthropic simply ignores the cache marker when content < 1024 tokens.

## How Caching Will Activate Automatically

### The Magic Number: 1024 Tokens

Once your system prompt reaches **1024+ tokens**, caching activates automatically:

```
Before (< 1024 tokens):
├─ Request 1: 370 input tokens × $3/M = full price
├─ Request 2: 370 input tokens × $3/M = full price  
└─ Request 3: 370 input tokens × $3/M = full price

After (≥ 1024 tokens):
├─ Request 1: 1024 input tokens × $3/M = full price (cache write)
├─ Request 2: 1024 cached × $0.30/M + new content × $3/M = 90% savings
└─ Request 3: 1024 cached × $0.30/M + new content × $3/M = 90% savings
```

### No Code Changes Required

The implementation is already configured for caching:

**verse-generator.ts (lines 42-46)**:
```typescript
system: [{
  type: "text",
  text: params.systemPrompt,
  cache_control: { type: "ephemeral" }  // ← Already set!
}],
```

**verse-generator.ts (lines 64-70)**:
```typescript
const getUsage = async () => {
  const finalMessage = await stream.finalMessage();
  return {
    inputTokens: finalMessage.usage.input_tokens,
    outputTokens: finalMessage.usage.output_tokens,
    totalTokens: finalMessage.usage.input_tokens + finalMessage.usage.output_tokens,
    cachedInputTokens: finalMessage.usage.cache_read_input_tokens ?? 0,  // ← Already tracking!
  };
};
```

When you add more content and cross the 1024-token threshold:
1. ✅ Anthropic automatically starts caching
2. ✅ `cachedInputTokens` appears in database
3. ✅ Admin dashboard shows cache savings
4. ✅ Zero code changes needed

## How to Reach 1024 Tokens

### Gap to Fill
- Current: ~370 tokens
- Need: 1024+ tokens
- **Gap: ~650 tokens** (~500 words of content)

### Best Places to Add Content

#### 1. Persona-Specific Content (Recommended)
Expand each persona's system prompt with:
- Detailed vocabulary lists (specific artists, terms they use)
- Example lines showing their style
- Things they would/wouldn't say
- References they would make (movies, music, sports)
- Specific battle tactics for their personality

**Example** (adds ~400 tokens):
```typescript
export const kennyKSystemPrompt = `You are "Kenny K"...
[existing content]

YOUR VOCABULARY & REFERENCES:
- Hip-hop: Hieroglyphics, Del, Souls of Mischief, Eligh, Living Legends
- Sports: Warriors, 49ers, Browns, LeBron, Steph Curry
- Turkish Funk: Selda Bağcan, Barış Manço, Erkin Koray
- Kung-fu: 36th Chamber, Five Deadly Venoms, Enter the Dragon
- 90s slang: "dope", "ill", "mad props", "real talk", "word up"

EXAMPLE LINES (style reference):
"I'm dropping wisdom like Eligh on a boom bap beat"
"Your style's more basic than a default MySpace sheet"
"I got that Turkish funk flowing through my cassette collection"
"While you're button-mashing games, I'm perfecting my direction"

THINGS YOU'D NEVER SAY:
- Modern mumble rap references
- TikTok or social media trends  
- Generic cliches like "you're trash"
- Anything breaking the boom bap aesthetic`;
```

#### 2. Battle Technique Guidelines (Shared)
Add to `battleRules.ts`:
- Rhyme scheme examples
- Punchline structure patterns
- Wordplay techniques
- Common mistakes to avoid

**Example** (adds ~300 tokens):
```typescript
export const BATTLE_TECHNIQUES = `
RHYME TECHNIQUES:
- Multisyllabic: "I'm immaculate, you're inadequate"
- Internal rhymes: "I SPIT hot BARS, you HIT rock BOTTOM"
- Assonance: "COLD as ICE, your FLOW's ADVICE"

STRUCTURE PATTERNS:
- Bars 1-2: Setup premise
- Bars 3-4: Build tension
- Bars 5-6: Heighten stakes
- Bars 7-8: Knockout punchline

AVOID:
- Repeating same rhyme sound
- Filler words (yeah, uh)
- Breaking 8-bar rule`;
```

#### 3. Progressive Approach
You don't have to add all at once. Add content organically:

**Phase 1**: Add 200 tokens (still won't cache, but better prompts)
**Phase 2**: Add another 200 tokens (getting closer)
**Phase 3**: Add final 250+ tokens → **🎉 Caching activates!**

## Monitoring Cache Activation

### In Console Logs
```bash
# Before caching (< 1024 tokens):
[Verse Generator] Using Anthropic SDK with prompt caching
# (but cachedInputTokens = 0)

# After caching (≥ 1024 tokens):
[Verse Generator] Using Anthropic SDK with prompt caching
# (cachedInputTokens > 0 starting from request 2)
```

### In Database
```sql
SELECT 
  round,
  persona_id,
  input_tokens,
  cached_input_tokens,
  (cached_input_tokens::float / NULLIF(input_tokens, 0)) * 100 as cache_percentage
FROM battle_token_usage
WHERE battle_id = 'your-battle-id'
ORDER BY created_at;
```

**Before 1024 tokens**:
```
round | input_tokens | cached_input_tokens | cache_percentage
------|--------------|---------------------|------------------
  1   |     370      |          0          |        0%
  2   |     370      |          0          |        0%
```

**After 1024 tokens**:
```
round | input_tokens | cached_input_tokens | cache_percentage
------|--------------|---------------------|------------------
  1   |    1100      |          0          |        0%        (cache write)
  2   |    1100      |       1024          |       93%        (cache hit!)
  3   |    1450      |       1024          |       71%        (partial cache)
```

### In Admin Dashboard
Visit `/admin/dashboard` and look at "Monthly Token Usage":
- **Before**: "Cached Input" = 0
- **After**: "Cached Input" shows growing numbers

## Cost Impact Analysis

### Current Situation (370 tokens, no caching)
```
6-verse battle:
- 6 × 370 input tokens = 2,220 total input tokens
- Cost: 2,220 × $3.00/M = $0.00666
```

### Future Situation (1100 tokens, with caching)
```
6-verse battle:
- Verse 1: 1,100 × $3.00/M = $0.00330 (cache write)
- Verses 2-6: (5 × 80 new) + (5 × 1,024 cached × $0.30/M) = $0.00120 + $0.00154 = $0.00274
- Total: $0.00604

Savings: $0.00062 per battle
Over 1000 battles: ~$0.62 saved
```

**Note**: Real savings depend on:
- How much battle history grows (more tokens = more cache value)
- Cache TTL (5 minutes - verses within 5min benefit most)
- Total battle volume

## Key Takeaways

1. **Current implementation works perfectly** - no caching yet, but fully functional
2. **No code changes needed** - caching activates automatically at 1024+ tokens
3. **Add content organically** - improve prompts for quality, get caching as bonus
4. **Monitor via dashboard** - you'll see `cachedInputTokens` appear when threshold crossed
5. **Future-proof** - works now, works later, scales naturally

## References

- Anthropic Caching Docs: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
- Minimum cache size: 1024 tokens
- Cache TTL: 5 minutes (refreshes on each use)
- Cache discount: ~90% off (varies by model)

---

**Last Updated**: November 2025  
**Status**: Caching configured but inactive (system prompt < 1024 tokens)  
**Next Step**: Add ~650 more tokens of useful content to any persona to activate

