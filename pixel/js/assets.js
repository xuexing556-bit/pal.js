/*
 * assets.js — 全部像素美术均由代码绘制，不依赖任何外部资源文件。
 */
var PAL = window.PAL || (window.PAL = {});

(function () {
	'use strict';

	var TILE = 16;

	// ---------- 工具 ----------

	function makeCanvas(w, h) {
		var c = document.createElement('canvas');
		c.width = w;
		c.height = h;
		return c;
	}

	// 用字符画生成像素图：rows 为字符串数组，legend 为 字符->颜色，'.' 与 ' ' 为透明
	function pixelArt(rows, legend) {
		var w = rows[0].length, h = rows.length;
		var c = makeCanvas(w, h);
		var g = c.getContext('2d');
		for (var y = 0; y < h; y++) {
			for (var x = 0; x < w; x++) {
				var ch = rows[y][x];
				if (ch === '.' || ch === ' ') continue;
				var col = legend[ch];
				if (!col) continue;
				g.fillStyle = col;
				g.fillRect(x, y, 1, 1);
			}
		}
		return c;
	}

	function tile(painter) {
		var c = makeCanvas(TILE, TILE);
		painter(c.getContext('2d'));
		return c;
	}

	function fillAll(g, color) {
		g.fillStyle = color;
		g.fillRect(0, 0, TILE, TILE);
	}

	function dots(g, color, pts) {
		g.fillStyle = color;
		for (var i = 0; i < pts.length; i++) {
			g.fillRect(pts[i][0], pts[i][1], 1, 1);
		}
	}

	// ---------- 地表图块 ----------

	function paintGrass(g) {
		fillAll(g, '#3e8948');
		dots(g, '#357a3f', [[2, 3], [6, 1], [11, 4], [14, 7], [4, 9], [9, 11], [13, 13], [1, 12], [7, 6], [12, 9]]);
		dots(g, '#4d9c57', [[5, 4], [10, 2], [3, 14], [15, 11], [8, 13]]);
	}

	function paintWater(g) {
		fillAll(g, '#2d5f9e');
		g.fillStyle = '#3f78bd';
		g.fillRect(2, 3, 5, 1);
		g.fillRect(9, 7, 5, 1);
		g.fillRect(4, 12, 5, 1);
		g.fillStyle = '#26528a';
		g.fillRect(11, 2, 4, 1);
		g.fillRect(1, 8, 4, 1);
		g.fillRect(10, 13, 4, 1);
	}

	var TILES = {};

	TILES.grass = tile(paintGrass);

	TILES.flower = tile(function (g) {
		paintGrass(g);
		dots(g, '#e85d75', [[4, 4], [3, 5], [5, 5], [4, 6]]);
		dots(g, '#ffd24d', [[4, 5], [11, 10]]);
		dots(g, '#f2f2f2', [[11, 9], [10, 10], [12, 10], [11, 11]]);
	});

	TILES.tree = tile(function (g) {
		paintGrass(g);
		g.fillStyle = '#6b4226';
		g.fillRect(6, 10, 4, 5);
		g.fillStyle = '#1e5e2e';
		g.fillRect(2, 3, 12, 7);
		g.fillRect(4, 1, 8, 3);
		g.fillStyle = '#2d7a40';
		g.fillRect(4, 2, 4, 2);
		g.fillRect(9, 4, 4, 2);
		dots(g, '#164823', [[3, 8], [7, 7], [12, 8], [6, 4], [10, 6]]);
	});

	TILES.path = tile(function (g) {
		fillAll(g, '#c9b27c');
		dots(g, '#b59d68', [[3, 2], [8, 5], [13, 3], [5, 9], [11, 12], [2, 13], [14, 9], [7, 14]]);
		dots(g, '#d8c48f', [[6, 3], [12, 7], [4, 12], [10, 1]]);
	});

	TILES.water = tile(paintWater);

	TILES.lotus = tile(function (g) {
		paintWater(g);
		g.fillStyle = '#3f8f4f';
		g.fillRect(3, 8, 9, 4);
		g.fillRect(5, 7, 5, 1);
		g.fillStyle = '#2d7a40';
		g.fillRect(7, 9, 2, 2);
		g.fillStyle = '#e88fb0';
		g.fillRect(9, 3, 4, 3);
		g.fillRect(10, 2, 2, 1);
		dots(g, '#ffffff', [[10, 3], [11, 4]]);
	});

	TILES.dock = tile(function (g) {
		paintWater(g);
		g.fillStyle = '#9a7548';
		g.fillRect(0, 2, 16, 5);
		g.fillRect(0, 9, 16, 5);
		g.fillStyle = '#7d5c36';
		g.fillRect(0, 6, 16, 1);
		g.fillRect(0, 13, 16, 1);
		dots(g, '#7d5c36', [[4, 4], [12, 4], [4, 11], [12, 11]]);
	});

	TILES.boat = tile(function (g) {
		paintWater(g);
		g.fillStyle = '#7a5230';
		g.fillRect(2, 7, 12, 4);
		g.fillRect(4, 11, 8, 2);
		g.fillStyle = '#94693f';
		g.fillRect(3, 7, 10, 1);
		g.fillStyle = '#5c3d22';
		g.fillRect(7, 4, 2, 3);
	});

	TILES.spring = tile(function (g) {
		fillAll(g, '#5fb6d4');
		g.fillStyle = '#8fd8ee';
		g.fillRect(3, 3, 5, 1);
		g.fillRect(9, 8, 5, 1);
		g.fillRect(2, 12, 5, 1);
		dots(g, '#ffffff', [[5, 5], [12, 3], [9, 12], [14, 10], [2, 8]]);
	});

	// ---------- 建筑图块 ----------

	function paintFloor(g) {
		fillAll(g, '#a87a4a');
		g.fillStyle = '#8a6038';
		g.fillRect(0, 3, 16, 1);
		g.fillRect(0, 7, 16, 1);
		g.fillRect(0, 11, 16, 1);
		g.fillRect(0, 15, 16, 1);
		dots(g, '#8a6038', [[5, 1], [12, 5], [3, 9], [10, 13]]);
	}

	TILES.floor = tile(paintFloor);

	TILES.wall = tile(function (g) {
		fillAll(g, '#5a4634');
		g.fillStyle = '#46362a';
		g.fillRect(0, 5, 16, 1);
		g.fillRect(0, 11, 16, 1);
		g.fillRect(5, 0, 1, 5);
		g.fillRect(11, 6, 1, 5);
		g.fillRect(3, 12, 1, 4);
		g.fillStyle = '#6b5440';
		g.fillRect(0, 0, 16, 1);
	});

	TILES.roof = tile(function (g) {
		fillAll(g, '#5a6b8c');
		g.fillStyle = '#46546e';
		g.fillRect(0, 4, 16, 1);
		g.fillRect(0, 9, 16, 1);
		g.fillRect(0, 14, 16, 1);
		g.fillStyle = '#6e80a3';
		g.fillRect(0, 0, 16, 1);
		dots(g, '#46546e', [[4, 2], [10, 6], [6, 11], [13, 1]]);
	});

	TILES.door = tile(function (g) {
		fillAll(g, '#5a4634');
		g.fillStyle = '#241a12';
		g.fillRect(3, 3, 10, 13);
		g.fillStyle = '#3a2a1c';
		g.fillRect(3, 3, 10, 1);
		dots(g, '#c9a227', [[11, 9]]);
	});

	TILES.counter = tile(function (g) {
		paintFloor(g);
		g.fillStyle = '#c89858';
		g.fillRect(0, 3, 16, 7);
		g.fillStyle = '#a87838';
		g.fillRect(0, 10, 16, 4);
		g.fillStyle = '#dfb070';
		g.fillRect(0, 3, 16, 1);
	});

	TILES.table = tile(function (g) {
		paintFloor(g);
		g.fillStyle = '#c89858';
		g.fillRect(2, 4, 12, 7);
		g.fillStyle = '#dfb070';
		g.fillRect(2, 4, 12, 1);
		g.fillStyle = '#8a6038';
		g.fillRect(3, 11, 2, 4);
		g.fillRect(11, 11, 2, 4);
	});

	TILES.bed = tile(function (g) {
		paintFloor(g);
		g.fillStyle = '#8a6038';
		g.fillRect(1, 1, 14, 14);
		g.fillStyle = '#b03040';
		g.fillRect(2, 5, 12, 9);
		g.fillStyle = '#cf4a5a';
		g.fillRect(2, 5, 12, 2);
		g.fillStyle = '#eeeae0';
		g.fillRect(3, 2, 6, 3);
	});

	TILES.well = tile(function (g) {
		paintGrass(g);
		g.fillStyle = '#8c8c94';
		g.fillRect(2, 4, 12, 10);
		g.fillStyle = '#6f6f78';
		g.fillRect(2, 4, 12, 2);
		g.fillStyle = '#1c2c4a';
		g.fillRect(5, 7, 6, 5);
	});

	// ---------- 人物 ----------

	var SPRITES = {};

	SPRITES.hero = pixelArt([
		'....kkkk....',
		'...kkkkkk...',
		'..kkkkkkkk..',
		'..bbbbbbbb..',
		'..kssssssk..',
		'..ksessesk..',
		'...ssssss...',
		'....ssss....',
		'..wwwbbwww..',
		'.wwwbbbbwww.',
		'.swwbbbbwws.',
		'..wwbbbbww..',
		'...wbbbbw...',
		'...dddddd...',
		'...dd..dd...',
		'...kk..kk...'
	], { k: '#23232b', b: '#3b6ea5', s: '#f2c9a0', e: '#23232b', w: '#e8e8e8', d: '#2a4d73' });

	SPRITES.aunt = pixelArt([
		'...gggggg...',
		'..gggggggg..',
		'..gggggggg..',
		'..gssssssg..',
		'..gsessesg..',
		'...ssssss...',
		'....ssss....',
		'..mmmmmmmm..',
		'.mmmwwwwmmm.',
		'.mmwwwwwwmm.',
		'.mmwwwwwwmm.',
		'..mwwwwwwm..',
		'..mmmmmmmm..',
		'..mmmmmmmm..',
		'...mm..mm...',
		'...kk..kk...'
	], { g: '#6b5a4a', s: '#f2c9a0', e: '#23232b', m: '#8a5a3a', w: '#e3dccb', k: '#23232b' });

	SPRITES.oldman = pixelArt([
		'....wwww....',
		'...wwwwww...',
		'..wwssssww..',
		'..wsessesw..',
		'...ssssss...',
		'...wwwwww...',
		'....wwww....',
		'..rrrrrrrr..',
		'.rrrrrrrrrr.',
		'.rrrrrrrrrr.',
		'.orrrrrrrr..',
		'.oorrrrrrr..',
		'..rrrrrrrr..',
		'..rrrrrrrr..',
		'...rr..rr...',
		'...kk..kk...'
	], { w: '#e6e6e6', s: '#e8bd96', e: '#23232b', r: '#7a8aa0', o: '#d98a2b', k: '#23232b' });

	SPRITES.linger = pixelArt([
		'....bbbb....',
		'...bbbbbb...',
		'..bbbbbbbb..',
		'.bbssssssbb.',
		'.bbsessesbb.',
		'.bbssssssbb.',
		'.b..ssss..b.',
		'.bwwwwwwwwb.',
		'.bwwwccwwwb.',
		'..wwwccwww..',
		'..wwwwwwww..',
		'..wwwwwwww..',
		'..wwwwwwww..',
		'...wwwwww...',
		'...wwwwww...',
		'....w..w....'
	], { b: '#2a2a3a', s: '#f6d4b0', e: '#23232b', w: '#f2f0ea', c: '#7ec8e3' });

	SPRITES.granny = pixelArt([
		'...wwwwww...',
		'..wwwwwwww..',
		'..wwwwwwww..',
		'..wssssssw..',
		'..wsessesw..',
		'...ssssss...',
		'....ssss....',
		'..pppppppp.h',
		'.pppppppppph',
		'.pppppppppph',
		'.pppppppp..h',
		'..pppppppp.h',
		'..pppppppp.h',
		'..pppppppp.h',
		'...pp..pp..h',
		'...kk..kk..h'
	], { w: '#dcdcdc', s: '#e3b890', e: '#23232b', p: '#5a3a6a', h: '#8a6038', k: '#23232b' });

	SPRITES.villager_m = pixelArt([
		'....hhhh....',
		'...hhhhhh...',
		'..hhhhhhhh..',
		'..hssssssh..',
		'..hsessesh..',
		'...ssssss...',
		'....ssss....',
		'..gggggggg..',
		'.gggggggggg.',
		'.sggggggggs.',
		'..gggggggg..',
		'..gggggggg..',
		'...gggggg...',
		'...nnnnnn...',
		'...nn..nn...',
		'...kk..kk...'
	], { h: '#4a3424', s: '#f2c9a0', e: '#23232b', g: '#5f7d3f', n: '#6b5a3a', k: '#23232b' });

	SPRITES.villager_f = pixelArt([
		'....bbbb....',
		'...bbbbbb...',
		'..bbbbbbbb..',
		'..bssssssb..',
		'..bsessesb..',
		'...ssssss...',
		'....ssss....',
		'..rrrrrrrr..',
		'.rrrrrrrrrr.',
		'.srrrrrrrrs.',
		'..rrrrrrrr..',
		'..rrrrrrrr..',
		'..rrrrrrrr..',
		'...rrrrrr...',
		'...rr..rr...',
		'...kk..kk...'
	], { b: '#3a2a2a', s: '#f6d4b0', e: '#23232b', r: '#b04a5a', k: '#23232b' });

	SPRITES.doctor = pixelArt([
		'....gggg....',
		'...gggggg...',
		'..ggssssgg..',
		'..gsessesg..',
		'...ssssss...',
		'...gggggg...',
		'....ssss....',
		'..uuuuuuuu..',
		'.uuuuuuuuuu.',
		'.suuuuuuuus.',
		'..uuuuuuuu..',
		'..uuuuuuuu..',
		'..uuuuuuuu..',
		'...uuuuuu...',
		'...uu..uu...',
		'...kk..kk...'
	], { g: '#9a9aa2', s: '#e8bd96', e: '#23232b', u: '#4a5a6a', k: '#23232b' });

	SPRITES.snake = pixelArt([
		'................',
		'......kkkk......',
		'.....kggggk.....',
		'....kgggggg k...',
		'....kgrggrgk....',
		'....kggggggk....',
		'.....kggggk.....',
		'...kkkgggggk....',
		'..kgggggggggk...',
		'.kgggkkkkkgggk..',
		'.kggk.....kggk..',
		'.kggk..kkkgggk..',
		'..kggkkgggggk...',
		'...kggggggkk....',
		'....kkkkkk......',
		'................'
	], { k: '#1c3a1c', g: '#4a9a4a', r: '#e03030' });

	PAL.Assets = {
		TILE: TILE,
		TILES: TILES,
		SPRITES: SPRITES,
		pixelArt: pixelArt
	};
})();
