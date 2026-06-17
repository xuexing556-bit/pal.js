/**
 * 对话框管理器 — 打字机文本、分页、选项菜单
 */
import Phaser from 'phaser';
import { SCREEN_W, SCREEN_H, FONT_FAMILY } from '../config';
import { drawBox } from './UIHelper';
import type { InputManager } from './InputManager';
import type { ChiptuneEngine } from './ChiptuneEngine';
import type { DialogItem } from '../types';

const BOX_X = 8;
const BOX_W = 304;
const BOX_H = 58;
const TEXT_SIZE = 10;
const LINE_H = 14;
const MAX_LINES = 2;
const SPEED = 30; // 字/秒
const MAX_CHARS_PER_LINE = 28;

/** 纯函数：文本分行 */
export function wrapText(text: string, maxChars: number = MAX_CHARS_PER_LINE): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const ch of text) {
    const next = cur + ch;
    if (next.length > maxChars) {
      lines.push(cur);
      cur = ch;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

interface PageItem {
  speaker: string;
  narration: boolean;
  pages: string[][];
}

export class DialogManager {
  active = false;
  private mode: 'text' | 'choice' = 'text';
  private scene: Phaser.Scene;
  private music: ChiptuneEngine;

  // 文本模式状态
  private queue: DialogItem[] = [];
  private speaker = '';
  private narration = false;
  private pages: string[][] = [];
  private pageIdx = 0;
  private reveal = 0;
  private cb: (() => void) | null = null;

  // 选项模式状态
  private prompt = '';
  private options: string[] = [];
  private sel = 0;
  private choiceCb: ((idx: number) => void) | null = null;

  // Phaser 显示对象
  private boxGfx!: Phaser.GameObjects.Graphics;
  private speakerText!: Phaser.GameObjects.Text;
  private lineTexts: Phaser.GameObjects.Text[] = [];
  private arrowText!: Phaser.GameObjects.Text;
  private choiceBoxGfx!: Phaser.GameObjects.Graphics;
  private promptText!: Phaser.GameObjects.Text;
  private optionTexts: Phaser.GameObjects.Text[] = [];
  private choiceArrow!: Phaser.GameObjects.Text;
  private container!: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, music: ChiptuneEngine) {
    this.scene = scene;
    this.music = music;
    this._buildObjects();
    this._hide();
  }

  private _buildObjects(): void {
    const by = SCREEN_H - BOX_H - 6;
    this.container = this.scene.add.container(0, 0).setDepth(100);

    this.boxGfx = this.scene.add.graphics();
    this.container.add(this.boxGfx);

    this.speakerText = this.scene.add.text(BOX_X + 10, by + 8, '', {
      fontFamily: FONT_FAMILY, fontSize: `${TEXT_SIZE}px`, color: '#7ec8e3',
    });
    this.container.add(this.speakerText);

    for (let i = 0; i < MAX_LINES; i++) {
      const t = this.scene.add.text(BOX_X + 10, by + 8 + (i === 0 ? LINE_H : 0) + i * LINE_H, '', {
        fontFamily: FONT_FAMILY, fontSize: `${TEXT_SIZE}px`, color: '#f2e6c0',
      });
      this.lineTexts.push(t);
      this.container.add(t);
    }

    this.arrowText = this.scene.add.text(SCREEN_W - 26, by + BOX_H - 13, '', {
      fontFamily: FONT_FAMILY, fontSize: '9px', color: '#ffd24d',
    });
    this.container.add(this.arrowText);

    // 选项对象
    this.choiceBoxGfx = this.scene.add.graphics();
    this.container.add(this.choiceBoxGfx);

    this.promptText = this.scene.add.text(BOX_X + 10, by + 8, '', {
      fontFamily: FONT_FAMILY, fontSize: `${TEXT_SIZE}px`, color: '#f2e6c0',
    });
    this.container.add(this.promptText);

    for (let i = 0; i < 4; i++) {
      const t = this.scene.add.text(0, 0, '', {
        fontFamily: FONT_FAMILY, fontSize: `${TEXT_SIZE}px`, color: '#e8e8e8',
      });
      this.optionTexts.push(t);
      this.container.add(t);
    }
    this.choiceArrow = this.scene.add.text(0, 0, '', {
      fontFamily: FONT_FAMILY, fontSize: `${TEXT_SIZE}px`, color: '#ffd24d',
    });
    this.container.add(this.choiceArrow);
  }

  private _hide(): void {
    this.container.setVisible(false);
  }

  private _show(): void {
    this.container.setVisible(true);
  }

  say(items: DialogItem[], cb?: () => void): void {
    this.queue = items.slice();
    this.cb = cb || null;
    this.active = true;
    this.mode = 'text';
    this._nextItem();
  }

  choice(prompt: string, options: string[], cb: (idx: number) => void): void {
    this.active = true;
    this.mode = 'choice';
    this.prompt = prompt;
    this.options = options;
    this.sel = 0;
    this.choiceCb = cb;
    this._show();
    this._renderChoice();
  }

  private _nextItem(): void {
    if (!this.queue.length) {
      this.active = false;
      this._hide();
      const cb = this.cb;
      this.cb = null;
      if (cb) cb();
      return;
    }
    const item = this.queue.shift()!;
    if (typeof item === 'string') {
      this.speaker = '';
      this.narration = true;
      const lines = wrapText(item);
      this.pages = [];
      for (let i = 0; i < lines.length; i += MAX_LINES) {
        this.pages.push(lines.slice(i, i + MAX_LINES));
      }
    } else {
      this.speaker = item.n || '';
      this.narration = !item.n;
      const lines = wrapText(item.t);
      this.pages = [];
      for (let i = 0; i < lines.length; i += MAX_LINES) {
        this.pages.push(lines.slice(i, i + MAX_LINES));
      }
    }
    this.pageIdx = 0;
    this.reveal = 0;
    this._show();
  }

  private _pageLen(): number {
    const page = this.pages[this.pageIdx] || [];
    let n = 0;
    for (const line of page) n += line.length;
    return n;
  }

  update(dt: number, input: InputManager): void {
    if (!this.active) return;

    if (this.mode === 'choice') {
      if (input.took('up')) {
        this.sel = (this.sel + this.options.length - 1) % this.options.length;
        this.music.sfx('cursor');
        this._renderChoice();
      }
      if (input.took('down')) {
        this.sel = (this.sel + 1) % this.options.length;
        this.music.sfx('cursor');
        this._renderChoice();
      }
      if (input.took('confirm')) {
        this.music.sfx('confirm');
        this.active = false;
        this._hide();
        const cb = this.choiceCb;
        const s = this.sel;
        this.choiceCb = null;
        if (cb) cb(s);
      }
      return;
    }

    // 文本模式
    this.reveal += dt * SPEED;
    if (input.took('confirm')) {
      if (this.reveal < this._pageLen()) {
        this.reveal = this._pageLen();
      } else if (this.pageIdx < this.pages.length - 1) {
        this.music.sfx('confirm');
        this.pageIdx++;
        this.reveal = 0;
      } else {
        this.music.sfx('confirm');
        this._nextItem();
      }
    }
    this._renderText();
  }

  private _renderText(): void {
    const by = SCREEN_H - BOX_H - 6;
    this.boxGfx.clear();
    drawBox(this.boxGfx, BOX_X, by, BOX_W, BOX_H);

    if (this.speaker) {
      this.speakerText.setText(this.speaker).setVisible(true);
      // 第一行文字从 speaker 下面开始
      this.lineTexts[0].setY(by + 8 + LINE_H);
      this.lineTexts[1].setY(by + 8 + LINE_H + LINE_H);
    } else {
      this.speakerText.setVisible(false);
      this.lineTexts[0].setY(by + 8);
      this.lineTexts[1].setY(by + 8 + LINE_H);
    }

    const page = this.pages[this.pageIdx] || [];
    let left = Math.floor(this.reveal);
    const color = this.narration ? '#cfd2da' : '#f2e6c0';
    for (let j = 0; j < this.lineTexts.length; j++) {
      if (j < page.length && left > 0) {
        const line = page[j];
        const shown = line.length <= left ? line : line.slice(0, left);
        left -= line.length;
        this.lineTexts[j].setText(shown).setColor(color);
      } else {
        this.lineTexts[j].setText('');
      }
    }

    if (this.reveal >= this._pageLen()) {
      this.arrowText.setText('\u25BC'); // ▼
    } else {
      this.arrowText.setText('');
    }

    // 隐藏选项相关
    this.choiceBoxGfx.clear();
    this.promptText.setText('');
    for (const t of this.optionTexts) t.setText('');
    this.choiceArrow.setText('');
  }

  private _renderChoice(): void {
    const by = SCREEN_H - BOX_H - 6;
    this.boxGfx.clear();
    drawBox(this.boxGfx, BOX_X, by, BOX_W, BOX_H);
    this.promptText.setText(this.prompt).setPosition(BOX_X + 10, by + 8);

    const ow = 110;
    const oh = this.options.length * LINE_H + 12;
    const ox = SCREEN_W - ow - 16;
    const oy = by - oh - 4;
    this.choiceBoxGfx.clear();
    drawBox(this.choiceBoxGfx, ox, oy, ow, oh);

    for (let i = 0; i < this.options.length; i++) {
      const isSel = i === this.sel;
      this.optionTexts[i]
        .setText(this.options[i])
        .setPosition(ox + 22, oy + 7 + i * LINE_H)
        .setColor(isSel ? '#ffd24d' : '#e8e8e8')
        .setVisible(true);
      if (isSel) {
        this.choiceArrow.setText('\u25B6').setPosition(ox + 8, oy + 7 + i * LINE_H); // ▶
      }
    }
    // 隐藏不用的选项文本
    for (let i = this.options.length; i < this.optionTexts.length; i++) {
      this.optionTexts[i].setVisible(false);
    }

    // 隐藏文本模式
    this.speakerText.setVisible(false);
    for (const t of this.lineTexts) t.setText('');
    this.arrowText.setText('');
  }
}
