/**
 * BootScene — 生成所有纹理 + 加载动画 → 进入 TitleScene
 */
import Phaser from 'phaser';
import { SCREEN_W, SCREEN_H, FONT_FAMILY } from '../config';
import { pixelArt } from '../core/PixelArtGenerator';
import { TILE_DEFS } from '../data/tiles';
import { SPRITE_DEFS } from '../data/sprites';
import { ChiptuneEngine } from '../core/ChiptuneEngine';
import { InputManager } from '../core/InputManager';
import { createInitialState } from '../core/GameState';
import { pixelText } from '../core/UIHelper';

export class BootScene extends Phaser.Scene {
  private bootT = 0;
  private gfx!: Phaser.GameObjects.Graphics;
  private progressText!: Phaser.GameObjects.Text;

  constructor() {
    super('BootScene');
  }

  create(): void {
    const chiptune = new ChiptuneEngine();
    const inputMgr = new InputManager(this);
    const state = createInitialState();

    this.registry.set('chiptune', chiptune);
    this.registry.set('inputMgr', inputMgr);
    this.registry.set('gameState', state);

    // 占位纹理（供 ExploreScene 图块池初始化使用）
    const wc = document.createElement('canvas');
    wc.width = 16; wc.height = 16;
    this.textures.addCanvas('_tile_pool', wc);

    // 生成图块纹理：用 addCanvas 注册
    for (let i = 0; i < TILE_DEFS.length; i++) {
      const c = makeTileCanvas(TILE_DEFS[i].paint);
      this.textures.addCanvas(TILE_DEFS[i].name, c);
    }

    // 生成角色精灵纹理
    for (const def of SPRITE_DEFS) {
      const c = pixelArt(def.rows, def.legend);
      this.textures.addCanvas('sprite:' + def.name, c);
    }

    this.bootT = 0;

    // 创建持久显示对象
    this.gfx = this.add.graphics();
    const cx = SCREEN_W / 2;
    const cy = SCREEN_H / 2 - 10;
    this.progressText = pixelText(this, cx, cy + 36, '正在准备像素资源 0%', 9, '#8a90a8', 0.5, false);
    pixelText(this, cx, SCREEN_H - 24, 'PAL.JS · 像素版', 8, '#4a5068', 0.5, false);
  }

  update(_time: number, dt: number): void {
    const inputMgr = this.registry.get('inputMgr') as InputManager;
    inputMgr.update();
    this.bootT += dt / 1000;

    // 重绘图形（clear 后重画，不销毁重建）
    this.gfx.clear();
    this.gfx.fillStyle(0x0b0b10, 1);
    this.gfx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    const p = Math.min(1, this.bootT / 1.8);
    const cx = SCREEN_W / 2;
    const cy = SCREEN_H / 2 - 10;
    const SEGS = 16, R = 30;
    const lit = Math.floor(p * SEGS);

    for (let i = 0; i < SEGS; i++) {
      const a = -Math.PI / 2 + (i / SEGS) * Math.PI * 2;
      const x = Math.round((cx + Math.cos(a) * R) / 4) * 4 - 2;
      const y = Math.round((cy + Math.sin(a) * R) / 4) * 4 - 2;
      this.gfx.fillStyle(i < lit ? 0xf2e6c0 : 0x2a2a36, 1);
      this.gfx.fillRect(x, y, 4, 4);
    }

    this.gfx.fillStyle(0x9fb8d8, 1); this.gfx.fillRect(cx - 1, cy - 12, 2, 18);
    this.gfx.fillStyle(0xf2e6c0, 1); this.gfx.fillRect(cx - 5, cy + 4, 10, 2); this.gfx.fillRect(cx - 2, cy + 6, 4, 5);

    // 更新进度文字
    this.progressText.setText('正在准备像素资源 ' + Math.floor(p * 100) + '%');

    if (this.bootT > 2.0 || inputMgr.took('confirm')) {
      this.scene.start('TitleScene');
    }
    inputMgr.endFrame();
  }
}

function makeTileCanvas(painter: (g: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  painter(c.getContext('2d')!);
  return c;
}
