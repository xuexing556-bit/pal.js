/**
 * EndingScene — 章节结尾过渡画面
 */
import Phaser from 'phaser';
import { SCREEN_W, SCREEN_H } from '../config';
import type { InputManager } from '../core/InputManager';
import type { GameState } from '../types';
import { pixelText } from '../core/UIHelper';
import { Chapter2 } from '../chapters/Chapter2';

export class EndingScene extends Phaser.Scene {
  private gameTime = 0;
  private ready = false;

  // 持久显示对象
  private gfx!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;

  constructor() { super('EndingScene'); }

  create(): void {
    this.gameTime = 0;
    this.ready = false;
    this.time.delayedCall(1000, () => { this.ready = true; });

    // 创建持久显示对象
    this.gfx = this.add.graphics();

    this.titleText = pixelText(this, SCREEN_W / 2, 92, '', 18, '#f2e6c0', 0.5);
    this.subtitleText = pixelText(this, SCREEN_W / 2, 130, '', 10, '#9fb8d8', 0.5);
    this.promptText = pixelText(this, SCREEN_W / 2, 210, '', 9, '#6a7390', 0.5, false);

    // 根据当前章节设置文字
    const state = this.registry.get('gameState') as GameState | undefined;
    const chNum = state?.currentChapter ?? 1;
    if (chNum === 1) {
      this.titleText.setText('—— 第一章 完 ——');
      this.subtitleText.setText('湖心的仙灵岛上，有人仍在等待。');
    } else {
      this.titleText.setText('—— 第二章 完 ——');
      this.subtitleText.setText('前路漫漫，江湖未了。');
    }
  }

  update(_time: number, dt: number): void {
    const inputMgr = this.registry.get('inputMgr') as InputManager;
    inputMgr.update();
    this.gameTime += dt / 1000;

    if (this.ready && inputMgr.took('confirm')) {
      const state = this.registry.get('gameState') as GameState;
      if (state.currentChapter === 1) {
        const ch2 = new Chapter2();
        ch2.init(state);
        this.registry.set('chapter', ch2);
        this.scene.start('ExploreScene', { mapId: 'inn_night', tx: 9, ty: 7, dir: 'up' });
      }
    }
    inputMgr.endFrame();

    // 重绘背景
    const g = this.gfx;
    g.clear();
    g.fillStyle(0x06080f, 1); g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    g.fillStyle(0x101a30, 1); g.fillRect(0, 170, SCREEN_W, 70);
    g.fillStyle(0x1c2c4a, 1); g.fillRect(0, 168, SCREEN_W, 3);
    g.fillStyle(0x7a5230, 1); g.fillRect(150, 160, 24, 5);

    // 闪烁提示
    if (this.ready && Math.floor(this.gameTime * 1.6) % 2 === 0) {
      const state = this.registry.get('gameState') as GameState | undefined;
      const chNum = state?.currentChapter ?? 1;
      this.promptText.setText(chNum === 1 ? '按确认键进入第二章' : '感谢游玩');
      this.promptText.setVisible(true);
    } else {
      this.promptText.setVisible(false);
    }
  }
}
