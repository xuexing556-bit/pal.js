/**
 * TitleScene — 标题画面
 */
import Phaser from 'phaser';
import { SCREEN_W, SCREEN_H, FONT_FAMILY } from '../config';
import type { InputManager } from '../core/InputManager';
import type { ChiptuneEngine } from '../core/ChiptuneEngine';

export class TitleScene extends Phaser.Scene {
  private gameTime = 0;
  private debugKey: Phaser.Input.Keyboard.Key | null = null;
  private gfx!: Phaser.GameObjects.Graphics;
  private startText!: Phaser.GameObjects.Text;

  constructor() { super('TitleScene'); }

  create(): void {
    const music = this.registry.get('chiptune') as ChiptuneEngine;
    music.unlock();
    music.play('title');
    this.input.keyboard?.once('keydown', () => { music.unlock(); });
    this.debugKey = this.input.keyboard?.addKey('KeyL') ?? null;

    // 创建持久显示对象
    this.gfx = this.add.graphics();

    const textOpts = (size: number, color: string) => ({
      fontFamily: FONT_FAMILY, fontSize: `${size}px`, color,
      shadow: { color: '#000', fill: true, offsetX: 1, offsetY: 1 },
    });

    this.add.text(SCREEN_W / 2, 78, '仙剑奇侠传', textOpts(30, '#f2e6c0')).setOrigin(0.5, 0);
    this.add.text(SCREEN_W / 2, 116, '像 素 版', textOpts(12, '#9fb8d8')).setOrigin(0.5, 0);
    this.add.text(SCREEN_W / 2, 140, '作者：幸', textOpts(9, '#7a8aa0')).setOrigin(0.5, 0);

    this.startText = this.add.text(SCREEN_W / 2, 186, '按 回车 / Z 键 开始', textOpts(11, '#ffd24d')).setOrigin(0.5, 0);

    this.add.text(SCREEN_W / 2, 210, 'L 键 — 选关调试', {
      fontFamily: FONT_FAMILY, fontSize: '8px', color: '#4a5068',
    }).setOrigin(0.5, 0);
    this.add.text(SCREEN_W / 2, 222, '方向键移动 · 回车/Z 确认 · M 静音 · 致敬经典之同人习作', {
      fontFamily: FONT_FAMILY, fontSize: '8px', color: '#6a7390',
    }).setOrigin(0.5, 0);
  }

  update(_time: number, dt: number): void {
    const inputMgr = this.registry.get('inputMgr') as InputManager;
    inputMgr.update();
    this.gameTime += dt / 1000;

    if (this.debugKey && Phaser.Input.Keyboard.JustDown(this.debugKey)) {
      this.scene.start('DebugScene');
      inputMgr.endFrame();
      return;
    }

    if (inputMgr.took('confirm')) {
      const music = this.registry.get('chiptune') as ChiptuneEngine;
      music.unlock();
      // 清除可能残留的章节实例，确保从第一章开始
      this.registry.remove('chapter');
      this.scene.start('ExploreScene', { mapId: 'inn', tx: 10, ty: 12, dir: 'down' });
    }
    inputMgr.endFrame();

    // 重绘图形背景（clear + 重画，不销毁重建）
    this.gfx.clear();
    this.gfx.fillStyle(0x0a0e1e, 1); this.gfx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    this.gfx.fillStyle(0x16203a, 1); this.gfx.fillRect(0, 150, SCREEN_W, 90);
    this.gfx.fillStyle(0x22335a, 1); this.gfx.fillRect(0, 160, SCREEN_W, 4);
    this.gfx.fillStyle(0x101830, 1);
    for (let i = 0; i < 7; i++) this.gfx.fillRect(i * 50 - 10, 120 - (i % 3) * 14, 60, 40);

    const stars = [[20,18],[60,40],[130,12],[200,30],[260,16],[300,48],[170,52],[90,26]];
    this.gfx.fillStyle(0xe8e8f0, 1);
    for (let s = 0; s < stars.length; s++) {
      if (Math.floor(this.gameTime * 2 + s) % 4 !== 0) this.gfx.fillRect(stars[s][0], stars[s][1], 1, 1);
    }
    this.gfx.fillStyle(0xf2e6c0, 1); this.gfx.fillCircle(262, 50, 16);
    this.gfx.fillStyle(0x0a0e1e, 1); this.gfx.fillCircle(268, 45, 13);

    // 闪烁 "开始" 文字
    this.startText.setVisible(Math.floor(this.gameTime * 1.6) % 2 === 0);
  }
}
