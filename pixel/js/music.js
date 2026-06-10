/*
 * music.js — WebAudio 芯片音乐引擎，全部曲目为本项目原创谱写（A 羽五声音阶）。
 * 方波旋律 + 三角波低音 + 噪声打击，呈 8-bit 像素质感。
 * 浏览器要求用户手势后才能出声：首次按键自动解锁。
 */
var PAL = window.PAL || (window.PAL = {});

(function () {
	'use strict';

	// 音符记法：[MIDI 音高或 null(休止), 八分音符步数]
	var SONGS = {
		title: {
			bpm: 70,
			tracks: [
				{ wave: 'square', vol: 0.30, notes: [
					[69, 4], [72, 2], [74, 2], [76, 8], [74, 2], [72, 2], [69, 4], [67, 8],
					[64, 4], [67, 2], [69, 2], [72, 8], [74, 4], [72, 2], [69, 2], [67, 8]
				] },
				{ wave: 'triangle', vol: 0.50, notes: [
					[45, 8], [40, 8], [43, 8], [45, 8],
					[45, 8], [40, 8], [43, 8], [45, 8]
				] }
			]
		},
		village: {
			bpm: 104,
			tracks: [
				{ wave: 'square', vol: 0.26, notes: [
					[64, 2], [67, 2], [69, 4], [67, 2], [69, 2], [72, 4],
					[69, 2], [67, 2], [64, 4], [62, 2], [60, 2], [62, 4]
				] },
				{ wave: 'triangle', vol: 0.48, notes: [
					[48, 4], [55, 4], [52, 4], [55, 4],
					[48, 4], [55, 4], [50, 4], [55, 4]
				] }
			]
		},
		island: {
			bpm: 84,
			tracks: [
				{ wave: 'triangle', vol: 0.42, notes: [
					[76, 6], [74, 2], [72, 6], [69, 2], [67, 8], [69, 6], [72, 2], [74, 8],
					[72, 4], [69, 4], [67, 8], [64, 8]
				] },
				{ wave: 'square', vol: 0.14, notes: [
					[45, 16], [43, 16], [48, 16], [45, 16]
				] }
			]
		},
		battle: {
			bpm: 144,
			tracks: [
				{ wave: 'square', vol: 0.28, notes: [
					[69, 2], [69, 2], [72, 2], [69, 2], [74, 2], [72, 2], [69, 2], [67, 2],
					[69, 2], [69, 2], [72, 2], [74, 2], [76, 2], [74, 2], [72, 2], [69, 2]
				] },
				{ wave: 'triangle', vol: 0.50, notes: [
					[45, 2], [45, 2], [45, 2], [45, 2], [43, 2], [43, 2], [43, 2], [43, 2],
					[45, 2], [45, 2], [45, 2], [45, 2], [40, 2], [40, 2], [43, 2], [43, 2]
				] },
				{ wave: 'noise', vol: 0.20, notes: [
					[1, 2], [null, 2], [1, 2], [null, 2], [1, 2], [null, 2], [1, 1], [1, 1], [null, 2],
					[1, 2], [null, 2], [1, 2], [null, 2], [1, 2], [null, 2], [1, 2], [null, 2]
				] }
			]
		},
		wedding: {
			bpm: 112,
			tracks: [
				{ wave: 'square', vol: 0.28, notes: [
					[72, 2], [74, 2], [76, 4], [74, 2], [72, 2], [69, 4],
					[72, 2], [76, 2], [79, 4], [76, 2], [74, 2], [72, 4]
				] },
				{ wave: 'triangle', vol: 0.48, notes: [
					[48, 4], [52, 4], [55, 4], [52, 4],
					[48, 4], [52, 4], [55, 4], [48, 4]
				] }
			]
		},
		ending: {
			bpm: 76,
			tracks: [
				{ wave: 'square', vol: 0.24, notes: [
					[67, 8], [69, 4], [72, 4], [74, 8], [72, 4], [69, 4],
					[67, 8], [64, 4], [62, 4], [64, 16]
				] },
				{ wave: 'triangle', vol: 0.48, notes: [
					[43, 16], [45, 16], [40, 16], [43, 16]
				] }
			]
		}
	};

	function midiFreq(m) {
		return 440 * Math.pow(2, (m - 69) / 12);
	}

	var Music = {
		ctx: null,
		master: null,
		noiseBuf: null,
		unlocked: false,
		muted: false,
		current: null,
		_timer: null,
		_trackState: null,

		ensure: function () {
			if (this.ctx) return;
			try {
				var AC = window.AudioContext || window.webkitAudioContext;
				if (!AC) return;
				this.ctx = new AC();
				this.master = this.ctx.createGain();
				this.master.gain.value = 0.16;
				this.master.connect(this.ctx.destination);
				var len = Math.floor(this.ctx.sampleRate * 0.3);
				this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
				var d = this.noiseBuf.getChannelData(0);
				for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
			} catch (e) { /* 无音频环境时静默运行 */ }
		},

		unlock: function () {
			this.ensure();
			if (!this.ctx) return;
			if (this.ctx.state === 'suspended') this.ctx.resume();
			if (!this.unlocked) {
				this.unlocked = true;
				if (this.current) this._start();
			}
		},

		toggleMute: function () {
			this.muted = !this.muted;
			if (this.master) this.master.gain.value = this.muted ? 0 : 0.16;
			return this.muted;
		},

		play: function (name) {
			if (this.current === name) return;
			this.current = name;
			this._stop();
			if (name && this.unlocked && this.ctx) this._start();
		},

		_start: function () {
			var song = SONGS[this.current];
			if (!song || !this.ctx) return;
			var stepDur = 60 / (song.bpm * 2);
			var t0 = this.ctx.currentTime + 0.08;
			this._trackState = song.tracks.map(function (tr) {
				return { tr: tr, idx: 0, time: t0 };
			});
			var self = this;
			this._timer = setInterval(function () {
				if (!self.ctx) return;
				var horizon = self.ctx.currentTime + 0.25;
				for (var i = 0; i < self._trackState.length; i++) {
					var st = self._trackState[i];
					while (st.time < horizon) {
						var note = st.tr.notes[st.idx];
						var dur = note[1] * stepDur;
						if (note[0] !== null) self._note(st.tr.wave, note[0], st.time, dur, st.tr.vol);
						st.time += dur;
						st.idx = (st.idx + 1) % st.tr.notes.length;
					}
				}
			}, 60);
		},

		_stop: function () {
			if (this._timer) {
				clearInterval(this._timer);
				this._timer = null;
			}
		},

		_note: function (wave, midi, t, dur, vol) {
			var ctx = this.ctx;
			var g = ctx.createGain();
			g.gain.setValueAtTime(0.0001, t);
			g.gain.linearRampToValueAtTime(vol, t + 0.012);
			g.gain.setValueAtTime(vol, Math.max(t + 0.012, t + dur * 0.7));
			g.gain.linearRampToValueAtTime(0.0001, t + dur * 0.95);
			g.connect(this.master);
			if (wave === 'noise') {
				var src = ctx.createBufferSource();
				src.buffer = this.noiseBuf;
				src.connect(g);
				src.start(t);
				src.stop(t + Math.min(dur, 0.12));
			} else {
				var osc = ctx.createOscillator();
				osc.type = wave;
				osc.frequency.value = midiFreq(midi);
				osc.connect(g);
				osc.start(t);
				osc.stop(t + dur);
			}
		},

		// ---------- 音效 ----------

		sfx: function (name) {
			if (!this.unlocked || !this.ctx || this.muted) return;
			var ctx = this.ctx, t = ctx.currentTime;
			var self = this;
			function blip(freq, dur, vol, type, slide) {
				var o = ctx.createOscillator(), g = ctx.createGain();
				o.type = type || 'square';
				o.frequency.setValueAtTime(freq, t);
				if (slide) o.frequency.linearRampToValueAtTime(slide, t + dur);
				g.gain.setValueAtTime(vol, t);
				g.gain.linearRampToValueAtTime(0.0001, t + dur);
				o.connect(g);
				g.connect(self.master);
				o.start(t);
				o.stop(t + dur);
			}
			switch (name) {
				case 'confirm': blip(880, 0.06, 0.2); break;
				case 'cursor': blip(660, 0.04, 0.15); break;
				case 'hit':
					blip(160, 0.12, 0.3, 'square', 60);
					if (this.noiseBuf) {
						var src = ctx.createBufferSource(), g2 = ctx.createGain();
						src.buffer = this.noiseBuf;
						g2.gain.setValueAtTime(0.25, t);
						g2.gain.linearRampToValueAtTime(0.0001, t + 0.1);
						src.connect(g2); g2.connect(this.master);
						src.start(t); src.stop(t + 0.1);
					}
					break;
				case 'skill': blip(300, 0.25, 0.22, 'square', 1400); break;
				case 'heal': blip(523, 0.1, 0.18); setTimeout(function () { self.sfx('confirm'); }, 90); break;
			}
		}
	};

	// 首次按键解锁音频
	window.addEventListener('keydown', function () { Music.unlock(); });

	PAL.Music = Music;
})();
