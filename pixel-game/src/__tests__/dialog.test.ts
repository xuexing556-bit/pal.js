/**
 * 对话系统测试 — wrapText 纯函数
 */
import { describe, it, expect } from 'vitest';
import { wrapText } from '../core/DialogManager';

describe('wrapText', () => {
  it('短文本不分行', () => {
    const result = wrapText('你好世界', 28);
    expect(result).toEqual(['你好世界']);
  });

  it('空字符串返回 [""]', () => {
    const result = wrapText('', 28);
    expect(result).toEqual(['']);
  });

  it('超过 maxChars 正确分行', () => {
    const text = '这是一段很长的测试文本用来验证自动换行功能是否正确工作';
    const result = wrapText(text, 10);
    expect(result.length).toBeGreaterThan(1);
    // 每行不超过 maxChars
    for (const line of result) {
      expect(line.length).toBeLessThanOrEqual(10);
    }
    // 所有行拼起来等于原文
    expect(result.join('')).toBe(text);
  });

  it('恰好等于 maxChars 时只有一行', () => {
    const text = '1234567890';
    const result = wrapText(text, 10);
    expect(result).toEqual(['1234567890']);
  });

  it('分页逻辑：每页 2 行', () => {
    const text = '一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十';
    const lines = wrapText(text, 10);
    // 30 字 / 10 = 3 行
    expect(lines.length).toBe(3);
    // 分页：page1 = lines[0..1], page2 = lines[2]
    const pages: string[][] = [];
    for (let i = 0; i < lines.length; i += 2) {
      pages.push(lines.slice(i, i + 2));
    }
    expect(pages.length).toBe(2);
    expect(pages[0].length).toBe(2);
    expect(pages[1].length).toBe(1);
  });
});
