class TTSService {
  constructor() {
    this.currentAudio = null;
    this.isMuted = false;
  }

  stop() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
      this.currentAudio = null;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }

  speakAudio(audioUrl, fallbackText) {
    this.stop();

    if (this.isMuted) return;

    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl);
        audio.volume = 1.0;
        this.currentAudio = audio;
        audio.play().catch((err) => {
          console.warn('HTML5 Audio playback error:', err);
          this.speakFallbackBrowserSpeech(fallbackText);
        });
        return;
      } catch (e) {
        console.warn('Audio element error:', e);
      }
    }

    this.speakFallbackBrowserSpeech(fallbackText);
  }

  speakFallbackBrowserSpeech(text) {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;

    const cleanText = text.replace(/[*_#~]/g, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (enVoice) utterance.voice = enVoice;

    try {
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted) {
      this.stop();
    }
  }
}

export const tts = new TTSService();
