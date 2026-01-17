/**
 * Speech Normalization Utility
 * Corrects common ASR misrecognitions for English and Hinglish
 * MUST be applied BEFORE intent detection
 */

const NORMALIZATION_MAP = {
  // ===== CRITICAL ASR FIXES =====
  // Play command variations
  ple: "play",
  pley: "play",
  plae: "play",
  plai: "play",
  pla: "play",
  plei: "play",

  // YouTube variations (ASR often mangles this)
  yutub: "youtube",
  ytub: "youtube",
  youtub: "youtube",
  yutube: "youtube",
  yuotube: "youtube",
  utube: "youtube",
  utub: "youtube",
  youtoob: "youtube",
  yootube: "youtube",
  yootub: "youtube",

  // Music variations
  myoujik: "music",
  myujik: "music",
  myusik: "music",
  musik: "music",
  mjusic: "music",
  moosic: "music",
  musick: "music",
  mujik: "music",

  // Song variations
  sng: "song",
  sung: "song",
  songg: "song",
  sang: "song",
  songz: "songs",

  // Singh (common surname)
  sinh: "singh",
  sing: "singh",
  singg: "singh",
  sigh: "singh",

  // Jarvis/Wake word variations
  jaarwis: "jarvis",
  jarwis: "jarvis",
  jarves: "jarvis",
  jaavis: "jarvis",
  jawis: "jarvis",
  jervis: "jarvis",

  // Hello variations
  helo: "hello",
  hallo: "hello",
  hllo: "hello",
  ello: "hello",

  // Hi/Ho variations
  hee: "hi",
  hii: "hi",
  ho: "ho",
  hoo: "ho",

  // On variations
  hon: "on",
  aan: "on",
  onn: "on",

  // ===== ARTIST NAMES =====
  arijit: "arijit",
  arijeet: "arijit",
  arijeeth: "arijit",
  arjit: "arijit",
  arijith: "arijit",
  arjeeth: "arijit",
  
  atif: "atif",
  ateef: "atif",
  aatif: "atif",
  
  shreya: "shreya",
  shriya: "shreya",
  shrea: "shreya",
  
  sonu: "sonu",
  sonoo: "sonu",
  
  neha: "neha",
  neeha: "neha",
  
  badshah: "badshah",
  badshaah: "badshah",
  badsha: "badshah",
  
  jubin: "jubin",
  jubeen: "jubin",

  // ===== HINGLISH COMMAND WORDS =====
  // Tum Hi Ho (popular song)
  tum: "tum",
  tumhee: "tum hi",
  heeho: "hi ho",
  tumhi: "tum hi",
  hiho: "hi ho",
  
  // Position words
  pe: "pe",
  par: "par",
  pey: "pe",
  
  // Action verbs
  kholo: "kholo",
  kholdo: "khol do",
  chala: "chala",
  chalao: "chala",
  chalaa: "chala",
  chalado: "chala do",
  chalade: "chala de",
  lagao: "lagao",
  lagaa: "laga",
  lagado: "laga do",
  sunao: "sunao",
  suno: "suno",
  bajao: "bajao",
  baja: "baja",
  search: "search",
  karo: "karo",
  
  // Common expressions
  achha: "achha",
  acha: "achha",
  accha: "achha",
  theek: "theek",
  thik: "theek",
  theekhai: "theek hai",
  
  // Fillers/Address words
  yaar: "yaar",
  yar: "yaar",
  yaaar: "yaar",
  bhai: "bhai",
  bhi: "bhi",
  haan: "haan",
  han: "haan",
  ji: "ji",
  
  // Gaana/Song in Hindi
  gaana: "gaana",
  gana: "gaana",
  gaane: "gaane",
  gane: "gaane",
  gaaney: "gaane"
};

/**
 * Minimal Hinglish/ASR normalization requested by the product spec.
 * Use this BEFORE intent detection and keyword extraction.
 */
export function normalizeHinglish(text = "") {
  const map = {
    ple: "play",
    myoujik: "music",
    sng: "song",
    yutub: "youtube",
    jaarwis: "jarvis",
    helo: "hello"
  };

  return (text || "")
    .toLowerCase()
    .split(/\s+/)
    .map((word) => {
      const cleanWord = word.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, "");
      return map[cleanWord] || cleanWord;
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalize ASR output to fix common spelling mistakes
 * MUST be called BEFORE intent detection and keyword extraction
 * @param {string} text - Raw ASR output
 * @returns {string} - Normalized text with corrected spellings
 */
export function normalizeSpeech(text = "") {
  if (!text || typeof text !== 'string') return "";

  // Step 0: Apply required Hinglish normalization first
  const base = normalizeHinglish(text);

  // Step 1: Lowercase and split
  let words = base.toLowerCase().split(/\s+/);
  
  // Step 2: Apply word-level normalization
  words = words.map(word => {
    // Remove punctuation from word edges for matching
    const cleanWord = word.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '');
    const normalized = NORMALIZATION_MAP[cleanWord];
    // Prefer normalized token; otherwise keep cleaned token (avoids carrying punctuation/noise)
    return normalized || cleanWord;
  });
  
  // Step 3: Handle multi-word corrections (join and re-check)
  let result = words.join(" ").replace(/\s+/g, " ").trim();
  
  // Common multi-word ASR mistakes
  result = result
    .replace(/tum\s+hee/gi, 'tum hi')
    .replace(/hee\s+ho/gi, 'hi ho')
    .replace(/chala\s+do/gi, 'chala do')
    .replace(/khol\s+do/gi, 'khol do')
    .replace(/laga\s+do/gi, 'laga do')
    .replace(/theek\s+hai/gi, 'theek hai');
  
  return result;
}
