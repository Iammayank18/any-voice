class BaseAdapter {
  constructor(onNewMessageCallback) {
    this.onNewMessageCallback = onNewMessageCallback;
    this.lastObservedMessageText = "";
    this.observer = null;
  }
  
  init() {
    this.startObserver();
  }

  submitText(text) {
    const input = this.getInputElement();
    if (!input) return false;
    
    // Focus the input
    input.focus();
    
    // Fallback logic for React / complex editor inputs
    if (input.tagName.toLowerCase() === 'textarea' || input.tagName.toLowerCase() === 'input') {
      input.value = text;
      // Dispatch input events
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // ContentEditable
      // Overwrite existing by selecting all (safer for modern editors)
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, text);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Delay button click precisely to allow Angular/React internal states to update
    setTimeout(() => this.clickSubmitButton(), 400);
    return true;
  }

  // Abstract methods to override
  getInputElement() { return null; }
  clickSubmitButton() {}
  startObserver() {}
  stopObserver() {
    if (this.observer) this.observer.disconnect();
  }
}

class ChatGPTAdapter extends BaseAdapter {
  getInputElement() {
    return document.querySelector('#prompt-textarea');
  }

  clickSubmitButton() {
    const btn = document.querySelector('button[data-testid="send-button"]');
    if (btn && !btn.disabled) {
      btn.click();
    } else {
      const input = this.getInputElement();
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    }
  }

  startObserver() {
    let timeout = null;
    let currentlyStreamingText = "";

    // Ignore existing conversation history on load
    const initialMessages = document.querySelectorAll('div[data-message-author-role="assistant"]');
    if (initialMessages.length > 0) {
      currentlyStreamingText = initialMessages[initialMessages.length - 1].innerText;
    }

    this.observer = new MutationObserver((mutations) => {
      const messages = document.querySelectorAll('div[data-message-author-role="assistant"]');
      if (messages.length === 0) return;
      
      const latestMessage = messages[messages.length - 1];
      const text = latestMessage.innerText;

      if (text !== currentlyStreamingText && text.trim().length > 0) {
        currentlyStreamingText = text;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          if (typeof this.onNewMessageCallback === 'function') {
            this.onNewMessageCallback(text);
          }
        }, 1500);
      }
    });

    this.observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
}

class ClaudeAdapter extends BaseAdapter {
  getInputElement() {
    return document.querySelector('.ProseMirror') || document.querySelector('div[contenteditable="true"]');
  }

  clickSubmitButton() {
    const btn = document.querySelector('button[aria-label="Send Message"]') || document.querySelector('button:has(svg.lucide-arrow-stop)');
    if (btn) btn.click();
  }

  startObserver() {
    let timeout = null;
    let currentlyStreamingText = "";

    // Ignore existing conversation history on load
    const initialMessages = document.querySelectorAll('.font-claude-message');
    if (initialMessages.length > 0) {
      currentlyStreamingText = initialMessages[initialMessages.length - 1].innerText;
    }

    this.observer = new MutationObserver((mutations) => {
      const messages = document.querySelectorAll('.font-claude-message');
      if (messages.length === 0) return;
      
      const latestMessage = messages[messages.length - 1];
      const text = latestMessage.innerText;

      if (text !== currentlyStreamingText && text.trim().length > 0) {
        currentlyStreamingText = text;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          if (typeof this.onNewMessageCallback === 'function') {
            this.onNewMessageCallback(text);
          }
        }, 1500);
      }
    });

    this.observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
}

class GeminiAdapter extends BaseAdapter {
  getInputElement() {
    return document.querySelector('rich-textarea') || document.querySelector('.ql-editor') || document.querySelector('div[contenteditable="true"]');
  }

  clickSubmitButton() {
    // Gemini send button selectors vary
    const btn = document.querySelector('button[aria-label="Send prompt"]') || 
                document.querySelector('button[aria-label="Send message"]') || 
                document.querySelector('.send-button') ||
                document.querySelector('button.mdc-icon-button') ||
                document.querySelector('button[mattooltip="Send message"]');
                
    if (btn && !btn.disabled) {
      btn.click();
    } else {
      // Fallback: fire enter key natively
      const input = this.getInputElement();
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
    }
  }

  startObserver() {
    let timeout = null;
    let currentlyStreamingText = "";

    // Ignore existing conversation history on load
    const initialMessages = document.querySelectorAll('model-response message-content, message-content');
    if (initialMessages.length > 0) {
      currentlyStreamingText = initialMessages[initialMessages.length - 1].innerText;
    }

    this.observer = new MutationObserver((mutations) => {
      // specifically target AI response elements in Gemini
      const messages = document.querySelectorAll('model-response message-content, message-content');
      if (messages.length === 0) return;
      
      const latestMessage = messages[messages.length - 1];
      const text = latestMessage.innerText;

      if (text !== currentlyStreamingText && text.trim().length > 0) {
        currentlyStreamingText = text;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          // If the text is exactly what we just sent, don't speak it.
          if (typeof this.onNewMessageCallback === 'function') {
            this.onNewMessageCallback(text);
          }
        }, 1500);
      }
    });

    this.observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
}

function getAdapter(hostname, onNewMessageCallback) {
  if (hostname.includes('chatgpt.com')) {
    return new ChatGPTAdapter(onNewMessageCallback);
  } else if (hostname.includes('claude.ai')) {
    return new ClaudeAdapter(onNewMessageCallback);
  } else if (hostname.includes('gemini.google.com')) {
    return new GeminiAdapter(onNewMessageCallback);
  }
  return null;
}

window.getAdapter = getAdapter;
