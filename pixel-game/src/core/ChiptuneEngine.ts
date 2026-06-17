/**
 * WebAudio 芯片音乐引擎 — 方波旋律 + 三角波低音 + 噪声打击
 */
import { SONGS, type SfxName } from '../data/songs';

function midiFreq(m: number): number {
  return 440 * Math.pow(2, (m - 69) / 12);
}

interface TrackState {
  tr: { wave: string; vol: number; notes: [number | null, number][] };
  idx: number;
  time: number;
}

export class ChiptuneEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private unlocked = false;
  private muted = false;
  private current: string | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private trackState: TrackState[] | null = null;

  ensure(): void {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.16;
      this.master.connect(this.ctx.destination);
      const len = Math.floor(this.ctx.sampleRate * 0.3);
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch {
      /* 无音频环境时静默运行 */
    }
  }

  unlock(): void {
    this.ensure();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (!this.unlocked) {
      this.unlocked = true;
      if (this.current) this._start();
    }
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.16;
    return this.muted;
  }

  play(name: string | null): void {
    if (this.current === name) return;
    this.current = name;
    this._stop();
    if (name && this.unlocked && this.ctx) this._start();
  }

  private _start(): void {
    const song = SONGS[this.current!];
    if (!song || !this.ctx) return;
    const stepDur = 60 / (song.bpm * 2);
    const t0 = this.ctx.currentTime + 0.08;
    this.trackState = song.tracks.map((tr) => ({
      tr: tr as any, idx: 0, time: t0,
    }));
    this.timer = setInterval(() => {
      if (!this.ctx) return;
      const horizon = this.ctx.currentTime + 0.25;
      for (const st of this.trackState!) {
        while (st.time < horizon) {
          const note = st.tr.notes[st.idx];
          const dur = note[1] * stepDur;
          if (note[0] !== null) this._note(st.tr.wave as any, note[0], st.time, dur, st.tr.vol);
          st.time += dur;
          st.idx = (st.idx + 1) % st.tr.notes.length;
        }
      }
    }, 60);
  }

  private _stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private _note(wave: OscillatorType | 'noise', midi: number, t: number, dur: number, vol: number): void {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.setValueAtTime(vol, Math.max(t + 0.012, t + dur * 0.7));
    g.gain.linearRampToValueAtTime(0.0001, t + dur * 0.95);
    g.connect(this.master!);
    if (wave === 'noise') {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf!;
      src.connect(g);
      src.start(t);
      src.stop(t + Math.min(dur, 0.12));
    } else {
      const osc = ctx.createOscillator();
      osc.type = wave;
      osc.frequency.value = midiFreq(midi);
      osc.connect(g);
      osc.start(t);
      osc.stop(t + dur);
    }
  }

  sfx(name: SfxName): void {
    if (!this.unlocked || !this.ctx || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const blip = (freq: number, dur: number, vol: number, type: OscillatorType = 'square', slide?: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.linearRampToValueAtTime(slide, t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master!);
      o.start(t);
      o.stop(t + dur);
    };
    switch (name) {
      case 'confirm': blip(880, 0.06, 0.2); break;
      case 'cursor': blip(660, 0.04, 0.15); break;
      case 'hit':
        blip(160, 0.12, 0.3, 'square', 60);
        if (this.noiseBuf) {
          const src = ctx.createBufferSource();
          const g2 = ctx.createGain();
          src.buffer = this.noiseBuf;
          g2.gain.setValueAtTime(0.25, t);
          g2.gain.linearRampToValueAtTime(0.0001, t + 0.1);
          src.connect(g2);
          g2.connect(this.master!);
          src.start(t);
          src.stop(t + 0.1);
        }
        break;
      case 'skill': blip(300, 0.25, 0.22, 'square', 1400); break;
      case 'heal':
        blip(523, 0.1, 0.18);
        setTimeout(() => this.sfx('confirm'), 90);
        break;
    }
  }
}
