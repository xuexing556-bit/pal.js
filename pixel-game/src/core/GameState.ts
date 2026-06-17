/**
 * 游戏状态管理
 */
import type { GameState } from '../types';

export function createInitialState(): GameState {
  return {
    hero: { hp: 60, maxhp: 60, mp: 24, maxmp: 24, potions: 3 },
    flags: {},
    currentChapter: 1,
    currentMap: 'inn',
  };
}

export function resetHero(state: GameState): void {
  state.hero.hp = state.hero.maxhp;
  state.hero.mp = state.hero.maxmp;
}
