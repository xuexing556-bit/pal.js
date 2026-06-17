/**
 * BattleScene — 回合制战斗（并行覆盖场景）
 */
import Phaser from 'phaser';
import { SCREEN_W, SCREEN_H } from '../config';
import type { GameState } from '../types';
import type { EnemyConfig, BattleMenuItem, BattleSceneData } from '../types/battle';
import type { InputManager } from '../core/InputManager';
import type { ChiptuneEngine } from '../core/ChiptuneEngine';
import { rollDamage, ATTACK_DAMAGE, SKILL_DAMAGE, SKILL_MP_COST, POTION_HEAL, clampHp } from '../core/BattleMath';
import { drawBox, drawHpBar, pixelText } from '../core/UIHelper';

export class BattleScene extends Phaser.Scene {
  private state!: GameState;
  private inputMgr!: InputManager;
  private music!: ChiptuneEngine;

  private active = false;
  private phase: 'menu' | 'msg' = 'msg';
  private enemy!: { name: string; hp: number; maxhp: number; atkMin: number; atkMax: number; spriteKey: string };
  private onWin: (() => void) | null = null;
  private menu: BattleMenuItem[] = [];
  private sel = 0;
  private msgs: string[] = [];
  private afterMsgs: string | null = null;
  private shake = 0;
  private flash = 0;
  private battleTime = 0;

  // 持久显示对象
  private gfx!: Phaser.GameObjects.Graphics;
  private enemyImg!: Phaser.GameObjects.Image;
  private eNameText!: Phaser.GameObjects.Text;
  private heroNameText!: Phaser.GameObjects.Text;
  private heroHpText!: Phaser.GameObjects.Text;
  private heroMpText!: Phaser.GameObjects.Text;
  private menuItems: { cursor: Phaser.GameObjects.Text; label: Phaser.GameObjects.Text }[] = [];
  private msgText!: Phaser.GameObjects.Text;
  private msgIndicator!: Phaser.GameObjects.Text;

  constructor() { super('BattleScene'); }

  init(data: BattleSceneData): void {
    this.state = this.registry.get('gameState') as GameState;
    this.inputMgr = this.registry.get('inputMgr') as InputManager;
    this.music = this.registry.get('chiptune') as ChiptuneEngine;

    const e = data.enemy;
    this.enemy = { name: e.name, hp: e.hp, maxhp: e.hp, atkMin: e.atkMin, atkMax: e.atkMax, spriteKey: e.spriteKey };
    this.onWin = data.onWin || null;
    this.active = true;
    this.sel = 0; this.shake = 0; this.flash = 0; this.battleTime = 0;
    this.refreshMenu();
    this.say([e.intro || (e.name + '挡住了去路！')], 'menu');
    this.music.play('battle');
  }

  create(): void {
    this.gfx = this.add.graphics();
    this.enemyImg = this.add.image(SCREEN_W / 2, 80, 'sprite:hero').setScale(4);

    this.eNameText = pixelText(this, 16, 13, '', 10, '#f2a0a0', 0, false);
    this.heroNameText = pixelText(this, 16, SCREEN_H - 58, '李逍遥', 10, '#7ec8e3', 0, false);
    this.heroHpText = pixelText(this, 16, SCREEN_H - 44, '', 9, '#e8e8e8', 0, false);
    this.heroMpText = pixelText(this, 16, SCREEN_H - 27, '', 9, '#e8e8e8', 0, false);

    // 菜单项池（最多 3 项）
    for (let i = 0; i < 3; i++) {
      const y = SCREEN_H - 60 + i * 14;
      this.menuItems.push({
        cursor: pixelText(this, SCREEN_W - 122, y, '', 10, '#ffd24d', 0, false),
        label: pixelText(this, SCREEN_W - 108, y, '', 10, '#e8e8e8', 0, false),
      });
    }

    // 消息区
    this.msgText = pixelText(this, 18, SCREEN_H - 98, '', 10, '#f2e6c0', 0, false);
    this.msgIndicator = pixelText(this, SCREEN_W - 26, SCREEN_H - 88, '', 9, '#ffd24d', 0, false);
  }

  private refreshMenu(): void {
    const h = this.state.hero;
    this.menu = [
      { key: 'atk', label: '攻击' },
      { key: 'skill', label: '仙风剑诀  ' + SKILL_MP_COST + 'MP', off: h.mp < SKILL_MP_COST || !this.state.flags.learnedSkill },
      { key: 'potion', label: '金创药 ×' + h.potions, off: h.potions <= 0 },
    ];
  }

  private say(msgs: string[], nextPhase: string): void {
    this.msgs = msgs.slice(); this.afterMsgs = nextPhase; this.phase = 'msg';
  }

  update(_time: number, dt: number): void {
    if (!this.active) return;
    this.inputMgr.update();
    this.battleTime += dt / 1000;
    if (this.shake > 0) this.shake -= dt / 1000;
    if (this.flash > 0) this.flash -= dt / 1000;

    if (this.phase === 'msg') {
      if (this.inputMgr.took('confirm')) { this.msgs.shift(); if (!this.msgs.length) this.advance(); }
      this.inputMgr.endFrame();
      this.drawFrame();
      return;
    }
    if (this.phase === 'menu') {
      if (this.inputMgr.took('up')) this.sel = (this.sel + this.menu.length - 1) % this.menu.length;
      if (this.inputMgr.took('down')) this.sel = (this.sel + 1) % this.menu.length;
      if (this.inputMgr.took('confirm')) {
        const item = this.menu[this.sel];
        if (item.off) { this.say(['现在用不了。'], 'menu'); this.inputMgr.endFrame(); this.drawFrame(); return; }
        this.heroAct(item.key);
      }
    }
    this.inputMgr.endFrame();
    this.drawFrame();
  }

  private drawFrame(): void {
    const g = this.gfx;
    const h = this.state.hero, e = this.enemy;

    g.clear();
    g.fillStyle(0x101424, 1); g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    g.fillStyle(0x1a2238, 1); g.fillRect(0, 130, SCREEN_W, 40);
    g.fillStyle(0x232c48, 1); g.fillRect(0, 150, SCREEN_W, 20);

    // 敌人精灵
    let sx = 0, sy = 0;
    if (this.shake > 0) { sx = Math.round(Math.sin(this.battleTime * 60) * 3); sy = Math.round(Math.cos(this.battleTime * 50) * 2); }
    this.enemyImg.setTexture('sprite:' + e.spriteKey);
    this.enemyImg.setPosition(SCREEN_W / 2 + sx, 80 + sy);

    if (this.flash > 0) { g.fillStyle(0xffffff, this.flash * 1.6); g.fillRect(0, 0, SCREEN_W, SCREEN_H); }

    // 敌人信息
    drawBox(g, 8, 8, 130, 30);
    this.eNameText.setText(e.name);
    drawHpBar(g, 16, 27, 110, 5, e.hp, e.maxhp, 0x3a1010, 0xd04040);

    // 英雄信息
    drawBox(g, 8, SCREEN_H - 64, 150, 56);
    this.heroHpText.setText('体力 ' + h.hp + '/' + h.maxhp);
    drawHpBar(g, 16, SCREEN_H - 33, 130, 4, h.hp, h.maxhp, 0x102a10, 0x40c050);
    this.heroMpText.setText('真气 ' + h.mp + '/' + h.maxmp);
    drawHpBar(g, 16, SCREEN_H - 16, 130, 4, h.mp, h.maxmp, 0x101a30, 0x5080e0);

    // 菜单
    if (this.phase === 'menu') {
      const mh = this.menu.length * 14 + 14;
      drawBox(g, SCREEN_W - 130, SCREEN_H - 8 - mh, 122, mh);
      for (let i = 0; i < 3; i++) {
        if (i < this.menu.length) {
          const it = this.menu[i];
          const y = SCREEN_H - mh + i * 14;
          const color = it.off ? '#777' : (i === this.sel ? '#ffd24d' : '#e8e8e8');
          this.menuItems[i].cursor.setText(i === this.sel ? '▶' : '');
          this.menuItems[i].cursor.setY(y);
          this.menuItems[i].label.setText(it.label);
          this.menuItems[i].label.setY(y);
          this.menuItems[i].label.setColor(color);
          this.menuItems[i].cursor.setVisible(true);
          this.menuItems[i].label.setVisible(true);
        } else {
          this.menuItems[i].cursor.setVisible(false);
          this.menuItems[i].label.setVisible(false);
        }
      }
    } else {
      for (let i = 0; i < 3; i++) {
        this.menuItems[i].cursor.setVisible(false);
        this.menuItems[i].label.setVisible(false);
      }
    }

    // 消息
    if (this.phase === 'msg' && this.msgs.length) {
      drawBox(g, 8, SCREEN_H - 110, SCREEN_W - 16, 36);
      this.msgText.setText(this.msgs[0]);
      this.msgText.setVisible(true);
      this.msgIndicator.setText('▼');
      this.msgIndicator.setVisible(true);
    } else {
      this.msgText.setVisible(false);
      this.msgIndicator.setVisible(false);
    }
  }

  private advance(): void {
    const next = this.afterMsgs; this.afterMsgs = null;
    if (next === 'win') {
      this.active = false;
      const cb = this.onWin; this.onWin = null;
      this.music.play('village');
      this.scene.stop(); this.scene.resume('ExploreScene');
      if (cb) cb();
    } else if (next === 'lose') {
      const h = this.state.hero; h.hp = h.maxhp; h.mp = h.maxmp;
      this.enemy.hp = this.enemy.maxhp; this.refreshMenu();
      this.say(['李逍遥咬着牙又站了起来……', '"再来！"'], 'menu');
    } else if (next === 'enemy') {
      this.enemyAct();
    } else {
      this.refreshMenu(); this.phase = (next as any) || 'menu';
    }
  }

  private heroAct(key: string): void {
    const h = this.state.hero, e = this.enemy;
    const msgs: string[] = [];
    if (key === 'atk') {
      const dmg = rollDamage(ATTACK_DAMAGE.min, ATTACK_DAMAGE.max);
      e.hp = Math.max(0, e.hp - dmg); this.shake = 0.25; this.music.sfx('hit');
      msgs.push('李逍遥挥剑斩出，造成 ' + dmg + ' 点伤害！');
    } else if (key === 'skill') {
      h.mp -= SKILL_MP_COST;
      const dmg2 = rollDamage(SKILL_DAMAGE.min, SKILL_DAMAGE.max);
      e.hp = Math.max(0, e.hp - dmg2); this.shake = 0.4; this.flash = 0.25; this.music.sfx('skill');
      msgs.push('李逍遥使出「仙风剑诀」，剑气纵横！', '造成 ' + dmg2 + ' 点伤害！');
    } else if (key === 'potion') {
      h.potions--; h.hp = clampHp(h.hp, POTION_HEAL, h.maxhp); this.music.sfx('heal');
      msgs.push('李逍遥服下金创药，恢复 ' + POTION_HEAL + ' 点体力。');
    }
    if (e.hp <= 0) { msgs.push(e.name + '化作一缕青烟散去了！'); this.say(msgs, 'win'); }
    else { this.say(msgs, 'enemy'); }
  }

  private enemyAct(): void {
    const h = this.state.hero, e = this.enemy;
    const dmg = rollDamage(e.atkMin, e.atkMax);
    h.hp = Math.max(0, h.hp - dmg); this.music.sfx('hit');
    const msgs = [e.name + '猛地扑了过来，李逍遥受到 ' + dmg + ' 点伤害！'];
    if (h.hp <= 0) { msgs.push('李逍遥眼前一黑，倒了下去……'); this.say(msgs, 'lose'); }
    else { this.say(msgs, 'menu'); }
  }
}
