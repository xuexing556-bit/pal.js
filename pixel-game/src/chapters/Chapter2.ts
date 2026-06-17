/**
 * Chapter2 — 第二章「黑苗来袭」
 *
 * 流程：夜半异响 → 暗夜调查 → 镇中斗黑苗 → 追踪山路 →
 *       营地激战护法 → 救出灵儿 → 第一次离开余杭
 */
import type { Chapter, GameState, MapDef, NpcDef } from '../types';
import type { EnemyConfig } from '../types/battle';
import { ENEMIES } from '../data/enemies';
import type { ExploreScene } from '../scenes/ExploreScene';

export class Chapter2 implements Chapter {
  readonly id = 2;
  readonly title = '第二章 · 黑苗来袭';

  private maps: Record<string, MapDef> = {};

  init(state: GameState): void {
    // 保留第一章的部分属性，恢复体力
    state.hero.hp = state.hero.maxhp;
    state.hero.mp = state.hero.maxmp;
    state.flags = {
      nightHeard: false,
      nightSaw: false,
      warriorDead: false,
      campReached: false,
      bossDead: false,
      lingerRescued: false,
      done: false,
      _introShown: false,
    };
    state.currentChapter = 2;

    // 夜间客栈 — 复用客栈基础布局，替换为暗色图块
    const innGrid = [
      'wwwwwwwwwwwwwwwwwwww',
      'wdd............dd..w',
      'w.BBBB.............w',
      'wddd...............w',
      'w..................w',
      'w...tt.....tt......w',
      'wddd...............w',
      'wddd...............w',
      'w...tt.....tt......w',
      'w..................w',
      'w..................w',
      'w..................w',
      'w..................w',
      'w..................w',
      'wwwwwwwwwDDwwwwwwwww',
    ];

    // 夜间小镇 — 复用小镇布局，草地替换为暗草地，顶部开一条通往山路的小径
    const townGrid = [
      'TTTTTTTTTTPTTTTTTTTT',
      'TaaaRRRRRaaaaRRRRaaT',
      'TaaaWWDWaaaaaWWWWaaT',
      'TaaaaaPaaaaaaaaaaaaT',
      'TaaaaaPaaaaOaaaaaaaT',
      'TaaaaaPPPPPPPPPaaaaT',
      'TaaaaaaaaaaaaaPaaaaT',
      'PPPPPPPPPPPPPPPaaaaT',
      'TaaaaaaaaaaaaaPaaaaT',
      'TaaFFaaaaaaaaaPaaaaT',
      'TaaFFaaaaaRRRRRaaaaT',
      'TaaaaaaaaaWWWWWaaaaT',
      'TaaaaaaaaaaaaaaaaaaT',
      'TaaaaaaaaaaaaaaaaaaT',
      'TTTTTTTTTTTTTTTTTTTT',
    ];

    // 山路 — 蜿蜒的碎石小道穿越山林
    const mountainGrid = [
      'rrrrrrrrrrrrrrrrrrrr',
      'rmmmmmmmmmmmmmmmmmmr',
      'rmmmmmmmTmmmmmmTmmmr',
      'rrrTmmmmmmmmTmmmmmmr',
      'rmmmmmmmmmmmmmmmmTmr',
      'rmmTmmmmmmmmmmmTmmmr',
      'rmmmmmmmmTmmmmmmmmmr',
      'rmTmmmmmmmmmmTmmmmmr',
      'rmmmmmmmTmmmmmmmmmTr',
      'rmmTmmmmmmmmmmmmmmmr',
      'rmmmmmmmmTmmmTmmmmmr',
      'rmTmmmmmmmmmmmmmmTmr',
      'rmmmmmmTmmmmmmmmmmmr',
      'rmmmmmmmmmmmmmmmmmmr',
      'rrrrrrrrrmmrrrrrrrrr',
    ];

    // 黑苗营地 — 帐篷围绕篝火
    const campGrid = [
      'aaaaaaaaaaaaaaaaaaaa',
      'aaaEEEEaaaaaEEEEaaaa',
      'aaaEEEEaaaaaEEEEaaaa',
      'aaaaaaaaaaaaaaaaaaaa',
      'aaaaaaaaaaaaaaaaaaaa',
      'aaaaaaaaaaaaaaaaaaaa',
      'aaaaaEEEEaaaaaEEEEaa',
      'aaaaaaaaaffaaaaaaaaa',
      'aaaaaaaaaffaaaaaaaaa',
      'aaaaaEEEEaaaaaEEEEaa',
      'aaaaaaaaaaaaaaaaaaaa',
      'aaaaaaaaaaaaaaaaaaaa',
      'aaaaaaaaaaaaaaaaaaaa',
      'aaaaaaaaaaaaaaaaaaaa',
      'aaaaaaaaaaaaaaaaaaaa',
    ];

    this.maps = {
      inn_night: {
        name: '客栈 · 深夜',
        grid: innGrid,
        exits: [
          { x: 9, y: 14, to: 'town_night', tx: 6, ty: 3 },
          { x: 10, y: 14, to: 'town_night', tx: 6, ty: 3 },
        ],
      },
      town_night: {
        name: '余杭镇 · 深夜',
        grid: townGrid,
        exits: [
          { x: 6, y: 2, to: 'inn_night', tx: 9, ty: 13 },
          { x: 10, y: 0, to: 'mountain_path', tx: 9, ty: 14 },
        ],
      },
      mountain_path: {
        name: '后山 · 林间小路',
        grid: mountainGrid,
        exits: [
          { x: 9, y: 14, to: 'town_night', tx: 10, ty: 1 },
          { x: 9, y: 0, to: 'black_miao_camp', tx: 9, ty: 13 },
        ],
      },
      black_miao_camp: {
        name: '黑苗营地',
        grid: campGrid,
        exits: [
          { x: 9, y: 13, to: 'mountain_path', tx: 9, ty: 1 },
        ],
      },
    };
  }

  getMaps(): Record<string, MapDef> {
    return this.maps;
  }

  setupNpcs(state: GameState, mapId: string): NpcDef[] {
    const f = state.flags;
    const npcs: NpcDef[] = [];

    if (mapId === 'town_night' && !f.warriorDead) {
      npcs.push({ id: 'miao_warrior', spriteKey: 'black_miao_warrior', x: 10, y: 7 });
    }

    if (mapId === 'black_miao_camp' && !f.bossDead) {
      npcs.push({ id: 'miao_leader', spriteKey: 'black_miao_leader', x: 10, y: 6 });
    }

    if (mapId === 'black_miao_camp' && f.bossDead && !f.lingerRescued) {
      npcs.push({ id: 'linger', spriteKey: 'linger', x: 9, y: 4 });
    }

    return npcs;
  }

  onStep(scene: any, state: GameState, mapId: string, tx: number, ty: number): boolean {
    const f = state.flags;

    // 营地 boss 触发 — 接近篝火区域
    if (mapId === 'black_miao_camp' && tx >= 8 && tx <= 11 && ty === 7 && !f.bossDead) {
      const explore = scene as ExploreScene;
      explore.dialogManager.say([
        '营地中央篝火熊熊，映得四周忽明忽暗。',
        '一个身披黑袍的高大身影从最大的帐篷中走了出来，手中握着一根乌黑的铁杖。',
        { n: '黑苗护法', t: '哈哈哈，果然来了。本座等你很久了。' },
        { n: '李逍遥', t: '把灵儿交出来！' },
        { n: '黑苗护法', t: '灵儿？你说那个女娲后裔？她对我们黑苗教有大用处，岂能说放就放。' },
        { n: '李逍遥', t: '少废话！' },
      ], () => {
        const enemy: EnemyConfig = { ...ENEMIES.miao_leader };
        scene.scene.launch('BattleScene', {
          enemy,
          onWin: () => {
            f.bossDead = true;
            const explore2 = scene as ExploreScene;
            explore2.dialogManager.say([
              '黑苗护法闷哼一声，踉跄后退，铁杖脱手飞出。',
              { n: '黑苗护法', t: '你……你竟有这般本事……哼，黑苗教不会放过你的……' },
              '护法化作一团黑烟遁去，余下的教徒四散奔逃。',
              { n: '李逍遥', t: '灵儿！灵儿你在哪里！' },
            ], () => {
              // 刷新 NPC：移除 boss，出现灵儿
              const newNpcs = this.setupNpcs(state, 'black_miao_camp');
              (explore2 as any).npcs = newNpcs;
            });
          },
        });
        scene.scene.pause();
      });
      explore.player.py += 4;
      return true;
    }

    return false;
  }

  interact(scene: any, state: GameState, id: string): void {
    const f = state.flags;
    const explore = scene as ExploreScene;
    const D = explore.dialogManager;

    switch (id) {
      case 'miao_warrior':
        if (!f.warriorDead) {
          D.say([
            '镇上的广场上，几个黑衣人正低声交谈。为首的一个猛然回头，与李逍遥四目相对——',
            { n: '黑苗武士', t: '什么人？！' },
            { n: '李逍遥', t: '你们是谁？深更半夜在我余杭镇做什么！' },
            { n: '黑苗武士', t: '哼……多管闲事。既然撞上了，就别想活着离开！' },
          ], () => {
            this.startWarriorBattle(scene, state);
          });
        }
        break;

      case 'miao_leader':
        if (!f.bossDead) {
          D.say([
            { n: '黑苗护法', t: '不知死活的小子，竟敢闯我黑苗营地。' },
            { n: '李逍遥', t: '把灵儿放了，否则别怪我不客气！' },
          ]);
        }
        break;

      case 'linger':
        if (!f.lingerRescued) {
          this.rescueLinger(scene, state);
        } else {
          D.say([
            { n: '赵灵儿', t: '李大哥……我们快离开这里吧。' },
          ]);
        }
        break;

      case 'bed_inn_night':
        if (!f.nightHeard) {
          D.say([
            '李逍遥躺在床上，翻来覆去睡不着。脑海里全是灵儿的影子，偏偏又记不真切。',
            { n: '李逍遥', t: '那个白衣女孩……到底是谁？为什么我一想起来，心里就空落落的……' },
          ]);
        } else {
          D.say([
            { n: '李逍遥', t: '不行，得出去看看！' },
          ]);
        }
        break;

      case 'campfire':
        if (!f.bossDead) {
          D.say(['篝火噼啪作响，火焰映得帐篷忽明忽暗。']);
        } else {
          D.say(['篝火已经快熄了，只剩下暗红的炭火。']);
        }
        break;
    }
  }

  getHint(state: GameState): string {
    const f = state.flags;
    if (f.done) return '';
    if (f.lingerRescued) return '从营地南边离开，准备出发远行';
    if (f.bossDead) return '去救灵儿';
    if (f.warriorDead) return '从镇北进入后山，追踪黑苗人';
    if (f.nightSaw) return '追上镇子里的黑衣人';
    if (f.nightHeard) return '出门去镇上看看';
    return '调查床铺';
  }

  getMusic(mapId: string): string {
    switch (mapId) {
      case 'inn_night': return 'night_tension';
      case 'town_night': return 'night_tension';
      case 'mountain_path': return 'mountain_adventure';
      case 'black_miao_camp': return 'battle';
      default: return 'night_tension';
    }
  }

  // ---------- 开场 ----------

  intro(scene: any): void {
    const explore = scene as ExploreScene;
    explore.dialogManager.say([
      '婶婶病愈之后，客栈又恢复了往日的热闹。',
      '只是李逍遥心里总觉得空落落的，好像忘了一件天大的事。',
      '这一夜，月黑风高，客栈里早早打了烊。李逍遥躺在阁楼的床上，辗转难眠……',
      { n: '婶婶', t: '逍遥，早些歇息吧。你今天跑了一天了。' },
      { n: '李逍遥', t: '嗯，这就睡。' },
      '夜深了。万籁俱寂。',
      '忽然，一阵细碎的响动从屋顶传来——',
      { n: '李逍遥', t: '……嗯？什么声音？' },
    ], () => {
      this.onNightHeard(scene);
    });
  }

  // ---------- 内部方法 ----------

  private onNightHeard(scene: any): void {
    const explore = scene as ExploreScene;
    const state = explore['state'] as GameState;
    state.flags.nightHeard = true;
    explore.dialogManager.say([
      '李逍遥一骨碌翻身下床，抓起枕边的剑。',
      { n: '李逍遥', t: '有贼？……不对，这脚步声不像普通人。' },
      '他轻手轻脚地推开房门，借着月色望去——几道黑影正沿着屋顶飞速掠过，方向是镇子后山。',
      { n: '李逍遥', t: '这些人……好快的身法！不像寻常盗贼。' },
      '黑影中似乎有人背着一个大包袱，隐约传出呜咽声。',
      { n: '李逍遥', t: '有人在挣扎……难道他们抓了谁？不行，得追上去看看！' },
    ], () => {
      state.flags.nightSaw = true;
      explore.scene.restart({ mapId: 'town_night', tx: 9, ty: 13, dir: 'up' });
    });
  }

  private startWarriorBattle(scene: any, state: GameState): void {
    const explore = scene as ExploreScene;
    const enemy: EnemyConfig = { ...ENEMIES.miao_warrior };
    scene.scene.launch('BattleScene', {
      enemy,
      onWin: () => {
        state.flags.warriorDead = true;
        explore.dialogManager.say([
          '李逍遥收剑入鞘。黑衣人倒地不起，同伴早已逃远。',
          { n: '李逍遥', t: '这帮人……穿得不像中原人。看这打扮，莫非是西南黑苗教的人？' },
          '他蹲下检查，发现黑衣人腰间挂着一枚令牌，上面刻着一个「苗」字。',
          { n: '李逍遥', t: '果然是黑苗教。他们抓走了谁？得赶紧追上去！' },
          '远处后山方向，隐约传来呼救声……',
        ], () => {
          // 刷新 NPC（清空镇上的武士）
          const newNpcs = this.setupNpcs(state, 'town_night');
          (explore as any).npcs = newNpcs;
        });
      },
    });
    scene.scene.pause();
    explore.player.py += 4;
  }

  private rescueLinger(scene: any, state: GameState): void {
    const f = state.flags;
    const explore = scene as ExploreScene;
    const D = explore.dialogManager;
    D.say([
      '帐篷里，一个白衣少女被绳索绑在柱子上，嘴里塞着布条。李逍遥冲上前去，三下两下解开了绳索。',
      '少女抬起头，泪眼朦胧地看清了面前的人——',
      { n: '赵灵儿', t: '李……李大哥？是你吗？你真的来了？' },
      { n: '李逍遥', t: '我……我记不太清很多事了，但心里有个声音一直在说，一定要来救你。' },
      { n: '赵灵儿', t: '（泪如雨下）是灵儿不好……是灵儿连累了你……' },
      { n: '李逍遥', t: '别哭别哭。那个黑衣头子说的「女娲后裔」是什么意思？' },
      { n: '赵灵儿', t: '李大哥，这些事说来话长。等我们安全了，灵儿慢慢告诉你。' },
      { n: '李逍遥', t: '好。先离开这里。' },
    ], () => {
      f.lingerRescued = true;
      D.say([
        '两人趁夜色离开了营地。山路崎岖，李逍遥一路护着灵儿，走走停停。',
        { n: '赵灵儿', t: '李大哥……你真的什么都不记得了吗？' },
        { n: '李逍遥', t: '我只记得梦里好像有个白衣姑娘，在莲花池边对我笑。其余的……都是模模糊糊的。' },
        { n: '赵灵儿', t: '没关系。只要李大哥还愿意相信灵儿，一切都会想起来的。' },
        '东方渐渐泛白，晨光穿过山林洒在两人身上。',
        { n: '李逍遥', t: '天亮了。灵儿，接下来我们去哪里？' },
        { n: '赵灵儿', t: '黑苗教不会善罢甘休的。我们先回余杭镇收拾行装，然后一起上路吧。' },
        { n: '李逍遥', t: '好。不管前面是什么，这次我不会再把你弄丢了。' },
        { n: '赵灵儿', t: '（轻轻握住李逍遥的手）嗯。' },
      ], () => {
        f.done = true;
        explore.scene.start('EndingScene');
      });
    });
  }
}
