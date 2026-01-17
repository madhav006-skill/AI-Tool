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

import { normalizeCommandText, stripWakeWordAndEdgeFillers } from './commandNormalizer';
import { detectIntent, extractYouTubeQuery } from './intentDetector';

function normalizeSpaces(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
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
  // Step 1: Normalize Hinglish/ASR mistakes (MANDATORY)
  const text = normalizeCommandText(inputText);
  if (!text) return { type: 'conversation' };

  // Step 2: Strip wake words/fillers on edges, then detect intent
  const cleaned = stripWakeWordAndEdgeFillers(text);
  const intent = detectIntent(cleaned);
  if (intent.type !== 'command' || intent.commandName !== 'youtube_play') return { type: 'conversation' };

  // Step 3: Extract search keywords
  const query = extractYouTubeQuery(cleaned);

  // Step 4: Detect language mode
  const language = detectLanguageMode(text);

  console.log('[YouTube Command]', {
    original: inputText,
    normalized: cleaned,
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
