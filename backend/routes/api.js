/**
 * API Routes for JARVIS Backend
 * PROMPTS 1-7: Strict language mirroring
 */

import express from 'express';
import { 
  detectLanguage, 
  isTask, 
  getVoiceProfile, 
  getResponseLanguageCode,
  getConversationLanguage,
  resetConversationLanguage 
} from '../services/languageService.js';
import { getChatResponse } from '../services/llmService.js';

const router = express.Router();

/**
 * POST /api/respond
 * PROMPTS 1-7: Get AI response with strict language mirroring
 */
router.post('/respond', async (req, res) => {
  try {
    const { userMessage, conversationMemory, newSession, detectedLanguage: frontendLang } = req.body;

    if (!userMessage) {
      return res.status(400).json({ error: 'userMessage is required' });
    }

    // PROMPT 6: Reset language memory for new sessions
    if (newSession) {
      resetConversationLanguage();
    }

    // CRITICAL: Use frontend's language detection (it knows ASR context)
    // Frontend decides between English vs Hinglish
    // Backend NEVER uses 'hi-script' unless explicitly requested
    let detectedLanguage = 'hinglish'; // Default to Hinglish for hi-IN ASR
    
    if (frontendLang === 'hinglish') {
      detectedLanguage = 'hinglish'; // Romanized Hinglish response
    } else if (frontendLang === 'english') {
      detectedLanguage = 'en'; // Pure English response
    } else if (frontendLang === 'hi-script') {
      detectedLanguage = 'hi-script'; // Only if user explicitly types Devanagari
    } else if (frontendLang) {
      // Any other frontend hint
      detectedLanguage = frontendLang;
    }
    // Note: We don't use backend detectLanguage() for voice input
    // because hi-IN ASR outputs Devanagari but user wants romanized response
    
    // PROMPT 5: Get voice profile that matches text language
    const voiceProfile = getVoiceProfile(detectedLanguage);
    
    // PROMPT 7: Get frontend-compatible language code
    const languageCode = getResponseLanguageCode(detectedLanguage);

    console.log(`[API] User message: "${userMessage.substring(0, 50)}..."`);
    console.log(`[API] Detected language: ${detectedLanguage}`);
    console.log(`[API] Voice profile: ${voiceProfile}`);

    // Convert memory array to context string
    let memoryContext = '(No previous conversation)';
    if (conversationMemory && conversationMemory.length > 0) {
      memoryContext = conversationMemory
        .map(ex => `User: ${ex.user}\\nAssistant: ${ex.assistant}`)
        .join('\\n');
    }

    // Create memory object for LLM call
    const tempMemory = {
      getContextString: () => memoryContext,
      getExchangeCount: () => conversationMemory?.length || 0
    };

    // Check if it's a task
    const isTaskMode = isTask(userMessage);

    let responseData;
    if (isTaskMode) {
      // Task mode response in appropriate language
      const taskResponses = {
        'en': `Task mode detected. This would execute automation for: ${userMessage}`,
        'hinglish': `Task mode detect hua. Yeh automation execute karega: ${userMessage}`,
        'hi-script': `टास्क मोड डिटेक्ट हुआ। यह ऑटोमेशन चलाएगा: ${userMessage}`
      };
      responseData = {
        text: taskResponses[detectedLanguage] || taskResponses['en'],
        emotion: 'calm',
        emotionIntensity: 'low'
      };
    } else {
      // PROMPTS 1-7: Get language-mirrored response
      responseData = await getChatResponse(userMessage, detectedLanguage, tempMemory);
    }

    res.json({
      response: responseData.text,
      language: languageCode,           // 'en' or 'hi' for frontend
      detectedLanguage: detectedLanguage, // Full language mode ('en', 'hinglish', 'hi-script')
      voiceProfile,
      isTask: isTaskMode,
      emotion: responseData.emotion || 'calm',
      emotionIntensity: responseData.emotionIntensity || 'low'
    });
  } catch (error) {
    console.error('[API] Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate response',
      details: error.message 
    });
  }
});

/**
 * POST /api/language-detect
 * PROMPTS 1-3: Detect language with Hinglish distinction
 */
router.post('/language-detect', (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const detectedLanguage = detectLanguage(text);
    const voiceProfile = getVoiceProfile(detectedLanguage);
    const languageCode = getResponseLanguageCode(detectedLanguage);

    res.json({ 
      language: languageCode,
      detectedLanguage,
      voiceProfile 
    });
  } catch (error) {
    console.error('[API] Error detecting language:', error);
    res.status(500).json({ error: 'Failed to detect language' });
  }
});

/**
 * POST /api/check-task
 * Check if input is a task or conversation
 */
router.post('/check-task', (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const taskMode = isTask(text);

    res.json({ isTask: taskMode });
  } catch (error) {
    console.error('[API] Error checking task:', error);
    res.status(500).json({ error: 'Failed to check task' });
  }
});

export default router;
