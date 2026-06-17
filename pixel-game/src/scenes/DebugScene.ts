/**
 * DebugScene — 选关调试页面
 *
 * 从标题画面按 L 键进入。方向键选择地图，回车跳转。
 * 按 ESC 返回标题。按 F 可切换 flag 编辑面板。
 */
import Phaser from 'phaser';
import { SCREEN_W, SCREEN_H, FONT_FAMILY } from '../config';
import type { InputManager } from '../core/InputManager';
import type { ChiptuneEngine } from '../core/ChiptuneEngine';
import type { GameState } from '../types';
import { Chapter1 } from '../chapters/Chapter1';
import { Chapter2 } from '../chapters/Chapter2';

interface DebugMapEntry {
  chapter: number;
  mapId: string;
  label: string;
  tx: number;
  ty: number;
}

interface DebugFlag {
  key: string;
  label: string;
}

const DEBUG_MAPS: DebugMapEntry[] = [
  { chapter: 1, mapId: 'inn',    label: '客栈',           tx: 10, ty: 12 },
  { chapter: 1, mapId: 'town',   label: '余杭镇',         tx: 6,  ty: 7  },
  { chapter: 1, mapId: 'lake',   label: '湖畔',           tx: 6,  ty: 6  },
  { chapter: 1, mapId: 'island', label: '仙灵岛',         tx: 9,  ty: 13 },
  { chapter: 2, mapId: 'inn_night',      label: '客栈·深夜',     tx: 9,  ty: 7  },
  { chapter: 2, mapId: 'town_night',     label: '余杭镇·深夜',   tx: 6,  ty: 7  },
  { chapter: 2, mapId: 'mountain_path',  label: '后山·林间路',   tx: 9,  ty: 13 },
  { chapter: 2, mapId: 'black_miao_camp',label: '黑苗营地',      tx: 9,  ty: 13 },
];

const DEBUG_FLAGS: DebugFlag[] = [
  { key: 'learnedSkill',  label: '已学剑诀' },
  { key: 'auntSick',      label: '婶婶病倒' },
  { key: 'snakeDead',     label: '蛇妖已死' },
  { key: 'married',       label: '已成婚' },
  { key: 'hasMedicine',   label: '有仙草' },
  { key: 'memoryLost',    label: '已失忆' },
  { key: 'nightHeard',    label: '夜半异响' },
  { key: 'nightSaw',      label: '目击黑影' },
  { key: 'warriorDead',   label: '武士已死' },
  { key: 'bossDead',      label: '护法已死' },
  { key: 'lingerRescued', label: '灵儿获救' },
];

/** 预分配的 Text 池大小 */
const POOL_SIZE = 60;

export class DebugScene extends Phaser.Scene {
  private sel = 0;
  private flagSel = -1;
  private gameTime = 0;
  private scrollOffset = 0;
  private mode: 'maps' | 'flags' = 'maps';

  // 持久显示对象
  private gfx!: Phaser.GameObjects.Graphics;
  private textPool: Phaser.GameObjects.Text[] = [];
  private poolIdx = 0;
  private fKey!: Phaser.Input.Keyboard.Key;

  constructor() { super('DebugScene'); }

  create(): void {
    this.sel = 0;
    this.flagSel = -1;
    this.scrollOffset = 0;
    this.gameTime = 0;
    this.mode = 'maps';

    this.gfx = this.add.graphics();
    this.fKey = this.input.keyboard!.addKey('KeyF');

    // 预创建文字池
    for (let i = 0; i < POOL_SIZE; i++) {
      const t = this.add.text(0, 0, '', { fontFamily: FONT_FAMILY, fontSize: '10px', color: '#fff', resolution: 2 });
      t.setVisible(false);
      this.textPool.push(t);
    }
  }

  /** 从池中取出一个 Text 对象 */
  private tx(x: number, y: number, text: string, size: string, color: string, originX = 0): Phaser.GameObjects.Text {
    if (this.poolIdx >= POOL_SIZE) {
      // 池耗尽时返回隐藏的占位对象（不应发生）
      const t = this.add.text(0, 0, '', { fontFamily: FONT_FAMILY, fontSize: size, color });
      t.setVisible(false);
      return t;
    }
    const t = this.textPool[this.poolIdx++];
    t.setPosition(x, y);
    t.setText(text);
    t.setFontSize(size);
    t.setColor(color);
    t.setOrigin(originX, 0);
    t.setVisible(true);
    return t;
  }

  update(_time: number, dt: number): void {
    const inputMgr = this.registry.get('inputMgr') as InputManager;
    inputMgr.update();
    this.gameTime += dt / 1000;

    if (this.mode === 'maps') {
      this.updateMaps(inputMgr);
    } else {
      this.updateFlags(inputMgr);
    }

    inputMgr.endFrame();
    this.drawFrame();
  }

  private updateMaps(inputMgr: InputManager): void {
    const total = DEBUG_MAPS.length;
    if (inputMgr.took('up')) {
      this.sel = (this.sel + total - 1) % total;
      if (this.sel < this.scrollOffset) this.scrollOffset = this.sel;
      if (this.sel >= this.scrollOffset + 6) this.scrollOffset = this.sel - 5;
    }
    if (inputMgr.took('down')) {
      this.sel = (this.sel + 1) % total;
      if (this.sel < this.scrollOffset) this.scrollOffset = this.sel;
      if (this.sel >= this.scrollOffset + 6) this.scrollOffset = this.sel - 5;
    }
    if (inputMgr.took('cancel')) {
      this.scene.start('TitleScene');
    }
    if (inputMgr.took('confirm')) {
      this.jumpToMap(DEBUG_MAPS[this.sel]);
    }
    if (Phaser.Input.Keyboard.JustDown(this.fKey)) {
      this.mode = 'flags';
      this.flagSel = 0;
      this.scrollOffset = 0;
    }
  }

  private updateFlags(inputMgr: InputManager): void {
    const total = DEBUG_FLAGS.length;
    if (inputMgr.took('up')) {
      this.flagSel = (this.flagSel + total - 1) % total;
      if (this.flagSel < this.scrollOffset) this.scrollOffset = this.flagSel;
      if (this.flagSel >= this.scrollOffset + 8) this.scrollOffset = this.flagSel - 7;
    }
    if (inputMgr.took('down')) {
      this.flagSel = (this.flagSel + 1) % total;
      if (this.flagSel < this.scrollOffset) this.scrollOffset = this.flagSel;
      if (this.flagSel >= this.scrollOffset + 8) this.scrollOffset = this.flagSel - 7;
    }
    if (inputMgr.took('confirm')) {
      this.toggleFlag(DEBUG_FLAGS[this.flagSel].key);
    }
    if (inputMgr.took('cancel') || Phaser.Input.Keyboard.JustDown(this.fKey)) {
      this.mode = 'maps';
      this.sel = 0;
      this.scrollOffset = 0;
    }
  }

  private toggleFlag(key: string): void {
    const state = this.registry.get('gameState') as GameState;
    state.flags[key] = !state.flags[key];
  }

  private jumpToMap(entry: DebugMapEntry): void {
    const state = this.registry.get('gameState') as GameState;
    const music = this.registry.get('chiptune') as ChiptuneEngine;
    music.unlock();

    if (entry.chapter === 1) {
      const ch = new Chapter1();
      ch.init(state);
      state.flags.learnedSkill = true;
      this.registry.set('chapter', ch);
    } else {
      const ch = new Chapter2();
      ch.init(state);
      state.hero.hp = state.hero.maxhp;
      state.hero.mp = state.hero.maxmp;
      state.flags.learnedSkill = true;
      this.registry.set('chapter', ch);
    }

    this.scene.start('ExploreScene', {
      mapId: entry.mapId,
      tx: entry.tx,
      ty: entry.ty,
      dir: 'down',
    });
  }

  private drawFrame(): void {
    // 重置池索引，隐藏所有池对象
    for (let i = 0; i < POOL_SIZE; i++) this.textPool[i].setVisible(false);
    this.poolIdx = 0;

    const g = this.gfx;
    g.clear();
    g.fillStyle(0x0a0a14, 1); g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    g.fillStyle(0x1a1a2e, 1); g.fillRect(0, 0, SCREEN_W, 28);
    g.fillStyle(0x2a2a4e, 1); g.fillRect(0, 27, SCREEN_W, 1);

    // 固定标题
    this.tx(8, 7, 'DEBUG · 选关调试', '11px', '#ffd24d');
    this.tx(SCREEN_W - 8, 7, this.mode === 'maps' ? '[F] Flag 编辑' : '[F] 地图列表', '9px', '#6a7390', 1);

    // 底部提示
    const hintY = SCREEN_H - 16;
    this.tx(8, hintY, '↑↓ 选择  Enter 确认  ESC 返回  F 切换面板', '8px', '#4a5068');
    const state = this.registry.get('gameState') as GameState;
    const h = state.hero;
    this.tx(SCREEN_W - 8, hintY, `HP ${h.hp}/${h.maxhp}  MP ${h.mp}/${h.maxmp}`, '8px', '#6a7390', 1);

    if (this.mode === 'maps') {
      this.renderMaps(g);
    } else {
      this.renderFlags(g);
    }
  }

  private renderMaps(g: Phaser.GameObjects.Graphics): void {
    const y0 = 38;
    const rowH = 22;
    const visibleCount = 6;

    let currentChapter = 0;
    let row = 0;

    for (let i = this.scrollOffset; i < Math.min(this.scrollOffset + visibleCount, DEBUG_MAPS.length); i++) {
      const entry = DEBUG_MAPS[i];
      const y = y0 + row * rowH;

      if (entry.chapter !== currentChapter) {
        currentChapter = entry.chapter;
        this.tx(12, y, `—— 第${currentChapter === 1 ? '一' : '二'}章 ——`, '8px', '#4a5068');
      }

      if (i === this.sel) {
        g.fillStyle(0x1e2a4a, 1);
        g.fillRect(8, y - 2, SCREEN_W - 16, rowH - 2);
        this.tx(16, y + 2, '▶', '11px', '#ffd24d');
      }

      const color = i === this.sel ? '#f2e6c0' : '#9a9ab0';
      this.tx(32, y + 2, entry.label, '11px', color);
      this.tx(SCREEN_W - 16, y + 2, entry.mapId, '9px', '#4a5068', 1);
      this.tx(SCREEN_W - 16, y + 12, `(${entry.tx}, ${entry.ty})`, '8px', '#3a3a50', 1);

      row++;
    }

    if (this.scrollOffset > 0) {
      this.tx(SCREEN_W / 2, y0 - 10, '▲', '8px', '#4a5068').setOrigin(0.5);
    }
    if (this.scrollOffset + visibleCount < DEBUG_MAPS.length) {
      this.tx(SCREEN_W / 2, y0 + visibleCount * rowH + 4, '▼', '8px', '#4a5068').setOrigin(0.5);
    }
  }

  private renderFlags(g: Phaser.GameObjects.Graphics): void {
    const state = this.registry.get('gameState') as GameState;
    const y0 = 38;
    const rowH = 18;
    const visibleCount = 8;

    this.tx(12, y0 - 2, 'Flag 开关（Enter 切换，跳关时生效）', '8px', '#4a5068');

    for (let i = this.scrollOffset; i < Math.min(this.scrollOffset + visibleCount, DEBUG_FLAGS.length); i++) {
      const flag = DEBUG_FLAGS[i];
      const y = y0 + 14 + (i - this.scrollOffset) * rowH;
      const val = !!state.flags[flag.key];

      if (i === this.flagSel) {
        g.fillStyle(0x1e2a4a, 1);
        g.fillRect(8, y - 2, SCREEN_W - 16, rowH - 2);
        this.tx(16, y + 1, '▶', '11px', '#ffd24d');
      }

      const color = i === this.flagSel ? '#f2e6c0' : '#9a9ab0';
      this.tx(32, y + 1, flag.label, '10px', color);

      const statusColor = val ? '#40c050' : '#c04040';
      const statusText = val ? 'ON' : 'OFF';
      this.tx(SCREEN_W - 16, y + 1, statusText, '10px', statusColor, 1);

      // 开关图标
      const boxX = SCREEN_W - 60;
      g.fillStyle(val ? 0x2a4a2a : 0x4a2a2a, 1);
      g.fillRect(boxX, y + 1, 20, 10);
      g.fillStyle(val ? 0x40c050 : 0xc04040, 1);
      g.fillRect(val ? boxX + 12 : boxX + 2, y + 3, 6, 6);
    }
  }
}
