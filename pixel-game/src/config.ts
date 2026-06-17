/** 游戏常量 */
export const TILE = 16;
export const WALK_SPEED = 72; // px/s
export const SCREEN_W = 320;
export const SCREEN_H = 240;
export const MAP_W = 20;
export const MAP_H = 15;

/** 方向定义 */
export const DIRS: Record<string, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

export type Direction = 'up' | 'down' | 'left' | 'right';

/** 字体族 */
export const FONT_FAMILY = '"PingFang SC", "Microsoft YaHei", sans-serif';
