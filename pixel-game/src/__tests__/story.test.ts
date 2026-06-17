/**
 * 剧情系统测试 — Chapter1 状态机、提示、NPC 布置
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Chapter1 } from '../chapters/Chapter1';
import { createInitialState } from '../core/GameState';
import type { GameState } from '../types';

describe('Chapter1', () => {
  let chapter: Chapter1;
  let state: GameState;

  beforeEach(() => {
    chapter = new Chapter1();
    state = createInitialState();
    chapter.init(state);
  });

  describe('init', () => {
    it('初始英雄属性正确', () => {
      expect(state.hero.hp).toBe(60);
      expect(state.hero.maxhp).toBe(60);
      expect(state.hero.mp).toBe(24);
      expect(state.hero.maxmp).toBe(24);
      expect(state.hero.potions).toBe(3);
    });

    it('初始标志全为 false', () => {
      expect(state.flags.learnedSkill).toBe(false);
      expect(state.flags.auntSick).toBe(false);
      expect(state.flags.snakeDead).toBe(false);
      expect(state.flags.married).toBe(false);
      expect(state.flags.hasMedicine).toBe(false);
      expect(state.flags.memoryLost).toBe(false);
      expect(state.flags.done).toBe(false);
    });

    it('章节编号为 1', () => {
      expect(state.currentChapter).toBe(1);
    });
  });

  describe('getHint', () => {
    it('初始提示：和老先生聊聊', () => {
      expect(chapter.getHint(state)).toBe('和客栈里的老先生聊聊');
    });

    it('学剑后提示：看婶婶', () => {
      state.flags.learnedSkill = true;
      expect(chapter.getHint(state)).toBe('去柜台看看婶婶');
    });

    it('婶婶病倒后提示：去湖畔', () => {
      state.flags.learnedSkill = true;
      state.flags.auntSick = true;
      expect(chapter.getHint(state)).toBe('去镇西湖畔，乘船前往仙灵岛');
    });

    it('蛇妖死后提示：去灵泉', () => {
      state.flags.auntSick = true;
      state.flags.snakeDead = true;
      expect(chapter.getHint(state)).toBe('去岛北的灵泉看看');
    });

    it('拿到药后提示：回程', () => {
      state.flags.married = true;
      state.flags.hasMedicine = true;
      expect(chapter.getHint(state)).toBe('回到岛南的小船，启程回家');
    });

    it('失忆后提示：交药给婶婶', () => {
      state.flags.hasMedicine = true;
      state.flags.memoryLost = true;
      expect(chapter.getHint(state)).toBe('回客栈，把灵药交给婶婶');
    });

    it('完成后无提示', () => {
      state.flags.done = true;
      expect(chapter.getHint(state)).toBe('');
    });
  });

  describe('setupNpcs', () => {
    it('客栈初始有婶婶和老者', () => {
      const npcs = chapter.setupNpcs(state, 'inn');
      const ids = npcs.map(n => n.id);
      expect(ids).toContain('aunt');
      expect(ids).toContain('oldman');
    });

    it('学剑后老者消失', () => {
      state.flags.learnedSkill = true;
      const npcs = chapter.setupNpcs(state, 'inn');
      const ids = npcs.map(n => n.id);
      expect(ids).not.toContain('oldman');
    });

    it('婶婶病倒后 NPC 变化', () => {
      state.flags.auntSick = true;
      const npcs = chapter.setupNpcs(state, 'inn');
      const ids = npcs.map(n => n.id);
      expect(ids).toContain('aunt');
      expect(ids).toContain('doctor');
      expect(ids).not.toContain('oldman');
    });

    it('镇上有两个镇民', () => {
      const npcs = chapter.setupNpcs(state, 'town');
      expect(npcs.length).toBe(2);
      const ids = npcs.map(n => n.id);
      expect(ids).toContain('villager_m');
      expect(ids).toContain('villager_f');
    });

    it('仙灵岛有灵儿', () => {
      const npcs = chapter.setupNpcs(state, 'island');
      expect(npcs.length).toBe(1);
      expect(npcs[0].id).toBe('linger');
    });

    it('湖畔无 NPC', () => {
      const npcs = chapter.setupNpcs(state, 'lake');
      expect(npcs.length).toBe(0);
    });
  });

  describe('getMusic', () => {
    it('客栈播放村庄音乐', () => {
      expect(chapter.getMusic('inn')).toBe('village');
    });

    it('镇上播放村庄音乐', () => {
      expect(chapter.getMusic('town')).toBe('village');
    });

    it('湖畔播放岛屿音乐', () => {
      expect(chapter.getMusic('lake')).toBe('island');
    });

    it('仙灵岛播放岛屿音乐', () => {
      expect(chapter.getMusic('island')).toBe('island');
    });
  });

  describe('getMaps', () => {
    it('返回 4 张地图', () => {
      const maps = chapter.getMaps();
      expect(Object.keys(maps).length).toBe(4);
      expect(maps.inn).toBeDefined();
      expect(maps.town).toBeDefined();
      expect(maps.lake).toBeDefined();
      expect(maps.island).toBeDefined();
    });
  });
});
