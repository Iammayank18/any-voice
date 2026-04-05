// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  // Initialize default options
  chrome.storage.sync.set({
    voiceAssistantEnabled: true,
    preferredVoice: 'Google US English',
    speechRate: 1.0,
    summarizationEnabled: false
  });
  console.log('AnyChat Voice Assistant Installed.');
});
