/*
 * dialog.js — 对话框：打字机文本、分页、选项
 *   say(items, cb)    items: [{n:'名字', t:'文本'}] 或纯字符串(旁白)
 *   choice(prompt, options, cb(index))
 */
var PAL = window.PAL || (window.PAL = {});

(function () {
	'use strict';

	var BOX_X = 8, BOX_W = 304, BOX_H = 58;
	var TEXT_SIZE = 10, LINE_H = 14, MAX_LINES = 2;
	var SPEED = 30; // 字/秒

	var Dialog = {
		active: false,
		mode: 'text',     // text | choice
		queue: [],
		pages: [],        // 当前条目分页后的行组
		pageIdx: 0,
		speaker: '',
		narration: false,
		reveal: 0,
		cb: null,
		// choice
		prompt: '',
		options: [],
		sel: 0,
		choiceCb: null,

		say: function (items, cb) {
			this.queue = items.slice();
			this.cb = cb || null;
			this.active = true;
			this.mode = 'text';
			this._nextItem();
		},

		choice: function (prompt, options, cb) {
			this.active = true;
			this.mode = 'choice';
			this.prompt = prompt;
			this.options = options;
			this.sel = 0;
			this.choiceCb = cb || null;
		},

		_nextItem: function () {
			if (!this.queue.length) {
				this.active = false;
				var cb = this.cb;
				this.cb = null;
				if (cb) cb();
				return;
			}
			var item = this.queue.shift();
			if (typeof item === 'string') item = { n: '', t: item };
			this.speaker = item.n || '';
			this.narration = !item.n;
			var lines = this._wrap(item.t, BOX_W - 20);
			this.pages = [];
			for (var i = 0; i < lines.length; i += MAX_LINES) {
				this.pages.push(lines.slice(i, i + MAX_LINES));
			}
			this.pageIdx = 0;
			this.reveal = 0;
		},

		_wrap: function (text, maxW) {
			var lines = [], cur = '';
			for (var i = 0; i < text.length; i++) {
				var next = cur + text[i];
				if (PAL.Screen.measure(next, TEXT_SIZE) > maxW) {
					lines.push(cur);
					cur = text[i];
				} else {
					cur = next;
				}
			}
			if (cur) lines.push(cur);
			return lines.length ? lines : [''];
		},

		_pageLen: function () {
			var page = this.pages[this.pageIdx] || [];
			var n = 0;
			for (var i = 0; i < page.length; i++) n += page[i].length;
			return n;
		},

		update: function (dt) {
			if (!this.active) return;
			var Input = PAL.Input;
			if (this.mode === 'choice') {
				if (Input.took('up')) { this.sel = (this.sel + this.options.length - 1) % this.options.length; PAL.Music.sfx('cursor'); }
				if (Input.took('down')) { this.sel = (this.sel + 1) % this.options.length; PAL.Music.sfx('cursor'); }
				if (Input.took('confirm')) {
					PAL.Music.sfx('confirm');
					this.active = false;
					var cb = this.choiceCb, sel = this.sel;
					this.choiceCb = null;
					if (cb) cb(sel);
				}
				return;
			}
			this.reveal += dt * SPEED;
			if (Input.took('confirm')) {
				if (this.reveal < this._pageLen()) {
					this.reveal = this._pageLen();
				} else if (this.pageIdx < this.pages.length - 1) {
					PAL.Music.sfx('confirm');
					this.pageIdx++;
					this.reveal = 0;
				} else {
					PAL.Music.sfx('confirm');
					this._nextItem();
				}
			}
		},

		render: function () {
			if (!this.active) return;
			var S = PAL.Screen;
			var by = S.H - BOX_H - 6;

			if (this.mode === 'choice') {
				S.box(BOX_X, by, BOX_W, BOX_H);
				S.text(this.prompt, BOX_X + 10, by + 8, '#f2e6c0', TEXT_SIZE);
				var ow = 110, oh = this.options.length * LINE_H + 12;
				var ox = S.W - ow - 16, oy = by - oh - 4;
				S.box(ox, oy, ow, oh);
				for (var i = 0; i < this.options.length; i++) {
					var sel = i === this.sel;
					if (sel) S.text('▶', ox + 8, oy + 7 + i * LINE_H, '#ffd24d', TEXT_SIZE);
					S.text(this.options[i], ox + 22, oy + 7 + i * LINE_H, sel ? '#ffd24d' : '#e8e8e8', TEXT_SIZE);
				}
				return;
			}

			S.box(BOX_X, by, BOX_W, BOX_H);
			var ty = by + 8;
			if (this.speaker) {
				S.text(this.speaker, BOX_X + 10, ty, '#7ec8e3', TEXT_SIZE);
				ty += LINE_H;
			}
			var page = this.pages[this.pageIdx] || [];
			var left = Math.floor(this.reveal);
			var color = this.narration ? '#cfd2da' : '#f2e6c0';
			for (var j = 0; j < page.length; j++) {
				var line = page[j];
				if (left <= 0) break;
				var shown = line.length <= left ? line : line.slice(0, left);
				left -= line.length;
				S.text(shown, BOX_X + 10, ty + j * LINE_H, color, TEXT_SIZE);
			}
			if (this.reveal >= this._pageLen()) {
				S.text('▼', S.W - 26, by + BOX_H - 13, '#ffd24d', 9);
			}
		}
	};

	PAL.Dialog = Dialog;
})();
