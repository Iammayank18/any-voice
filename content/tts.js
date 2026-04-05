class TextToSpeechManager {
  constructor(onStartCallback, onEndCallback) {
    this.synth = window.speechSynthesis;
    this.onStartCallback = onStartCallback;
    this.onEndCallback = onEndCallback;
    this.preferredVoiceURI = null;
    this.speechRate = 1.0;
    this.groqApiKey = null;
    this.audioElement = null;

    // Hard stop initially
    this.stop();
  }

  setSettings(preferredVoiceURI, speechRate, groqApiKey) {
    this.preferredVoiceURI = preferredVoiceURI;
    this.speechRate = speechRate || 1.0;
    this.groqApiKey = groqApiKey;
  }

  cleanText(text) {
    return text.replace(/```[\s\S]*?```/g, " [Code Block Omitted] ")
               .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
               .replace(/https?:\/\/[^\s]+/g, " [URL Omitted] ")
               .replace(/[*_~`#]/g, "")
               .trim();
  }

  isSpeaking() {
    return this.synth.speaking || (this.audioElement && !this.audioElement.paused);
  }

  async speak(text) {
    const cleanedText = this.cleanText(text);
    if (!cleanedText) return;

    // Use Groq API if key is provided
    if (this.groqApiKey) {
      await this.speakWithGroq(cleanedText);
      return;
    }

    // Fallback to Native Speech Synthesis
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.rate = this.speechRate;

    const voices = this.synth.getVoices();
    if (this.preferredVoiceURI && voices.length > 0) {
      const selected = voices.find(v => v.voiceURI === this.preferredVoiceURI);
      if (selected) utterance.voice = selected;
    }

    utterance.onstart = () => {
      if (this.onStartCallback) this.onStartCallback();
    };

    utterance.onend = () => {
      if (this.onEndCallback) this.onEndCallback();
    };

    utterance.onerror = (e) => {
      console.error("AnyChat: TTS Error", e);
      if (this.onEndCallback) this.onEndCallback();
    };

    this.synth.speak(utterance);
  }

  async speakWithGroq(text) {
    try {
      if (this.onStartCallback) this.onStartCallback();
      
      const response = await fetch("https://api.groq.com/openai/v1/audio/speech", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "canopylabs/orpheus-v1-english", // Specific Groq TTS model
          input: text,
          voice: "diana", // strictly accepted by Groq's Orpheus model
          response_format: "wav"
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      this.audioElement = new Audio(url);
      
      this.audioElement.playbackRate = this.speechRate;

      this.audioElement.onended = () => {
        if (this.onEndCallback) this.onEndCallback();
      };
      
      await this.audioElement.play();
      
    } catch (error) {
      console.error("AnyChat: Groq TTS Failed (Ensure your API key is valid)", error);
      // We cannot fallback to native this.speak(text) here because browsers strictly block 
      // window.speechSynthesis.speak() if it happens inside an async callback (loss of user gesture).
      // Instead, we just end the speech gracefully to reset the UI.
      if (this.onEndCallback) this.onEndCallback(); 
    }
  }

  stop() {
    if (this.synth.speaking) {
      this.synth.cancel();
      if (this.onEndCallback) this.onEndCallback();
    }
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      if (this.onEndCallback) this.onEndCallback();
    }
  }
}
window.TextToSpeechManager = TextToSpeechManager;
