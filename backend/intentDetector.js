export function detectIntent(text) {
  const t = (text || '').trim();
  if (!t) return { type: 'CHAT' };

  const lower = t.toLowerCase();

  // Deterministic rule: play-intent at start => YOUTUBE_PLAY
  const match = lower.match(/^(play|chala|chalao|lagao|laga|suno|sunao)\b\s*(.*)$/i);
  if (match) {
    const query = (t.slice(match[1].length) || '').trim();
    return {
      type: 'YOUTUBE_PLAY',
      query
    };
  }

  return { type: 'CHAT' };
}
