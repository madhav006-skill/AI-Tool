/**
 * YouTube Command Detection Test Suite
 * Run in browser console or as a Node test
 */

import { detectYouTubeCommand } from '../services/commandService.js';

const TEST_CASES = [
  // English commands
  {
    input: "play arijit singh music",
    expected: { type: 'command', commandName: 'youtube_play', query: 'arijit singh', language: 'en' }
  },
  {
    input: "play arijit singh songs on youtube",
    expected: { type: 'command', commandName: 'youtube_play', query: 'arijit singh', language: 'en' }
  },
  {
    input: "open youtube and play tum hi ho",
    expected: { type: 'command', commandName: 'youtube_play', query: 'tum hi ho', language: 'en' }
  },
  {
    input: "youtube pe arijit singh chala",
    expected: { type: 'command', commandName: 'youtube_play', query: 'arijit singh', language: 'hinglish' }
  },
  
  // Hinglish commands
  {
    input: "jarvis youtube pe tum hi ho chala",
    expected: { type: 'command', commandName: 'youtube_play', query: 'tum hi ho', language: 'hinglish' }
  },
  {
    input: "jarvis, youtube pe arijit singh ke gaane chala do",
    expected: { type: 'command', commandName: 'youtube_play', query: 'arijit singh', language: 'hinglish' }
  },
  {
    input: "yaar youtube pe badshah lagao",
    expected: { type: 'command', commandName: 'youtube_play', query: 'badshah', language: 'hinglish' }
  },
  {
    input: "bhai youtube kholo aur atif aslam chala",
    expected: { type: 'command', commandName: 'youtube_play', query: 'atif aslam', language: 'hinglish' }
  },
  
  // Just open YouTube (no query)
  {
    input: "open youtube",
    expected: { type: 'command', commandName: 'youtube_play', query: '', language: 'en' }
  },
  {
    input: "youtube kholo",
    expected: { type: 'command', commandName: 'youtube_play', query: '', language: 'hinglish' }
  },
  
  // Implicit YouTube (play music pattern)
  {
    input: "play some music by shreya ghoshal",
    expected: { type: 'command', commandName: 'youtube_play', query: 'shreya ghoshal', language: 'en' }
  },
  
  // NOT YouTube commands (should return conversation)
  {
    input: "what is the weather",
    expected: { type: 'conversation' }
  },
  {
    input: "hello jarvis",
    expected: { type: 'conversation' }
  },
  {
    input: "tell me a joke",
    expected: { type: 'conversation' }
  },
  {
    input: "play chess with me",
    expected: { type: 'conversation' } // "play" without music context
  }
];

function runTests() {
  console.log('🧪 Running YouTube Command Detection Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  TEST_CASES.forEach((test, index) => {
    const result = detectYouTubeCommand(test.input);
    
    // Compare results
    const typeMatch = result.type === test.expected.type;
    const commandMatch = !test.expected.commandName || result.commandName === test.expected.commandName;
    const queryMatch = test.expected.query === undefined || 
                       result.query?.toLowerCase().includes(test.expected.query.toLowerCase()) ||
                       (!result.query && !test.expected.query);
    const languageMatch = !test.expected.language || result.language === test.expected.language;
    
    const success = typeMatch && commandMatch && queryMatch && languageMatch;
    
    if (success) {
      console.log(`✅ Test ${index + 1}: PASS`);
      console.log(`   Input: "${test.input}"`);
      console.log(`   Result:`, result);
      passed++;
    } else {
      console.log(`❌ Test ${index + 1}: FAIL`);
      console.log(`   Input: "${test.input}"`);
      console.log(`   Expected:`, test.expected);
      console.log(`   Got:`, result);
      failed++;
    }
    console.log('');
  });
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed out of ${TEST_CASES.length} total`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed!');
  }
}

// Export for use
export { TEST_CASES, runTests };

// Auto-run if executed directly
if (typeof window !== 'undefined') {
  console.log('YouTube Command Tests loaded. Run runTests() to execute.');
}
