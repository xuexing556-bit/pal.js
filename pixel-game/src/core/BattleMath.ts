/**
 * 战斗数学 — 纯函数，便于测试
 */

export function rollDamage(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export const ATTACK_DAMAGE = { min: 9, max: 14 };
export const SKILL_DAMAGE = { min: 18, max: 26 };
export const SKILL_MP_COST = 6;
export const POTION_HEAL = 35;

export function clampHp(current: number, delta: number, max: number): number {
  return Math.max(0, Math.min(max, current + delta));
}
