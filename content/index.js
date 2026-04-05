// Main content script that glues STT, TTS, Adapter, and UI together
console.log("AnyChat: Injecting Voice Assistant...");

let isExtensionEnabled = true;

chrome.storage.sync.get(['voiceAssistantEnabled', 'preferredVoice', 'speechRate', 'groqApiKey', 'aiMode'], (data) => {
  isExtensionEnabled = data.voiceAssistantEnabled !== false;
  if (isExtensionEnabled) {
    initializeExtension(data);
  }
});

function initializeExtension(settings) {
  let currentAiMode = settings.aiMode || 'Conversational';

  const adapter = window.getAdapter(window.location.hostname, (newMessageText) => {
    if (!ui.isVisible) {
      console.log("AnyChat: Background message ignored (Sphere UI is currently hidden).");
      return;
    }
    // When a new message is fully formed
    console.log("AnyChat: New message finalized, speaking...");
    tts.speak(newMessageText);
  });

  if (!adapter) {
    console.log("AnyChat: No adapter found for this site.");
    return;
  }

  let ui, stt, tts;

  const onUItoggle = () => {
    if (ui.currentState === 'speaking') {
      tts.stop();
      stt.start(); // Go back to listening
    } else if (ui.currentState === 'listening') {
      stt.stop();
    } else {
      stt.start();
    }
  };

  ui = new window.VoiceUI(onUItoggle);

  stt = new window.SpeechToTextManager(
    (finalTranscript, interimTranscript) => { // onResult
      if (finalTranscript) {
        console.log("AnyChat: Heard:", finalTranscript);
        // User spoke something final
        // Stop STT temporarily when we submit, so we don't accidentally transcribe TTS or noises while waiting
        stt.stop();
        ui.setState('idle');
        ui.setTooltipText('Sending...');
        
        // Interrupt any ongoing TTS
        if (tts.isSpeaking()) {
            tts.stop();
        }

        let textToSubmit = finalTranscript;
        if (currentAiMode && currentAiMode !== 'Conversational') {
            const prefixMap = {
                'Friendly': '[Instruction: Reply in a very friendly, warm, and supportive tone] ',
                'Neutral': '[Instruction: Reply in a strictly neutral, direct, and objective tone] ',
                'Interview': '[Instruction: Act as a professional interviewer asking follow-up questions] ',
                'Challenging': '[Instruction: Reply in a challenging tone. Intelligently debate my points] ',
                'Aggressive': '[Instruction: Reply in an aggressive, highly demanding and combative tone] '
            };
            const prefix = prefixMap[currentAiMode];
            if (prefix) {
                textToSubmit = prefix + textToSubmit;
            }
        }

        const success = adapter.submitText(textToSubmit);
        if (!success) {
           console.error("AnyChat: Failed to find input wrapper.");
           stt.start(); // restart if failed
        }
      } else {
         ui.setTooltipText(`"${interimTranscript}"`);
      }
    },
    () => { // onStart
      ui.setState('listening');
    },
    () => { // onEnd
      if (ui.currentState === 'listening') {
        ui.setState('idle');
      }
    },
    (err) => { // onError
      ui.setState('idle');
      ui.setTooltipText(`Error: ${err}`);
      console.error(err);
    }
  );

  tts = new window.TextToSpeechManager(
    () => { // onStart
      ui.setState('speaking');
    },
    () => { // onEnd
      // Continuous Conversation Loop:
      // When AI finishes speaking, visually reset and immediately start listening again
      ui.setState('idle');
      if (ui.isVisible) {
        // Automatically start the microphone so user doesn't have to click
        stt.start();
      }
    }
  );

  tts.setSettings(settings.preferredVoice, settings.speechRate, settings.groqApiKey);
  adapter.init();

  // Listen for 'Start Chat' command from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "START_CHAT") {
      if (!ui.isVisible) {
        ui.toggleModal();
      }
      // Auto-start listening on launch for best UX
      if (ui.currentState !== 'listening') {
        stt.start();
      }
      sendResponse({status: "ok"});
    }
  });

  // Listen for real-time setting changes from the popup
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
      if (changes.aiMode) {
        currentAiMode = changes.aiMode.newValue;
        console.log("AnyChat: Persona magically shifted to " + currentAiMode);
      }
      if (changes.preferredVoice || changes.speechRate || changes.groqApiKey) {
        chrome.storage.sync.get(['preferredVoice', 'speechRate', 'groqApiKey'], (data) => {
          tts.setSettings(data.preferredVoice, data.speechRate, data.groqApiKey);
          console.log("AnyChat: Voice settings dynamically updated.");
        });
      }
    }
  });
}
