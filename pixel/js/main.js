/*
 * main.js — 游戏主循环：状态机 / 行走与碰撞 / 场景切换 / 渲染
 */
var PAL = window.PAL || (window.PAL = {});

(function () {
	'use strict';

	var TILE = 16;
	var WALK_SPEED = 72; // px/s

	var DIRS = {
		up: { dx: 0, dy: -1 },
		down: { dx: 0, dy: 1 },
		left: { dx: -1, dy: 0 },
		right: { dx: 1, dy: 0 }
	};

	var Game = {
		state: 'boot',    // boot | title | explore | wedding | ending
		mapId: 'inn',
		map: null,
		npcs: [],
		time: 0,
		bootT: 0,
		whiteFlash: 0,
		flashCb: null,
		player: {
			px: 10 * TILE, py: 12 * TILE,  // 像素坐标（左上角）
			dir: 'down',
			walking: false
		},

		init: function () {
			PAL.Screen.init('screen');
			PAL.Input.init();
			this.changeMap('inn', 10, 12, 'down');
			this.state = 'boot';
			var self = this;
			var last = performance.now();
			function frame(now) {
				var dt = Math.min(0.05, (now - last) / 1000);
				last = now;
				self.update(dt);
				self.render();
				PAL.Input.endFrame();
				requestAnimationFrame(frame);
			}
			requestAnimationFrame(frame);
		},

		changeMap: function (mapId, tx, ty, dir) {
			this.mapId = mapId;
			this.map = PAL.Maps.MAPS[mapId];
			this.player.px = tx * TILE;
			this.player.py = ty * TILE;
			if (dir) this.player.dir = dir;
			PAL.Story.setupMap(this, mapId);
			if (this.state === 'explore' || this.state === 'title') this.playSceneMusic();
		},

		playSceneMusic: function () {
			var song = (this.mapId === 'lake' || this.mapId === 'island') ? 'island' : 'village';
			PAL.Music.play(song);
		},

		startWedding: function () {
			this.state = 'wedding';
			PAL.Music.play('wedding');
			var self = this;
			// 等一帧再开台词，避免确认键串扰
			setTimeout(function () { PAL.Story.weddingScript(self); }, 50);
		},

		endWedding: function () {
			this.state = 'explore';
			this.changeMap('island', 9, 4, 'down');
			PAL.Dialog.say([
				'一夜无话。翌日醒来，李逍遥怀里揣着仙草，心里却像揣了只兔子。',
				{ n: '李逍遥', t: '我居然真的成亲了……得先回去救婶婶，再回来接灵儿。' }
			]);
		},

		flashWhite: function (cb) {
			this.whiteFlash = 1.2;
			this.flashCb = cb || null;
		},

		// ---------- 更新 ----------

		update: function (dt) {
			this.time += dt;

			if (PAL.Input.took('mute')) PAL.Music.toggleMute();

			if (this.state === 'boot') {
				this.bootT += dt;
				if (this.bootT > 2.0 || PAL.Input.took('confirm')) {
					this.state = 'title';
					PAL.Music.play('title');
				}
				return;
			}

			if (this.whiteFlash > 0) {
				this.whiteFlash -= dt;
				if (this.whiteFlash <= 0.6 && this.flashCb) {
					var cb = this.flashCb;
					this.flashCb = null;
					cb();
				}
				return;
			}

			if (PAL.Battle.active) {
				PAL.Battle.update(dt);
				return;
			}
			if (PAL.Dialog.active) {
				PAL.Dialog.update(dt);
				return;
			}

			var Input = PAL.Input;

			if (this.state === 'title') {
				if (Input.took('confirm')) {
					this.state = 'explore';
					this.playSceneMusic();
					PAL.Story.intro(this);
				}
				return;
			}

			if (this.state === 'ending') return;
			if (this.state === 'wedding') return;

			// explore
			this.updatePlayer(dt);
			if (Input.took('confirm')) this.tryInteract();
		},

		updatePlayer: function (dt) {
			var Input = PAL.Input;
			var p = this.player;
			var dir = null;
			if (Input.isDown('up')) dir = 'up';
			else if (Input.isDown('down')) dir = 'down';
			else if (Input.isDown('left')) dir = 'left';
			else if (Input.isDown('right')) dir = 'right';

			p.walking = !!dir;
			if (!dir) return;
			p.dir = dir;
			var d = DIRS[dir];
			var step = WALK_SPEED * dt;
			var nx = p.px + d.dx * step;
			var ny = p.py + d.dy * step;
			if (!this.collides(nx, p.py)) p.px = nx;
			if (!this.collides(p.px, ny)) p.py = ny;

			// 中心所在图块
			var ctx2 = Math.floor((p.px + TILE / 2) / TILE);
			var cty = Math.floor((p.py + TILE / 2) / TILE);

			// 行走触发
			if (PAL.Story.onStep(this, this.mapId, ctx2, cty)) return;

			// 出口
			var exits = this.map.exits || [];
			for (var i = 0; i < exits.length; i++) {
				var e = exits[i];
				if (e.x === ctx2 && e.y === cty) {
					this.changeMap(e.to, e.tx, e.ty, p.dir);
					return;
				}
			}
		},

		collides: function (px, py) {
			// 碰撞盒：略小于一格
			var pad = 3;
			var x0 = Math.floor((px + pad) / TILE);
			var x1 = Math.floor((px + TILE - 1 - pad) / TILE);
			var y0 = Math.floor((py + TILE / 2) / TILE);
			var y1 = Math.floor((py + TILE - 1) / TILE);
			for (var ty = y0; ty <= y1; ty++) {
				for (var tx = x0; tx <= x1; tx++) {
					if (PAL.Maps.isSolid(this.map, tx, ty)) return true;
					if (this.npcAt(tx, ty)) return true;
				}
			}
			return false;
		},

		npcAt: function (tx, ty) {
			for (var i = 0; i < this.npcs.length; i++) {
				if (this.npcs[i].x === tx && this.npcs[i].y === ty) return this.npcs[i];
			}
			return null;
		},

		tryInteract: function () {
			var p = this.player;
			var d = DIRS[p.dir];
			var ctx2 = Math.floor((p.px + TILE / 2) / TILE);
			var cty = Math.floor((p.py + TILE / 2) / TILE);
			var fx = ctx2 + d.dx, fy = cty + d.dy;

			var npc = this.npcAt(fx, fy);
			if (npc) {
				PAL.Story.interact(this, npc.id);
				return;
			}
			var t = PAL.Maps.tileAt(this.map, fx, fy);
			if (t === 'boat') {
				PAL.Story.interact(this, this.mapId === 'island' ? 'boat_island' : 'boat_lake');
			} else if (t === 'well') {
				PAL.Story.interact(this, 'well');
			} else if (t === 'bed' && this.mapId === 'inn' && PAL.Story.flags.auntSick) {
				PAL.Story.interact(this, 'aunt');
			}
		},

		// ---------- 渲染 ----------

		render: function () {
			var S = PAL.Screen;
			var g = S.g;

			if (PAL.Battle.active) {
				PAL.Battle.render();
				PAL.Dialog.render();
				this.renderFlash();
				S.present();
				return;
			}

			if (this.state === 'boot') {
				this.renderBoot();
				S.present();
				return;
			}
			if (this.state === 'title') {
				this.renderTitle();
				S.present();
				return;
			}
			if (this.state === 'ending') {
				this.renderEnding();
				S.present();
				return;
			}
			if (this.state === 'wedding') {
				this.renderWedding();
				PAL.Dialog.render();
				this.renderFlash();
				S.present();
				return;
			}

			this.renderMap();
			PAL.Dialog.render();
			this.renderHud();
			this.renderFlash();
			S.present();
		},

		renderFlash: function () {
			if (this.whiteFlash > 0) {
				var a = Math.min(1, this.whiteFlash);
				PAL.Screen.g.fillStyle = 'rgba(255,255,255,' + a + ')';
				PAL.Screen.g.fillRect(0, 0, PAL.Screen.W, PAL.Screen.H);
			}
		},

		renderMap: function () {
			var S = PAL.Screen, g = S.g;
			var T = PAL.Assets.TILES;
			var map = this.map;
			g.fillStyle = '#000';
			g.fillRect(0, 0, S.W, S.H);
			for (var y = 0; y < map.grid.length; y++) {
				for (var x = 0; x < map.grid[0].length; x++) {
					var name = PAL.Maps.tileAt(map, x, y);
					var img = T[name] || T.grass;
					g.drawImage(img, x * TILE, y * TILE);
				}
			}
			// NPC 与玩家按 y 排序绘制
			var ents = [];
			for (var i = 0; i < this.npcs.length; i++) {
				var n = this.npcs[i];
				ents.push({ y: n.y * TILE, spr: n.sprite, px: n.x * TILE + 2, py: n.y * TILE, bob: 0 });
			}
			var p = this.player;
			var bob = p.walking ? (Math.floor(this.time * 8) % 2) : 0;
			ents.push({ y: p.py, spr: PAL.Assets.SPRITES.hero, px: p.px + 2, py: p.py, bob: bob, flip: p.dir === 'left' });
			ents.sort(function (a, b) { return a.y - b.y; });
			for (var j = 0; j < ents.length; j++) {
				var e = ents[j];
				if (e.flip) {
					g.save();
					g.translate(Math.round(e.px) + e.spr.width, Math.round(e.py - e.bob));
					g.scale(-1, 1);
					g.drawImage(e.spr, 0, 0);
					g.restore();
				} else {
					g.drawImage(e.spr, Math.round(e.px), Math.round(e.py - e.bob));
				}
			}
		},

		renderHud: function () {
			var S = PAL.Screen;
			S.textShadow(this.map.name, 6, 4, '#f2e6c0', 9);
			var hint = PAL.Story.hint();
			if (hint && !PAL.Dialog.active) {
				S.textShadow('◆ ' + hint, 6, S.H - 13, '#9fd8a8', 9);
			}
		},

		renderBoot: function () {
			// 像素化重制原项目 loadingScreen.js 的圆环进度动画
			var S = PAL.Screen, g = S.g;
			var p = Math.min(1, this.bootT / 1.8);
			g.fillStyle = '#0b0b10';
			g.fillRect(0, 0, S.W, S.H);
			var cx = S.W / 2, cy = S.H / 2 - 10;
			var SEGS = 16, R = 30;
			var lit = Math.floor(p * SEGS);
			for (var i = 0; i < SEGS; i++) {
				var a = -Math.PI / 2 + (i / SEGS) * Math.PI * 2;
				var x = Math.round((cx + Math.cos(a) * R) / 4) * 4 - 2;
				var y = Math.round((cy + Math.sin(a) * R) / 4) * 4 - 2;
				g.fillStyle = i < lit ? '#f2e6c0' : '#2a2a36';
				g.fillRect(x, y, 4, 4);
			}
			// 环心一柄小剑
			g.fillStyle = '#9fb8d8';
			g.fillRect(cx - 1, cy - 12, 2, 18);
			g.fillStyle = '#f2e6c0';
			g.fillRect(cx - 5, cy + 4, 10, 2);
			g.fillRect(cx - 2, cy + 6, 4, 5);
			S.text('正在准备像素资源 ' + Math.floor(p * 100) + '%', cx, cy + 36, '#8a90a8', 9, 'center');
			S.text('PAL.JS · 像素版', cx, S.H - 24, '#4a5068', 8, 'center');
		},

		renderTitle: function () {
			var S = PAL.Screen, g = S.g;
			g.fillStyle = '#0a0e1e';
			g.fillRect(0, 0, S.W, S.H);
			// 远山与湖
			g.fillStyle = '#16203a';
			g.fillRect(0, 150, S.W, 90);
			g.fillStyle = '#22335a';
			g.fillRect(0, 160, S.W, 4);
			g.fillStyle = '#101830';
			for (var i = 0; i < 7; i++) {
				var bx = i * 50 - 10;
				g.fillRect(bx, 120 - (i % 3) * 14, 60, 40);
			}
			// 星
			g.fillStyle = '#e8e8f0';
			var stars = [[20, 18], [60, 40], [130, 12], [200, 30], [260, 16], [300, 48], [170, 52], [90, 26]];
			for (var s = 0; s < stars.length; s++) {
				if (Math.floor(this.time * 2 + s) % 4 !== 0) g.fillRect(stars[s][0], stars[s][1], 1, 1);
			}
			// 月
			g.fillStyle = '#f2e6c0';
			g.beginPath();
			g.arc(262, 50, 16, 0, Math.PI * 2);
			g.fill();
			g.fillStyle = '#0a0e1e';
			g.beginPath();
			g.arc(268, 45, 13, 0, Math.PI * 2);
			g.fill();

			S.textShadow('仙剑奇侠传', S.W / 2, 78, '#f2e6c0', 30, 'center');
			S.textShadow('像 素 版 · 第 一 章', S.W / 2, 116, '#9fb8d8', 12, 'center');
			if (Math.floor(this.time * 1.6) % 2 === 0) {
				S.textShadow('按 回车 / Z 键 开始', S.W / 2, 186, '#ffd24d', 11, 'center');
			}
			S.text('方向键移动 · 回车/Z 确认 · M 静音 · 致敬经典之同人习作', S.W / 2, 222, '#6a7390', 8, 'center');
		},

		renderWedding: function () {
			var S = PAL.Screen, g = S.g;
			g.fillStyle = '#4a0e16';
			g.fillRect(0, 0, S.W, S.H);
			g.fillStyle = '#5e1620';
			g.fillRect(0, 150, S.W, 90);
			// 喜字
			S.textShadow('囍', S.W / 2, 26, '#ffd24d', 36, 'center');
			// 红烛
			for (var c = 0; c < 2; c++) {
				var cx = c === 0 ? 70 : 250 - 6;
				g.fillStyle = '#d04040';
				g.fillRect(cx, 96, 6, 40);
				g.fillStyle = '#ffd24d';
				var fl = Math.floor(this.time * 6) % 2 === 0 ? 0 : 1;
				g.fillRect(cx + 2, 88 + fl, 2, 6);
				g.fillStyle = '#ff8030';
				g.fillRect(cx + 2, 92, 2, 3);
			}
			// 新人
			var spr = PAL.Assets.SPRITES;
			g.imageSmoothingEnabled = false;
			g.drawImage(spr.hero, 0, 0, 12, 16, 124, 100, 36, 48);
			g.drawImage(spr.linger, 0, 0, 12, 16, 168, 100, 36, 48);
			g.drawImage(spr.granny, 0, 0, 12, 16, 216, 108, 27, 36);
			// 地毯
			g.fillStyle = '#a02030';
			g.fillRect(110, 156, 110, 24);
			g.fillStyle = '#ffd24d';
			g.fillRect(110, 156, 110, 2);
			g.fillRect(110, 178, 110, 2);
		},

		renderEnding: function () {
			var S = PAL.Screen, g = S.g;
			g.fillStyle = '#06080f';
			g.fillRect(0, 0, S.W, S.H);
			g.fillStyle = '#101a30';
			g.fillRect(0, 170, S.W, 70);
			// 湖上孤舟
			g.fillStyle = '#1c2c4a';
			g.fillRect(0, 168, S.W, 3);
			g.fillStyle = '#7a5230';
			g.fillRect(150, 160, 24, 5);
			S.textShadow('—— 第一章 完 ——', S.W / 2, 92, '#f2e6c0', 18, 'center');
			S.text('湖心的仙灵岛上，有人仍在等待。', S.W / 2, 130, '#9fb8d8', 10, 'center');
			if (Math.floor(this.time * 1.6) % 2 === 0) {
				S.text('感谢游玩 · 刷新页面可重新开始', S.W / 2, 210, '#6a7390', 9, 'center');
			}
		}
	};

	window.addEventListener('load', function () {
		Game.init();
	});

	PAL.Game = Game;
})();
