// Web Audio API Sound Synthesizer (No external audio file dependencies)

class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('quiz_muted') === 'true';
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('quiz_muted', this.muted ? 'true' : 'false');
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio autoplay policy catch
    }
  }

  playTick() {
    this.playTone(800, 'sine', 0.05, 0.05);
  }

  playUrgentTick() {
    this.playTone(1100, 'triangle', 0.08, 0.08);
  }

  playCorrect() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'triangle', 0.25, 0.15);
        }, idx * 70);
      });
    } catch (e) {}
  }

  playIncorrect() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;

      this.playTone(220, 'sawtooth', 0.25, 0.1);
      setTimeout(() => {
        this.playTone(196, 'sawtooth', 0.35, 0.1);
      }, 120);
    } catch (e) {}
  }

  playPrize() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'sine', 0.35, 0.18);
        }, idx * 100);
      });
    } catch (e) {}
  }

  playFanfare() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const fanfare = [
        { f: 523.25, d: 150 },
        { f: 523.25, d: 150 },
        { f: 523.25, d: 150 },
        { f: 659.25, d: 300 },
        { f: 783.99, d: 450 }
      ];

      let elapsed = 0;
      fanfare.forEach((n) => {
        setTimeout(() => {
          this.playTone(n.f, 'triangle', n.d / 1000, 0.2);
        }, elapsed);
        elapsed += n.d;
      });
    } catch (e) {}
  }
}

const soundManager = new SoundFX();
export default soundManager;
