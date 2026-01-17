/**
 * API Service - Frontend communication with backend
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiService = {
  /**
   * Get AI response with conversation context
   */
  async getResponse(userMessage, conversationMemory, detectedLanguage = null) {
    try {
      const response = await fetch(`${API_BASE}/api/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userMessage,
          conversationMemory: conversationMemory.map(ex => ({
            user: ex.user,
            assistant: ex.assistant
          })),
          detectedLanguage
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[API] Error getting response:', error);
      throw error;
    }
  },

  /**
   * Detect language from text
   */
  async detectLanguage(text) {
    try {
      const response = await fetch(`${API_BASE}/api/language-detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[API] Error detecting language:', error);
      throw error;
    }
  },

  /**
   * Check if input is a task
   */
  async checkTask(text) {
    try {
      const response = await fetch(`${API_BASE}/api/check-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[API] Error checking task:', error);
      throw error;
    }
  }
};

export default apiService;
