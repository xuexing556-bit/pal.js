/** 英雄属性 */
export interface HeroStats {
  hp: number;
  maxhp: number;
  mp: number;
  maxmp: number;
  potions: number;
}

/** NPC 定义 */
export interface NpcDef {
  id: string;
  spriteKey: string;
  x: number;
  y: number;
}

/** 地图出口 */
export interface MapExit {
  x: number;
  y: number;
  to: string;
  tx: number;
  ty: number;
}

/** 地图定义 */
export interface MapDef {
  name: string;
  grid: string[];
  exits: MapExit[];
  music?: string;
}

/** 图块索引映射 */
export type TileIndexMap = Record<string, number>;

/** 对话条目 */
export type DialogItem = string | { n: string; t: string };

/** 游戏状态 */
export interface GameState {
  hero: HeroStats;
  flags: Record<string, boolean>;
  currentChapter: number;
  currentMap: string;
}

/** 场景切换参数 */
export interface ChangeMapParams {
  mapId: string;
  tx: number;
  ty: number;
  dir?: string;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

/** 章节接口 — scene 使用 any 避免循环依赖 */
export interface Chapter {
  readonly id: number;
  readonly title: string;

  init(state: GameState): void;
  getMaps(): Record<string, MapDef>;
  setupNpcs(state: GameState, mapId: string): NpcDef[];
  onStep(
    scene: any,
    state: GameState,
    mapId: string,
    tx: number,
    ty: number,
  ): boolean;
  interact(scene: any, state: GameState, id: string): void;
  getHint(state: GameState): string;
  getMusic(mapId: string): string;
  intro?(scene: any): void;
}
