class VoiceUI {
  constructor(onClickToggle) {
    this.onClickToggle = onClickToggle;
    this.currentState = 'idle'; // idle, listening, speaking
    this.isVisible = false;
    this.injectUI();
  }

  injectUI() {
    this.hostElement = document.createElement('div');
    this.hostElement.id = 'anychat-fabric-host';
    document.body.appendChild(this.hostElement);

    this.shadowRoot = this.hostElement.attachShadow({ mode: 'open' });

    // Inject CSS
    const linkElem = document.createElement('link');
    linkElem.setAttribute('rel', 'stylesheet');
    linkElem.setAttribute('href', chrome.runtime.getURL('content/ui.css'));
    this.shadowRoot.appendChild(linkElem);

    // Create Main Container
    this.container = document.createElement('div');
    this.container.className = 'anychat-container state-idle';

    // The Modal Overlay
    this.modal = document.createElement('div');
    this.modal.className = 'anychat-modal';

    // Close Button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => this.toggleModal();
    this.modal.appendChild(closeBtn);

    // Sphere Area
    const sphereContainer = document.createElement('div');
    sphereContainer.className = 'sphere-container';
    
    this.ripple = document.createElement('div');
    this.ripple.className = 'ripple';
    
    this.sphere = document.createElement('div');
    this.sphere.className = 'sphere';
    
    sphereContainer.appendChild(this.ripple);
    sphereContainer.appendChild(this.sphere);
    
    // Click Sphere to trigger logic
    sphereContainer.onclick = () => {
      if (this.onClickToggle) this.onClickToggle();
    };
    
    this.modal.appendChild(sphereContainer);

    // Status Message
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'status-text';
    this.tooltip.innerText = 'Tap Sphere to Speak';
    this.modal.appendChild(this.tooltip);

    this.container.appendChild(this.modal);

    this.shadowRoot.appendChild(this.container);
  }

  toggleModal() {
    this.isVisible = !this.isVisible;
    if (this.isVisible) {
      this.container.classList.add('is-visible');
    } else {
      this.container.classList.remove('is-visible');
    }
  }

  setState(state) {
    this.container.classList.remove('state-idle', 'state-listening', 'state-speaking');
    this.container.classList.add(`state-${state}`);
    this.currentState = state;

    if (state === 'idle') {
      this.tooltip.innerText = 'Tap Sphere to Speak';
    } else if (state === 'listening') {
      this.tooltip.innerText = 'Listening... (Tap to stop)';
    } else if (state === 'speaking') {
      this.tooltip.innerText = 'Speaking... (Tap to interrupt)';
    }
  }

  setTooltipText(text) {
    if (this.tooltip) {
      this.tooltip.innerText = text;
    }
  }
}

window.VoiceUI = VoiceUI;
