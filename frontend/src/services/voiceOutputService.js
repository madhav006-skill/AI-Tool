/**
 * Voice Output Service - Text-to-speech with Web Audio API
 * PROMPTS 1-7: Language-consistent voice output
 * PROMPT 11: Emotion-aware speech parameters
 */

export class VoiceOutputService {
  constructor() {
    this.audioContext = null;
    this.currentAudio = null;
    this.currentUtterance = null;
    this.isPlaying = false;
  }

  /**
   * Initialize audio context
   */
  initialize() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    console.log('[TTS] Audio context initialized');
  }

  /**
   * Get emotion-based voice parameters
   * PROMPT 11: Adjust speech based on detected emotion
   */
  getEmotionVoiceParams(emotion, intensity) {
    const params = {
      angry: { rate: 0.9, pitch: 0.9 },      // Slower, lower (calming)
      confused: { rate: 0.85, pitch: 1.0 },  // Slower (clear)
      excited: { rate: 1.1, pitch: 1.1 },    // Faster, higher (energetic)
      calm: { rate: 1.0, pitch: 1.0 }        // Normal
    };

    const base = params[emotion] || params.calm;
    
    // Adjust based on intensity
    if (intensity === 'medium') {
      return {
        rate: (base.rate + 1.0) / 2,
        pitch: (base.pitch + 1.0) / 2
      };
    } else if (intensity === 'low') {
      return { rate: 1.0, pitch: 1.0 };
    }
    
    return base;
  }

  /**
   * PROMPT 5: Get voice language code based on detected language mode
   * Ensures voice output matches text language
   */
  getVoiceLanguage(language, detectedLanguage) {
    // PROMPT 5: Voice must match text language
    if (detectedLanguage === 'hi-script') {
      // Pure Hindi script - use Hindi voice
      return 'hi-IN';
    } else if (detectedLanguage === 'hinglish') {
      // Hinglish / spoken Hindi via ASR (often phonetic) - use Hindi voice for a natural experience
      return 'hi-IN';
    } else {
      // Pure English - use American/British English voice
      return 'en-US';
    }
  }

  /**
   * Speak text using Web Speech API with language and emotion awareness
   * PROMPT 5: Voice language = Text language
   * PROMPT 11: Emotion-aware speech
   */
  speak(text, language = 'en', options = {}) {
    return new Promise((resolve, reject) => {
      try {
        // PROMPT 13: Stop any ongoing speech (listening priority)
        this.stop();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // PROMPT 5: Use correct voice for language mode
        const detectedLanguage = options.detectedLanguage || language;
        utterance.lang = this.getVoiceLanguage(language, detectedLanguage);

        // Try to pick a real matching voice (Windows/Chrome often needs explicit voice for hi-IN)
        try {
          const voices = window.speechSynthesis.getVoices?.() || [];
          if (voices.length > 0) {
            const preferred = voices.find(v => (v.lang || '').toLowerCase() === utterance.lang.toLowerCase())
              || voices.find(v => (v.lang || '').toLowerCase().startsWith(utterance.lang.toLowerCase()))
              || voices.find(v => utterance.lang.toLowerCase().startsWith((v.lang || '').toLowerCase()));
            if (preferred) {
              utterance.voice = preferred;
              console.log(`[TTS] Selected voice: ${preferred.name} (${preferred.lang})`);
            }
          }
        } catch (e) {
          // Ignore voice selection errors; lang-only still works on many browsers
        }
        
        console.log(`[TTS] Language mode: ${detectedLanguage}, Voice: ${utterance.lang}`);
        
        // PROMPT 11: Apply emotion-based parameters
        if (options.emotion && options.emotionIntensity) {
          const params = this.getEmotionVoiceParams(options.emotion, options.emotionIntensity);
          utterance.rate = params.rate;
          utterance.pitch = params.pitch;
          console.log(`[TTS] Emotion: ${options.emotion} (${options.emotionIntensity}) - Rate: ${params.rate}, Pitch: ${params.pitch}`);
        } else {
          utterance.rate = options.rate || 1.0;
          utterance.pitch = 1.0;
        }
        
        utterance.volume = 1.0;

        utterance.onend = () => {
          this.isPlaying = false;
          this.currentUtterance = null;
          console.log('[TTS] Speech ended');
          resolve();
        };

        utterance.onerror = (error) => {
          console.error('[TTS] Error:', error);
          this.isPlaying = false;
          this.currentUtterance = null;
          reject(error);
        };

        this.currentUtterance = utterance;
        this.isPlaying = true;
        console.log(`[TTS] Speaking (${detectedLanguage}): "${text.substring(0, 50)}..."`);
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('[TTS] Error:', error);
        reject(error);
      }
    });
  }

  /**
   * Play audio from URL or blob
   */
  async playAudio(audioSource) {
    return new Promise((resolve, reject) => {
      try {
        const audio = new Audio();
        
        if (audioSource instanceof Blob) {
          audio.src = URL.createObjectURL(audioSource);
        } else {
          audio.src = audioSource;
        }

        audio.onended = () => {
          this.isPlaying = false;
          resolve();
        };

        audio.onerror = (error) => {
          console.error('[AUDIO] Error:', error);
          reject(error);
        };

        this.currentAudio = audio;
        this.isPlaying = true;
        audio.play().catch(reject);
      } catch (error) {
        console.error('[AUDIO] Error:', error);
        reject(error);
      }
    });
  }

  /**
   * Stop playback
   * PROMPT 9 & 13: Immediate stop for barge-in
   */
  stop() {
    // Stop speech synthesis immediately
    if (this.currentUtterance) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
    
    // Stop audio if playing
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    
    this.isPlaying = false;
    console.log('[AUDIO] Playback stopped immediately');
  }

  /**
   * Check if audio is playing
   */
  isAudioPlaying() {
    return this.isPlaying || window.speechSynthesis.speaking;
  }
}

export default VoiceOutputService;
