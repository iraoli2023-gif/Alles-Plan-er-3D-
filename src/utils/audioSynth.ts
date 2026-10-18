// Web Audio API sound synthesizer for Smart Home audio nodes, chimes, sirens and alerts

class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Classic two-tone Westminster Ding-Dong doorbell chime
   */
  public playDoorbell(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Tone 1: High (Ding ~659 Hz E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.35, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.95);

    // Tone 2: Lower (Dong ~523 Hz C5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(523.25, now + 0.45);

    gain2.gain.setValueAtTime(0, now + 0.45);
    gain2.gain.linearRampToValueAtTime(0.38, now + 0.49);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.45);
    osc2.stop(now + 1.65);
  }

  /**
   * Pleasant subtle confirmation beep / chime
   */
  public playConfirmation(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  /**
   * Short CAD snap tick sound for wall/grid snapping
   */
  public playSnap(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Subtle UI click sound for buttons and tabs
   */
  public playClick(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  /**
   * Multi-chord Welcome Tone
   */
  public playWelcome(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [440, 554.37, 659.25, 880]; // A major arpeggio
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.14;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.85);
    });
  }

  /**
   * Pulsing security / burglar alarm siren
   */
  public playSiren(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    // Modulate pitch up and down
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.35);
    osc.frequency.linearRampToValueAtTime(700, now + 0.7);
    osc.frequency.linearRampToValueAtTime(1200, now + 1.05);
    osc.frequency.linearRampToValueAtTime(700, now + 1.4);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.55);
  }

  /**
   * Terrarium / Technical warning alarm
   */
  public playAlert(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.18;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(950, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.13);
    }
  }

  public playSoundByType(type: 'doorbell' | 'siren' | 'welcome' | 'alert' | 'ding'): void {
    switch (type) {
      case 'doorbell':
        this.playDoorbell();
        break;
      case 'siren':
        this.playSiren();
        break;
      case 'welcome':
        this.playWelcome();
        break;
      case 'alert':
        this.playAlert();
        break;
      case 'ding':
      default:
        this.playConfirmation();
        break;
    }
  }
}

export const soundSynth = new SoundSynthesizer();
