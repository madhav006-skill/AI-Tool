/**
 * YouTube Command Handler
 * Handles YouTube voice command processing with natural Hinglish support
 */

/**
 * Generate natural voice feedback for YouTube commands
 * @param {string} query - The search query
 * @param {string} language - 'hinglish' or 'en'
 * @returns {string} Natural voice response
 */
export function getYouTubeVoiceFeedback(query, language = 'en') {
  if (!query) {
    return language === 'hinglish' 
      ? 'Theek hai yaar, YouTube khol raha hoon'
      : 'Okay, opening YouTube';
  }

  // Hinglish responses - friendly and natural
  const hinglishResponses = [
    `Achha theek hai yaar, YouTube pe ${query} chala raha hoon`,
    `Haan bhai, ${query} YouTube pe laga raha hoon`,
    `Theek hai boss, ${query} abhi chala raha hoon`,
    `Bilkul yaar, YouTube pe ${query} play kar raha hoon`
  ];

  // English responses - friendly and casual
  const englishResponses = [
    `Alright, playing ${query} on YouTube`,
    `Sure, opening ${query} on YouTube`,
    `Got it, searching ${query} on YouTube`,
    `Okay, playing ${query} for you`
  ];

  const responses = language === 'hinglish' ? hinglishResponses : englishResponses;
  const randomIndex = Math.floor(Math.random() * responses.length);
  
  return responses[randomIndex];
}

/**
 * Build YouTube search URL with proper encoding
 * @param {string} query - Search query
 * @returns {string} YouTube URL
 */
export function buildYouTubeSearchUrl(query) {
  if (!query || !query.trim()) {
    return 'https://www.youtube.com/';
  }
  
  const cleanQuery = query.trim();
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanQuery)}`;
}

/**
 * Open YouTube in a new tab
 * @param {string} url - YouTube URL
 * @returns {boolean} Success status
 */
export function openYouTube(url) {
  try {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (!newWindow) {
      console.warn('[YouTube] Popup blocked - please allow popups');
      return false;
    }
    return true;
  } catch (error) {
    console.error('[YouTube] Failed to open:', error);
    return false;
  }
}

/**
 * Extract artist or song name from common patterns
 * @param {string} query - The extracted query
 * @returns {Object} Enhanced query info
 */
export function enhanceQuery(query) {
  if (!query) return { original: '', enhanced: '', type: 'generic' };

  const lower = query.toLowerCase();
  
  // Check if it's likely a song/music request
  const hasMusicKeywords = /song|music|gaana|gaane/i.test(lower);
  
  // Try to identify if it's an artist name (common Indian artists)
  const commonArtists = [
    'arijit singh', 'atif aslam', 'shreya ghoshal', 'sonu nigam', 
    'neha kakkar', 'badshah', 'yo yo honey singh', 'guru randhawa',
    'armaan malik', 'jubin nautiyal', 'darshan raval'
  ];
  
  const foundArtist = commonArtists.find(artist => lower.includes(artist));
  
  if (foundArtist) {
    return {
      original: query,
      enhanced: query,
      type: 'artist',
      artist: foundArtist
    };
  }
  
  if (hasMusicKeywords) {
    return {
      original: query,
      enhanced: query,
      type: 'music'
    };
  }
  
  return {
    original: query,
    enhanced: query,
    type: 'generic'
  };
}
