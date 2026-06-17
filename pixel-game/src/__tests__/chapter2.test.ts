/**
 * Chapter2 测试 — 验证第二章剧情、地图、NPC、音乐等
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Chapter2 } from '../chapters/Chapter2';
import type { GameState } from '../types';

function freshState(): GameState {
  const ch = new Chapter2();
  const s: GameState = {
    hero: { hp: 60, maxhp: 60, mp: 24, maxmp: 24, potions: 3 },
    flags: {},
    currentChapter: 1,
    currentMap: '',
  };
  ch.init(s);
  return s;
}

describe('Chapter2 — 初始化', () => {
  it('章节编号和标题正确', () => {
    const ch = new Chapter2();
    expect(ch.id).toBe(2);
    expect(ch.title).toBe('第二章 · 黑苗来袭');
  });

  it('init 重置所有第二章 flag', () => {
    const s = freshState();
    expect(s.flags.nightHeard).toBe(false);
    expect(s.flags.nightSaw).toBe(false);
    expect(s.flags.warriorDead).toBe(false);
    expect(s.flags.campReached).toBe(false);
    expect(s.flags.bossDead).toBe(false);
    expect(s.flags.lingerRescued).toBe(false);
    expect(s.flags.done).toBe(false);
    expect(s.flags._introShown).toBe(false);
  });

  it('init 恢复英雄满血满蓝', () => {
    const ch = new Chapter2();
    const s: GameState = {
      hero: { hp: 10, maxhp: 60, mp: 5, maxmp: 24, potions: 3 },
      flags: {},
      currentChapter: 1,
      currentMap: '',
    };
    ch.init(s);
    expect(s.hero.hp).toBe(60);
    expect(s.hero.mp).toBe(24);
  });

  it('currentChapter 设为 2', () => {
    const s = freshState();
    expect(s.currentChapter).toBe(2);
  });
});

describe('Chapter2 — 地图', () => {
  it('包含 4 张地图', () => {
    const ch = new Chapter2();
    const s = freshState();
    ch.init(s);
    const maps = ch.getMaps();
    expect(Object.keys(maps).length).toBe(4);
    expect(maps.inn_night).toBeDefined();
    expect(maps.town_night).toBeDefined();
    expect(maps.mountain_path).toBeDefined();
    expect(maps.black_miao_camp).toBeDefined();
  });

  it('地图名称正确', () => {
    const ch = new Chapter2();
    ch.init(freshState());
    const maps = ch.getMaps();
    expect(maps.inn_night.name).toBe('客栈 · 深夜');
    expect(maps.town_night.name).toBe('余杭镇 · 深夜');
    expect(maps.mountain_path.name).toBe('后山 · 林间小路');
    expect(maps.black_miao_camp.name).toBe('黑苗营地');
  });

  it('所有地图 grid 行宽一致', () => {
    const ch = new Chapter2();
    ch.init(freshState());
    for (const map of Object.values(ch.getMaps())) {
      const w = map.grid[0].length;
      for (const row of map.grid) {
        expect(row.length).toBe(w);
      }
    }
  });

  it('inn_night 有通往 town_night 的出口', () => {
    const ch = new Chapter2();
    ch.init(freshState());
    const exits = ch.getMaps().inn_night.exits;
    expect(exits.length).toBeGreaterThan(0);
    expect(exits.every(e => e.to === 'town_night')).toBe(true);
  });

  it('town_night 有通往 inn_night 和 mountain_path 的出口', () => {
    const ch = new Chapter2();
    ch.init(freshState());
    const exits = ch.getMaps().town_night.exits;
    const targets = exits.map(e => e.to);
    expect(targets).toContain('inn_night');
    expect(targets).toContain('mountain_path');
  });

  it('mountain_path 有通往 town_night 和 black_miao_camp 的出口', () => {
    const ch = new Chapter2();
    ch.init(freshState());
    const exits = ch.getMaps().mountain_path.exits;
    const targets = exits.map(e => e.to);
    expect(targets).toContain('town_night');
    expect(targets).toContain('black_miao_camp');
  });
});

describe('Chapter2 — NPC 放置', () => {
  it('初始时 town_night 有黑苗武士', () => {
    const ch = new Chapter2();
    const s = freshState();
    ch.init(s);
    const npcs = ch.setupNpcs(s, 'town_night');
    expect(npcs.length).toBe(1);
    expect(npcs[0].id).toBe('miao_warrior');
    expect(npcs[0].spriteKey).toBe('black_miao_warrior');
  });

  it('武士死后 town_night 无 NPC', () => {
    const ch = new Chapter2();
    const s = freshState();
    ch.init(s);
    s.flags.warriorDead = true;
    expect(ch.setupNpcs(s, 'town_night').length).toBe(0);
  });

  it('初始时 black_miao_camp 有护法 boss', () => {
    const ch = new Chapter2();
    const s = freshState();
    ch.init(s);
    const npcs = ch.setupNpcs(s, 'black_miao_camp');
    expect(npcs.length).toBe(1);
    expect(npcs[0].id).toBe('miao_leader');
  });

  it('boss 死后灵儿出现在营地', () => {
    const ch = new Chapter2();
    const s = freshState();
    ch.init(s);
    s.flags.bossDead = true;
    const npcs = ch.setupNpcs(s, 'black_miao_camp');
    expect(npcs.length).toBe(1);
    expect(npcs[0].id).toBe('linger');
    expect(npcs[0].spriteKey).toBe('linger');
  });

  it('灵儿获救后营地无 NPC', () => {
    const ch = new Chapter2();
    const s = freshState();
    ch.init(s);
    s.flags.bossDead = true;
    s.flags.lingerRescued = true;
    expect(ch.setupNpcs(s, 'black_miao_camp').length).toBe(0);
  });

  it('inn_night 和 mountain_path 默认无 NPC', () => {
    const ch = new Chapter2();
    const s = freshState();
    ch.init(s);
    expect(ch.setupNpcs(s, 'inn_night').length).toBe(0);
    expect(ch.setupNpcs(s, 'mountain_path').length).toBe(0);
  });
});

describe('Chapter2 — 提示文本', () => {
  it('初始提示：调查床铺', () => {
    const ch = new Chapter2();
    const s = freshState();
    ch.init(s);
    expect(ch.getHint(s)).toBe('调查床铺');
  });

  it('nightHeard 后提示出门', () => {
    const ch = new Chapter2();
    const s = freshState();
    ch.init(s);
    s.flags.nightHeard = true;
    expect(ch.getHint(s)).toBe('出门去镇上看看');
  });

  it('nightSaw 后提示追黑衣人', () => {
    const ch = new Chapter2();
    const s = freshState();
    ch.init(s);
    s.flags.nightSaw = true;
    expect(ch.getHint(s)).toBe('追上镇子里的黑衣人');
  });

  it('warriorDead 后提示去后山', () => {
    const ch = new Chapter2();
    const s = freshState();
    ch.init(s);
    s.flags.warriorDead = true;
    expect(ch.getHint(s)).toBe('从镇北进入后山，追踪黑苗人');
  });

  it('bossDead 后提示救灵儿', () => {
    const ch = new Chapter2();
    const s = freshState();
    ch.init(s);
    s.flags.bossDead = true;
    expect(ch.getHint(s)).toBe('去救灵儿');
  });

  it('lingerRescued 后提示离开营地', () => {
    const ch = new Chapter2();
    const s = freshState();
    ch.init(s);
    s.flags.lingerRescued = true;
    expect(ch.getHint(s)).toBe('从营地南边离开，准备出发远行');
  });

  it('done 后无提示', () => {
    const ch = new Chapter2();
    const s = freshState();
    ch.init(s);
    s.flags.done = true;
    expect(ch.getHint(s)).toBe('');
  });
});

describe('Chapter2 — 音乐', () => {
  it('客栈深夜播放 night_tension', () => {
    const ch = new Chapter2();
    expect(ch.getMusic('inn_night')).toBe('night_tension');
  });

  it('小镇深夜播放 night_tension', () => {
    const ch = new Chapter2();
    expect(ch.getMusic('town_night')).toBe('night_tension');
  });

  it('后山播放 mountain_adventure', () => {
    const ch = new Chapter2();
    expect(ch.getMusic('mountain_path')).toBe('mountain_adventure');
  });

  it('营地播放 battle', () => {
    const ch = new Chapter2();
    expect(ch.getMusic('black_miao_camp')).toBe('battle');
  });
});
