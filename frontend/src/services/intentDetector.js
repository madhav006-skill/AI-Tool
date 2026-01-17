/**
 * Intent Detector
 * Pure deterministic intent detection.
 */

function normalizeSpaces(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

export function detectIntent(normalizedText) {
  const t = (normalizedText || '').toLowerCase();
  if (!t) return { type: 'conversation' };

  // Play intent variants (kept deterministic)
  const hasPlay = /\b(play|chala|chalao|lagao|laga|sunao|suno)\b/.test(t);
  const hasTarget = /\b(youtube|yt|yutub|music|song|songs)\b/.test(t);

  if (hasPlay && hasTarget) {
    return { type: 'command', commandName: 'youtube_play' };
  }

  return { type: 'conversation' };
}

export function extractYouTubeQuery(text) {
  let q = normalizeSpaces(text);

  // Remove fillers anywhere
  q = q.replace(/\b(jarvis|jaarwis|jarwis|hello|helo|please|pls|plz|haan|han|bhai|yaar|yar)\b/gi, ' ');

  // Remove tokens
  q = q
    .replace(/\b(youtube|yt|yutub|ytub)\b/gi, ' ')
    .replace(/\b(play|chala|chalao|chala do|chala de|lagao|laga|lagaa)\b/gi, ' ')
    .replace(/\b(on|in|pe|par|mein|main)\b/gi, ' ')
    .replace(/\b(song|songs|music|gaana|gaane|video|videos)\b/gi, ' ');

  // Trim punctuation edges
  q = q.replace(/^[\s,.;:!?-]+|[\s,.;:!?-]+$/g, ' ');

  return normalizeSpaces(q);
}
