/**
 * ExploreScene — 主游戏场景：地图、行走、碰撞、NPC、场景切换
 */
import Phaser from 'phaser';
import { TILE, WALK_SPEED, SCREEN_W, SCREEN_H, DIRS } from '../config';
import type { Direction, GameState, NpcDef, ChangeMapParams, Chapter } from '../types';
import type { InputManager } from '../core/InputManager';
import type { ChiptuneEngine } from '../core/ChiptuneEngine';
import { DialogManager } from '../core/DialogManager';
import { pixelText } from '../core/UIHelper';
import { MAPS, tileAt } from '../data/maps';
import { SOLID_TILES } from '../data/tiles';
import { Chapter1 } from '../chapters/Chapter1';

const MAX_TILES = 25 * 20;
const MAX_ENTS = 12;

export class ExploreScene extends Phaser.Scene {
  private state!: GameState;
  private inputMgr!: InputManager;
  private music!: ChiptuneEngine;
  dialogManager!: DialogManager;
  private chapter!: Chapter;

  private mapId = 'inn';
  private mapDef: any = null;
  npcs: NpcDef[] = [];

  player = { px: 10 * TILE, py: 12 * TILE, dir: 'down' as Direction, walking: false };

  private gameTime = 0;
  private whiteFlash = 0;
  private flashCb: (() => void) | null = null;

  // 持久显示对象
  private gfx!: Phaser.GameObjects.Graphics;
  private flashGfx!: Phaser.GameObjects.Graphics;
  private tilePool: Phaser.GameObjects.Image[] = [];
  private entPool: Phaser.GameObjects.Sprite[] = [];
  private mapNameText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;

  constructor() { super('ExploreScene'); }

  init(data: ChangeMapParams & { chapter?: number }): void {
    this.state = this.registry.get('gameState') as GameState;
    this.inputMgr = this.registry.get('inputMgr') as InputManager;
    this.music = this.registry.get('chiptune') as ChiptuneEngine;

    // 从注册表获取章节实例（跨章节切换时保留），或创建第一章
    let chapter = this.registry.get('chapter') as Chapter | undefined;
    if (!chapter) {
      chapter = new Chapter1();
      chapter.init(this.state);
      this.registry.set('chapter', chapter);
    }
    this.chapter = chapter;

    if (data?.mapId) {
      this.mapId = data.mapId;
      this.player.px = data.tx * TILE;
      this.player.py = data.ty * TILE;
      if (data.dir) this.player.dir = data.dir as Direction;
    }
  }

  create(): void {
    this.dialogManager = new DialogManager(this, this.music);
    this.changeMap(this.mapId, this.player.px / TILE, this.player.py / TILE, this.player.dir);

    if (!this.state.flags._introShown) {
      this.state.flags._introShown = true;
      this.chapter.intro?.(this);
    }

    // 创建持久显示对象
    this.gfx = this.add.graphics();
    this.flashGfx = this.add.graphics();

    // 预创建地图图块池
    for (let i = 0; i < MAX_TILES; i++) {
      const img = this.add.image(0, 0, '_tile_pool').setOrigin(0.5).setVisible(false);
      this.tilePool.push(img);
    }

    // 预创建实体精灵池
    for (let i = 0; i < MAX_ENTS; i++) {
      const s = this.add.sprite(0, 0, 'sprite:hero').setOrigin(0, 0).setVisible(false);
      this.entPool.push(s);
    }

    // HUD 文字
    this.mapNameText = pixelText(this, 6, 4, '', 9, '#f2e6c0');
    this.hintText = pixelText(this, 6, SCREEN_H - 13, '', 9, '#9fd8a8');
  }

  changeMap(mapId: string, tx: number, ty: number, dir?: string): void {
    this.mapId = mapId;
    this.state.currentMap = mapId;
    this.mapDef = this.chapter.getMaps()[mapId] || MAPS[mapId];
    this.player.px = tx * TILE;
    this.player.py = ty * TILE;
    if (dir) this.player.dir = dir as Direction;
    this.npcs = this.chapter.setupNpcs(this.state, mapId);
    this.playSceneMusic();
  }

  playSceneMusic(): void {
    this.music.play(this.chapter.getMusic(this.mapId));
  }

  startWedding(): void { this.scene.start('WeddingScene'); }

  flashWhite(cb: () => void): void {
    this.whiteFlash = 1.2;
    this.flashCb = cb;
  }

  update(_time: number, dt: number): void {
    this.inputMgr.update();
    this.gameTime += dt / 1000;
    if (this.inputMgr.took('mute')) this.music.toggleMute();

    if (this.whiteFlash > 0) {
      this.whiteFlash -= dt / 1000;
      if (this.whiteFlash <= 0.6 && this.flashCb) { const cb = this.flashCb; this.flashCb = null; cb(); }
      this.drawFrame();
      this.inputMgr.endFrame();
      return;
    }
    if (this.dialogManager.active) {
      this.dialogManager.update(dt / 1000, this.inputMgr);
      this.drawFrame();
      this.inputMgr.endFrame();
      return;
    }
    this.updatePlayer(dt / 1000);
    if (this.inputMgr.took('confirm')) this.tryInteract();
    this.inputMgr.endFrame();

    this.drawFrame();
  }

  private drawFrame(): void {
    // 背景 + 地图图块
    this.gfx.clear();
    this.gfx.fillStyle(0x000000, 1);
    this.gfx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    let tileIdx = 0;
    if (this.mapDef) {
      for (let y = 0; y < this.mapDef.grid.length; y++) {
        for (let x = 0; x < this.mapDef.grid[0].length; x++) {
          if (tileIdx >= MAX_TILES) break;
          const name = tileAt(this.mapDef, x, y);
          const img = this.tilePool[tileIdx];
          img.setTexture(name);
          img.setPosition(x * TILE + 8, y * TILE + 8);
          img.setVisible(true);
          tileIdx++;
        }
      }
    }
    for (let i = tileIdx; i < MAX_TILES; i++) this.tilePool[i].setVisible(false);

    // NPC + 玩家 y 排序
    const ents: { y: number; key: string; px: number; py: number; bob: number; flip?: boolean }[] = [];
    for (const n of this.npcs) {
      ents.push({ y: n.y * TILE, key: 'sprite:' + n.spriteKey, px: n.x * TILE + 2, py: n.y * TILE, bob: 0 });
    }
    const p = this.player;
    const bob = p.walking ? (Math.floor(this.gameTime * 8) % 2) : 0;
    ents.push({ y: p.py, key: 'sprite:hero', px: p.px + 2, py: p.py, bob, flip: p.dir === 'left' });
    ents.sort((a, b) => a.y - b.y);

    for (let i = 0; i < MAX_ENTS; i++) {
      if (i < ents.length) {
        const e = ents[i];
        const sp = this.entPool[i];
        sp.setTexture(e.key);
        sp.setPosition(e.px, e.py - e.bob);
        sp.setFlipX(!!e.flip);
        sp.setVisible(true);
      } else {
        this.entPool[i].setVisible(false);
      }
    }

    // 白闪
    this.flashGfx.clear();
    if (this.whiteFlash > 0) {
      this.flashGfx.fillStyle(0xffffff, Math.min(1, this.whiteFlash));
      this.flashGfx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    }

    // HUD
    this.mapNameText.setText(this.mapDef?.name ?? '');
    this.mapNameText.setVisible(!!this.mapDef);
    const hint = this.chapter.getHint(this.state);
    if (hint && !this.dialogManager.active) {
      this.hintText.setText('◆ ' + hint);
      this.hintText.setVisible(true);
    } else {
      this.hintText.setVisible(false);
    }
  }

  private updatePlayer(dt: number): void {
    const p = this.player;
    let dir: Direction | null = null;
    if (this.inputMgr.isDown('up')) dir = 'up';
    else if (this.inputMgr.isDown('down')) dir = 'down';
    else if (this.inputMgr.isDown('left')) dir = 'left';
    else if (this.inputMgr.isDown('right')) dir = 'right';

    p.walking = !!dir;
    if (!dir) return;
    p.dir = dir;
    const d = DIRS[dir];
    const step = WALK_SPEED * dt;
    const nx = p.px + d.dx * step, ny = p.py + d.dy * step;
    if (!this.collides(nx, p.py)) p.px = nx;
    if (!this.collides(p.px, ny)) p.py = ny;

    const ctx = Math.floor((p.px + TILE / 2) / TILE);
    const cty = Math.floor((p.py + TILE / 2) / TILE);
    if (this.chapter.onStep(this, this.state, this.mapId, ctx, cty)) return;

    for (const e of (this.mapDef?.exits || [])) {
      if (e.x === ctx && e.y === cty) {
        this.scene.restart({ mapId: e.to, tx: e.tx, ty: e.ty, dir: p.dir });
        return;
      }
    }
  }

  private collides(px: number, py: number): boolean {
    const pad = 3;
    const x0 = Math.floor((px + pad) / TILE), x1 = Math.floor((px + TILE - 1 - pad) / TILE);
    const y0 = Math.floor((py + TILE / 2) / TILE), y1 = Math.floor((py + TILE - 1) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (SOLID_TILES.has(tileAt(this.mapDef, tx, ty))) return true;
        if (this.npcAt(tx, ty)) return true;
      }
    }
    return false;
  }

  private npcAt(tx: number, ty: number): NpcDef | null {
    for (const n of this.npcs) if (n.x === tx && n.y === ty) return n;
    return null;
  }

  private tryInteract(): void {
    const p = this.player, d = DIRS[p.dir];
    const ctx = Math.floor((p.px + TILE / 2) / TILE), cty = Math.floor((p.py + TILE / 2) / TILE);
    const fx = ctx + d.dx, fy = cty + d.dy;
    const npc = this.npcAt(fx, fy);
    if (npc) { this.chapter.interact(this, this.state, npc.id); return; }
    const t = tileAt(this.mapDef, fx, fy);
    if (t === 'boat') this.chapter.interact(this, this.state, this.mapId === 'island' ? 'boat_island' : 'boat_lake');
    else if (t === 'well') this.chapter.interact(this, this.state, 'well');
    else if (t === 'bed' && this.mapId === 'inn' && this.state.flags.auntSick) this.chapter.interact(this, this.state, 'aunt');
    else if (t === 'bed' && this.mapId === 'inn_night') this.chapter.interact(this, this.state, 'bed_inn_night');
    else if (t === 'campfire') this.chapter.interact(this, this.state, 'campfire');
  }
}
