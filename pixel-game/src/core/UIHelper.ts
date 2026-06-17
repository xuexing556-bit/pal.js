/**
 * UI 工具 — 对话框、阴影文字、血条、高清像素文字
 */
import Phaser from 'phaser';
import { FONT_FAMILY, SCREEN_W, SCREEN_H } from '../config';

/**
 * 高清像素文字 — 使用 2x 内部分辨率渲染，解决 320x240 下中文模糊问题。
 * @param shadow 是否添加 1px 右下阴影（默认 true）
 */
export function pixelText(
  scene: Phaser.Scene,
  x: number, y: number,
  text: string,
  size: number,
  color: string,
  originX: number = 0,
  shadow: boolean = true,
): Phaser.GameObjects.Text {
  const opts: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: FONT_FAMILY,
    fontSize: `${size}px`,
    color,
    resolution: 2,
  };
  if (shadow) {
    opts.shadow = { color: '#000000', fill: true, offsetX: 1, offsetY: 1, blur: 0 };
  }
  return scene.add.text(x, y, text, opts).setOrigin(originX, 0);
}

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
    resolution: 2,
  }).setOrigin(align === 'center' ? 0.5 : 0, 0).setDepth(10);
  // 正文
  return scene.add.text(x, y, text, {
    fontFamily: FONT_FAMILY,
    fontSize: `${size}px`,
    color,
    resolution: 2,
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
