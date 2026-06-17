/**
 * 像素美术生成器 — 从字符画地图生成 Phaser 纹理
 */

/** 从字符画数组 + 颜色图例生成离屏 Canvas */
export function pixelArt(
  rows: string[],
  legend: Record<string, string>,
): HTMLCanvasElement {
  const w = rows[0].length;
  const h = rows.length;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (ch === '.' || ch === ' ') continue;
      const col = legend[ch];
      if (!col) continue;
      g.fillStyle = col;
      g.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

/** 用绘制函数生成 16x16 图块 Canvas */
export function makeTile(painter: (g: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 16;
  painter(c.getContext('2d')!);
  return c;
}

/** 填充整个 16x16 图块 */
export function fillAll(g: CanvasRenderingContext2D, color: string): void {
  g.fillStyle = color;
  g.fillRect(0, 0, 16, 16);
}

/** 在指定坐标画 1x1 像素点 */
export function dots(g: CanvasRenderingContext2D, color: string, pts: number[][]): void {
  g.fillStyle = color;
  for (const p of pts) {
    g.fillRect(p[0], p[1], 1, 1);
  }
}
