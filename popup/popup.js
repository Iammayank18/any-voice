document.addEventListener('DOMContentLoaded', () => {
    const startChatBtn = document.getElementById('startChatBtn');
    const toggleExtension = document.getElementById('toggleExtension');
    const voiceSelect = document.getElementById('voiceSelect');
    const groqApiKey = document.getElementById('groqApiKey');
    const speechRate = document.getElementById('speechRate');
    const rateValue = document.getElementById('rateValue');
    const summarizationEnabled = document.getElementById('summarizationEnabled');
    const aiModeSelect = document.getElementById('aiModeSelect');

    // Load available voices into select
    const synth = window.speechSynthesis;
    function populateVoiceList() {
        if(typeof synth === 'undefined') return;
        const voices = synth.getVoices();
        voiceSelect.innerHTML = '';
        voices.forEach((voice) => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.value = voice.name;
            voiceSelect.appendChild(option);
        });
        
        // After loading voices, set the selected one from storage
        chrome.storage.sync.get('preferredVoice', (data) => {
            if (data.preferredVoice && voices.find(v => v.name === data.preferredVoice)) {
                voiceSelect.value = data.preferredVoice;
            }
        });
    }

    populateVoiceList();
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = populateVoiceList;
    }

    // Load existing settings
    chrome.storage.sync.get(['voiceAssistantEnabled', 'speechRate', 'summarizationEnabled', 'groqApiKey'], (data) => {
        toggleExtension.checked = data.voiceAssistantEnabled !== false;
        
        if (data.speechRate) {
            speechRate.value = data.speechRate;
            rateValue.textContent = `${data.speechRate}x`;
        }
        
        if (data.groqApiKey) {
            groqApiKey.value = data.groqApiKey;
        }

        if (data.aiMode) {
            aiModeSelect.value = data.aiMode;
        }

        summarizationEnabled.checked = data.summarizationEnabled || false;
    });

    // Save Groq key
    groqApiKey.addEventListener('input', (e) => {
        chrome.storage.sync.set({ groqApiKey: e.target.value.trim() });
    });

    // Start Chat Trigger
    startChatBtn.addEventListener('click', () => {
        startChatBtn.innerHTML = "Starting...";
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "START_CHAT" }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError.message);
                        startChatBtn.innerHTML = "Reload this Page & Try Again";
                        startChatBtn.style.background = "#ff3b30";
                    } else {
                        // Close popup nicely
                        window.close();
                    }
                });
            } else {
                 startChatBtn.innerHTML = "No Chat Open";
            }
        });
    });

    // Save settings on change
    toggleExtension.addEventListener('change', (e) => {
        chrome.storage.sync.set({ voiceAssistantEnabled: e.target.checked });
        // NOTE: Would need a page reload or messaging to toggle extension state mid-session, 
        // for MVP they can just reload the chat page.
    });

    voiceSelect.addEventListener('change', (e) => {
        chrome.storage.sync.set({ preferredVoice: e.target.value });
    });

    aiModeSelect.addEventListener('change', (e) => {
        chrome.storage.sync.set({ aiMode: e.target.value });
    });

    speechRate.addEventListener('input', (e) => {
        rateValue.textContent = `${e.target.value}x`;
        chrome.storage.sync.set({ speechRate: parseFloat(e.target.value) });
    });

    summarizationEnabled.addEventListener('change', (e) => {
        chrome.storage.sync.set({ summarizationEnabled: e.target.checked });
    });
});
