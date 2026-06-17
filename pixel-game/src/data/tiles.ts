/**
 * 图块数据 — 程序化绘制函数
 */
import { makeTile, fillAll, dots } from '../core/PixelArtGenerator';

export interface TileDef {
  name: string;
  paint: (g: CanvasRenderingContext2D) => void;
}

function paintGrass(g: CanvasRenderingContext2D): void {
  fillAll(g, '#3e8948');
  dots(g, '#357a3f', [[2,3],[6,1],[11,4],[14,7],[4,9],[9,11],[13,13],[1,12],[7,6],[12,9]]);
  dots(g, '#4d9c57', [[5,4],[10,2],[3,14],[15,11],[8,13]]);
}

function paintWater(g: CanvasRenderingContext2D): void {
  fillAll(g, '#2d5f9e');
  g.fillStyle = '#3f78bd';
  g.fillRect(2,3,5,1); g.fillRect(9,7,5,1); g.fillRect(4,12,5,1);
  g.fillStyle = '#26528a';
  g.fillRect(11,2,4,1); g.fillRect(1,8,4,1); g.fillRect(10,13,4,1);
}

function paintFloor(g: CanvasRenderingContext2D): void {
  fillAll(g, '#a87a4a');
  g.fillStyle = '#8a6038';
  g.fillRect(0,3,16,1); g.fillRect(0,7,16,1); g.fillRect(0,11,16,1); g.fillRect(0,15,16,1);
  dots(g, '#8a6038', [[5,1],[12,5],[3,9],[10,13]]);
}

export const TILE_DEFS: TileDef[] = [
  { name: 'grass', paint: paintGrass },
  { name: 'flower', paint(g) {
    paintGrass(g);
    dots(g, '#e85d75', [[4,4],[3,5],[5,5],[4,6]]);
    dots(g, '#ffd24d', [[4,5],[11,10]]);
    dots(g, '#f2f2f2', [[11,9],[10,10],[12,10],[11,11]]);
  }},
  { name: 'tree', paint(g) {
    paintGrass(g);
    g.fillStyle = '#6b4226'; g.fillRect(6,10,4,5);
    g.fillStyle = '#1e5e2e'; g.fillRect(2,3,12,7); g.fillRect(4,1,8,3);
    g.fillStyle = '#2d7a40'; g.fillRect(4,2,4,2); g.fillRect(9,4,4,2);
    dots(g, '#164823', [[3,8],[7,7],[12,8],[6,4],[10,6]]);
  }},
  { name: 'path', paint(g) {
    fillAll(g, '#c9b27c');
    dots(g, '#b59d68', [[3,2],[8,5],[13,3],[5,9],[11,12],[2,13],[14,9],[7,14]]);
    dots(g, '#d8c48f', [[6,3],[12,7],[4,12],[10,1]]);
  }},
  { name: 'water', paint: paintWater },
  { name: 'lotus', paint(g) {
    paintWater(g);
    g.fillStyle = '#3f8f4f'; g.fillRect(3,8,9,4); g.fillRect(5,7,5,1);
    g.fillStyle = '#2d7a40'; g.fillRect(7,9,2,2);
    g.fillStyle = '#e88fb0'; g.fillRect(9,3,4,3); g.fillRect(10,2,2,1);
    dots(g, '#ffffff', [[10,3],[11,4]]);
  }},
  { name: 'dock', paint(g) {
    paintWater(g);
    g.fillStyle = '#9a7548'; g.fillRect(0,2,16,5); g.fillRect(0,9,16,5);
    g.fillStyle = '#7d5c36'; g.fillRect(0,6,16,1); g.fillRect(0,13,16,1);
    dots(g, '#7d5c36', [[4,4],[12,4],[4,11],[12,11]]);
  }},
  { name: 'boat', paint(g) {
    paintWater(g);
    g.fillStyle = '#7a5230'; g.fillRect(2,7,12,4); g.fillRect(4,11,8,2);
    g.fillStyle = '#94693f'; g.fillRect(3,7,10,1);
    g.fillStyle = '#5c3d22'; g.fillRect(7,4,2,3);
  }},
  { name: 'spring', paint(g) {
    fillAll(g, '#5fb6d4');
    g.fillStyle = '#8fd8ee'; g.fillRect(3,3,5,1); g.fillRect(9,8,5,1); g.fillRect(2,12,5,1);
    dots(g, '#ffffff', [[5,5],[12,3],[9,12],[14,10],[2,8]]);
  }},
  { name: 'floor', paint: paintFloor },
  { name: 'wall', paint(g) {
    fillAll(g, '#5a4634');
    g.fillStyle = '#46362a'; g.fillRect(0,5,16,1); g.fillRect(0,11,16,1);
    g.fillRect(5,0,1,5); g.fillRect(11,6,1,5); g.fillRect(3,12,1,4);
    g.fillStyle = '#6b5440'; g.fillRect(0,0,16,1);
  }},
  { name: 'roof', paint(g) {
    fillAll(g, '#5a6b8c');
    g.fillStyle = '#46546e'; g.fillRect(0,4,16,1); g.fillRect(0,9,16,1); g.fillRect(0,14,16,1);
    g.fillStyle = '#6e80a3'; g.fillRect(0,0,16,1);
    dots(g, '#46546e', [[4,2],[10,6],[6,11],[13,1]]);
  }},
  { name: 'door', paint(g) {
    fillAll(g, '#5a4634');
    g.fillStyle = '#241a12'; g.fillRect(3,3,10,13);
    g.fillStyle = '#3a2a1c'; g.fillRect(3,3,10,1);
    dots(g, '#c9a227', [[11,9]]);
  }},
  { name: 'counter', paint(g) {
    paintFloor(g);
    g.fillStyle = '#c89858'; g.fillRect(0,3,16,7);
    g.fillStyle = '#a87838'; g.fillRect(0,10,16,4);
    g.fillStyle = '#dfb070'; g.fillRect(0,3,16,1);
  }},
  { name: 'table', paint(g) {
    paintFloor(g);
    g.fillStyle = '#c89858'; g.fillRect(2,4,12,7);
    g.fillStyle = '#dfb070'; g.fillRect(2,4,12,1);
    g.fillStyle = '#8a6038'; g.fillRect(3,11,2,4); g.fillRect(11,11,2,4);
  }},
  { name: 'bed', paint(g) {
    paintFloor(g);
    g.fillStyle = '#8a6038'; g.fillRect(1,1,14,14);
    g.fillStyle = '#b03040'; g.fillRect(2,5,12,9);
    g.fillStyle = '#cf4a5a'; g.fillRect(2,5,12,2);
    g.fillStyle = '#eeeae0'; g.fillRect(3,2,6,3);
  }},
  { name: 'well', paint(g) {
    paintGrass(g);
    g.fillStyle = '#8c8c94'; g.fillRect(2,4,12,10);
    g.fillStyle = '#6f6f78'; g.fillRect(2,4,12,2);
    g.fillStyle = '#1c2c4a'; g.fillRect(5,7,6,5);
  }},
  { name: 'dark_floor', paint(g) {
    fillAll(g, '#5a4a3a');
    g.fillStyle = '#4a3a2a';
    g.fillRect(0,3,16,1); g.fillRect(0,7,16,1); g.fillRect(0,11,16,1); g.fillRect(0,15,16,1);
    dots(g, '#4a3a2a', [[5,1],[12,5],[3,9],[10,13]]);
  }},
  { name: 'dark_wall', paint(g) {
    fillAll(g, '#3a2a1a');
    g.fillStyle = '#2a1a0a'; g.fillRect(0,5,16,1); g.fillRect(0,11,16,1);
    g.fillRect(5,0,1,5); g.fillRect(11,6,1,5); g.fillRect(3,12,1,4);
    g.fillStyle = '#4a3a2a'; g.fillRect(0,0,16,1);
  }},
  { name: 'mountain_rock', paint(g) {
    fillAll(g, '#6a6a72');
    g.fillStyle = '#5a5a62'; g.fillRect(0,4,16,1); g.fillRect(0,9,16,1);
    dots(g, '#7a7a82', [[3,2],[8,6],[13,1],[5,11],[10,13]]);
    dots(g, '#4a4a52', [[7,3],[14,7],[2,8],[11,12]]);
  }},
  { name: 'mountain_path', paint(g) {
    fillAll(g, '#9a8a6a');
    dots(g, '#8a7a5a', [[3,2],[8,5],[13,3],[5,9],[11,12]]);
    dots(g, '#aa9a7a', [[6,3],[12,7],[4,12]]);
  }},
  { name: 'tent', paint(g) {
    fillAll(g, '#3a5a3a');
    g.fillStyle = '#5a3a2a'; g.fillRect(1,4,14,11);
    g.fillStyle = '#7a5a3a'; g.fillRect(2,2,12,3); g.fillRect(4,1,8,2);
    g.fillStyle = '#2a1a0a'; g.fillRect(6,8,4,7);
  }},
  { name: 'campfire', paint(g) {
    fillAll(g, '#3a5a3a');
    g.fillStyle = '#6b4226'; g.fillRect(4,10,8,3);
    g.fillStyle = '#e85020'; g.fillRect(5,6,6,4); g.fillRect(7,3,2,3);
    g.fillStyle = '#ffa830'; g.fillRect(6,5,4,2); g.fillRect(8,4,1,2);
  }},
  { name: 'dark_grass', paint(g) {
    fillAll(g, '#2a5a32');
    dots(g, '#1e4a28', [[2,3],[6,1],[11,4],[14,7],[4,9],[9,11],[13,13]]);
    dots(g, '#3a6a3e', [[5,4],[10,2],[3,14],[15,11]]);
  }},
];

/** 图块名 → 索引 */
export const TILE_INDEX: Record<string, number> = {};
TILE_DEFS.forEach((t, i) => { TILE_INDEX[t.name] = i; });

/** 实体碰撞表 */
export const SOLID_TILES = new Set([
  'wall', 'counter', 'table', 'bed', 'tree', 'well', 'roof', 'water', 'lotus', 'boat', 'spring',
  'dark_wall', 'tent', 'mountain_rock', 'campfire',
]);
