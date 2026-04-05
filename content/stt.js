class SpeechToTextManager {
  constructor(onResultCallback, onStartCallback, onEndCallback, onErrorCallback) {
    this.isActive = false;
    this.recognition = null;
    this.onResultCallback = onResultCallback;
    this.onStartCallback = onStartCallback;
    this.onEndCallback = onEndCallback;
    this.onErrorCallback = onErrorCallback;
    
    this.init();
  }

  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("AnyChat: SpeechRecognition API not supported in this browser.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isActive = true;
      if (this.onStartCallback) this.onStartCallback();
    };

    this.recognition.onend = () => {
      this.isActive = false;
      if (this.onEndCallback) this.onEndCallback();
    };

    this.recognition.onerror = (event) => {
      console.error("AnyChat STT Error:", event.error);
      if (this.onErrorCallback) this.onErrorCallback(event.error);
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      if (this.onResultCallback) {
        this.onResultCallback(finalTranscript, interimTranscript);
      }
    };
  }

  start() {
    if (this.recognition && !this.isActive) {
      try {
        this.recognition.start();
      } catch (e) {
        console.error("AnyChat: STT start error", e);
      }
    }
  }

  stop() {
    if (this.recognition && this.isActive) {
      this.recognition.stop();
    }
  }

  toggle() {
    if (this.isActive) {
      this.stop();
    } else {
      this.start();
    }
  }
}

window.SpeechToTextManager = SpeechToTextManager;
