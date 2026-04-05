# AnyChat 🎙️🔮

**AnyChat** is a powerful Chrome extension that instantly transforms popular AI web interfaces (ChatGPT, Claude, and Gemini) into immersive, hands-free voice companions. 

By injecting a cinematic floating "Sphere" UI directly into the browser, AnyChat enables a continuous voice-to-voice interaction loop, bypassing the need to ever type or read traditional chat boxes.

## ✨ Key Features

### 🎬 Cinematic Voice (Groq API Integration)
AnyChat bypasses robotic native browser voices by natively supporting **Groq**. By simply dropping your Groq API key into the extension settings, AnyChat intelligently routes all text to Groq’s ultra-low latency `orpheus-v1-english` engine, streaming back buttery-smooth, human-like voice responses in milliseconds.

### 🎭 Dynamic AI Personas
Shift the psychological behavior of your AI completely on the fly without typing a word! Select from 5 curated Personas in the popup:
- **Conversational (Default)**: Normal AI behavior.
- **Friendly**: Injects instructions to respond warmly and supportively.
- **Neutral**: Keeps the AI entirely objective and direct.
- **Interview Mode**: Forces the AI to act as a professional interviewer who critically assesses your responses and proactively asks follow-up questions.
- **Challenging**: Forces the AI to debate you intelligently on your assertions.
- **Aggressive**: Pushes the AI into a highly combative and demanding state.

*AnyChat handles this securely under the hood by automatically intercepting your recognized speech and prefixing it with a hidden instruction block milliseconds before hitting send.*

### 🧘 Immersive Focus Mode
When the Voice Assistant is active, AnyChat automatically dims your browser and applies a beautiful frosted-glass blur over the underlying chat platform. This blocks accidental background clicks and eliminates complex UI distractions, keeping you entirely focused on the conversation.

### 🔄 True Hands-Free Loop
Once you click "Start Chat", the extension:
1. **Listens** to your Voice (STT) via the browser's native Web Speech API.
2. **Auto-Submits** your speech directly into the input box of ChatGPT, Claude, or Gemini.
3. **Observes** the DOM dynamically, waiting for the AI to finish typing its new response.
4. **Speaks** the exact response back to you.
5. **Auto-Reactivates** the microphone the second it finishes talking, creating an infinite, seamless conversational loop.

### 🔌 Multi-Platform Support
Built on a modular Adapter architecture, AnyChat dynamically detects which site you are on and adapts its DOM injection strategies accordingly. Currently supports:
- `chatgpt.com`
- `claude.ai`
- `gemini.google.com`

---

## 🚀 Installation 

Since AnyChat interacts aggressively with browser DOMs and audio APIs, it must be loaded as an Unpacked Extension:

1. Clone or download this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Toggle **Developer mode** in the top right corner.
4. Click **Load unpacked** in the top left corner.
5. Select the `any-chat` folder you downloaded.
6. *Optional but highly recommended:* Pin the AnyChat extension to your toolbar for quick access.

## ⚙️ Configuration & Usage

1. Click the AnyChat extension icon in your Chrome toolbar.
2. Optional: Paste in a **Groq API Key** for cinematic audio.
3. Select your desired preferred **AI Persona Mode**.
4. Navigate to any active ChatGPT, Claude, or Gemini tab.
5. Click **Start Chat** in the extension popup. 
6. Watch the screen blur, the Sphere appear, and simply start talking!

## 🧩 Architecture Snapshot

- `popup/` - HTML/JS/CSS for the extension popup and user settings. Real-time synced to local storage.
- `content/index.js` - The primary glue tying the extension together. Listens for UI triggers, intercepts recognized speech, manages the Persona prefixing, and controls the audio state.
- `content/adapters.js` - Complex Site-Specific Adapters bypassing tricky implementations (such as React synthetic events and Angular content-editables) to forcefully type text and trigger submit buttons.
- `content/stt.js` & `content/tts.js` - Resilient audio stream managers handling the Web Speech pipeline and Groq fallback logic.
- `content/ui.js` & `content/ui.css` - Shadow DOM injection housing the interactive floating Sphere model and immersive backdrop blurring. 

## 🛡️ Privacy
AnyChat strictly operates client-side. Your voice data is processed natively by modern browser APIs (and the Groq API, if supplied). Your API Key is securely stored in standard Chrome local synced storage. No intermediate servers are used.
