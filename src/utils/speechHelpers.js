// Speech recognition and synthesis utilities for AiSuite

export class SpeechManager {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.isSpeaking = false;
    
    // Initialize speech recognition if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
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

    // Stop any current speech
    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure utterance
    utterance.rate = options.rate || 0.9;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 0.8;
    utterance.lang = options.lang || 'en-US';

    // Set voice if specified
    if (options.voice) {
      const voices = this.synthesis.getVoices();
      const selectedVoice = voices.find(voice => voice.name === options.voice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    // Event handlers
    utterance.onstart = () => {
      this.isSpeaking = true;
      options.onStart && options.onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      options.onEnd && options.onEnd();
    };

    utterance.onerror = (event) => {
      this.isSpeaking = false;
      options.onError && options.onError(event);
    };

    this.synthesis.speak(utterance);
    return true;
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