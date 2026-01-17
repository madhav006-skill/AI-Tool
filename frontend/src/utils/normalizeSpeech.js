/**
 * Speech Normalization Utility
 * Corrects common ASR misrecognitions for English and Hinglish
 */

const NORMALIZATION_MAP = {
  // Common commands
  ple: "play",
  pley: "play",
  plae: "play",
  plai: "play",

  yutub: "youtube",
  ytub: "youtube",
  youtub: "youtube",
  yutube: "youtube",
  yuotube: "youtube",

  myoujik: "music",
  myujik: "music",
  myusik: "music",
  musik: "music",
  mjusic: "music",

  sinh: "singh",
  sing: "singh",
  singg: "singh",

  hee: "hi",
  ho: "ho",
  hon: "on",
  n: "on",
  aan: "on",

  // Names
  arijit: "arijit",
  arijeet: "arijit",
  arijeeth: "arijit",
  arjit: "arijit",

  tum: "tum",
  tumhee: "tum hi",
  heeho: "hi ho",
  
  // Additional common words
  pe: "pe",
  par: "par",
  kholo: "kholo",
  chala: "chala",
  chalao: "chala",
  lagao: "lagao",
  search: "search",
  karo: "karo",
  
  // English words often mispronounced
  song: "song",
  songs: "songs",
  gaane: "gaane",
  gaana: "gaana"
};

export function normalizeSpeech(text = "") {
  if (!text || typeof text !== 'string') return "";
  
  let words = text.toLowerCase().split(/\s+/);
  
  words = words.map(word => NORMALIZATION_MAP[word] || word);
  
  return words.join(" ");
}
