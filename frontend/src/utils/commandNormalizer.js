const WORD_MAP = {
  ple: 'play',
  pley: 'play',
  myoujik: 'music',
  muzic: 'music',
  sng: 'song',
  yutub: 'youtube',
  arijitsinh: 'arijit singh',
  jaarwis: 'jarvis',
  helo: 'hello'
};

function normalizeSpaces(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function stripEdgePunctuation(word) {
  return (word || '').replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '');
}

export function normalizeCommand(text) {
  return normalizeSpaces(text)
    .toLowerCase()
    .split(/\s+/)
    .map((word) => {
      const clean = stripEdgePunctuation(word);
      return WORD_MAP[clean] || clean;
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
