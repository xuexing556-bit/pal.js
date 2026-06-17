# pal-pixel-repo 开发规范

> 仙剑奇侠传像素版 — Phaser 3 + Vite + TypeScript 游戏项目。
> 本文件定义编码规范、架构约定和常见陷阱，所有 AI 辅助编码必须遵守。

## 项目结构

```
pal-pixel-repo/
├── pixel-game/              # 主项目（Phaser 3 游戏）
│   ├── src/
│   │   ├── main.ts          # Phaser.Game 入口，场景注册
│   │   ├── config.ts        # 屏幕尺寸、字体、速度等常量
│   │   ├── types/           # TypeScript 类型定义
│   │   ├── core/            # 核心模块：InputManager, ChiptuneEngine, DialogManager, BattleMath
│   │   ├── scenes/          # 7 个场景：Boot → Title → Explore → Battle → Wedding → Ending → Debug
│   │   ├── chapters/        # 章节系统：Chapter1, Chapter2（实现 Chapter 接口）
│   │   ├── data/            # 静态数据：tiles, sprites, maps, songs, enemies
│   │   └── __tests__/       # Vitest 单元测试
│   ├── vite.config.ts       # base: '/pal.js/'（GitHub Pages 路径前缀）
│   └── tsconfig.json        # strict 模式，ES2020 target
├── .github/workflows/deploy.yml  # GitHub Pages 自动部署
└── AGENTS.md                # 本文件
```

## 构建与测试命令

```bash
cd pixel-game

# 类型检查（必须零错误）
npx tsc --noEmit

# 单元测试（Vitest）
npx vitest run

# 本地开发
npx vite --port 5173

# 生产构建
npx vite build
```

所有代码变更提交前必须通过 `tsc --noEmit` 和 `vitest run`。

## 核心编码规范

### 规则 1：禁止在 render() 中创建显示对象

**这是本项目最重要的规则。违反会导致 GPU 显存泄漏 → WebGL 上下文丢失 → 黑屏。**

```typescript
// ❌ 致命错误：每帧创建 Text/Image，永远不销毁
render(): void {
  this.add.text(x, y, 'text', opts);   // 60FPS = 每秒泄漏 60 个 Text
  this.add.image(x, y, key);            // 同上
  const g = this.add.graphics();
  g.drawRect(...);
  g.destroy();  // 只销毁了 Graphics，Text/Image 仍在显示列表中
}

// ✅ 正确：create() 创建一次，update() 更新属性
create(): void {
  this.gfx = this.add.graphics();
  this.label = this.add.text(x, y, '', opts);
  this.sprite = this.add.image(x, y, key);
}

update(): void {
  this.gfx.clear();
  this.gfx.fillStyle(0x000000, 1);
  this.gfx.fillRect(0, 0, W, H);

  this.label.setText('new text');
  this.sprite.setPosition(newX, newY);
  this.sprite.setVisible(condition);
}
```

### 规则 2：大量动态对象使用对象池

当场景需要每帧渲染可变数量的对象（如地图图块、NPC、菜单项）时，使用预分配的对象池：

```typescript
create(): void {
  this.tilePool: Phaser.GameObjects.Image[] = [];
  for (let i = 0; i < MAX_TILES; i++) {
    this.tilePool.push(
      this.add.image(0, 0, '_placeholder').setVisible(false)
    );
  }
}

update(): void {
  // 先隐藏所有
  for (let i = 0; i < MAX_TILES; i++) this.tilePool[i].setVisible(false);
  // 按需激活
  for (let i = 0; i < visibleTiles; i++) {
    this.tilePool[i].setTexture(tileName);
    this.tilePool[i].setPosition(x, y);
    this.tilePool[i].setVisible(true);
  }
}
```

DebugScene 使用 Text 池（`this.textPool`），每帧重置 `poolIdx = 0` 后复用。

### 规则 3：Graphics 对象 clear() 而非销毁重建

```typescript
// ❌ 每帧创建+销毁 Graphics
render() {
  const g = this.add.graphics();
  g.fillRect(...);
  g.destroy();
}

// ✅ create() 创建一次，update() 中 clear + 重画
create() { this.gfx = this.add.graphics(); }
update() {
  this.gfx.clear();
  this.gfx.fillStyle(color, 1);
  this.gfx.fillRect(...);
}
```

### 规则 4：InputManager 按键注册

`InputManager` 使用数组存储每个动作的所有按键映射。新增按键只需在 `KEYMAP` 中添加：

```typescript
const KEYMAP: Record<string, string> = {
  Enter: 'confirm', KeyZ: 'confirm', Space: 'confirm',  // 三个键都映射到 confirm
  // ...
};
```

不要在场景代码中绕过 InputManager 直接调用 `scene.input.keyboard.addKey()`，否则会导致按键状态不同步。唯一例外：`DebugScene` 中的 `F` 键和 `TitleScene` 中的 `L` 键（场景级快捷键）。

## 架构约定

### 章节系统

- `Chapter` 接口定义在 `types/index.ts`，包含 `init()`, `getMaps()`, `setupNpcs()`, `interact()`, `onStep()`, `getHint()`, `getMusic()` 和可选的 `intro()`
- `ExploreScene` 从 `this.registry.get('chapter')` 获取章节实例，支持跨场景持久化
- 章节切换发生在 `EndingScene`：初始化新章节 → 写入 registry → 启动 ExploreScene
- 新增章节：实现 `Chapter` 接口 → 在 `EndingScene` 中添加过渡逻辑 → 在 `DebugScene.DEBUG_MAPS` 中添加调试入口

### 场景流程

```
BootScene（纹理生成）→ TitleScene（标题画面）→ ExploreScene（主游戏）
                                                ↕ BattleScene（战斗，并行覆盖）
                                                → WeddingScene（成亲）
                                                → EndingScene（章节结尾）→ ExploreScene（下一章）
TitleScene → DebugScene（按 L 键，调试用）
```

### 纹理生成

所有精灵和图块纹理在 `BootScene.create()` 中通过 `HTMLCanvasElement` + `textures.addCanvas()` 程序化生成，不依赖外部图片文件。新增纹理：
- 图块：在 `data/tiles.ts` 的 `TILE_DEFS` 中添加 painter 函数
- 精灵：在 `data/sprites.ts` 的 `SPRITE_DEFS` 中添加 rows + legend

### Phaser 渲染配置

```typescript
render: {
  antialias: false,
  pixelArt: true,
  preserveDrawingBuffer: true,  // 必须：支持 CDP 截图和 toDataURL()
}
```

## 部署

- GitHub Pages 部署通过 `.github/workflows/deploy.yml` 自动触发
- `vite.config.ts` 的 `base` 必须为 `'/pal.js/'`
- push 到 `master` 分支后，GitHub Actions 自动构建并部署
- 线上地址：https://xuexing556-bit.github.io/pal.js/
- 详细部署和 CDP 验收流程见 Skill：`phaser-github-pages-deploy`

## 常见陷阱

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 黑屏 | render() 中创建显示对象不销毁 | 遵守规则 1-3 |
| CDP 截图全黑 | WebGL 默认 `preserveDrawingBuffer: false` | render config 中设为 true |
| 按键 Z/Space 无响应 | InputManager 只注册了第一个键 | 已修复，使用数组存储 |
| 纹理键冲突 | 使用 Phaser 内置名如 `__WHITE` | 用自定义前缀如 `_tile_pool` |
| 构建后资源 404 | `base` 路径不含仓库名前缀 | `base: '/pal.js/'` |
| git push 认证失败 | gh auth credential helper 不生效 | token-in-URL 方式，push 后清除 |
| 章节切换后状态丢失 | 新章节未写入 registry | EndingScene 中 `registry.set('chapter', newCh)` |
