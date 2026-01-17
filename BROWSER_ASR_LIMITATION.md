# 🚨 CRITICAL: Browser ASR Limitation

## The Problem

**Browser SpeechRecognition API CANNOT reliably mix Hindi (hi-IN) and English (en-IN) models.**

Attempting to switch between language models causes:
- Empty transcripts
- Recognition failure
- Microphone hanging
- No words captured

## The Solution

**DO NOT SWITCH `recognition.lang` WHILE THE MIC IS RUNNING.**

Instead, choose **one** ASR language per mic session:
- `hi-IN` for Hindi/Hinglish (best overall for Indian speech)
- `en-IN` for pure English

In the app we support **ASR: Auto** (recommended):
- On each mic start, we pick `en-IN` or `hi-IN` once for that session.
- We never change it mid-session.

### What This Means

| User Says | ASR Language | ASR Output | Result |
|-----------|-------------|------------|---------|
| "hello how are you" | `en-IN` | "hello how are you" | ✅ Perfect |
| "aur batao kya haal chaal" | `hi-IN` | "aur batao kya haal chaal" | ✅ Better capture |
| "नमस्ते कैसे हो" (spoken Hindi) | `hi-IN` | "नमस्ते कैसे हो" OR phonetic | ✅ Better capture |
| "bhai please help karo" (Hinglish) | `hi-IN` | "bhai please help karo" | ✅ Better capture |

## Why Phonetic Hindi is CORRECT

ASR's job: **Capture spoken words as text**
- Hindi spoken → Phonetic text = SUCCESS
- "namaste" is a valid transcription of "नमस्ते"

Language intelligence happens AFTER ASR:
- Backend detects language from text
- Response language chosen appropriately
- TTS uses correct voice/accent

Backend language mirroring rules:
- `en` → reply in English
- `hinglish` → reply in romanized Hinglish (Latin letters only)
- `hi-script` → reply in Hindi (Devanagari)

## What NOT To Do

❌ **NEVER** switch ASR language while the mic is running:
```javascript
// ❌ often breaks recognition when changed mid-session
this.recognition.lang = 'hi-IN';
this.recognition.lang = 'en-IN';
```

❌ **NEVER** auto-detect and switch languages:
```javascript
// ❌ CAUSES FAILURES
if (isHindi(text)) {
    this.recognition.lang = 'hi-IN';  // DON'T DO THIS
}
```

❌ **NEVER** expect Devanagari script from microphone:
```javascript
// ❌ UNREALISTIC EXPECTATION
// User says: "namaste"
// ASR will NOT output: "नमस्ते"
// ASR WILL output: "namaste" ✅
```

## How Production Systems Work

**Google Assistant, Alexa, ChatGPT Voice:**
- Use custom ASR engines (NOT browser SpeechRecognition)
- Have multilingual models trained on code-mixed speech
- Can handle Devanagari output

**Browser SpeechRecognition:**
- Uses Google Cloud Speech API (free tier, limited)
- Cannot handle language switching
- Best with single-language model

**Our Solution:**
- Accept browser limitations
- Use **ASR: Auto** (session-based `hi-IN`/`en-IN`)
- Handle language intelligence in backend
- **THIS IS THE CORRECT APPROACH**

## Evidence

Multiple debugging sessions showed:
1. Switching between `en-IN` and `hi-IN` mid-session → Recognition breaks
2. Single-language per session is stable
3. `hi-IN` often captures Hindi/Hinglish better; `en-IN` is best for pure English

## Implementation

**voiceInputService.js:**
```javascript
// ⚠️ CRITICAL: pick ONE per session; do not change mid-session
this.recognition.lang = 'hi-IN'; // or 'en-IN'
```

**App.jsx:**
```javascript
// Language switching DISABLED at ASR level
// Language handled at backend/response level
```

## Success Criteria

✅ English: "hello" → Captured as "hello" (ASR `en-IN`)
✅ Hinglish: "aur batao" → Captured as "aur batao" (ASR `hi-IN`)
✅ Hindi: "नमस्ते" (spoken) → Captured reliably (ASR `hi-IN`)

## Final Word

**This is not a bug. This is not a workaround. This is the correct architecture.**

Browser ASR is for speech-to-text.
Language intelligence is for text-to-meaning.
Separate concerns. Works reliably.
