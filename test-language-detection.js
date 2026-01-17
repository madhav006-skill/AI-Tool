/**
 * Language Detection Test Suite
 * Run: node test-language-detection.js
 */

// Simulate the detectLanguage function
function detectLanguage(text) {
  if (!text || !text.trim()) return 'english';
  
  // Check for Devanagari script (pure Hindi)
  const hindiRegex = /[\u0900-\u097F]/;
  if (hindiRegex.test(text)) {
    return 'hinglish'; // Even if pure Hindi, respond in Hinglish
  }
  
  // Check for romanized Hindi/Hinglish words
  const hinglishWords = [
    'kya', 'hai', 'haan', 'nahi', 'aur', 'batao', 'kaise', 'ho',
    'sab', 'theek', 'badhiya', 'yaar', 'chal', 'raha', 'abhi',
    'mujhe', 'tumhe', 'mere', 'tere', 'kuch', 'bhi', 'thik',
    'achha', 'sunao', 'dekho', 'karo', 'kab', 'kaun', 'kahan'
  ];
  
  const words = text.toLowerCase().split(/\s+/);
  const hinglishCount = words.filter(w => hinglishWords.includes(w)).length;
  
  // If 20%+ are Hinglish words, classify as Hinglish
  if (hinglishCount / words.length >= 0.2) {
    return 'hinglish';
  }
  
  // If any Roman characters, likely English
  if (/[a-zA-Z]/.test(text)) {
    return 'english';
  }
  
  return 'english'; // Default
}

// Test cases
const testCases = [
  // English
  { text: "Can you hear me clearly?", expected: "english" },
  { text: "What's the weather today?", expected: "english" },
  { text: "Hello how are you doing", expected: "english" },
  
  // Hinglish (romanized)
  { text: "aur batao kya haal chaal", expected: "hinglish" },
  { text: "kya chal raha hai", expected: "hinglish" },
  { text: "sab theek hai yaar", expected: "hinglish" },
  { text: "mujhe bhi batao", expected: "hinglish" },
  
  // Mixed (should detect Hinglish if 20%+ Hinglish words)
  { text: "I think kya we should dekho", expected: "hinglish" }, // 2/6 = 33%
  { text: "Can you tell me kya hai", expected: "hinglish" }, // 2/6 = 33%
  
  // Mostly English with 1 Hinglish word (< 20%)
  { text: "Please tell me what is this yaar", expected: "english" }, // 1/7 = 14%
  
  // Devanagari (should return hinglish)
  { text: "क्या हाल है", expected: "hinglish" },
  { text: "नमस्ते कैसे हो", expected: "hinglish" },
];

console.log('🧪 Language Detection Test Suite\n');
console.log('='.repeat(70));

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = detectLanguage(test.text);
  const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
  
  if (result === test.expected) {
    passed++;
  } else {
    failed++;
  }
  
  console.log(`\nTest ${index + 1}: ${status}`);
  console.log(`  Input:    "${test.text}"`);
  console.log(`  Expected: ${test.expected}`);
  console.log(`  Got:      ${result}`);
  
  if (result !== test.expected) {
    const words = test.text.toLowerCase().split(/\s+/);
    const hinglishWords = ['kya', 'hai', 'haan', 'nahi', 'aur', 'batao', 'kaise', 'ho',
      'sab', 'theek', 'badhiya', 'yaar', 'chal', 'raha', 'abhi',
      'mujhe', 'tumhe', 'mere', 'tere', 'kuch', 'bhi', 'thik',
      'achha', 'sunao', 'dekho', 'karo', 'kab', 'kaun', 'kahan'];
    const hinglishCount = words.filter(w => hinglishWords.includes(w)).length;
    console.log(`  Debug:    ${hinglishCount}/${words.length} Hinglish words (${(hinglishCount/words.length*100).toFixed(1)}%)`);
  }
});

console.log('\n' + '='.repeat(70));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed (${(passed/(passed+failed)*100).toFixed(1)}% success rate)\n`);

if (failed === 0) {
  console.log('🎉 All tests passed!\n');
} else {
  console.log('⚠️  Some tests failed. Review detection logic.\n');
}
