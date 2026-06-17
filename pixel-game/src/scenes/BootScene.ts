/**
 * BootScene — 生成所有纹理 + 加载动画 → 进入 TitleScene
 */
import Phaser from 'phaser';
import { SCREEN_W, SCREEN_H, FONT_FAMILY } from '../config';
import { pixelArt } from '../core/PixelArtGenerator';
import { TILE_DEFS, TILE_INDEX } from '../data/tiles';
import { SPRITE_DEFS } from '../data/sprites';
import { ChiptuneEngine } from '../core/ChiptuneEngine';
import { InputManager } from '../core/InputManager';
import { createInitialState } from '../core/GameState';

export class BootScene extends Phaser.Scene {
  private bootT = 0;

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
  }

  update(_time: number, dt: number): void {
    const inputMgr = this.registry.get('inputMgr') as InputManager;
    inputMgr.update();
    this.bootT += dt / 1000;

    if (this.bootT > 2.0 || inputMgr.took('confirm')) {
      this.scene.start('TitleScene');
    }
    inputMgr.endFrame();
  }

  render(): void {
    const g = this.add.graphics();
    g.fillStyle(0x0b0b10, 1);
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);

    const p = Math.min(1, this.bootT / 1.8);
    const cx = SCREEN_W / 2;
    const cy = SCREEN_H / 2 - 10;
    const SEGS = 16, R = 30;
    const lit = Math.floor(p * SEGS);

    for (let i = 0; i < SEGS; i++) {
      const a = -Math.PI / 2 + (i / SEGS) * Math.PI * 2;
      const x = Math.round((cx + Math.cos(a) * R) / 4) * 4 - 2;
      const y = Math.round((cy + Math.sin(a) * R) / 4) * 4 - 2;
      g.fillStyle(i < lit ? 0xf2e6c0 : 0x2a2a36, 1);
      g.fillRect(x, y, 4, 4);
    }

    g.fillStyle(0x9fb8d8, 1); g.fillRect(cx - 1, cy - 12, 2, 18);
    g.fillStyle(0xf2e6c0, 1); g.fillRect(cx - 5, cy + 4, 10, 2); g.fillRect(cx - 2, cy + 6, 4, 5);
    g.destroy();

    this.add.text(cx, cy + 36, '正在准备像素资源 ' + Math.floor(p * 100) + '%', {
      fontFamily: FONT_FAMILY, fontSize: '9px', color: '#8a90a8',
    }).setOrigin(0.5, 0);
    this.add.text(cx, SCREEN_H - 24, 'PAL.JS · 像素版', {
      fontFamily: FONT_FAMILY, fontSize: '8px', color: '#4a5068',
    }).setOrigin(0.5, 0);
  }
}

function makeTileCanvas(painter: (g: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  painter(c.getContext('2d')!);
  return c;
}
