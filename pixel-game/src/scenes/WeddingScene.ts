/**
 * WeddingScene — 拜堂成亲场景
 */
import Phaser from 'phaser';
import { SCREEN_W, SCREEN_H } from '../config';
import type { GameState } from '../types';
import type { InputManager } from '../core/InputManager';
import type { ChiptuneEngine } from '../core/ChiptuneEngine';
import { DialogManager } from '../core/DialogManager';
import { pixelText } from '../core/UIHelper';

export class WeddingScene extends Phaser.Scene {
  private gameTime = 0;
  private state!: GameState;
  private inputMgr!: InputManager;
  private music!: ChiptuneEngine;
  private dialogManager!: DialogManager;

  // 持久显示对象
  private gfx!: Phaser.GameObjects.Graphics;
  private heroImg!: Phaser.GameObjects.Image;
  private lingerImg!: Phaser.GameObjects.Image;
  private grannyImg!: Phaser.GameObjects.Image;

  constructor() { super('WeddingScene'); }

  create(): void {
    this.state = this.registry.get('gameState') as GameState;
    this.inputMgr = this.registry.get('inputMgr') as InputManager;
    this.music = this.registry.get('chiptune') as ChiptuneEngine;
    this.dialogManager = new DialogManager(this, this.music);
    this.music.play('wedding');

    // 创建持久显示对象
    this.gfx = this.add.graphics();
    pixelText(this, SCREEN_W / 2, 26, '囍', 36, '#ffd24d', 0.5);

    this.heroImg = this.add.image(124, 100, 'sprite:hero').setDisplaySize(36, 48);
    this.lingerImg = this.add.image(168, 100, 'sprite:linger').setDisplaySize(36, 48);
    this.grannyImg = this.add.image(216, 108, 'sprite:granny').setDisplaySize(27, 36);

    this.time.delayedCall(50, () => { this.weddingScript(); });
  }

  private weddingScript(): void {
    this.dialogManager.say([
      '是夜，水月宫中红烛高照，喜字映得满堂生辉。',
      { n: '姥姥', t: '一拜天地——' },
      { n: '姥姥', t: '二拜高堂——' },
      { n: '姥姥', t: '夫妻对拜——礼成！' },
      { n: '赵灵儿', t: '李大哥……从今往后，灵儿就把一切都托付给你了。' },
      { n: '李逍遥', t: '灵儿放心，我李逍遥说话算话，这辈子都不会负你。' },
      '灵儿从袖中捧出一株通体莹白的仙草，郑重地放进李逍遥手里。',
      { n: '赵灵儿', t: '这是岛上的灵芝仙草，能治好婶婶的病。明日一早你便动身吧，救人要紧。' },
      '李逍遥获得「灵芝仙草」！',
    ], () => {
      this.state.flags.married = true;
      this.state.flags.hasMedicine = true;
      this.scene.start('ExploreScene', { mapId: 'island', tx: 9, ty: 4, dir: 'down' });
    });
  }

  update(_time: number, dt: number): void {
    this.inputMgr.update();
    this.gameTime += dt / 1000;
    if (this.inputMgr.took('mute')) this.music.toggleMute();
    if (this.dialogManager.active) this.dialogManager.update(dt / 1000, this.inputMgr);
    this.inputMgr.endFrame();

    // 重绘图形
    const g = this.gfx;
    g.clear();
    g.fillStyle(0x4a0e16, 1); g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    g.fillStyle(0x5e1620, 1); g.fillRect(0, 150, SCREEN_W, 90);

    // 红烛动画
    for (let c = 0; c < 2; c++) {
      const cx = c === 0 ? 70 : 244;
      g.fillStyle(0xd04040, 1); g.fillRect(cx, 96, 6, 40);
      g.fillStyle(0xffd24d, 1);
      const fl = Math.floor(this.gameTime * 6) % 2 === 0 ? 0 : 1;
      g.fillRect(cx + 2, 88 + fl, 2, 6);
      g.fillStyle(0xff8030, 1); g.fillRect(cx + 2, 92, 2, 3);
    }

    g.fillStyle(0xa02030, 1); g.fillRect(110, 156, 110, 24);
    g.fillStyle(0xffd24d, 1); g.fillRect(110, 156, 110, 2); g.fillRect(110, 178, 110, 2);
  }
}
