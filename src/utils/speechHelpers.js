// Speech recognition and synthesis utilities for AiSuite

export class SpeechManager {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.isSpeaking = false;
    this.voicesLoaded = false;
    this.pendingQueue = [];
    
    // Initialize speech recognition if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }

    // Ensure voices are loaded; some browsers need an async event
    if (this.synthesis) {
      const loadVoices = () => {
        const voices = this.synthesis.getVoices();
        if (voices && voices.length) {
          this.voicesLoaded = true;
          // Flush any queued utterances
          const queue = [...this.pendingQueue];
            this.pendingQueue = [];
            queue.forEach(item => this._speakInternal(item.text, item.options));
        }
      };
      loadVoices();
      this.synthesis.onvoiceschanged = loadVoices;
      // Fallback attempt after short delay if still not loaded
      setTimeout(() => { if (!this.voicesLoaded) loadVoices(); }, 750);
    }
  }

  setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;
  }

  // Speech-to-text functionality
  startListening(onResult, onError, onEnd) {
    if (!this.recognition) {
      onError && onError(new Error('Speech recognition not supported'));
      return false;
    }

    if (this.isListening) {
      return false;
    }

    this.isListening = true;

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult && onResult(transcript);
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      onError && onError(new Error(`Speech recognition error: ${event.error}`));
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd && onEnd();
    };

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      this.isListening = false;
      onError && onError(error);
      return false;
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  // Text-to-speech functionality
  speak(text, options = {}) {
    if (!this.synthesis) {
      console.warn('Speech synthesis not supported');
      return false;
    }
    if (!text || !text.trim()) return false;

    // If voices not loaded yet, queue
    if (!this.voicesLoaded) {
      this.pendingQueue.push({ text, options });
      return true;
    }
    this.stopSpeaking();
    return this._speakInternal(text, options);
  }

  _speakInternal(text, options) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 0.95;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 0.9;
    utterance.lang = options.lang || 'en-US';
    // Voice preference: pick a stable default if not specified
    const voices = this.synthesis.getVoices();
    if (options.voice) {
      const selected = voices.find(v => v.name === options.voice);
      if (selected) utterance.voice = selected;
    } else if (voices.length) {
      // Pick first en voice for consistency
      const preferred = voices.find(v => v.lang.startsWith('en')) || voices[0];
      utterance.voice = preferred;
    }
    utterance.onstart = () => { this.isSpeaking = true; options.onStart && options.onStart(); };
    utterance.onend = () => { this.isSpeaking = false; options.onEnd && options.onEnd(); };
    utterance.onerror = (e) => {
      this.isSpeaking = false;
      // Retry once if voices may have loaded late
      if (!this.voicesLoaded) {
        setTimeout(() => this.speak(text, options), 300);
      }
      options.onError && options.onError(e);
    };
    this.synthesis.speak(utterance);
    return true;
  }

  forceSpeak(text) {
    // Utility to re-trigger speak ignoring queue state
    return this.speak(text, {});
  }

  stopSpeaking() {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.cancel();
      this.isSpeaking = false;
    }
  }

  // Get available voices
  getVoices() {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices();
  }

  // Check browser support
  static isSupported() {
    return {
      speechRecognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
      speechSynthesis: 'speechSynthesis' in window
    };
  }

  // Request microphone permission
  static async requestMicrophonePermission() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }
}

// Default speech manager instance
export const speechManager = new SpeechManager();

// Helper functions
export const speakText = (text, options = {}) => {
  return speechManager.speak(text, options);
};

export const startListening = (onResult, onError, onEnd) => {
  return speechManager.startListening(onResult, onError, onEnd);
};

export const stopListening = () => {
  speechManager.stopListening();
};

export const stopSpeaking = () => {
  speechManager.stopSpeaking();
};

export const isListening = () => {
  return speechManager.isListening;
};

export const isSpeaking = () => {
  return speechManager.isSpeaking;
};