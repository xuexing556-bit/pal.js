/**
 * 战斗数学测试
 */
import { describe, it, expect } from 'vitest';
import { rollDamage, ATTACK_DAMAGE, SKILL_DAMAGE, SKILL_MP_COST, POTION_HEAL, clampHp } from '../core/BattleMath';

describe('BattleMath', () => {
  describe('rollDamage', () => {
    it('返回值在 [min, max] 范围内', () => {
      for (let i = 0; i < 1000; i++) {
        const dmg = rollDamage(ATTACK_DAMAGE.min, ATTACK_DAMAGE.max);
        expect(dmg).toBeGreaterThanOrEqual(ATTACK_DAMAGE.min);
        expect(dmg).toBeLessThanOrEqual(ATTACK_DAMAGE.max);
      }
    });

    it('攻击伤害范围 9-14', () => {
      expect(ATTACK_DAMAGE.min).toBe(9);
      expect(ATTACK_DAMAGE.max).toBe(14);
    });

    it('技能伤害范围 18-26', () => {
      expect(SKILL_DAMAGE.min).toBe(18);
      expect(SKILL_DAMAGE.max).toBe(26);
    });

    it('技能 MP 消耗为 6', () => {
      expect(SKILL_MP_COST).toBe(6);
    });

    it('金创药恢复 35 HP', () => {
      expect(POTION_HEAL).toBe(35);
    });

    it('min === max 时始终返回该值', () => {
      for (let i = 0; i < 100; i++) {
        expect(rollDamage(10, 10)).toBe(10);
      }
    });
  });

  describe('clampHp', () => {
    it('HP 不会低于 0', () => {
      expect(clampHp(10, -20, 60)).toBe(0);
    });

    it('HP 不会超过 max', () => {
      expect(clampHp(50, 35, 60)).toBe(60);
    });

    it('正常范围内正确计算', () => {
      expect(clampHp(30, -10, 60)).toBe(20);
      expect(clampHp(30, 15, 60)).toBe(45);
    });

    it('HP 为 0 时受伤仍返回 0', () => {
      expect(clampHp(0, -5, 60)).toBe(0);
    });
  });
});
