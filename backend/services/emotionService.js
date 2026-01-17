/**
 * Emotion Detection Service
 * PROMPT 10 & 11: Detect user emotion from text/voice and adjust responses
 */

/**
 * Detect emotion from user input
 * @param {string} text - User input text
 * @returns {Object} - { emotion: string, confidence: number, keywords: array }
 */
export function detectEmotion(text) {
  const lowerText = text.toLowerCase();
  
  // Emotion patterns with keywords
  const emotionPatterns = {
    angry: {
      keywords: ['angry', 'mad', 'furious', 'frustrated', 'annoyed', 'irritated', 'pissed', 'hate', 
                 'stupid', 'worst', 'terrible', 'garbage', 'useless', 'damn', 'wtf',
                 'gussa', 'naraz', 'khafa', 'pagal'],
      punctuation: /!{2,}|[A-Z]{3,}/g // Multiple exclamations or ALL CAPS
    },
    
    confused: {
      keywords: ['confused', 'don\'t understand', 'what', 'how', 'why', 'explain', 'huh', 'unclear',
                 'not sure', 'confused', 'lost', 'help me understand', 'meaning',
                 'samajh nahi aaya', 'kya matlab', 'kaise', 'kyun', 'kya hai'],
      punctuation: /\?{2,}/g // Multiple question marks
    },
    
    excited: {
      keywords: ['excited', 'amazing', 'awesome', 'great', 'wonderful', 'fantastic', 'love', 'yay',
                 'wow', 'cool', 'perfect', 'excellent', 'brilliant', 'super', 'best',
                 'mast', 'bahut badhiya', 'zabardast', 'kamaal', 'ekdum'],
      punctuation: /!+/g // Exclamation marks
    },
    
    calm: {
      keywords: ['okay', 'fine', 'thanks', 'thank you', 'good', 'alright', 'sure', 'yes',
                 'please', 'kindly', 'appreciate', 'understand',
                 'theek hai', 'achha', 'dhanyavaad', 'shukriya', 'bilkul']
    }
  };

  const detected = {
    emotion: 'calm', // Default
    confidence: 0,
    keywords: [],
    intensity: 'normal'
  };

  let maxScore = 0;

  // Check each emotion
  for (const [emotion, pattern] of Object.entries(emotionPatterns)) {
    let score = 0;
    const foundKeywords = [];

    // Check keywords
    for (const keyword of pattern.keywords) {
      if (lowerText.includes(keyword)) {
        score += 1;
        foundKeywords.push(keyword);
      }
    }

    // Check punctuation patterns
    if (pattern.punctuation) {
      const matches = text.match(pattern.punctuation);
      if (matches) {
        score += matches.length * 0.5;
      }
    }

    // Check text length vs keyword density
    const wordCount = lowerText.split(/\s+/).length;
    if (score > 0) {
      score = score / Math.max(wordCount / 10, 1); // Normalize by text length
    }

    // Update if this emotion scores higher
    if (score > maxScore) {
      maxScore = score;
      detected.emotion = emotion;
      detected.keywords = foundKeywords;
    }
  }

  // Calculate confidence (0-1)
  detected.confidence = Math.min(maxScore / 2, 1);

  // Determine intensity
  if (detected.confidence > 0.7) {
    detected.intensity = 'high';
  } else if (detected.confidence > 0.4) {
    detected.intensity = 'medium';
  } else {
    detected.intensity = 'low';
  }

  // Special case: Multiple question marks = very confused
  if ((text.match(/\?/g) || []).length >= 2) {
    detected.emotion = 'confused';
    detected.confidence = Math.max(detected.confidence, 0.7);
  }

  // Special case: ALL CAPS = very angry or excited
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.5 && text.length > 10) {
    if (detected.emotion === 'excited') {
      detected.confidence = Math.max(detected.confidence, 0.8);
    } else {
      detected.emotion = 'angry';
      detected.confidence = Math.max(detected.confidence, 0.8);
    }
  }

  console.log(`[EMOTION] Detected: ${detected.emotion} (confidence: ${detected.confidence.toFixed(2)}, intensity: ${detected.intensity})`);
  if (detected.keywords.length > 0) {
    console.log(`[EMOTION] Keywords found: ${detected.keywords.join(', ')}`);
  }

  return detected;
}

/**
 * Get emotion-specific system prompt adjustments
 * PROMPT 11: Emotion-aware response style
 */
export function getEmotionPromptModifier(emotion, intensity) {
  const modifiers = {
    angry: {
      high: '\n\nIMPORTANT: User seems upset or frustrated. Respond very calmly, politely, and empathetically. Acknowledge their concern. Be helpful and patient.',
      medium: '\n\nNOTE: User may be slightly frustrated. Keep response calm and helpful.',
      low: ''
    },
    
    confused: {
      high: '\n\nIMPORTANT: User is confused. Explain clearly, simply, and step-by-step. Avoid jargon. Be patient and thorough.',
      medium: '\n\nNOTE: User needs clarification. Be clear and straightforward.',
      low: ''
    },
    
    excited: {
      high: '\n\nNOTE: User is excited! Match their positive energy. Be enthusiastic and upbeat in response.',
      medium: '\n\nNOTE: User is in a good mood. Be warm and friendly.',
      low: ''
    },
    
    calm: {
      high: '',
      medium: '',
      low: ''
    }
  };

  return modifiers[emotion]?.[intensity] || '';
}

/**
 * Get voice output parameters based on emotion
 * PROMPT 11: Adjust speech rate and pitch
 */
export function getEmotionVoiceParams(emotion, intensity) {
  const params = {
    angry: { rate: 0.9, pitch: 0.9 },      // Slower, lower tone (calming)
    confused: { rate: 0.85, pitch: 1.0 },  // Slower (clear explanation)
    excited: { rate: 1.1, pitch: 1.1 },    // Faster, higher (match energy)
    calm: { rate: 1.0, pitch: 1.0 }        // Normal
  };

  const base = params[emotion] || params.calm;
  
  // Adjust based on intensity
  if (intensity === 'high') {
    return base;
  } else if (intensity === 'medium') {
    // Moderate the effect
    return {
      rate: (base.rate + 1.0) / 2,
      pitch: (base.pitch + 1.0) / 2
    };
  } else {
    return { rate: 1.0, pitch: 1.0 }; // Normal for low intensity
  }
}

export default {
  detectEmotion,
  getEmotionPromptModifier,
  getEmotionVoiceParams
};
