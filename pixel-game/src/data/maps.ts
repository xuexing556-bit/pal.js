/**
 * 地图数据
 * 图例：W 墙  . 地板  C 柜台  t 桌子  B 床  D 门
 *       G 草地 T 树  P 小路  F 花丛  O 水井  R 屋顶
 *       ~ 水  L 莲花  k 栈桥  b 小船  S 灵泉
 */
import type { MapDef } from '../types';

export const LEGEND: Record<string, string> = {
  W: 'wall', '.': 'floor', C: 'counter', t: 'table', B: 'bed', D: 'door',
  G: 'grass', T: 'tree', P: 'path', F: 'flower', O: 'well', R: 'roof',
  '~': 'water', L: 'lotus', k: 'dock', b: 'boat', S: 'spring',
  // Chapter 2 tiles
  d: 'dark_floor', w: 'dark_wall', r: 'mountain_rock', m: 'mountain_path',
  E: 'tent', f: 'campfire', a: 'dark_grass',
};

export const MAPS: Record<string, MapDef> = {
  inn: {
    name: '余杭镇 · 客栈',
    grid: [
      'WWWWWWWWWWWWWWWWWWWW',
      'W..................W',
      'W.CCCC........BB...W',
      'W..................W',
      'W..................W',
      'W...tt.....tt......W',
      'W..................W',
      'W..................W',
      'W...tt.....tt......W',
      'W..................W',
      'W..................W',
      'W..................W',
      'W..................W',
      'W..................W',
      'WWWWWWWWWDDWWWWWWWWW',
    ],
    exits: [
      { x: 9, y: 14, to: 'town', tx: 6, ty: 3 },
      { x: 10, y: 14, to: 'town', tx: 6, ty: 3 },
    ],
  },
  town: {
    name: '余杭镇',
    grid: [
      'TTTTTTTTTTTTTTTTTTTT',
      'TGGGRRRRRGGGGRRRRGGT',
      'TGGGWWDWWGGGGWWWWGGT',
      'TGGGGGPGGGGGGGGGGGGT',
      'TGGGGGPGGGGOGGGGGGGT',
      'TGGGGGPPPPPPPPPGGGGT',
      'TGGGGGGGGGGGGGPGGGGT',
      'PPPPPPPPPPPPPPPGGGGT',
      'TGGGGGGGGGGGGGPGGGGT',
      'TGGFFGGGGGGGGGPGGGGT',
      'TGGFFGGGGGRRRRRGGGGT',
      'TGGGGGGGGGWWWWWGGGGT',
      'TGGGGGGGGGGGGGGGGGGT',
      'TGGGGGGGGGGGGGGGGGGT',
      'TTTTTTTTTTTTTTTTTTTT',
    ],
    exits: [
      { x: 6, y: 2, to: 'inn', tx: 9, ty: 13 },
      { x: 0, y: 7, to: 'lake', tx: 18, ty: 7 },
    ],
  },
  lake: {
    name: '余杭镇外 · 湖畔',
    grid: [
      '~~~~~~~~~~~~TTTTTTTT',
      '~~~~~~~~~~~~TGGGGGGT',
      '~~L~~~~~~~~~GGGGGGGT',
      '~~~~~~~~~~~~GGGGGGGT',
      '~~~~~L~~~~~GGGGGGGGT',
      '~~~~~~~~~~~GGGGGGGGT',
      '~~bkkkkkkkkGGGGGGGGT',
      '~~~~~~~~~~~GPPPPPPPP',
      '~~~~L~~~~~~GGGGGGGGT',
      '~~~~~~~~~~~~GGGGGGGT',
      '~~~~~~~~~~~~GGFFGGGT',
      '~~~~~~~~~~~~GGGGGGGT',
      '~~~L~~~~~~~~~GGGGGGT',
      '~~~~~~~~~~~~~TTTTTTT',
      '~~~~~~~~~~~~~~TTTTTT',
    ],
    exits: [
      { x: 19, y: 7, to: 'town', tx: 1, ty: 7 },
    ],
  },
  island: {
    name: '仙灵岛',
    grid: [
      '~~~~~~~~~~~~~~~~~~~~',
      '~TTTTTTTSSSSTTTTTT~~',
      '~TGGGGGGSSSSGGGGGT~~',
      '~TGGGGGGGGGGGGGGGT~~',
      '~TGGTTGGGGGGTTGGGT~~',
      '~TGFFGGGGPGGGGFFGT~~',
      '~TGGGGGGGPGGGGGGGT~~',
      '~TGGGGGGGPGGGGGGGT~~',
      '~TTTTTTTTPTTTTTTTT~~',
      '~TGGGGGGGPGGGGGGGT~~',
      '~TGFFGGGGPGGGFFGGT~~',
      '~TTTTTTTGPGTTTTTTT~~',
      '~~~L~~~TGPGT~~L~~~~~',
      '~~~~~~~TkPkT~~~~~~~~',
      '~~~~~~~~~b~~~~~~~~~~',
    ],
    exits: [],
  },
};

/** 根据地图和坐标获取图块名 */
export function tileAt(map: MapDef, tx: number, ty: number): string {
  const grid = map.grid;
  if (ty < 0 || ty >= grid.length || tx < 0 || tx >= grid[0].length) return 'wall';
  return LEGEND[grid[ty][tx]] || 'grass';
}

/** 判断图块是否实体（不可通行） */
export function isSolid(tileName: string): boolean {
  const SOLID = new Set([
    'wall', 'counter', 'table', 'bed', 'tree', 'well', 'roof',
    'water', 'lotus', 'boat', 'spring',
    'dark_wall', 'tent', 'mountain_rock', 'campfire',
  ]);
  return SOLID.has(tileName);
}
