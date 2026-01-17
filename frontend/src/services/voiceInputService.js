/**
 * Voice Input Service - ChatGPT Voice Mode Clone
 * 
 * ARCHITECTURE:
 * - Uses Web Speech API for streaming text ONLY
 * - Fixed en-IN base (neutral for English/Hindi/Hinglish)
 * - Polling-based silence detection (2000ms strict)
 * - Text-based language detection (NOT ASR auto-detect)
 * - Transcript ACCUMULATION (never overwrite)
 * 
 * Flow:
 * 1. Capture speech → neutral en-IN ASR
 * 2. Accumulate final + interim transcripts
 * 3. Poll for 2s silence
 * 4. Detect language from text
 * 5. Send complete utterance
 */

export class VoiceInputService {
  constructor(onVoiceDetected = null) {
    this.recognition = null;
    this.isListening = false;
    
    // Transcript state
    this.finalTranscript = '';
    this.lastSpeechTime = null;
    
    // Silence polling
    this.silenceCheckInterval = null;
    this.SILENCE_THRESHOLD = 2000; // 2 seconds strict
    this.POLL_INTERVAL = 200; // Check every 200ms
    
    // Callbacks
    this.onResult = null;
    this.onError = null;
    this.onStart = null;
    this.onEnd = null;
    this.onStatusUpdate = null;
    this.onVoiceDetected = onVoiceDetected;
    
    console.log('[VOICE] ChatGPT Voice Mode initialized');
    console.log('[VOICE] Config: hi-IN ASR + Devanagari→Roman transliteration');
  }

  isBrowserSupported() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    return !!SpeechRecognition;
  }

  async initialize() {
    if (!this.isBrowserSupported()) {
      throw new Error('SpeechRecognition not supported in this browser');
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[VOICE] Microphone permission granted');
      this.updateStatus('Microphone ready');
      return true;
    } catch (error) {
      console.error('[VOICE] Microphone error:', error);
      throw new Error('Microphone access denied: ' + error.message);
    }
  }

  async startListening(options = {}) {
    console.log('[VOICE] Starting ChatGPT-like listening');
    
    // Cleanup existing session
    this.stopSilencePolling();
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore
      }
      this.recognition = null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    // HI-IN CONFIG - Best Hindi recognition, transliterate to romanized
    // Hindi: captures as Devanagari → transliterate to Roman
    // English: captures phonetically → display as-is
    this.recognition.lang = 'hi-IN';
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    
    // Reset state
    this.finalTranscript = '';
    this.lastSpeechTime = null;
    
    console.log('[VOICE] ASR: hi-IN (captures Hindi+English, auto-transliterate)');
    this.updateStatus('Initializing...');
    
    this.recognition.onstart = () => {
      console.log('[VOICE] ✅ Listening active');
      this.isListening = true;
      this.lastSpeechTime = Date.now();
      this.startSilencePolling();
      this.updateStatus('🎤 Listening...');
      if (this.onStart) this.onStart();
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      
      // ACCUMULATE transcripts with TRANSLITERATION
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const rawText = event.results[i][0].transcript.trim();
        const romanText = this.transliterateToRoman(rawText);
        
        if (event.results[i].isFinal) {
          // Add romanized to permanent transcript
          this.finalTranscript += romanText + ' ';
          console.log('[VOICE] Final chunk (raw):', rawText);
          console.log('[VOICE] Final chunk (romanized):', romanText);
        } else {
          // Interim for live display (romanized)
          interimTranscript += romanText;
        }
      }
      
      // Update last speech timestamp (for silence detection)
      this.lastSpeechTime = Date.now();
      
      // Notify voice activity (for barge-in)
      if (this.onVoiceDetected) {
        this.onVoiceDetected();
      }
      
      // Use romanized text for display
      const liveText = (this.finalTranscript + interimTranscript).trim();
      
      if (liveText) {
        console.log('[VOICE] Live (romanized):', liveText.substring(0, 50) + '...');
        this.updateStatus('📝 ' + liveText);
        
        if (this.onResult) {
          this.onResult(liveText);
        }
      }
    };

    this.recognition.onerror = (event) => {
      console.error('[VOICE] ASR error:', event.error);
      
      // Ignore no-speech (expected during silence)
      if (event.error === 'no-speech') {
        console.log('[VOICE] No speech (normal during silence)');
        return;
      }
      
      // Ignore aborted (manual stop)
      if (event.error === 'aborted') {
        console.log('[VOICE] Aborted (manual stop)');
        return;
      }
      
      this.updateStatus('⚠️ ' + event.error);
      
      if (this.onError) {
        this.onError(event.error);
      }
    };

    this.recognition.onend = () => {
      console.log('[VOICE] ASR ended');
      this.isListening = false;
      this.stopSilencePolling();
      
      const finalText = this.finalTranscript.trim();
      
      if (finalText) {
        console.log('[VOICE] ✅ Complete:', finalText);
        this.updateStatus('✅ Processing...');
        
        // Detect language from text
        const detectedLang = this.detectLanguage(finalText);
        console.log('[VOICE] Detected language:', detectedLang);

        let finalTextToSend = finalText;
        if (detectedLang === 'english') {
          finalTextToSend = this.normalizeEnglishTranscript(finalText);
          if (finalTextToSend !== finalText) {
            console.log('[VOICE] English normalized:', finalText, '→', finalTextToSend);
          }
        }
        
        if (this.onEnd) {
          this.onEnd(finalTextToSend, detectedLang);
        }
      } else {
        console.log('[VOICE] No text captured');
        this.updateStatus('');
      }
      
      // Reset
      this.finalTranscript = '';
      this.lastSpeechTime = null;
    };

    try {
      this.recognition.start();
      console.log('[VOICE] Recognition started');
    } catch (error) {
      console.error('[VOICE] Failed to start:', error);
      this.updateStatus('Failed to start: ' + error.message);
      throw error;
    }
  }

  /**
   * POLLING-BASED SILENCE DETECTION (ChatGPT Mode)
   * Checks every 200ms if silence > 2000ms
   */
  startSilencePolling() {
    this.stopSilencePolling();
    
    console.log('[VOICE] Starting silence polling (2000ms threshold)');
    
    this.silenceCheckInterval = setInterval(() => {
      if (!this.lastSpeechTime || !this.finalTranscript.trim()) {
        return; // No speech yet
      }
      
      const silenceDuration = Date.now() - this.lastSpeechTime;
      
      if (silenceDuration > this.SILENCE_THRESHOLD) {
        console.log(`[VOICE] ⏱️ Silence detected: ${silenceDuration}ms > ${this.SILENCE_THRESHOLD}ms`);
        this.stopListening();
      }
    }, this.POLL_INTERVAL);
  }

  stopSilencePolling() {
    if (this.silenceCheckInterval) {
      clearInterval(this.silenceCheckInterval);
      this.silenceCheckInterval = null;
    }
  }

  stopListening() {
    console.log('[VOICE] Stopping listening');
    
    this.stopSilencePolling();
    
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('[VOICE] Error stopping:', error);
      }
    }
  }

  /**
   * COMPREHENSIVE DEVANAGARI TO ROMAN TRANSLITERATION
   */
  transliterateToRoman(text) {
    if (!text) return text;
    
    // Check if already romanized
    const hasDevanagari = /[\u0900-\u097F]/.test(text);
    if (!hasDevanagari) return text;
    
    let result = text;
    
    // STEP 1: Common full-word replacements (most accurate)
    const wordMap = {
      'क्या': 'kya', 'है': 'hai', 'हैं': 'hain', 'हूं': 'hoon', 'हूँ': 'hoon',
      'हो': 'ho', 'था': 'tha', 'थी': 'thi', 'थे': 'the',
      'और': 'aur', 'या': 'ya', 'में': 'mein', 'मैं': 'main',
      'तुम': 'tum', 'आप': 'aap', 'हम': 'hum', 'यह': 'yeh', 'ये': 'ye',
      'वह': 'woh', 'वो': 'wo', 'कर': 'kar', 'करो': 'karo', 'करना': 'karna',
      'कैसे': 'kaise', 'कहां': 'kahan', 'कब': 'kab', 'क्यों': 'kyon',
      'सब': 'sab', 'कुछ': 'kuch', 'कोई': 'koi', 'भी': 'bhi',
      'नहीं': 'nahi', 'ना': 'na', 'हां': 'haan', 'हाँ': 'haan',
      'ठीक': 'theek', 'अच्छा': 'achha', 'बढ़िया': 'badhiya',
      'यार': 'yaar', 'भाई': 'bhai', 'जी': 'ji',
      'चल': 'chal', 'चलो': 'chalo', 'रहा': 'raha', 'रही': 'rahi', 'रहे': 'rahe',
      'बोलो': 'bolo', 'बताओ': 'batao', 'देखो': 'dekho', 'सुनो': 'suno',
      'मुझे': 'mujhe', 'तुम्हें': 'tumhe', 'आपको': 'aapko',
      'मेरा': 'mera', 'मेरी': 'meri', 'मेरे': 'mere',
      'तेरा': 'tera', 'तेरी': 'teri', 'तेरे': 'tere',
      'अभी': 'abhi', 'अब': 'ab', 'बाद': 'baad', 'पहले': 'pehle',
      'आज': 'aaj', 'कल': 'kal', 'यहां': 'yahan', 'वहां': 'wahan',
      'समझ': 'samajh', 'समझो': 'samjho', 'सकते': 'sakte', 'सकता': 'sakta',
      'चाहिए': 'chahiye', 'चाहता': 'chahta', 'चाहती': 'chahti',
      'गया': 'gya', 'गई': 'gyi', 'गए': 'gye',
      'सुन': 'sun', 'पा': 'paa', 'फोन': 'phone', 'phone': 'phone',
      'डिस्चार्ज': 'discharge', 'चार्ज': 'charge',
      // English words captured in Devanagari
      'व्हाट': 'what', 'कैन': 'can', 'यू': 'you', 'दो': 'do',
      'आईएफ': 'if', 'माय': 'my', 'गेट': 'get',
      'इंग्लिश': 'english', 'अंडरस्टैंड': 'understand'
    };
    
    Object.keys(wordMap).forEach(devWord => {
      const regex = new RegExp(devWord, 'g');
      result = result.replace(regex, wordMap[devWord]);
    });
    
    // STEP 2: Common conjuncts/compounds (before individual chars)
    const conjunctMap = {
      'व्ह': 'wh', 'क्य': 'kya', 'क्र': 'kr', 'त्र': 'tr', 
      'ज्ञ': 'gya', 'क्ष': 'ksh', 'श्र': 'shr',
      'र्ज': 'rj', 'र्च': 'rch', 'र्क': 'rk', 'र्ग': 'rg'
    };
    
    Object.keys(conjunctMap).forEach(conj => {
      const regex = new RegExp(conj, 'g');
      result = result.replace(regex, conjunctMap[conj]);
    });
    
    // STEP 3: Individual character mapping
    const charMap = {
      'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
      'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
      'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
      'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
      'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
      'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'w', 'श': 'sh',
      'ष': 'sh', 'स': 's', 'ह': 'h',
      'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
      'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
      'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
      'ृ': 'ri', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
      'ं': 'n', 'ः': 'h', 'ँ': 'n',
      '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
      '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
      '।': '.', '॥': '..', '?': '?', '!': '!'
    };

    result = result.split('').map(char => (charMap[char] ?? char)).join('');
    
    // STEP 4: Remove virama (halant) and any remaining Devanagari
    result = result.replace(/्/g, ''); // Remove virama
    result = result.replace(/[\u0900-\u097F]/g, ''); // Remove any leftover Devanagari
    
    // STEP 5: Clean up
    result = result.replace(/\s+/g, ' ').trim();
    result = result.replace(/([a-z])\1{2,}/gi, '$1$1'); // Remove triple+ repeats
    
    return result;
  }

  normalizeEnglishTranscript(text) {
    if (!text) return text;

    let result = text;

    // Remove any leftovers that can leak from mixed scripts
    result = result.replace(/्/g, '');
    result = result.replace(/[\u0900-\u097F]/g, '');

    const replacements = [
      // Common phonetic misspellings from hi-IN
      ['haau', 'how'],
      ['maany', 'many'],
      ['memoree', 'memory'],
      ['stor', 'store'],
      ['phyouchr', 'future'],
      ['rephrens', 'reference'],
      ['phrm', 'from'],
      ['pst', 'past'],
      ['histree', 'history'],
      ['aaeeeph', 'if'],
      ['maay', 'my'],
      ['phon', 'phone'],
      ['dischaarj', 'discharge'],
      ['discharge', 'discharge'],
      // English phonetic tokens we added for detection
      ['kain', 'can'],
      ['yoo', 'you'],
      ['hindee', 'hindi'],
      // Sometimes ASR merges words
      ['kaindo', 'can do'],
      ['cando', 'can do']
    ];

    // Apply word-boundary replacements
    for (const [from, to] of replacements) {
      const regex = new RegExp(`\\b${from}\\b`, 'gi');
      result = result.replace(regex, to);
    }

    // Keep only reasonable characters for English transcript
    result = result.replace(/[^a-z0-9\s'".,?!-]/gi, '');
    result = result.replace(/\s+/g, ' ').trim();

    return result;
  }

  /**
   * TEXT-BASED LANGUAGE DETECTION
   * For hi-IN ASR (outputs Devanagari for Hindi, mixed for English)
   */
  detectLanguage(text) {
    if (!text || !text.trim()) return 'hinglish';
    
    const cleanText = text.trim().toLowerCase();
    
    // Hindi/Hinglish words (romanized by transliteration)
    const hinglishWords = [
      'kya', 'hai', 'hain', 'ho', 'hoon', 'hun', 'tha', 'thi', 'the',
      'kar', 'karo', 'karna', 'kiya', 'kiye', 'karenge',
      'bolo', 'batao', 'dekho', 'suno', 'sunao', 'jao', 'aao',
      'chalo', 'chal', 'raha', 'rahi', 'rahe', 'rhe',
      'samajh', 'samjha', 'samjho', 'sakte', 'sakta', 'sakti',
      'sun', 'paa', 'paya',
      'chahiye', 'chahie', 'chahta', 'chahti',
      'mein', 'main', 'mai', 'hum', 'tum', 'aap', 'yeh', 'ye', 'woh', 'wo',
      'mujhe', 'tumhe', 'aapko', 'usko', 'isko',
      'mera', 'meri', 'mere', 'tera', 'teri', 'tere', 'apna', 'apni',
      'koi', 'kuch', 'sab', 'sabko',
      'achha', 'accha', 'acha', 'theek', 'thik', 'sahi', 'galat',
      'bahut', 'bahot', 'bohot', 'zyada', 'kam', 'thoda',
      'badhiya', 'badiya',
      'abhi', 'ab', 'baad', 'pehle', 'phele', 'aaj', 'kal',
      'kab', 'kaha', 'kahan', 'yaha', 'yahan', 'waha', 'wahan',
      'haan', 'han', 'nahi', 'nai', 'na', 'ji', 'bhi', 'toh', 'to',
      'aur', 'ya', 'lekin', 'par', 'kyunki',
      'yaar', 'yar', 'bhai', 'dost', 'arre', 'oye',
      'matlab', 'baat', 'bilkul', 'pakka'
    ];
    
    // English words + phonetic patterns from hi-IN ASR
    const englishWords = [
      // Standard English
      'what', 'how', 'when', 'where', 'why', 'who',
      'can', 'will', 'should', 'would', 'could',
      'please', 'tell', 'help', 'need', 'want',
      'like', 'know', 'think', 'understand',
      'hello', 'hi', 'thanks', 'thank', 'yes', 'no',
      'okay', 'ok', 'good', 'bad', 'great',
      'the', 'is', 'are', 'was', 'were', 'have', 'has',
      'do', 'does', 'did', 'you', 'your', 'my', 'me',
      // Phonetic captures by hi-IN
      'kain', 'yoo', 'andrs', 'taind', 'ing', 'lish',
      'english', 'understand', 'aandarstaaind'
    ];
    
    const words = cleanText.split(/\s+/);
    const totalWords = words.length;
    
    const hinglishCount = words.filter(w => hinglishWords.includes(w)).length;
    const englishCount = words.filter(w => englishWords.includes(w)).length;
    
    const hinglishRatio = hinglishCount / totalWords;
    const englishRatio = englishCount / totalWords;
    
    console.log(`[VOICE] Detection - Text: "${cleanText}"`);
    console.log(`[VOICE] Hinglish: ${hinglishCount}/${totalWords} (${(hinglishRatio*100).toFixed(1)}%), English: ${englishCount}/${totalWords} (${(englishRatio*100).toFixed(1)}%)`);
    
    // PRIORITY 1: Strong English (40%+ English words)
    if (englishRatio >= 0.4) {
      console.log('[VOICE] → Detected: English (strong match)');
      return 'english';
    }
    
    // PRIORITY 2: More English than Hindi
    if (englishCount > hinglishCount) {
      console.log('[VOICE] → Detected: English (more English words)');
      return 'english';
    }
    
    // PRIORITY 3: Any Hinglish words → Hinglish
    if (hinglishCount >= 1) {
      console.log('[VOICE] → Detected: Hinglish (Hindi words found)');
      return 'hinglish';
    }
    
    // Default to Hinglish for hi-IN
    console.log('[VOICE] → Detected: Hinglish (default)');
    return 'hinglish';
  }

  isActive() {
    return this.isListening;
  }

  getCurrentTranscript() {
    return this.finalTranscript.trim();
  }

  cleanup() {
    console.log('[VOICE] Cleanup');
    this.stopListening();
    this.stopSilencePolling();
    
    if (this.recognition) {
      this.recognition.onstart = null;
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;
      this.recognition = null;
    }
  }

  updateStatus(status) {
    if (this.onStatusUpdate) {
      this.onStatusUpdate(status);
    }
  }
}

export default VoiceInputService;
