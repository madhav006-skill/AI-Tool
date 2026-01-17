import { fixSpelling } from './spellFix.js';
import { detectIntent } from './intentDetector.js';

export async function parseIntentController(req, res) {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required' });
    }

    const correctedText = await fixSpelling(text);
    const intent = detectIntent(correctedText);

    return res.json({
      normalizedText: text,
      correctedText,
      intent
    });
  } catch (error) {
    console.error('[API] parse-intent error:', error);
    return res.status(500).json({ error: 'Failed to parse intent' });
  }
}
