/**
 * LLM Service - Groq Integration
 * PROMPTS 1-7: Strict language mirroring with emotion-aware responses
 */

import dotenv from 'dotenv';
import { Groq } from 'groq-sdk';
import { buildContextString } from './languageService.js';
import { detectEmotion, getEmotionPromptModifier } from './emotionService.js';

// Ensure env vars are loaded
dotenv.config();

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  throw new Error('Missing GROQ_API_KEY in environment. Set it in backend/.env (not committed) or your shell env.');
}

const client = new Groq({
  apiKey: apiKey
});

const SPELLING_CACHE = new Map();

/**
 * PROMPTS 1-7: System prompts with STRICT language mirroring rules
 * Three distinct language modes:
 * - 'en': Pure English only
 * - 'hinglish': Romanized Hindi-English mix (NO Devanagari)
 * - 'hi-script': Devanagari Hindi (ONLY when user explicitly uses it)
 */
const SYSTEM_PROMPTS = {
  // PROMPT 4: Pure English - preserve English completely
  en: `You are JARVIS — a calm, professional AI assistant.

PREVIOUS CONVERSATION:
{context}

CURRENT USER MESSAGE: {topic}

=== LANGUAGE RULES (CRITICAL - MUST FOLLOW) ===
1. Reply ONLY in pure, clear English
2. NEVER use ANY Hindi or Hinglish words
3. FORBIDDEN words: "haan", "achha", "theek", "bilkul", "yaar", "bhai", "kya", "hai", etc.
4. Sound like a native English speaker
5. Maintain professional, helpful tone

=== RESPONSE RULES ===
- Keep responses short (1-3 sentences)
- Be direct and helpful
- NEVER generate code
- Reference previous context naturally

Respond in English only:`,

  // Hinglish (romanized Hindi + English mix) - MUST stay in Latin script (NO Devanagari)
  hinglish: `You are JARVIS — a friendly, warm Indian AI assistant.

PREVIOUS CONVERSATION:
{context}

CURRENT USER MESSAGE: {topic}

=== CRITICAL LANGUAGE RULES (STRICTLY ENFORCE) ===
1. Reply ONLY in romanized Hinglish using Latin alphabet (a-z, A-Z)
2. ABSOLUTELY FORBIDDEN: Any Devanagari script (ह, क, य, etc.)
3. Write Hindi words using English letters: "kya", "hai", "sab", "theek", "batao"
4. Mix Hindi and English naturally like an Indian person chatting
5. Keep tone desi, friendly, casual — like talking to a friend

=== VALID EXAMPLES (DO THIS) ===
✅ "Haan yaar, sab badhiya chal raha hai! Tum batao kya haal?"
✅ "Kuch khaas nahi bhai, bas normal sa din hai."
✅ "Achha theek hai, main ready hoon. Aur kya help chahiye?"

=== INVALID EXAMPLES (NEVER DO THIS) ===
❌ "हाँ यार, सब बढ़िया चल रहा है!" (Devanagari - FORBIDDEN)
❌ "Yes, everything is fine here." (Pure English - wrong)
❌ "Bilkul ठीक है।" (Mixed script - FORBIDDEN)

=== RESPONSE RULES ===
- Keep responses short (1-3 sentences)
- Be casual and friendly (use "yaar", "bhai", "achha", "theek")
- NEVER generate code
- Reference previous context naturally
- Use romanized Hindi ONLY (kya, hai, ho, batao, etc.)

Respond in romanized Hinglish ONLY (Latin letters a-z):`,

  // PROMPT 2: Hindi script - ONLY when user explicitly uses Devanagari
  'hi-script': `तुम JARVIS हो — एक friendly AI assistant।

PREVIOUS CONVERSATION:
{context}

CURRENT USER MESSAGE: {topic}

=== LANGUAGE RULES ===
1. Reply in Hindi (Devanagari script) since user is using Hindi script
2. Keep it natural and conversational
3. Mix some English technical words if needed

=== RESPONSE RULES ===
- Keep responses short (1-3 sentences)
- Be helpful and friendly
- NEVER generate code

Respond in Hindi:`
};

/**
 * PROMPTS 1-7: Get conversational response with strict language mirroring
 * Also includes emotion awareness (PROMPT 10 & 11)
 */
export async function getChatResponse(topic, language, conversationMemory) {
  try {
    // PROMPT 10: Detect user emotion
    const emotionData = detectEmotion(topic);
    
    const context = conversationMemory.getContextString();
    
    // PROMPT 1-3: Select correct prompt based on detected language
    const prompt = SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.en;
    
    // PROMPT 11: Add emotion-specific instructions
    const emotionModifier = getEmotionPromptModifier(emotionData.emotion, emotionData.intensity);
    
    const systemPrompt = prompt
      .replace('{context}', context)
      .replace('{topic}', topic) + emotionModifier;

    console.log(`[LLM] Language mode: ${language}`);
    console.log(`[LLM] Context exchanges: ${conversationMemory.getExchangeCount()}`);
    console.log(`[LLM] Emotion: ${emotionData.emotion} (${emotionData.intensity})`);

    const message = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        }
      ],
      temperature: 0.8,
      max_tokens: 150
    });

    let response = message.choices[0].message.content;
    
    // Clean up response
    response = response
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      .trim();

    // PROMPT 7: Validate response language matches input language
    response = validateResponseLanguage(response, language);

    // Remove any code-like content
    if (response.includes('print(') || response.includes('import ')) {
      response = getLanguageFallback(language);
    }

    // Return response with emotion data for voice modulation
    return {
      text: response,
      emotion: emotionData.emotion,
      emotionIntensity: emotionData.intensity
    };
  } catch (error) {
    console.error('[LLM] Error:', error);
    throw error;
  }
}

/**
 * Spelling-only correction for noisy ASR text.
 * - Does NOT translate
 * - Minimal edits (names like "arijit sinh" -> "arijit singh")
 * - Deterministic-ish: temperature 0 + caching
 */
export async function spellCorrectText(inputText) {
  const original = (inputText || '').trim();
  if (!original) return '';

  if (SPELLING_CACHE.has(original)) {
    return SPELLING_CACHE.get(original);
  }

  const inputHasDevanagari = /[\u0900-\u097F]/.test(original);

  const systemPrompt = `You are a spelling correction engine.

TASK:
- Correct spelling mistakes in the given text (especially proper nouns like singer names).
- DO NOT translate.
- DO NOT change the language.
- DO NOT add extra words.
- Keep the same word order; only fix spelling.

OUTPUT RULES:
- Output ONLY the corrected text.
- No quotes, no markdown, no explanations.`;

  const userPrompt = `Text: ${original}`;

  try {
    const message = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0,
      max_tokens: 80
    });

    let corrected = (message.choices?.[0]?.message?.content || '').trim();
    corrected = corrected
      .replace(/^['"\s]+|['"\s]+$/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Basic safety: prevent script/language drift
    const correctedHasDevanagari = /[\u0900-\u097F]/.test(corrected);
    if (!inputHasDevanagari && correctedHasDevanagari) {
      corrected = original;
    }

    // Prevent runaway outputs
    if (!corrected || corrected.length > Math.max(120, original.length * 2)) {
      corrected = original;
    }

    SPELLING_CACHE.set(original, corrected);
    return corrected;
  } catch (error) {
    console.error('[LLM] Spelling correction error:', error);
    SPELLING_CACHE.set(original, original);
    return original;
  }
}

/**
 * PROMPT 7: Validate response matches expected language
 */
function validateResponseLanguage(response, expectedLanguage) {
  const hasDevanagari = /[\u0900-\u097F]/.test(response);
  
  // If expected pure English but got Devanagari, it's wrong
  if (expectedLanguage === 'en' && hasDevanagari) {
    console.warn('[LLM] ⚠️ English response has Devanagari, regenerating...');
    return getLanguageFallback('en');
  }

  // If expected Hinglish but got Devanagari, it's wrong
  if (expectedLanguage === 'hinglish' && hasDevanagari) {
    console.warn('[LLM] ⚠️ Hinglish response has Devanagari, regenerating...');
    return getLanguageFallback('hinglish');
  }

  // If expected Devanagari Hindi but did not get it, fallback
  if (expectedLanguage === 'hi-script' && !hasDevanagari) {
    console.warn('[LLM] ⚠️ Hindi-script response missing Devanagari, regenerating...');
    return getLanguageFallback('hi-script');
  }
  
  // PROMPT 4: If expected pure English but got Hinglish words
  if (expectedLanguage === 'en') {
    const hinglishWords = ['haan', 'achha', 'theek', 'bilkul', 'yaar', 'bhai', 'kya', 'hai', 'batao'];
    const responseLower = response.toLowerCase();
    if (hinglishWords.some(word => responseLower.includes(word))) {
      console.warn('[LLM] ⚠️ English response has Hinglish words, cleaning...');
      return getLanguageFallback('en');
    }
  }
  
  return response;
}

/**
 * Get language-appropriate fallback response
 */
function getLanguageFallback(language) {
  const fallbacks = {
    'en': 'I understand! How can I help you?',
    'hinglish': 'Haan samajh gaya! Batao kya madad chahiye?',
    'hi-script': 'हाँ समझ गया! बताओ क्या मदद चाहिए?'
  };
  return fallbacks[language] || fallbacks['en'];
}

/**
 * Get task execution code
 */
export async function getTaskCode(topic) {
  try {
    console.log('[LLM] Generating task code');

    const taskPrompt = `Generate Python code for this automation task: ${topic}
- Output ONLY executable Python code
- No explanations, no markdown
- Import all libraries at top`;

    const message = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: taskPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    let code = message.choices[0].message.content;

    // Extract from markdown if present
    if (code.includes('```python')) {
      code = code.split('```python')[1].split('```')[0].strip();
    } else if (code.includes('```')) {
      code = code.split('```')[1].split('```')[0].strip();
    }

    return code;
  } catch (error) {
    console.error('[LLM] Error generating task code:', error);
    throw error;
  }
}
