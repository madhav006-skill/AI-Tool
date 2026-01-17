/**
 * Language Detection Service
 * PROMPTS 1-7: Strict language mirroring with Hinglish detection
 * 
 * Language codes:
 * - 'en' = Pure English (respond in English only)
 * - 'hinglish' = Hindi+English mix (respond in Hinglish romanized)
 * - 'hi-script' = Devanagari Hindi (ONLY if user explicitly uses it)
 */

// PROMPT 6: Track conversation language for consistency
let conversationLanguage = null;

/**
 * Hinglish detection keywords
 *
 * IMPORTANT:
 * - Keep this list focused on romanized Hindi words.
 * - Do NOT include common English words (e.g., "are", "help", "issue") otherwise pure English
 *   sentences get misclassified as Hinglish.
 */
const STRONG_HINGLISH_WORDS = [
  // Common verbs
  'kya', 'hai', 'hain', 'tha', 'thi', 'the', 'ho', 'hoon', 'hun',
  'karo', 'karna', 'kar', 'kiya', 'kiye', 'karenge', 'karunga', 'karegi',
  'bolo', 'batao', 'dekho', 'suno', 'jao', 'aao', 'lo', 'do', 'de', 'le',
  'chalo', 'chal', 'raha', 'rahi', 'rahe', 'ruk', 'ja', 'aa', 'likhna',
  'chahiye', 'chahie', 'chahta', 'chahti', 'chaahie',
  'bolna', 'samajhna', 'samajh', 'samajhlo',
  
  // Common nouns/pronouns
  'mein', 'main', 'mai', 'hum', 'tum', 'aap', 'yeh', 'woh', 'wo', 'ye',
  'mujhe', 'tumhe', 'tumko', 'aapko', 'usko', 'isko', 'unko', 'inko',
  'mera', 'meri', 'mere', 'tera', 'teri', 'tere', 'apna', 'apni', 'apne',
  'hamara', 'hamari', 'hamare',
  'koi', 'kuch', 'sab', 'sabko', 'kisne', 'kisko', 'kaun', 'konsa',
  
  // Common adjectives/adverbs
  'achha', 'accha', 'acha', 'theek', 'thik', 'sahi', 'galat', 'bura',
  'bahut', 'zyada', 'kam', 'thoda', 'bohot', 'bohat', 'itna', 'utna',
  'abhi', 'baad', 'pehle', 'phele', 'aaj', 'kal', 'parso',
  'jaldi', 'der',
  
  // Common particles/conjunctions
  'haan', 'han', 'nahi', 'nai', 'na', 'ji', 'bhi', 'toh',
  'aur', 'ya', 'lekin', 'par', 'magar', 'kyunki', 'isliye', 'tabhi',
  'bas', 'sirf', 'phir', 'fir',
  
  // Casual/slang words
  'yaar', 'yar', 'bhai', 'dost', 'arre', 'oye', 'abe',
  'matlab', 'mtlb', 'scene', 'baat', 'baatein', 'bilkul', 'pakka',
  'samajh', 'samjho', 'samjha', 'pata', 'maloom', 'khabar',
  
  // Question words
  'kaise', 'kaisa', 'kaisi', 'kaha', 'kab', 'kyun', 'kyu', 'kitna', 'kitni',
  
  // Greetings/expressions
  'namaste', 'namaskar', 'shukriya', 'dhanyawad', 'alvida', 'chinta',
  'haal', 'chaal'
];

// Weak/ambiguous tokens: helpful as supporting signal but not sufficient alone.
// Intentionally excludes common English words.
const WEAK_HINGLISH_WORDS = [
  'main', 'mai', 'mein',
  'tum', 'aap',
  'aur', 'par', 'lekin',
  'na', 'nahi', 'haan', 'han',
  'kya', 'hai', 'ho', 'toh'
];

/**
 * PROMPT 1, 2, 3: Detect language with strict classification
 * Returns: 'en', 'hinglish', or 'hi-script'
 */
export function detectLanguage(text, forceNew = false) {
  if (!text) return conversationLanguage || 'en';

  const textLower = text.toLowerCase().trim();
  const words = textLower.split(/\s+/);

  // PROMPT 2: Check for Devanagari script (Hindi Unicode)
  const devanagariRegex = /[\u0900-\u097F]/g;
  const hasDevanagari = devanagariRegex.test(text);
  
  const cleaned = words
    .map(w => w.replace(/[.,!?]/g, ''))
    .filter(Boolean);

  // Hinglish scoring: strong Hindi tokens + weak supporting tokens
  const strongCount = cleaned.filter(w => STRONG_HINGLISH_WORDS.includes(w)).length;
  const weakCount = cleaned.filter(w => WEAK_HINGLISH_WORDS.includes(w)).length;
  const strongRatio = cleaned.length > 0 ? strongCount / cleaned.length : 0;
  
  let detectedLanguage;
  
  if (hasDevanagari) {
    // PROMPT 2: Only return 'hi-script' if user explicitly uses Devanagari
    // This is the ONLY case where Hindi script response is allowed
    detectedLanguage = 'hi-script';
    console.log('[LANG] Detected: Hindi script (Devanagari)');
  } else {
    // Detect Hinglish only when we see enough strong Hindi signal.
    // This prevents pure-English phrases like "are you listening" from being misclassified.
    const isHinglish =
      strongCount >= 2 ||
      strongRatio >= 0.2 ||
      (strongCount >= 1 && weakCount >= 2 && cleaned.length >= 3);

    if (isHinglish) {
      detectedLanguage = 'hinglish';
      console.log(`[LANG] Detected: Hinglish (strong=${strongCount}, weak=${weakCount}, ${(strongRatio * 100).toFixed(0)}% strong ratio)`);
    } else {
      detectedLanguage = 'en';
      console.log('[LANG] Detected: English');
    }
  }
  
  // PROMPT 6: Remember language for conversation continuity
  if (forceNew || !conversationLanguage) {
    conversationLanguage = detectedLanguage;
  } else if (detectedLanguage !== conversationLanguage) {
    // Only switch if user clearly changed language
    const switchThreshold = hasDevanagari || strongRatio >= 0.35 || strongCount >= 3;
    if (switchThreshold) {
      console.log(`[LANG] Language switch: ${conversationLanguage} → ${detectedLanguage}`);
      conversationLanguage = detectedLanguage;
    }
  }
  
  return detectedLanguage;
}

/**
 * PROMPT 6: Get current conversation language
 */
export function getConversationLanguage() {
  return conversationLanguage || 'en';
}

/**
 * PROMPT 6: Reset conversation language (for new sessions)
 */
export function resetConversationLanguage() {
  conversationLanguage = null;
}

/**
 * Check if input is a task or conversation
 */
export function isTask(text) {
  const taskKeywords = [
    'open', 'play', 'search', 'youtube', 'google', 'whatsapp', 'send',
    'download', 'website', 'browser', 'spotify', 'music', 'video', 'file',
    'create', 'delete', 'instagram', 'facebook', 'twitter', 'email',
    'gmail', 'message'
  ];

  const textLower = text.toLowerCase();
  return taskKeywords.some(keyword => textLower.includes(keyword));
}

/**
 * PROMPT 5: Get voice profile based on language (voice = text language)
 */
export function getVoiceProfile(language) {
  const voiceMap = {
    'hi-script': 'hi-IN', // Hindi voice for Devanagari only
    'hinglish': 'en-IN',  // Indian English voice for Hinglish
    'en': 'en-US'         // American English for pure English
  };
  return voiceMap[language] || voiceMap['en'];
}

/**
 * PROMPT 7: Validate and get response language code for frontend
 * Maps internal language codes to frontend-compatible codes
 */
export function getResponseLanguageCode(detectedLanguage) {
  // Frontend uses 'hi' for both Hinglish and Hindi script
  // But we need to track this for proper voice selection
  const codeMap = {
    'hi-script': 'hi',    // Devanagari - Hindi TTS
    'hinglish': 'hi',     // Hinglish - but uses Indian English TTS
    'en': 'en'            // English - English TTS
  };
  return codeMap[detectedLanguage] || 'en';
}

/**
 * Build context string from conversation history
 */
export function buildContextString(conversationHistory) {
  if (!conversationHistory || conversationHistory.length === 0) {
    return '(No previous conversation)';
  }

  return conversationHistory
    .map(exchange => `User: ${exchange.user}\nAssistant: ${exchange.assistant}`)
    .join('\n');
}
