/**
 * UI 工具 — 对话框、阴影文字、血条
 */
import Phaser from 'phaser';
import { FONT_FAMILY, SCREEN_W, SCREEN_H } from '../config';

export function addShadowText(
  scene: Phaser.Scene,
  x: number, y: number,
  text: string,
  color: string,
  size: number = 10,
  align: string = 'left',
): Phaser.GameObjects.Text {
  // 阴影层
  scene.add.text(x + 1, y + 1, text, {
    fontFamily: FONT_FAMILY,
    fontSize: `${size}px`,
    color: '#000000',
  }).setOrigin(align === 'center' ? 0.5 : 0, 0).setDepth(10);
  // 正文
  return scene.add.text(x, y, text, {
    fontFamily: FONT_FAMILY,
    fontSize: `${size}px`,
    color,
  }).setOrigin(align === 'center' ? 0.5 : 0, 0).setDepth(11);
}

export function drawBox(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
  g.fillStyle(0x0a0e24, 0.92);
  g.fillRect(x, y, w, h);
  g.lineStyle(1, 0xd8c890, 1);
  g.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
}

export function drawHpBar(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number,
  w: number, h: number,
  current: number, max: number,
  bgColor: number, fgColor: number,
): void {
  g.fillStyle(bgColor, 1);
  g.fillRect(x, y, w, h);
  g.fillStyle(fgColor, 1);
  g.fillRect(x, y, Math.round(w * current / max), h);
}
