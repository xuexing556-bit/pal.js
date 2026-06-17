/**
 * 敌人配置数据
 */
import type { EnemyConfig } from '../types/battle';

export const ENEMIES: Record<string, EnemyConfig> = {
  snake: {
    name: '守山蛇妖',
    hp: 55,
    atkMin: 5,
    atkMax: 9,
    spriteKey: 'snake',
    intro: '守山蛇妖瞪着血红的眼睛逼了过来！',
  },
  miao_warrior: {
    name: '黑苗武士',
    hp: 80,
    atkMin: 8,
    atkMax: 14,
    spriteKey: 'black_miao_warrior',
    intro: '黑苗武士拔出弯刀，杀气腾腾地冲了过来！',
  },
  miao_leader: {
    name: '黑苗护法',
    hp: 140,
    atkMin: 12,
    atkMax: 20,
    spriteKey: 'black_miao_leader',
    intro: '黑苗护法冷笑着举起了手中的黑铁杖！',
  },
};
