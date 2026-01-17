# YouTube Voice Command Integration

## Overview
JARVIS now supports natural voice commands to search and play content on YouTube. The integration handles both English and Hinglish (romanized Hindi) commands with a friendly, conversational tone.

## Features

### ✅ Intent Detection
- Detects YouTube commands from natural language input
- Works with both explicit ("play on youtube") and implicit ("play music") patterns
- Supports English and Hinglish voice commands
- Handles common ASR (Automatic Speech Recognition) mistakes

### ✅ Keyword Extraction
- Intelligently extracts artist names, song titles, and search queries
- Removes command verbs, filler words, and stop words
- Preserves meaningful search keywords
- Supports multi-word queries (e.g., "arijit singh", "tum hi ho")

### ✅ Natural Voice Feedback
- Randomized, friendly responses in English or Hinglish
- Emotion-aware speech (excited tone for music)
- Matches user's language preference
- Speaks feedback BEFORE opening YouTube tab

### ✅ Browser Integration
- Opens YouTube in new tab with search query
- Respects browser autoplay policies
- Handles popup blockers gracefully
- No DOM manipulation or security violations

## Usage Examples

### English Commands
```
"play arijit singh music"
"open youtube and play tum hi ho"
"play some songs by shreya ghoshal"
"search badshah on youtube"
"youtube open"
```

### Hinglish Commands
```
"jarvis youtube pe tum hi ho chala"
"youtube pe arijit singh ke gaane chala do"
"yaar youtube pe badshah lagao"
"bhai youtube kholo aur atif aslam suna"
"youtube pe kuch gaane chala"
```

### Implicit Commands (Music Context)
```
"play arijit singh songs"
"play some music by atif aslam"
"listen to shreya ghoshal"
```

## Voice Responses

### Hinglish (Randomized)
- "Achha theek hai yaar, YouTube pe {query} chala raha hoon"
- "Haan bhai, {query} YouTube pe laga raha hoon"
- "Theek hai boss, {query} abhi chala raha hoon"
- "Bilkul yaar, YouTube pe {query} play kar raha hoon"

### English (Randomized)
- "Alright, playing {query} on YouTube"
- "Sure, opening {query} on YouTube"
- "Got it, searching {query} on YouTube"
- "Okay, playing {query} for you"

## Implementation Details

### Files Modified/Created

#### 1. `commandService.js` (Enhanced)
- `detectYouTubeCommand()` - Detects YouTube intent from user input
- `buildYouTubeUrl()` - Constructs YouTube search URL
- `extractQuery()` - Extracts clean search keywords
- `detectLanguageMode()` - Identifies Hinglish vs English

#### 2. `youtubeHandler.js` (New)
- `getYouTubeVoiceFeedback()` - Generates natural voice responses
- `buildYouTubeSearchUrl()` - URL builder utility
- `openYouTube()` - Opens YouTube in new tab
- `enhanceQuery()` - Query enhancement logic

#### 3. `App.jsx` (Updated)
- Integrated YouTube command handler
- Added natural voice feedback flow
- Improved error handling for popup blockers

#### 4. `normalizeSpeech.js` (Enhanced)
- Added YouTube-specific word corrections
- Added common artist name normalizations
- Added Hinglish word corrections

## Architecture Flow

```
User Voice Input
    ↓
Speech Recognition (hi-IN + transliteration)
    ↓
normalizeSpeech() - Fix ASR mistakes
    ↓
detectYouTubeCommand() - Intent detection
    ↓
┌─────────────────┬─────────────────┐
│  YouTube CMD    │  Conversation   │
└─────────────────┴─────────────────┘
    ↓                      ↓
extractQuery()         Send to LLM
    ↓                      ↓
detectLanguageMode()   Get response
    ↓                      ↓
getYouTubeVoiceFeedback()  ↓
    ↓                      ↓
Speak feedback (TTS)   Speak response
    ↓                      ↓
openYouTube()          Continue chat
    ↓
Open new tab
```

## Intent Detection Rules

### Trigger Patterns
1. **Explicit YouTube mention**
   - Contains: `youtube`, `yt`, `yutub`, `ytub`
   - Devanagari: `यूट्यूब`, `यूटूब`

2. **Implicit music context**
   - Play intent: `play`, `chala`, `chalao`, `lagao`, `suno`
   - AND Video context: `song`, `songs`, `music`, `gaana`, `gaane`, `video`

### NOT Triggered
- "play game" (no video context)
- "tell me about youtube" (no action verb)
- "how to use youtube" (question, not command)

## Keyword Extraction Logic

### Removed Tokens
- **Wake words**: jarvis, जार्विस
- **YouTube tokens**: youtube, yt, yutub, ytub, यूट्यूब
- **Action verbs**: play, chala, chalao, kholo, lagao, suno
- **Position words**: on, pe, par, mein, in
- **Possessive markers**: ke, ki, ka, ko, se
- **Filler words**: please, yaar, bhai, aur, and

### Preserved Tokens
- Artist names (e.g., "arijit singh")
- Song titles (e.g., "tum hi ho")
- Genre terms if isolated (e.g., "music" alone becomes query)

## Language Detection

### Hinglish Indicators
- Devanagari script present
- Keywords: `chala`, `kholo`, `lagao`, `pe`, `yaar`, `gaane`

### English Indicators
- No Devanagari script
- No Hinglish keywords
- Pure English vocabulary

## Testing

### Run Tests
```javascript
// In browser console
import { runTests } from './utils/test-youtube-commands.js';
runTests();
```

### Test Coverage
- ✅ English commands with explicit YouTube
- ✅ Hinglish commands with YouTube tokens
- ✅ Implicit music commands
- ✅ Wake word removal
- ✅ Keyword extraction accuracy
- ✅ Language detection
- ✅ Non-YouTube commands (negative cases)

## Error Handling

### Popup Blockers
- Graceful failure with user notification
- Error message: "Could not open YouTube. Please allow popups for this site."
- Console warning logged

### Empty Queries
- Falls back to YouTube homepage
- Voice feedback: "Theek hai, YouTube khol raha hoon"

### TTS Failures
- Catches TTS errors silently
- YouTube still opens even if voice fails
- Logs error to console

## Browser Compatibility

### Supported
- ✅ Chrome/Edge (full support)
- ✅ Firefox (with hi-IN voice installed)
- ✅ Safari (limited TTS voices)

### Requirements
- Web Speech API support
- Popup permissions
- JavaScript enabled

## Privacy & Security

### No Security Violations
- ✅ Uses `window.open()` with `noopener,noreferrer`
- ✅ No DOM manipulation of external sites
- ✅ No auto-click hacks
- ✅ Respects browser autoplay policies

### No Backend Calls
- YouTube commands are processed client-side only
- No data sent to LLM backend
- Faster response time
- Works offline for command detection

## Future Enhancements

### Potential Features
- [ ] Playlist support ("play my liked songs")
- [ ] Channel subscriptions ("open veritasium channel")
- [ ] Video duration filters ("play short music videos")
- [ ] Mood-based searches ("play calm music")
- [ ] History tracking ("play what I played yesterday")

### Known Limitations
- Cannot auto-play videos (browser restriction)
- Cannot auto-click first result (XSS protection)
- Popup blockers may prevent tab opening
- Voice recognition accuracy varies by accent

## Troubleshooting

### Command Not Detected
- Check if input contains "youtube", "yt", or music keywords
- Verify normalizeSpeech() is fixing ASR mistakes
- Enable debug logs: Check `[YouTube Command]` console output

### Wrong Query Extracted
- Review extractQuery() regex patterns
- Check if artist/song name is in normalization map
- Verify filler words are being removed

### TTS Not Working
- Check browser's available voices (`speechSynthesis.getVoices()`)
- Verify hi-IN voice installed for Hinglish
- Check microphone permissions
- Look for TTS errors in console

### YouTube Not Opening
- Allow popups for the site
- Check browser's popup blocker settings
- Verify `window.open()` is not blocked by extension
- Check console for errors

## Support

For issues or questions:
1. Check console logs (`[YouTube Command]`, `[TTS]`, `[COMMAND]`)
2. Run test suite to verify detection logic
3. Review ARCHITECTURE.md for system overview
4. Check browser console for errors
