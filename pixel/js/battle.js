/*
 * battle.js — 回合制战斗：攻击 / 仙风剑诀 / 金创药
 */
var PAL = window.PAL || (window.PAL = {});

(function () {
	'use strict';

	function rnd(min, max) {
		return min + Math.floor(Math.random() * (max - min + 1));
	}

	var Battle = {
		active: false,
		phase: 'msg',      // menu | msg | over
		enemy: null,
		onWin: null,
		menu: [],
		sel: 0,
		msgs: [],
		afterMsgs: null,
		shake: 0,
		flash: 0,
		time: 0,

		start: function (enemy, onWin) {
			this.active = true;
			PAL.Music.play('battle');
			this.enemy = {
				name: enemy.name,
				hp: enemy.hp, maxhp: enemy.hp,
				atkMin: enemy.atkMin, atkMax: enemy.atkMax,
				sprite: enemy.sprite
			};
			this.onWin = onWin || null;
			this.sel = 0;
			this.shake = 0;
			this.flash = 0;
			this._refreshMenu();
			this._say([enemy.intro || (enemy.name + '挡住了去路！')], 'menu');
		},

		_refreshMenu: function () {
			var h = PAL.Story.hero;
			this.menu = [
				{ key: 'atk', label: '攻击' },
				{ key: 'skill', label: '仙风剑诀  ' + 6 + 'MP', off: h.mp < 6 || !PAL.Story.flags.learnedSkill },
				{ key: 'potion', label: '金创药 ×' + h.potions, off: h.potions <= 0 }
			];
		},

		_say: function (msgs, nextPhase) {
			this.msgs = msgs.slice();
			this.afterMsgs = nextPhase;
			this.phase = 'msg';
		},

		update: function (dt) {
			if (!this.active) return;
			this.time += dt;
			if (this.shake > 0) this.shake -= dt;
			if (this.flash > 0) this.flash -= dt;
			var Input = PAL.Input;
			var h = PAL.Story.hero;

			if (this.phase === 'msg') {
				if (Input.took('confirm')) {
					this.msgs.shift();
					if (!this.msgs.length) this._advance();
				}
				return;
			}

			if (this.phase === 'menu') {
				if (Input.took('up')) this.sel = (this.sel + this.menu.length - 1) % this.menu.length;
				if (Input.took('down')) this.sel = (this.sel + 1) % this.menu.length;
				if (Input.took('confirm')) {
					var item = this.menu[this.sel];
					if (item.off) {
						this._say(['现在用不了。'], 'menu');
						return;
					}
					this._heroAct(item.key);
				}
			}
		},

		_advance: function () {
			var next = this.afterMsgs;
			this.afterMsgs = null;
			if (next === 'win') {
				this.active = false;
				PAL.Game.playSceneMusic();
				var cb = this.onWin;
				this.onWin = null;
				if (cb) cb();
			} else if (next === 'lose') {
				// 不设死局：恢复后重来
				var h = PAL.Story.hero;
				h.hp = h.maxhp;
				h.mp = h.maxmp;
				this.enemy.hp = this.enemy.maxhp;
				this._refreshMenu();
				this._say(['李逍遥咬着牙又站了起来……', '“再来！”'], 'menu');
			} else if (next === 'enemy') {
				this._enemyAct();
			} else {
				this._refreshMenu();
				this.phase = next || 'menu';
			}
		},

		_heroAct: function (key) {
			var h = PAL.Story.hero;
			var e = this.enemy;
			var msgs = [];
			if (key === 'atk') {
				var dmg = rnd(9, 14);
				e.hp = Math.max(0, e.hp - dmg);
				this.shake = 0.25;
				PAL.Music.sfx('hit');
				msgs.push('李逍遥挥剑斩出，造成 ' + dmg + ' 点伤害！');
			} else if (key === 'skill') {
				h.mp -= 6;
				var dmg2 = rnd(18, 26);
				e.hp = Math.max(0, e.hp - dmg2);
				this.shake = 0.4;
				this.flash = 0.25;
				PAL.Music.sfx('skill');
				msgs.push('李逍遥使出「仙风剑诀」，剑气纵横！');
				msgs.push('造成 ' + dmg2 + ' 点伤害！');
			} else if (key === 'potion') {
				h.potions--;
				var heal = 35;
				h.hp = Math.min(h.maxhp, h.hp + heal);
				PAL.Music.sfx('heal');
				msgs.push('李逍遥服下金创药，恢复 ' + heal + ' 点体力。');
			}
			if (e.hp <= 0) {
				msgs.push(e.name + '化作一缕青烟散去了！');
				this._say(msgs, 'win');
			} else {
				this._say(msgs, 'enemy');
			}
		},

		_enemyAct: function () {
			var h = PAL.Story.hero;
			var e = this.enemy;
			var dmg = rnd(e.atkMin, e.atkMax);
			h.hp = Math.max(0, h.hp - dmg);
			PAL.Music.sfx('hit');
			var msgs = [e.name + '猛地扑了过来，李逍遥受到 ' + dmg + ' 点伤害！'];
			if (h.hp <= 0) {
				msgs.push('李逍遥眼前一黑，倒了下去……');
				this._say(msgs, 'lose');
			} else {
				this._say(msgs, 'menu');
			}
		},

		render: function () {
			if (!this.active) return;
			var S = PAL.Screen, g = S.g;
			var h = PAL.Story.hero;
			var e = this.enemy;

			// 背景
			g.fillStyle = '#101424';
			g.fillRect(0, 0, S.W, S.H);
			g.fillStyle = '#1a2238';
			g.fillRect(0, 130, S.W, 40);
			g.fillStyle = '#232c48';
			g.fillRect(0, 150, S.W, 20);

			// 敌人
			var sx = 0, sy2 = 0;
			if (this.shake > 0) {
				sx = Math.round(Math.sin(this.time * 60) * 3);
				sy2 = Math.round(Math.cos(this.time * 50) * 2);
			}
			var spr = e.sprite;
			var scale = 4;
			var ex = Math.round(S.W / 2 - spr.width * scale / 2) + sx;
			var ey = 36 + sy2 + Math.round(Math.sin(this.time * 2) * 2);
			g.imageSmoothingEnabled = false;
			g.drawImage(spr, ex, ey, spr.width * scale, spr.height * scale);
			if (this.flash > 0) {
				g.fillStyle = 'rgba(255,255,255,' + (this.flash * 1.6) + ')';
				g.fillRect(0, 0, S.W, S.H);
			}

			// 敌人血条
			S.box(8, 8, 130, 30);
			S.text(e.name, 16, 13, '#f2a0a0', 10);
			g.fillStyle = '#3a1010';
			g.fillRect(16, 27, 110, 5);
			g.fillStyle = '#d04040';
			g.fillRect(16, 27, Math.round(110 * e.hp / e.maxhp), 5);

			// 我方面板
			S.box(8, S.H - 64, 150, 56);
			S.text('李逍遥', 16, S.H - 58, '#7ec8e3', 10);
			S.text('体力 ' + h.hp + '/' + h.maxhp, 16, S.H - 44, '#e8e8e8', 9);
			g.fillStyle = '#102a10';
			g.fillRect(16, S.H - 33, 130, 4);
			g.fillStyle = '#40c050';
			g.fillRect(16, S.H - 33, Math.round(130 * h.hp / h.maxhp), 4);
			S.text('真气 ' + h.mp + '/' + h.maxmp, 16, S.H - 27, '#e8e8e8', 9);
			g.fillStyle = '#101a30';
			g.fillRect(16, S.H - 16, 130, 4);
			g.fillStyle = '#5080e0';
			g.fillRect(16, S.H - 16, Math.round(130 * h.mp / h.maxmp), 4);

			// 菜单 / 消息
			if (this.phase === 'menu') {
				var mh = this.menu.length * 14 + 14;
				S.box(S.W - 130, S.H - 8 - mh, 122, mh);
				for (var i = 0; i < this.menu.length; i++) {
					var it = this.menu[i];
					var y = S.H - mh + i * 14;
					var color = it.off ? '#777' : (i === this.sel ? '#ffd24d' : '#e8e8e8');
					if (i === this.sel) S.text('▶', S.W - 122, y, '#ffd24d', 10);
					S.text(it.label, S.W - 108, y, color, 10);
				}
			} else if (this.phase === 'msg' && this.msgs.length) {
				S.box(8, S.H - 110, S.W - 16, 36);
				S.text(this.msgs[0], 18, S.H - 98, '#f2e6c0', 10);
				S.text('▼', S.W - 26, S.H - 88, '#ffd24d', 9);
			}
		}
	};

	PAL.Battle = Battle;
})();
