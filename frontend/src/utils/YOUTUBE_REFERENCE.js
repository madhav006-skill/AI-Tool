/**
 * YOUTUBE VOICE COMMAND - DEVELOPER QUICK REFERENCE
 * ================================================
 * 
 * OVERVIEW
 * --------
 * This module enables natural voice commands to search and play YouTube content.
 * Supports English and Hinglish with friendly, conversational responses.
 * 
 * KEY FILES
 * ---------
 * - commandService.js: Intent detection & keyword extraction
 * - youtubeHandler.js: URL building & voice feedback generation
 * - App.jsx: Integration with voice pipeline
 * - normalizeSpeech.js: ASR error correction
 * 
 * QUICK START
 * -----------
 * 
 * 1. DETECT YOUTUBE COMMAND
 *    const cmd = detectYouTubeCommand(userInput);
 *    // Returns: { type, commandName, query, language }
 * 
 * 2. BUILD YOUTUBE URL
 *    const url = buildYouTubeUrl(cmd.query);
 *    // Returns: https://www.youtube.com/results?search_query=...
 * 
 * 3. GET VOICE FEEDBACK
 *    const feedback = getYouTubeVoiceFeedback(cmd.query, cmd.language);
 *    // Returns natural response: "Achha theek hai yaar, YouTube pe {query} chala raha hoon"
 * 
 * 4. OPEN YOUTUBE
 *    const success = openYouTube(url);
 *    // Opens new tab, returns true/false
 * 
 * EXAMPLE USAGE IN APP
 * --------------------
 * 
 * const cmd = detectYouTubeCommand(message);
 * if (cmd.type === 'command' && cmd.commandName === 'youtube_play') {
 *   const url = buildYouTubeUrl(cmd.query);
 *   const feedback = getYouTubeVoiceFeedback(cmd.query, cmd.language);
 *   
 *   // Speak feedback
 *   await voiceOutputService.speak(feedback, cmd.language === 'hinglish' ? 'hi' : 'en');
 *   
 *   // Open YouTube
 *   openYouTube(url);
 *   
 *   return; // Don't send to backend
 * }
 * 
 * COMMAND EXAMPLES
 * ----------------
 * English:
 *   "play arijit singh music"           → query: "arijit singh"
 *   "open youtube and play tum hi ho"   → query: "tum hi ho"
 *   "youtube open"                      → query: ""
 * 
 * Hinglish:
 *   "youtube pe arijit singh chala"     → query: "arijit singh"
 *   "yaar badshah lagao youtube pe"     → query: "badshah"
 *   "youtube kholo"                     → query: ""
 * 
 * INTENT DETECTION LOGIC
 * ----------------------
 * Triggers when:
 *   1. Contains "youtube", "yt", "yutub", etc.
 *   OR
 *   2. Contains play verb (play/chala/lagao) + music context (song/music/gaana)
 * 
 * NOT triggered:
 *   - "play chess" (no music context)
 *   - "tell me about youtube" (no action verb)
 * 
 * KEYWORD EXTRACTION
 * ------------------
 * Removes:
 *   - Wake words: jarvis
 *   - YouTube tokens: youtube, yt
 *   - Action verbs: play, chala, lagao, kholo
 *   - Position words: on, pe, par
 *   - Fillers: please, yaar, bhai, aur
 * 
 * Preserves:
 *   - Artist names: arijit singh, atif aslam
 *   - Song titles: tum hi ho
 *   - Genre: music (if alone)
 * 
 * LANGUAGE DETECTION
 * ------------------
 * Hinglish if:
 *   - Contains Devanagari script
 *   - Contains keywords: chala, kholo, pe, yaar, gaane
 * 
 * English otherwise
 * 
 * VOICE FEEDBACK
 * --------------
 * Randomized responses:
 * 
 * Hinglish:
 *   - "Achha theek hai yaar, YouTube pe {query} chala raha hoon"
 *   - "Haan bhai, {query} YouTube pe laga raha hoon"
 *   - "Theek hai boss, {query} abhi chala raha hoon"
 * 
 * English:
 *   - "Alright, playing {query} on YouTube"
 *   - "Sure, opening {query} on YouTube"
 *   - "Got it, searching {query} on YouTube"
 * 
 * TESTING
 * -------
 * Run test suite:
 *   import { runTests } from './utils/test-youtube-commands.js';
 *   runTests();
 * 
 * Debug logs:
 *   [YouTube Command] - Command detection results
 *   [COMMAND] - App-level command handling
 *   [TTS] - Voice feedback
 * 
 * ADDING NEW ARTISTS/SONGS
 * -------------------------
 * Edit normalizeSpeech.js:
 * 
 * const NORMALIZATION_MAP = {
 *   // Add new artist
 *   "karan": "karan aujla",
 *   "karana": "karan aujla",
 *   
 *   // Add new song
 *   "kesariya": "kesariya",
 *   "kesaria": "kesariya"
 * };
 * 
 * COMMON ISSUES
 * -------------
 * 
 * 1. Command not detected
 *    → Check console: [YouTube Command] output
 *    → Verify input contains "youtube" or play+music keywords
 * 
 * 2. Wrong query extracted
 *    → Check normalizeSpeech() mappings
 *    → Review extractQuery() regex patterns
 * 
 * 3. TTS not working
 *    → Verify hi-IN voice installed
 *    → Check speechSynthesis.getVoices()
 * 
 * 4. YouTube won't open
 *    → Allow popups in browser
 *    → Check popup blocker settings
 * 
 * ERROR HANDLING
 * --------------
 * - Popup blocked: Shows error message to user
 * - Empty query: Opens YouTube homepage
 * - TTS fails: Opens YouTube anyway, logs error
 * - No backend calls: All processing is client-side
 * 
 * BROWSER COMPATIBILITY
 * ---------------------
 * ✅ Chrome/Edge (full support)
 * ✅ Firefox (with hi-IN voice)
 * ⚠️ Safari (limited voices)
 * 
 * SECURITY
 * --------
 * - Uses window.open() with noopener,noreferrer
 * - No DOM manipulation
 * - No auto-click hacks
 * - Client-side only (no backend)
 * 
 * PERFORMANCE
 * -----------
 * - Detection: < 1ms (regex-based)
 * - No LLM calls (instant response)
 * - No network requests (client-side)
 * - Voice feedback: ~1-2 seconds
 * 
 * API REFERENCE
 * -------------
 * 
 * detectYouTubeCommand(inputText: string): CommandResult
 *   Returns: {
 *     type: 'command' | 'conversation',
 *     commandName?: 'youtube_play',
 *     query?: string,
 *     language?: 'en' | 'hinglish'
 *   }
 * 
 * buildYouTubeUrl(query: string): string
 *   Returns: YouTube search URL or homepage
 * 
 * getYouTubeVoiceFeedback(query: string, language: string): string
 *   Returns: Natural voice response (randomized)
 * 
 * openYouTube(url: string): boolean
 *   Returns: true if successful, false if blocked
 * 
 * normalizeSpeech(text: string): string
 *   Returns: Normalized text with ASR corrections
 * 
 * CUSTOMIZATION
 * -------------
 * 
 * Change voice responses:
 *   → Edit youtubeHandler.js: hinglishResponses/englishResponses arrays
 * 
 * Add new command patterns:
 *   → Edit commandService.js: looksLikeYouTubeIntent()
 * 
 * Modify keyword extraction:
 *   → Edit commandService.js: extractQuery()
 * 
 * Add ASR corrections:
 *   → Edit normalizeSpeech.js: NORMALIZATION_MAP
 */

// This file serves as inline documentation
// No code execution - just reference
export const YOUTUBE_INTEGRATION_REFERENCE = {
  version: '1.0.0',
  lastUpdated: '2026-01-17',
  status: 'Production Ready'
};
