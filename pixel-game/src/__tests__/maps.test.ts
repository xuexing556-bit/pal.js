/**
 * 地图系统测试 — tileAt, isSolid 纯函数
 */
import { describe, it, expect } from 'vitest';
import { MAPS, tileAt, isSolid, LEGEND } from '../data/maps';

describe('Maps', () => {
  describe('tileAt', () => {
    it('正确返回图块名', () => {
      // inn 地图左上角 (0,0) 是 W = wall
      expect(tileAt(MAPS.inn, 0, 0)).toBe('wall');
      // inn (1,1) 是 . = floor
      expect(tileAt(MAPS.inn, 1, 1)).toBe('floor');
      // inn (2,2) 是 C = counter
      expect(tileAt(MAPS.inn, 2, 2)).toBe('counter');
    });

    it('越界返回 wall', () => {
      expect(tileAt(MAPS.inn, -1, 0)).toBe('wall');
      expect(tileAt(MAPS.inn, 0, -1)).toBe('wall');
      expect(tileAt(MAPS.inn, 20, 0)).toBe('wall');
      expect(tileAt(MAPS.inn, 0, 15)).toBe('wall');
    });

    it('town 地图草地正确', () => {
      // (1,1) 是 G = grass
      expect(tileAt(MAPS.town, 1, 1)).toBe('grass');
    });

    it('lake 地图水域', () => {
      expect(tileAt(MAPS.lake, 0, 0)).toBe('water');
    });
  });

  describe('isSolid', () => {
    it('墙壁是实体', () => {
      expect(isSolid('wall')).toBe(true);
    });

    it('草地不是实体', () => {
      expect(isSolid('grass')).toBe(false);
    });

    it('地板不是实体', () => {
      expect(isSolid('floor')).toBe(false);
    });

    it('树是实体', () => {
      expect(isSolid('tree')).toBe(true);
    });

    it('水是实体', () => {
      expect(isSolid('water')).toBe(true);
    });

    it('小路不是实体', () => {
      expect(isSolid('path')).toBe(false);
    });
  });

  describe('LEGEND', () => {
    it('所有地图字符都有对应图块', () => {
      const knownChars = new Set(Object.keys(LEGEND));
      for (const [mapName, map] of Object.entries(MAPS)) {
        for (let y = 0; y < map.grid.length; y++) {
          for (let x = 0; x < map.grid[y].length; x++) {
            const ch = map.grid[y][x];
            expect(knownChars.has(ch), `${mapName} (${x},${y}) char '${ch}' not in LEGEND`).toBe(true);
          }
        }
      }
    });
  });

  describe('地图出口', () => {
    it('inn 有两个出口到 town', () => {
      expect(MAPS.inn.exits.length).toBe(2);
      expect(MAPS.inn.exits[0].to).toBe('town');
    });

    it('town 有出口到 inn 和 lake', () => {
      const targets = MAPS.town.exits.map(e => e.to);
      expect(targets).toContain('inn');
      expect(targets).toContain('lake');
    });

    it('island 无出口（只能坐船离开）', () => {
      expect(MAPS.island.exits.length).toBe(0);
    });
  });
});
