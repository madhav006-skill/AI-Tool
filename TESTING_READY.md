# 🚀 SERVER READY - TESTING GUIDE

## ✅ Both Servers Running

### Backend Status
```
🤖 JARVIS Backend Server
📍 Running on: http://localhost:5000
📍 Health Check: http://localhost:5000/health
📍 API Endpoint: http://localhost:5000/api/respond
Status: ✅ ACTIVE
```

### Frontend Status
```
⚛️ React Frontend (Vite)
📍 Running on: http://localhost:3000
📍 Ready for browser access
Status: ✅ ACTIVE
```

---

## 🧪 Test Kaise Kare

### Test 1: Browser Main Access Karo
```
1. Browser kholo
2. URL bar main likho: http://localhost:3000
3. JARVIS interface dikhna chahiye
4. Empty chat screen nazar aayega

✅ Expected: UI load ho jaaye
```

### Test 2: English Mein Baat Karo
```
1. http://localhost:3000 kholo
2. Text input field mein likho: "Hello, how are you?"
3. Click karo send button
4. Wait karo response ke liye

Expected Response:
- Professional English tone
- Language detected: "en"
- Response in natural English

✅ PASS agar English reply aaye
```

### Test 3: Hindi/Hinglish Mein Test Karo
```
1. Text field mein likho: "Namaste, kaisa ho?"
2. Send button click karo
3. Listen karo response

Expected Response:
- Hinglish tone with "haan", "bilkul", "yaar"
- Language detected: "hi"
- Natural Indian accent voice

✅ PASS agar Hinglish reply with slang aaye
```

### Test 4: Voice Input Test Karo
```
1. Microphone button click karo (🎙️ icon)
2. Speak karo: "Tell me about Python"
3. Listen karo response

Expected:
- Continuous listening active
- Response generated
- Voice played back

✅ PASS agar voice recording + response work karey
```

### Test 5: Memory Test Karo
```
1. Say/Type: "I like Python"
2. Wait for response
3. Say/Type: "How do I learn it?"
4. Look at response - should reference Python

Expected:
- New response remembers previous context
- Not treating second message as fresh

✅ PASS agar context show karey
```

### Test 6: Interrupt (Barge-In) Test Karo
```
1. Say/Type: "Tell me a long story"
2. Assistant shuru karay bolna
3. Wait 2-3 seconds
4. Say/Type: "Stop, tell a joke"
5. Listen - audio should stop immediately

Expected:
- Audio stops < 100ms
- New response generated
- Console shows "[BARGE-IN] Voice detected"

✅ PASS agar interrupt smooth ho
```

---

## 🐛 Troubleshooting

### Issue: Microphone Permission Denied
```
Fix: 
1. Chrome address bar mein microphone icon dekho
2. Click karo
3. Select "Allow" for microphone access
4. Refresh page
```

### Issue: No Audio Output
```
Fix:
1. Check system volume (Windows taskbar)
2. Check browser volume
3. Toggle Voice button (🔊) in app header
4. Make sure speakers connected
```

### Issue: Backend Connection Failed
```
✅ Backend Status: Running on port 5000
Verify command:
  curl http://localhost:5000/health

Should return:
  {"status":"JARVIS Backend is running",...}
```

### Issue: Frontend Not Loading
```
✅ Frontend Status: Running on port 3000
Check:
  http://localhost:3000 should show JARVIS UI

If not:
  1. Check terminal - should show "ready in xxx ms"
  2. Clear browser cache (Ctrl+Shift+Del)
  3. Hard refresh (Ctrl+F5)
```

### Issue: Language Detection Wrong
```
Test with clear examples:
✅ English: "What is programming?"
✅ Hindi: "नमस्ते" or "kya haal hai?"

If wrong, check console:
  [API] Language detected: hi/en
```

---

## 📊 API Testing (curl)

### Test Backend Directly

**Health Check:**
```bash
curl http://localhost:5000/health
```
Expected: `{"status":"JARVIS Backend is running",...}`

**Language Detection:**
```bash
curl -X POST http://localhost:5000/api/language-detect \
  -H "Content-Type: application/json" \
  -d '{"text":"Namaste"}'
```
Expected: `{"language":"hi","voiceProfile":"hi-IN-MadhurNeural"}`

**Chat Response:**
```bash
curl -X POST http://localhost:5000/api/respond \
  -H "Content-Type: application/json" \
  -d '{"userMessage":"Hello","conversationMemory":[]}'
```
Expected: Response with text, language, voiceProfile

---

## 📈 Console Output Expected

When you interact with JARVIS, browser console (F12) should show:

```
[VOICE] Microphone initialized with VAD
[API] User message: "hello"
[API] Language detected: en
[LLM] Chat response for en with 0 exchanges in context
[TTS] Speaking in en: "Hello! How can I help?"
```

---

## ✅ All 6 Features to Test

1. **Continuous Listening** ✅ - Say anything, it records
2. **Correct Language** ✅ - English/Hindi auto-detected
3. **Hinglish Slang** ✅ - Uses "haan", "bilkul", "yaar"
4. **Human Voice** ✅ - Native accent (en-US or hi-IN)
5. **Interrupt** ✅ - Speak while assistant talking
6. **Memory** ✅ - References previous messages

---

## 📍 URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/health

---

## 🎯 Quick Testing Sequence

```
1. Open http://localhost:3000 in browser
2. Type: "Hello"
3. Verify: English response
4. Type: "Namaste"
5. Verify: Hinglish response with slang
6. Try microphone button
7. Say: "Tell me a story"
8. Interrupt during speech
9. Verify: All features work
```

---

**Status: ✅ SERVER READY FOR TESTING**

अब test kar na! 🚀

(Now go test it! 🚀)
