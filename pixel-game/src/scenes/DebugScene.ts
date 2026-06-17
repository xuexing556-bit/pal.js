/**
 * DebugScene — 选关调试页面
 *
 * 从标题画面按 L 键进入。方向键选择地图，回车跳转。
 * 按 ESC 返回标题。按 T 可切换当前调试 flag。
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

/** 可调式的 flag */
interface DebugFlag {
  key: string;
  label: string;
}

const DEBUG_MAPS: DebugMapEntry[] = [
  // 第一章
  { chapter: 1, mapId: 'inn',    label: '客栈',           tx: 10, ty: 12 },
  { chapter: 1, mapId: 'town',   label: '余杭镇',         tx: 6,  ty: 7  },
  { chapter: 1, mapId: 'lake',   label: '湖畔',           tx: 6,  ty: 6  },
  { chapter: 1, mapId: 'island', label: '仙灵岛',         tx: 9,  ty: 13 },
  // 第二章
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

export class DebugScene extends Phaser.Scene {
  private sel = 0;
  private flagSel = -1; // -1 = 地图列表模式，>= 0 = flag 编辑模式
  private gameTime = 0;
  private scrollOffset = 0;
  private mode: 'maps' | 'flags' = 'maps';

  constructor() { super('DebugScene'); }

  create(): void {
    this.sel = 0;
    this.flagSel = -1;
    this.scrollOffset = 0;
    this.gameTime = 0;
    this.mode = 'maps';
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
    // 按 Tab 或 F 切换到 flag 编辑模式
    if (this.isKeyPressed('KeyF')) {
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
    if (inputMgr.took('cancel') || this.isKeyPressed('KeyF')) {
      this.mode = 'maps';
      this.sel = 0;
      this.scrollOffset = 0;
    }
  }

  private isKeyPressed(code: string): boolean {
    const key = this.input.keyboard?.addKey(code);
    if (key && Phaser.Input.Keyboard.JustDown(key)) return true;
    return false;
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
      // 自动解锁关键 flag 以便调试
      state.flags.learnedSkill = true;
      this.registry.set('chapter', ch);
    } else {
      const ch = new Chapter2();
      ch.init(state);
      // 保留第一章的属性加成
      state.hero.hp = state.hero.maxhp;
      state.hero.mp = state.hero.maxmp;
      state.flags.learnedSkill = true;
      this.registry.set('chapter', ch);
    }

    // 叠加用户手动设置的 flag
    this.scene.start('ExploreScene', {
      mapId: entry.mapId,
      tx: entry.tx,
      ty: entry.ty,
      dir: 'down',
    });
  }

  render(): void {
    const g = this.add.graphics();
    // 深色调试背景
    g.fillStyle(0x0a0a14, 1); g.fillRect(0, 0, SCREEN_W, SCREEN_H);

    // 顶部标题栏
    g.fillStyle(0x1a1a2e, 1); g.fillRect(0, 0, SCREEN_W, 28);
    g.fillStyle(0x2a2a4e, 1); g.fillRect(0, 27, SCREEN_W, 1);

    if (this.mode === 'maps') {
      this.renderMaps(g);
    } else {
      this.renderFlags(g);
    }
    g.destroy();

    // 顶部标题
    this.add.text(8, 7, 'DEBUG · 选关调试', {
      fontFamily: FONT_FAMILY, fontSize: '11px', color: '#ffd24d',
    });
    this.add.text(SCREEN_W - 8, 7, this.mode === 'maps' ? '[F] Flag 编辑' : '[F] 地图列表', {
      fontFamily: FONT_FAMILY, fontSize: '9px', color: '#6a7390',
    }).setOrigin(1, 0);

    // 底部操作提示
    const hintY = SCREEN_H - 16;
    this.add.text(8, hintY, '↑↓ 选择  Enter 确认  ESC 返回  F 切换面板', {
      fontFamily: FONT_FAMILY, fontSize: '8px', color: '#4a5068',
    });

    // 当前英雄信息
    const state = this.registry.get('gameState') as GameState;
    const h = state.hero;
    this.add.text(SCREEN_W - 8, hintY, `HP ${h.hp}/${h.maxhp}  MP ${h.mp}/${h.maxmp}`, {
      fontFamily: FONT_FAMILY, fontSize: '8px', color: '#6a7390',
    }).setOrigin(1, 0);
  }

  private renderMaps(g: Phaser.GameObjects.Graphics): void {
    const y0 = 38;
    const rowH = 22;
    const visibleCount = 6;
    const state = this.registry.get('gameState') as GameState;

    // 章节分隔标题
    let currentChapter = 0;
    let row = 0;

    for (let i = this.scrollOffset; i < Math.min(this.scrollOffset + visibleCount, DEBUG_MAPS.length); i++) {
      const entry = DEBUG_MAPS[i];
      const y = y0 + row * rowH;

      if (entry.chapter !== currentChapter) {
        currentChapter = entry.chapter;
        this.add.text(12, y, `—— 第${currentChapter === 1 ? '一' : '二'}章 ——`, {
          fontFamily: FONT_FAMILY, fontSize: '8px', color: '#4a5068',
        });
        // 不占用行，把地图项和章节标题放一起
      }

      // 选中高亮
      if (i === this.sel) {
        g.fillStyle(0x1e2a4a, 1);
        g.fillRect(8, y - 2, SCREEN_W - 16, rowH - 2);
        this.add.text(16, y + 2, '▶', {
          fontFamily: FONT_FAMILY, fontSize: '11px', color: '#ffd24d',
        });
      }

      // 地图名
      const color = i === this.sel ? '#f2e6c0' : '#9a9ab0';
      this.add.text(32, y + 2, entry.label, {
        fontFamily: FONT_FAMILY, fontSize: '11px', color,
      });

      // mapId
      this.add.text(SCREEN_W - 16, y + 2, entry.mapId, {
        fontFamily: FONT_FAMILY, fontSize: '9px', color: '#4a5068',
      }).setOrigin(1, 0);

      // 出生坐标
      this.add.text(SCREEN_W - 16, y + 12, `(${entry.tx}, ${entry.ty})`, {
        fontFamily: FONT_FAMILY, fontSize: '8px', color: '#3a3a50',
      }).setOrigin(1, 0);

      row++;
    }

    // 滚动指示
    if (this.scrollOffset > 0) {
      this.add.text(SCREEN_W / 2, y0 - 10, '▲', {
        fontFamily: FONT_FAMILY, fontSize: '8px', color: '#4a5068',
      }).setOrigin(0.5);
    }
    if (this.scrollOffset + visibleCount < DEBUG_MAPS.length) {
      this.add.text(SCREEN_W / 2, y0 + visibleCount * rowH + 4, '▼', {
        fontFamily: FONT_FAMILY, fontSize: '8px', color: '#4a5068',
      }).setOrigin(0.5);
    }
  }

  private renderFlags(g: Phaser.GameObjects.Graphics): void {
    const state = this.registry.get('gameState') as GameState;
    const y0 = 38;
    const rowH = 18;
    const visibleCount = 8;

    this.add.text(12, y0 - 2, 'Flag 开关（Enter 切换，跳关时生效）', {
      fontFamily: FONT_FAMILY, fontSize: '8px', color: '#4a5068',
    });

    for (let i = this.scrollOffset; i < Math.min(this.scrollOffset + visibleCount, DEBUG_FLAGS.length); i++) {
      const flag = DEBUG_FLAGS[i];
      const y = y0 + 14 + (i - this.scrollOffset) * rowH;
      const val = !!state.flags[flag.key];

      // 选中高亮
      if (i === this.flagSel) {
        g.fillStyle(0x1e2a4a, 1);
        g.fillRect(8, y - 2, SCREEN_W - 16, rowH - 2);
        this.add.text(16, y + 1, '▶', {
          fontFamily: FONT_FAMILY, fontSize: '11px', color: '#ffd24d',
        });
      }

      // Flag 名
      const color = i === this.flagSel ? '#f2e6c0' : '#9a9ab0';
      this.add.text(32, y + 1, flag.label, {
        fontFamily: FONT_FAMILY, fontSize: '10px', color,
      });

      // 状态指示
      const statusColor = val ? '#40c050' : '#c04040';
      const statusText = val ? 'ON' : 'OFF';
      this.add.text(SCREEN_W - 16, y + 1, statusText, {
        fontFamily: FONT_FAMILY, fontSize: '10px', color: statusColor,
      }).setOrigin(1, 0);

      // 开关图标
      const boxX = SCREEN_W - 60;
      g.fillStyle(val ? 0x2a4a2a : 0x4a2a2a, 1);
      g.fillRect(boxX, y + 1, 20, 10);
      g.fillStyle(val ? 0x40c050 : 0xc04040, 1);
      g.fillRect(val ? boxX + 12 : boxX + 2, y + 3, 6, 6);
    }
  }
}
