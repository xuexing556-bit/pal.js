import Phaser from 'phaser';
import { SCREEN_W, SCREEN_H } from './config';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { ExploreScene } from './scenes/ExploreScene';
import { BattleScene } from './scenes/BattleScene';
import { WeddingScene } from './scenes/WeddingScene';
import { EndingScene } from './scenes/EndingScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: SCREEN_W,
  height: SCREEN_H,
  parent: 'game-container',
  pixelArt: true,
  render: {
    antialias: false,
    pixelArt: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, TitleScene, ExploreScene, BattleScene, WeddingScene, EndingScene],
};

new Phaser.Game(config);
