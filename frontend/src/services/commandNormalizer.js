/**
 * Command Normalizer
 * Deterministic cleanup for noisy Hinglish/English ASR text.
 *
 * NOTE: This is intentionally non-AI. It should run BEFORE intent detection.
 */

import { normalizeSpeech } from '../utils/normalizeSpeech';

function normalizeSpaces(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

export function normalizeCommandText(text) {
  return normalizeSpaces(normalizeSpeech(text || ''));
}

export function stripWakeWordAndEdgeFillers(text) {
  let cleaned = (text || '');

  // Remove wake word variants (beginning of sentence)
  cleaned = cleaned.replace(/^\s*(jarvis|jaarwis|jarwis|जार्विस|जर्विस)\b\s*[,–-]?\s*/i, '');

  // Remove common fillers from edges only
  const fillers = [
    'hello', 'helo', 'hallo',
    'please', 'pls', 'plz',
    'haan', 'han', 'ji',
    'bhai', 'yaar', 'yar', 'boss',
    'okay', 'ok', 'okey',
    'arre', 'arey', 'are'
  ];

  const fillerRegexStart = new RegExp(`^\\s*(${fillers.join('|')})\\b\\s*[,]?\\s*`, 'gi');
  const fillerRegexEnd = new RegExp(`\\s*[,]?\\s*\\b(${fillers.join('|')})\\s*$`, 'gi');

  cleaned = cleaned.replace(fillerRegexStart, '');
  cleaned = cleaned.replace(fillerRegexEnd, '');

  return normalizeSpaces(cleaned);
}

export function stripFillersEverywhere(text) {
  return normalizeSpaces(
    (text || '').replace(/\b(jarvis|jaarwis|jarwis|hello|helo|please|pls|plz|haan|han|bhai|yaar|yar)\b/gi, ' ')
  );
}
