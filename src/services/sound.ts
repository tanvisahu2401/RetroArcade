/**
 * 8-Bit Web Audio API Sound Synthesizer
 * Provides authentic retro arcade audio without external assets.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
    const saved = localStorage.getItem('retro_arcade_muted');
    if (saved !== null) {
      this.muted = saved === 'true';
    }
  }

  private initCtx(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    localStorage.setItem('retro_arcade_muted', String(this.muted));
    return this.muted;
  }

  public playTone(freq: number, type: OscillatorType, duration: number, startDelay = 0, gainLevel = 0.15) {
    if (this.muted) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startDelay);

      gain.gain.setValueAtTime(gainLevel, ctx.currentTime + startDelay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startDelay);
      osc.stop(ctx.currentTime + startDelay + duration);
    } catch {
      // Audio might be blocked by browser policy until interaction
    }
  }

  // Classic jump sound (sweep up)
  public playJump() {
    if (this.muted) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }

  // Coin pick up / Star collection (two-tone high ding)
  public playCoin() {
    if (this.muted) return;
    this.playTone(987.77, 'square', 0.08, 0, 0.12); // B5
    this.playTone(1318.51, 'square', 0.25, 0.08, 0.15); // E6
  }

  // Bounce boing (rubbery pitch drop/bend)
  public playBounce() {
    if (this.muted) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.05);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {}
  }

  // Snake food eat (quick blip)
  public playEat() {
    if (this.muted) return;
    this.playTone(523.25, 'square', 0.05, 0, 0.1);
    this.playTone(659.25, 'square', 0.08, 0.04, 0.12);
  }

  // Laser shot (descending saw)
  public playLaser() {
    if (this.muted) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  }

  // Level up or stage complete jingle
  public playLevelUp() {
    if (this.muted) return;
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'triangle', 0.14, idx * 0.08, 0.15);
    });
  }

  // Hit / Brick destroy / Enemy stomp
  public playHit() {
    if (this.muted) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }

  // Tetris line clear / level win fanfare
  public playClear() {
    if (this.muted) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'square', 0.12, idx * 0.08, 0.15);
    });
  }

  // Game over jingle
  public playGameOver() {
    if (this.muted) return;
    const notes = [440, 415.3, 392, 349.23];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'sawtooth', 0.2, idx * 0.14, 0.12);
    });
  }

  // Tetris piece rotate / small click
  public playClick() {
    if (this.muted) return;
    this.playTone(700, 'sine', 0.03, 0, 0.05);
  }
}

export const sound = new SoundEngine();
