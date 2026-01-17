import { spellCorrectText } from './services/llmService.js';

// Backwards-compatible wrapper matching the requested module name.
export async function fixSpelling(text) {
  return await spellCorrectText(text);
}
