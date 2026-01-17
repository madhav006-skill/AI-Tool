import React, { useState, useEffect, useRef } from 'react';
import apiService from './services/apiService';
import VoiceInputService from './services/voiceInputService';
import VoiceOutputService from './services/voiceOutputService';
import { detectYouTubeCommand, buildYouTubeUrl } from './services/commandService';
import './styles/index.css';

function App() {
  const [conversationHistory, setConversationHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('auto');
  const [detectedLanguageMode, setDetectedLanguageMode] = useState('en');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [error, setError] = useState('');
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [bargeInDetected, setBargeInDetected] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [micStatus, setMicStatus] = useState('');
  const [userEmotion, setUserEmotion] = useState('calm');
  const [emotionIntensity, setEmotionIntensity] = useState('low');

  const voiceInputRef = useRef(null);
  const voiceOutputRef = useRef(null);
  const historyEndRef = useRef(null);

  // Initialize voice services
  useEffect(() => {
    // PROMPT 9 & 13: Callback for voice activity detection (barge-in with priority)
    const handleVoiceDetected = () => {
      console.log('[BARGE-IN] User voice detected during assistant speech');
      setBargeInDetected(true);
      
      // PROMPT 13: Listening ALWAYS has priority - stop assistant immediately
      if (voiceOutputRef.current && voiceOutputRef.current.isAudioPlaying()) {
        console.log('[BARGE-IN] 🔥 STOPPING ASSISTANT IMMEDIATELY - User is speaking!');
        voiceOutputRef.current.stop();
        setIsAssistantSpeaking(false);
        
        // PROMPT 9: Switch to listening mode
        console.log('[BARGE-IN] Switching to listening mode');
        if (!voiceInputRef.current.isActive()) {
          handleStartListening();
        }
      }
    };

    voiceInputRef.current = new VoiceInputService(handleVoiceDetected);
    voiceOutputRef.current = new VoiceOutputService();
    voiceOutputRef.current.initialize();

    // PROMPT 2: Check browser support
    if (!voiceInputRef.current.isBrowserSupported()) {
      setVoiceSupported(false);
      setError('Voice recognition is not supported in your browser. Please use Chrome or Edge.');
    }

    return () => {
      if (voiceInputRef.current) {
        voiceInputRef.current.cleanup();
      }
    };
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory]);

  /**
   * Start continuous listening with 2-second silence threshold
   */
  const handleStartListening = async () => {
    try {
      setError('');
      setMicStatus('Initializing...');
      
      if (!voiceInputRef.current) {
        throw new Error('Voice service not initialized');
      }

      if (!voiceInputRef.current.isBrowserSupported()) {
        throw new Error('Voice recognition not supported in this browser. Please use Chrome or Edge.');
      }

      if (voiceInputRef.current.isActive()) {
        console.warn('[APP] Already listening');
        return;
      }

      await voiceInputRef.current.initialize();
      
      // Setup callbacks
      voiceInputRef.current.onStart = () => {
        setIsListening(true);
        setMicStatus('🎤 Listening... (hi-IN + transliteration, 2s silence)');
        console.log('[APP] Mic started');
      };
      
      // Live transcript updates
      voiceInputRef.current.onResult = (liveText) => {
        setRecognizedText(liveText);
        setMicStatus(`📝 ${liveText}`);
      };
      
      // Finalized after 2 seconds of silence (with language detection)
      voiceInputRef.current.onEnd = (finalText, detectedLang) => {
        setIsListening(false);
        setMicStatus('✅ Processing...');
        console.log('[APP] Final text:', finalText);
        console.log('[APP] Detected language:', detectedLang);
        
        // Update language hint for backend
        setCurrentLanguage(detectedLang === 'hinglish' ? 'hinglish' : 'en');
        
        if (finalText && !isLoading) {
          handleSendMessage(finalText, detectedLang);
        }
      };
      
      voiceInputRef.current.onError = (error) => {
        if (error !== 'no-speech') {
          setError(`⚠️ ${error}`);
          setMicStatus(`⚠️ ${error}`);
        }
        console.error('[APP] Voice error:', error);
      };
      
      voiceInputRef.current.onStatusUpdate = (status) => {
        setMicStatus(status);
      };
      
      // Start listening
      await voiceInputRef.current.startListening();
      
    } catch (err) {
      console.error('[APP] Error starting listening:', err);
      setError(err.message || 'Failed to access microphone');
      setMicStatus(`❌ ${err.message}`);
      setIsListening(false);
    }
  };

  /**
   * Stop listening manually
   */
  const handleStopListening = () => {
    try {
      if (voiceInputRef.current) {
        voiceInputRef.current.stopListening();
      }
      setIsListening(false);
      setMicStatus('Stopped');
      console.log('[APP] Stopped listening manually');

    } catch (err) {
      console.error('[APP] Error stopping listening:', err);
    }
  };

  /**
   * PROMPT 6: Send message (voice or text) - UNIFIED PIPELINE
   */
  const handleSendMessage = async (message, detectedLang = null) => {
    if (!message.trim()) return;

    try {
      setError('');
      setMicStatus(''); // Clear mic status when sending

      // 1) COMMAND LAYER (YouTube only) - must NOT hit backend
      const cmd = detectYouTubeCommand(message);
      if (cmd.type === 'command' && cmd.commandName === 'youtube_play') {
        const url = buildYouTubeUrl(cmd.query);
        console.log('[COMMAND] YouTube detected:', cmd);
        window.open(url, '_blank', 'noopener,noreferrer');

        const userMsg = message;
        const assistantMsg = cmd.query
          ? `Opening YouTube search for: ${cmd.query}`
          : 'Opening YouTube.';

        const updatedHistory = [...conversationHistory, { user: userMsg, assistant: assistantMsg }];
        setConversationHistory(updatedHistory);
        setUserInput('');
        setRecognizedText('');

        if (voiceEnabled && voiceOutputRef.current) {
          // For Hinglish voice, keep hi-IN; for English keep en-US
          const langMode = detectedLang === 'hinglish' ? 'hi' : 'en';
          const detectedMode = detectedLang === 'hinglish' ? 'hinglish' : 'en';
          try {
            await voiceOutputRef.current.speak(
              cmd.query
                ? (detectedLang === 'hinglish'
                    ? `Theek hai, YouTube pe ${cmd.query} search kar raha hoon.`
                    : `Okay, opening YouTube search for ${cmd.query}.`)
                : (detectedLang === 'hinglish'
                    ? 'Theek hai, YouTube khol raha hoon.'
                    : 'Okay, opening YouTube.'),
              langMode,
              { detectedLanguage: detectedMode, emotion: 'calm', emotionIntensity: 'low' }
            );
          } catch (err) {
            console.error('[COMMAND] TTS error:', err);
          } finally {
            if (voiceInputRef.current && voiceInputRef.current.resetAfterResponse) {
              voiceInputRef.current.resetAfterResponse();
            }
          }
        } else {
          if (voiceInputRef.current && voiceInputRef.current.resetAfterResponse) {
            voiceInputRef.current.resetAfterResponse();
          }
        }

        return; // IMPORTANT: do not send command to backend
      }

      // 2) Normal conversation flow
      setIsLoading(true);

      // Add user message to history
      const updatedHistory = [...conversationHistory];
      setConversationHistory([...updatedHistory, { user: message, assistant: '' }]);
      setUserInput('');
      setRecognizedText('');

      // PROMPT 6: Get response from backend (same pipeline for voice and text)
      console.log('[APP] Sending to backend:', message);
      console.log('[APP] Language hint:', detectedLang);
      const response = await apiService.getResponse(message, updatedHistory, detectedLang);
      
      // PROMPT 10: Update emotion state
      if (response.emotion) {
        setUserEmotion(response.emotion);
        setEmotionIntensity(response.emotionIntensity || 'low');
        console.log(`[APP] User emotion: ${response.emotion} (${response.emotionIntensity})`);
      }
      
      // Update with assistant response
      updatedHistory.push({
        user: message,
        assistant: response.response
      });

      // Keep only last 6 exchanges
      if (updatedHistory.length > 6) {
        updatedHistory.splice(0, 1);
      }

      setConversationHistory(updatedHistory);
      setCurrentLanguage('auto');
      setDetectedLanguageMode(response.detectedLanguage || 'en');

      // PROMPTS 1-7 & 11 & 13: Speak response with language-matched voice
      if (voiceEnabled && voiceOutputRef.current) {
        // PROMPT 13: Check if user is speaking before starting to talk
        if (voiceInputRef.current && voiceInputRef.current.isActive()) {
          console.log('[PRIORITY] User is listening - skipping assistant speech');
          return;
        }
        
        setIsAssistantSpeaking(true);
        try {
          // PROMPT 5 & 11: Use language-consistent, emotion-aware speech
          await voiceOutputRef.current.speak(
            response.response,
            response.language,
            {
              detectedLanguage: response.detectedLanguage, // PROMPT 5: For voice selection
              emotion: response.emotion || 'calm',
              emotionIntensity: response.emotionIntensity || 'low'
            }
          );
        } catch (err) {
          console.error('[BARGE-IN] Error during speech:', err);
        } finally {
          setIsAssistantSpeaking(false);
          
          // 🎯 STATE MACHINE: Reset voice input to IDLE after response
          if (voiceInputRef.current && voiceInputRef.current.resetAfterResponse) {
            voiceInputRef.current.resetAfterResponse();
          }
        }
      } else {
        // 🎯 STATE MACHINE: Reset even if voice disabled
        if (voiceInputRef.current && voiceInputRef.current.resetAfterResponse) {
          voiceInputRef.current.resetAfterResponse();
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to get response');
      
      // Remove the last empty assistant message on error
      setConversationHistory(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle text input submission
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (userInput.trim()) {
      handleSendMessage(userInput);
    }
  };

  /**
   * Render conversation message
   */
  const renderMessage = (exchange, index) => (
    <div key={index} className="message-exchange">
      <div className="message user-message">
        <span className="message-avatar">👤</span>
        <div className="message-content">
          <p>{exchange.user}</p>
        </div>
      </div>
      {exchange.assistant && (
        <div className="message assistant-message">
          <span className="message-avatar">🤖</span>
          <div className="message-content">
            <p>{exchange.assistant}</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1>🤖 JARVIS</h1>
          <p>AI Voice Assistant with Conversation Memory</p>
        </div>
        <div className="header-controls">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={voiceEnabled}
              onChange={(e) => setVoiceEnabled(e.target.checked)}
            />
            <span className="toggle-label">🔊 Voice</span>
          </label>
          <span className={`language-badge ${currentLanguage}`}>
            {detectedLanguageMode === 'hi-script' ? '🇮🇳 Hindi' : detectedLanguageMode === 'hinglish' ? '🇮🇳 Hinglish' : '🇺🇸 English'}
          </span>

          {/* PROMPT 10: Emotion Badge */}
          {userEmotion !== 'calm' && (
            <span className={`emotion-badge emotion-${userEmotion}`}>
              {userEmotion === 'angry' && '😠 Angry'}
              {userEmotion === 'confused' && '🤔 Confused'}
              {userEmotion === 'excited' && '🎉 Excited'}
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {/* Browser Compatibility Warning */}
        {!voiceSupported && (
          <div className="warning-banner">
            <span>⚠️</span>
            <p>Voice recognition is not supported in your browser. Please use Chrome or Edge for voice features.</p>
          </div>
        )}

        {/* Voice Debug Panel - Show live transcript */}
        {isListening && recognizedText && (
          <div className="voice-debug-panel">
            <div className="debug-status">
              <strong>🎤 Live:</strong> {recognizedText}
            </div>
            <div className="debug-hint">
              ⏱️ Will finalize after 2 seconds of silence or press Stop
            </div>
          </div>
        )}

        {/* Conversation History */}
        <div className="conversation-container">
          <div className="messages-list">
            {conversationHistory.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎙️</div>
                <p>Start speaking or type to begin</p>
                <p className="hint">JARVIS remembers your conversation</p>
                {!voiceSupported && (
                  <p className="warning-hint">⚠️ Voice input unavailable in this browser</p>
                )}
              </div>
            ) : (
              conversationHistory.map((exchange, index) => renderMessage(exchange, index))
            )}
            <div ref={historyEndRef} />
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-banner">
              <span>⚠️</span>
              <p>{error}</p>
              <button onClick={() => setError('')}>✕</button>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>JARVIS thinking...</p>
            </div>
          )}
        </div>

        {/* Memory Display */}
        {conversationHistory.length > 0 && (
          <div className="memory-panel">
            <details>
              <summary>📝 Conversation Memory ({conversationHistory.length} exchanges)</summary>
              <div className="memory-content">
                {conversationHistory.map((exchange, index) => (
                  <div key={index} className="memory-exchange">
                    <div className="memory-item">
                      <strong>Exchange {index + 1}:</strong>
                    </div>
                    <div className="memory-item">
                      <span>👤:</span> {exchange.user.substring(0, 80)}
                      {exchange.user.length > 80 ? '...' : ''}
                    </div>
                    <div className="memory-item">
                      <span>🤖:</span> {exchange.assistant.substring(0, 80)}
                      {exchange.assistant.length > 80 ? '...' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </main>

      {/* Footer - Input Controls */}
      <footer className="app-footer">
        <form onSubmit={handleSubmit} className="input-form">
          <div className="input-group">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={voiceSupported ? "Type or say something..." : "Type something..."}
              disabled={isLoading || isListening}
              className="text-input"
            />
            <button
              type="submit"
              disabled={isLoading || !userInput.trim()}
              className="btn btn-send"
              title="Send message"
            >
              ⚡ Send
            </button>
          </div>

          <div className="button-group">
            <button
              type="button"
              onClick={isListening ? handleStopListening : handleStartListening}
              disabled={isLoading || !voiceSupported}
              className={`btn btn-voice ${isListening ? 'recording' : ''}`}
              title={isListening ? 'Stop listening' : 'Start listening'}
            >
              {isListening ? '🛑 Stop' : '🎤 Listen'}
            </button>
            
            {conversationHistory.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setConversationHistory([]);
                  setError('');
                  setMicStatus('');
                  setRecognizedText('');
                }}
                className="btn btn-clear"
                title="Clear history"
              >
                🗑️ Clear
              </button>
            )}
          </div>
        </form>

      </footer>
    </div>
  );
}

export default App;