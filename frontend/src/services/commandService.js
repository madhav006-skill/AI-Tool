/**
 * Command Service - YouTube integration only
 * Detect YouTube-related commands and return:
 * {
 *   type: "command" | "conversation",
 *   commandName?: "youtube_play",
 *   query?: string
 * }
 */

function normalizeSpaces(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function stripPunctuationEdges(text) {
  return normalizeSpaces((text || '').replace(/^[\s,.;:!?-]+|[\s,.;:!?-]+$/g, ''));
}

function removeWakeWord(text) {
  // Remove leading wake word variants like: "jarvis," / "jarvis" / "जार्विस" etc.
  return normalizeSpaces(
    (text || '').replace(/^\s*(jarvis|जार्विस|जर्विस)\b\s*[,–-]?\s*/i, '')
  );
}

function looksLikeYouTubeIntent(text) {
  const t = (text || '').toLowerCase();
  return (
    /\byoutube\b/.test(t) ||
    /\byt\b/.test(t) ||
    /[\u0900-\u097F]/.test(text) && /(यूट्यूब|यूटूब)/.test(text)
  );
}

function extractQuery(rawText) {
  let text = removeWakeWord(rawText);

  // Remove obvious YouTube tokens (English + Hindi)
  text = text
    .replace(/\byoutube\b/gi, ' ')
    .replace(/\byt\b/gi, ' ')
    .replace(/यूट्यूब/gi, ' ')
    .replace(/यूटूब/gi, ' ');

  // Remove common intent verbs/phrases in English
  text = text
    .replace(/\b(open|kholo|khol|start|launch)\b/gi, ' ')
    .replace(/\b(play|chala|chalao|chala do|chala de|lagao)\b/gi, ' ')
    .replace(/\b(search|find|look\s*up|dhoond|dhundo|dhundho)\b/gi, ' ')
    .replace(/\b(on)\b/gi, ' ')
    .replace(/\b(pe|par)\b/gi, ' ')
    .replace(/\b(ke|ki|ka)\b/gi, ' ')
    .replace(/\b(gaane|song|songs|music)\b/gi, ' ');

  // Remove common Hindi/Devanagari verbs
  text = text
    .replace(/(खोलो|खोल|चलाओ|चला|चला दो|खोज|खोजो|सर्च|ढूंढो|ढूंढ)/g, ' ')
    .replace(/(पर|पे|में|का|की|के)/g, ' ');

  // Remove filler words
  text = text
    .replace(/\b(please|pls|plz|jarvis)\b/gi, ' ')
    .replace(/\b(aur|and)\b/gi, ' ');

  return stripPunctuationEdges(text);
}

/**
 * Detect YouTube command.
 * IMPORTANT: This function is pure and must not call backend/LLM.
 */
export function detectYouTubeCommand(inputText) {
  const text = normalizeSpaces(inputText);
  if (!text) return { type: 'conversation' };

  // Must include YouTube token OR explicit Hindi token
  if (!looksLikeYouTubeIntent(text)) {
    // Also allow explicit "play X on youtube" where youtube might be missing (keep scope strict: require youtube)
    return { type: 'conversation' };
  }

  const query = extractQuery(text);

  // If user only said "youtube kholo" etc, query can be empty.
  return {
    type: 'command',
    commandName: 'youtube_play',
    ...(query ? { query } : {})
  };
}

export function buildYouTubeUrl(query) {
  const q = normalizeSpaces(query);
  if (!q) return 'https://www.youtube.com/';
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}
