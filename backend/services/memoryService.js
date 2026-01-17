/**
 * Conversation Memory Service
 * Manages short-term conversation history (last 6 exchanges)
 */

class ConversationMemory {
  constructor(maxExchanges = 6) {
    this.history = [];
    this.maxExchanges = maxExchanges;
  }

  /**
   * Add user and assistant messages to memory
   */
  addExchange(userMessage, assistantResponse) {
    this.history.push({
      user: userMessage,
      assistant: assistantResponse,
      timestamp: new Date()
    });

    // Keep only recent exchanges
    if (this.history.length > this.maxExchanges) {
      this.history = this.history.slice(-this.maxExchanges);
    }

    console.log(`[MEMORY] Exchange added. Total: ${this.history.length}/${this.maxExchanges}`);
  }

  /**
   * Get formatted context string for LLM
   */
  getContextString() {
    if (this.history.length === 0) {
      return '(No previous conversation)';
    }

    return this.history
      .map(exchange => `User: ${exchange.user}\nAssistant: ${exchange.assistant}`)
      .join('\n');
  }

  /**
   * Get full history
   */
  getHistory() {
    return this.history.map(({ user, assistant }) => ({ user, assistant }));
  }

  /**
   * Clear history
   */
  clear() {
    this.history = [];
    console.log('[MEMORY] History cleared');
  }

  /**
   * Get total number of exchanges
   */
  getExchangeCount() {
    return this.history.length;
  }
}

export default ConversationMemory;
