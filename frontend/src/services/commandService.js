/**
 * Command Service - YouTube integration with enhanced voice command support
 * Detect YouTube-related commands and return:
 * {
 *   type: "command" | "conversation",
 *   commandName?: "youtube_play",
 *   query?: string,
 *   language?: "en" | "hinglish"
 * }
 */

import { normalizeSpeech } from '../utils/normalizeSpeech';

function normalizeSpaces(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function stripPunctuationEdges(text) {
  return normalizeSpaces((text || '').replace(/^[\s,.;:!?-]+|[\s,.;:!?-]+$/g, ''));
}

/**
 * Remove wake words and common fillers from text
 * This cleans up the input before keyword extraction
 */
function removeWakeWord(text) {
  let cleaned = (text || '');
  
  // Remove wake word variants (beginning of sentence)
  cleaned = cleaned.replace(/^\s*(jarvis|jaarwis|jarwis|जार्विस|जर्विस)\b\s*[,–-]?\s*/i, '');
  
  // Remove common fillers/address words that don't add meaning
  const fillers = [
    'hello', 'helo', 'hallo',
    'please', 'pls', 'plz',
    'haan', 'han', 'ji',
    'bhai', 'yaar', 'yar', 'boss',
    'okay', 'ok', 'okey',
    'arre', 'arey', 'are'
  ];
  
  // Remove fillers only from edges (not middle of query)
  const fillerRegexStart = new RegExp(`^\\s*(${fillers.join('|')})\\b\\s*[,]?\\s*`, 'gi');
  const fillerRegexEnd = new RegExp(`\\s*[,]?\\s*\\b(${fillers.join('|')})\\s*$`, 'gi');
  
  cleaned = cleaned.replace(fillerRegexStart, '');
  cleaned = cleaned.replace(fillerRegexEnd, '');
  
  return normalizeSpaces(cleaned);
}

/**
 * Detect if text contains YouTube intent keywords
 */
function looksLikeYouTubeIntent(text) {
  const t = (text || '').toLowerCase();
  
  // YouTube tokens (English + Hindi/Hinglish)
  const hasYouTubeToken = (
    /\byoutube\b/.test(t) ||
    /\byt\b/.test(t) ||
    /\byutub\b/.test(t) ||
    /\bytub\b/.test(t) ||
    ((/[\u0900-\u097F]/.test(text)) && /(यूट्यूब|यूटूब)/.test(text))
  );
  
  if (hasYouTubeToken) return true;
  
  // Also check for "play on youtube" pattern even without explicit "youtube" word
  // This handles: "play arijit singh music" if context suggests video playback
  const hasPlayIntent = (
    /\b(play|chala|chalao|chala do|lagao|laga|suno|sunao)\b/.test(t)
  );
  
  const hasVideoContext = (
    /\b(video|song|songs|music|gaana|gaane)\b/.test(t)
  );
  
  // Only return true if both play intent AND video context exist
  // This prevents false positives like "play game"
  return hasPlayIntent && hasVideoContext;
}

/**
 * Extract search query from YouTube command
 * Removes command verbs, YouTube tokens, and filler words
 * Returns clean search keywords (artist/song name)
 */
function extractQuery(rawText) {
  let text = removeWakeWord(rawText);

  // Remove YouTube tokens (English + Hindi variants)
  text = text
    .replace(/\byoutube\b/gi, ' ')
    .replace(/\byt\b/gi, ' ')
    .replace(/\byutub\b/gi, ' ')
    .replace(/\bytub\b/gi, ' ')
    .replace(/यूट्यूब/gi, ' ')
    .replace(/यूटूब/gi, ' ');

  // Remove intent verbs (English)
  text = text
    .replace(/\b(open|kholo|khol|start|launch)\b/gi, ' ')
    .replace(/\b(play|chala|chalao|chala do|chala de|lagao|laga|lagaa)\b/gi, ' ')
    .replace(/\b(search|find|look\s*up|dhoond|dhundo|dhundho|dekh|dekho)\b/gi, ' ')
    .replace(/\b(suno|sunao|sun|suna)\b/gi, ' ');

  // Remove position words
  text = text
    .replace(/\b(on|in|pe|par|mein|main)\b/gi, ' ');

  // Remove possessive markers and articles
  text = text
    .replace(/\b(ke|ki|ka|ko|se|ne)\b/gi, ' ')
    .replace(/\b(a|an|the)\b/gi, ' ');

  // Remove "music/song/video" category words ONLY if other keywords remain
  // This preserves "arijit singh music" -> "arijit singh"
  // But keeps "music" if that's all that's left
  const beforeMusicRemoval = text.trim();
  text = text
    .replace(/\b(gaane|gaana|song|songs|music|video|videos)\b/gi, ' ');
  
  const afterMusicRemoval = text.trim();
  // If removing music words left nothing, restore the original
  if (!afterMusicRemoval && beforeMusicRemoval) {
    text = beforeMusicRemoval;
  }

  // Remove common Hindi/Devanagari verbs
  text = text
    .replace(/(खोलो|खोल|चलाओ|चला|चला दो|खोज|खोजो|सर्च|ढूंढो|ढूंढ|सुनो|सुना)/g, ' ')
    .replace(/(पर|पे|में|का|की|के|को|से|ने)/g, ' ');

  // Remove filler words and common expressions
  text = text
    .replace(/\b(please|pls|plz|jarvis|yaar|yar|bhai)\b/gi, ' ')
    .replace(/\b(aur|and|bhi|toh|also)\b/gi, ' ')
    .replace(/\b(kuch|some|thoda)\b/gi, ' ');

  return stripPunctuationEdges(text);
}

/**
 * Detect language mode from the text
 */
function detectLanguageMode(text) {
  const lower = (text || '').toLowerCase();
  
  // Check for Devanagari script
  if (/[\u0900-\u097F]/.test(text)) {
    return 'hinglish'; // Even Devanagari gets romanized response
  }
  
  // Hinglish keywords
  const hinglishWords = [
    'chala', 'chalao', 'kholo', 'khol', 'lagao', 'laga', 'suno', 'sunao',
    'pe', 'par', 'mein', 'yaar', 'bhai', 'gaana', 'gaane',
    'kya', 'hai', 'hoon', 'theek', 'achha', 'acha'
  ];
  
  const hasHinglishWords = hinglishWords.some(word => 
    new RegExp(`\\b${word}\\b`, 'i').test(lower)
  );
  
  return hasHinglishWords ? 'hinglish' : 'en';
}

/**
 * Detect YouTube command.
 * IMPORTANT: This function is pure and must not call backend/LLM.
 * Returns command object with type, commandName, query, and language
 */
export function detectYouTubeCommand(inputText) {
  // Step 1: Normalize common ASR mistakes
  const normalized = normalizeSpeech(inputText);
  const text = normalizeSpaces(normalized);
  if (!text) return { type: 'conversation' };

  // Step 2: Check for YouTube intent
  if (!looksLikeYouTubeIntent(text)) {
    return { type: 'conversation' };
  }

  // Step 3: Extract search keywords
  const query = extractQuery(text);

  // Step 4: Detect language mode
  const language = detectLanguageMode(text);

  console.log('[YouTube Command]', {
    original: inputText,
    normalized: text,
    query,
    language
  });

  // Return command object
  return {
    type: 'command',
    commandName: 'youtube_play',
    query: query || '', // Empty query = just open YouTube
    language
  };
}

export function buildYouTubeUrl(query) {
  const q = normalizeSpaces(query);
  if (!q) return 'https://www.youtube.com/';
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}
