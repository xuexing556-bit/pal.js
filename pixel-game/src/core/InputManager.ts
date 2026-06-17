/**
 * 输入管理器 — 封装 Phaser 键盘，提供 isDown / took（消费型边沿触发）
 */
import Phaser from 'phaser';

const KEYMAP: Record<string, string> = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Enter: 'confirm', KeyZ: 'confirm', Space: 'confirm',
  Escape: 'cancel', KeyX: 'cancel',
  KeyM: 'mute',
};

export class InputManager {
  private down: Record<string, boolean> = {};
  private pressed: Record<string, boolean> = {};
  private keys: Record<string, Phaser.Input.Keyboard.Key[]> = {};

  constructor(scene: Phaser.Scene) {
    if (!scene.input.keyboard) return;
    for (const [code, action] of Object.entries(KEYMAP)) {
      if (!this.keys[action]) this.keys[action] = [];
      this.keys[action].push(scene.input.keyboard.addKey(code));
    }
  }

  update(): void {
    for (const [action, keyList] of Object.entries(this.keys)) {
      const anyDown = keyList.some(k => k.isDown);
      if (anyDown) {
        if (!this.down[action]) {
          this.pressed[action] = true;
        }
        this.down[action] = true;
      } else {
        this.down[action] = false;
      }
    }
  }

  isDown(k: string): boolean {
    return !!this.down[k];
  }

  /** 消费型边沿触发 — 取出后即清除 */
  took(k: string): boolean {
    if (this.pressed[k]) {
      this.pressed[k] = false;
      return true;
    }
    return false;
  }

  endFrame(): void {
    this.pressed = {};
  }
}
