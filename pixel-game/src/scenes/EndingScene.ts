/**
 * EndingScene — 章节结尾过渡画面
 */
import Phaser from 'phaser';
import { SCREEN_W, SCREEN_H, FONT_FAMILY } from '../config';
import type { InputManager } from '../core/InputManager';
import type { GameState } from '../types';
import { Chapter2 } from '../chapters/Chapter2';

export class EndingScene extends Phaser.Scene {
  private gameTime = 0;
  private ready = false;
  constructor() { super('EndingScene'); }

  create(): void {
    this.gameTime = 0;
    this.ready = false;
    // 延迟 1 秒后才允许按键继续，避免误触
    this.time.delayedCall(1000, () => { this.ready = true; });
  }

  update(_time: number, dt: number): void {
    const inputMgr = this.registry.get('inputMgr') as InputManager;
    inputMgr.update();
    this.gameTime += dt / 1000;

    if (this.ready && inputMgr.took('confirm')) {
      const state = this.registry.get('gameState') as GameState;
      if (state.currentChapter === 1) {
        // 过渡到第二章
        const ch2 = new Chapter2();
        ch2.init(state);
        this.registry.set('chapter', ch2);
        this.scene.start('ExploreScene', { mapId: 'inn_night', tx: 9, ty: 7, dir: 'up' });
      }
      // 后续章节可在此扩展
    }
    inputMgr.endFrame();
  }

  render(): void {
    const g = this.add.graphics();
    const state = this.registry.get('gameState') as GameState | undefined;
    const chNum = state?.currentChapter ?? 1;

    g.fillStyle(0x06080f, 1); g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    g.fillStyle(0x101a30, 1); g.fillRect(0, 170, SCREEN_W, 70);
    g.fillStyle(0x1c2c4a, 1); g.fillRect(0, 168, SCREEN_W, 3);
    g.fillStyle(0x7a5230, 1); g.fillRect(150, 160, 24, 5);
    g.destroy();

    if (chNum === 1) {
      this.add.text(SCREEN_W / 2, 92, '—— 第一章 完 ——', {
        fontFamily: FONT_FAMILY, fontSize: '18px', color: '#f2e6c0',
        shadow: { color: '#000', fill: true, offsetX: 1, offsetY: 1 },
      }).setOrigin(0.5, 0);
      this.add.text(SCREEN_W / 2, 130, '湖心的仙灵岛上，有人仍在等待。', {
        fontFamily: FONT_FAMILY, fontSize: '10px', color: '#9fb8d8',
      }).setOrigin(0.5, 0);
    } else {
      this.add.text(SCREEN_W / 2, 92, '—— 第二章 完 ——', {
        fontFamily: FONT_FAMILY, fontSize: '18px', color: '#f2e6c0',
        shadow: { color: '#000', fill: true, offsetX: 1, offsetY: 1 },
      }).setOrigin(0.5, 0);
      this.add.text(SCREEN_W / 2, 130, '前路漫漫，江湖未了。', {
        fontFamily: FONT_FAMILY, fontSize: '10px', color: '#9fb8d8',
      }).setOrigin(0.5, 0);
    }

    if (this.ready && Math.floor(this.gameTime * 1.6) % 2 === 0) {
      const label = chNum === 1 ? '按确认键进入第二章' : '感谢游玩';
      this.add.text(SCREEN_W / 2, 210, label, {
        fontFamily: FONT_FAMILY, fontSize: '9px', color: '#6a7390',
      }).setOrigin(0.5, 0);
    }
  }
}
