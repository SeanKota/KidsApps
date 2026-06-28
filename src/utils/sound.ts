class AudioSynth {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play a soft organic bubble pop sound (for click/tap feedback)
  playPop() {
    const ctx = this.init();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = 'sine';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(130, now + 0.08);
      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {
      console.warn('Failed to play pop sound:', e);
    }
  }

  // Play a gentle major chord chime (when answer is revealed)
  playReveal() {
    const ctx = this.init();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const playNote = (freq: number, delay: number, volume: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);
        gainNode.gain.setValueAtTime(0, now + delay);
        gainNode.gain.linearRampToValueAtTime(volume, now + delay + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.6);
        osc.start(now + delay);
        osc.stop(now + delay + 0.65);
      };
      playNote(523.25, 0, 0.06);
      playNote(659.25, 0.06, 0.06);
      playNote(783.99, 0.12, 0.06);
    } catch (e) {
      console.warn('Failed to play reveal sound:', e);
    }
  }

  // Play a warm success fanfare sound (when color match is detected)
  playSuccess() {
    const ctx = this.init();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const playNote = (freq: number, delay: number, volume: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);
        gainNode.gain.setValueAtTime(0, now + delay);
        gainNode.gain.linearRampToValueAtTime(volume, now + delay + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
        osc.start(now + delay);
        osc.stop(now + delay + duration);
      };
      playNote(523.25, 0, 0.07, 0.3);
      playNote(659.25, 0.15, 0.07, 0.3);
      playNote(783.99, 0.3, 0.07, 0.3);
    } catch (e) {
      console.warn('Failed to play success sound:', e);
    }
  }

  // Play a warm, flute-like tone sequence for discussion time
  playDiscuss() {
    const ctx = this.init();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const playNote = (freq: number, delay: number, volume: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + delay);
        gainNode.gain.setValueAtTime(0, now + delay);
        gainNode.gain.linearRampToValueAtTime(volume, now + delay + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
        osc.start(now + delay);
        osc.stop(now + delay + duration + 0.05);
      };
      playNote(349.23, 0, 0.08, 0.8);
      playNote(440.0, 0.15, 0.06, 0.8);
      playNote(523.25, 0.3, 0.06, 0.8);
      playNote(440.0, 0.45, 0.06, 1.2);
    } catch (e) {
      console.warn('Failed to play discuss sound:', e);
    }
  }
}

export const sound = new AudioSynth();
