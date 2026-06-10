/*
 * engine.js — 低分辨率后备缓冲(320x240) + 放大呈现 + 键盘输入
 */
var PAL = window.PAL || (window.PAL = {});

(function () {
	'use strict';

	var W = 320, H = 240;

	var Screen = {
		W: W,
		H: H,
		canvas: null,
		buffer: null,
		g: null,
		init: function (canvasId) {
			this.canvas = document.getElementById(canvasId);
			this.outCtx = this.canvas.getContext('2d');
			this.outCtx.imageSmoothingEnabled = false;
			this.buffer = document.createElement('canvas');
			this.buffer.width = W;
			this.buffer.height = H;
			this.g = this.buffer.getContext('2d');
		},
		present: function () {
			this.outCtx.imageSmoothingEnabled = false;
			this.outCtx.drawImage(this.buffer, 0, 0, this.canvas.width, this.canvas.height);
		},
		// 在缓冲上绘制中文文本（低分辨率字体，放大后呈像素感）
		text: function (str, x, y, color, size, align) {
			var g = this.g;
			g.font = (size || 10) + 'px "PingFang SC", "Microsoft YaHei", sans-serif';
			g.textAlign = align || 'left';
			g.textBaseline = 'top';
			g.fillStyle = color || '#fff';
			g.fillText(str, x, y);
			g.textAlign = 'left';
		},
		textShadow: function (str, x, y, color, size, align) {
			this.text(str, x + 1, y + 1, '#000', size, align);
			this.text(str, x, y, color, size, align);
		},
		measure: function (str, size) {
			var g = this.g;
			g.font = (size || 10) + 'px "PingFang SC", "Microsoft YaHei", sans-serif';
			return g.measureText(str).width;
		},
		box: function (x, y, w, h) {
			var g = this.g;
			g.fillStyle = 'rgba(10, 14, 36, 0.92)';
			g.fillRect(x, y, w, h);
			g.strokeStyle = '#d8c890';
			g.lineWidth = 1;
			g.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
		}
	};

	var KEYMAP = {
		ArrowUp: 'up', KeyW: 'up',
		ArrowDown: 'down', KeyS: 'down',
		ArrowLeft: 'left', KeyA: 'left',
		ArrowRight: 'right', KeyD: 'right',
		Enter: 'confirm', KeyZ: 'confirm', Space: 'confirm',
		Escape: 'cancel', KeyX: 'cancel',
		KeyM: 'mute'
	};

	var Input = {
		down: {},
		pressed: {},
		init: function () {
			var self = this;
			window.addEventListener('keydown', function (e) {
				var k = KEYMAP[e.code];
				if (!k) return;
				e.preventDefault();
				if (!e.repeat && !self.down[k]) self.pressed[k] = true;
				self.down[k] = true;
			});
			window.addEventListener('keyup', function (e) {
				var k = KEYMAP[e.code];
				if (!k) return;
				e.preventDefault();
				self.down[k] = false;
			});
		},
		isDown: function (k) { return !!this.down[k]; },
		// 边沿触发，取出后即清除
		took: function (k) {
			if (this.pressed[k]) {
				this.pressed[k] = false;
				return true;
			}
			return false;
		},
		endFrame: function () { this.pressed = {}; }
	};

	PAL.Screen = Screen;
	PAL.Input = Input;
})();
