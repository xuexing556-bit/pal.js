/**
 * Chapter1 — 第一章剧情脚本（对白为本项目原创撰写）
 *
 * 流程：客栈帮工 → 酒剑仙传剑 → 婶婶病倒 → 湖畔行舟 →
 *       仙灵岛斗蛇妖 → 初遇灵儿 → 姥姥逼婚 → 拜堂得药 →
 *       离岛忘情 → 返乡救人 → 第一章 完
 */
import type { Chapter, GameState, MapDef, NpcDef } from '../types';
import type { EnemyConfig } from '../types/battle';
import { MAPS } from '../data/maps';
import { ENEMIES } from '../data/enemies';
import type { ExploreScene } from '../scenes/ExploreScene';

export class Chapter1 implements Chapter {
  readonly id = 1;
  readonly title = '第一章';

  private maps: Record<string, MapDef> = {};

  init(state: GameState): void {
    state.hero = { hp: 60, maxhp: 60, mp: 24, maxmp: 24, potions: 3 };
    state.flags = {
      learnedSkill: false,
      auntSick: false,
      snakeDead: false,
      married: false,
      hasMedicine: false,
      memoryLost: false,
      done: false,
      _introShown: false,
    };
    state.currentChapter = 1;
    this.maps = { ...MAPS };
  }

  getMaps(): Record<string, MapDef> {
    return this.maps;
  }

  setupNpcs(state: GameState, mapId: string): NpcDef[] {
    const f = state.flags;
    const npcs: NpcDef[] = [];
    if (mapId === 'inn') {
      if (!f.auntSick) {
        npcs.push({ id: 'aunt', spriteKey: 'aunt', x: 3, y: 3 });
        if (!f.learnedSkill) {
          npcs.push({ id: 'oldman', spriteKey: 'oldman', x: 11, y: 6 });
        }
      } else {
        npcs.push({ id: 'aunt', spriteKey: 'aunt', x: 14, y: 2 });
        npcs.push({ id: 'doctor', spriteKey: 'doctor', x: 12, y: 3 });
      }
    } else if (mapId === 'town') {
      npcs.push({ id: 'villager_m', spriteKey: 'villager_m', x: 9, y: 5 });
      npcs.push({ id: 'villager_f', spriteKey: 'villager_f', x: 4, y: 9 });
    } else if (mapId === 'island') {
      npcs.push({ id: 'linger', spriteKey: 'linger', x: 9, y: 3 });
    }
    return npcs;
  }

  onStep(scene: any, state: GameState, mapId: string, tx: number, ty: number): boolean {
    const f = state.flags;
    if (mapId === 'island' && tx === 9 && ty === 8 && !f.snakeDead) {
      const explore = scene as ExploreScene;
      explore.dialogManager.say([
        '前方草丛猛地一阵晃动——',
        '一条碗口粗的大蛇昂起头，吐着信子拦住了去路！',
      ], () => {
        const enemy: EnemyConfig = { ...ENEMIES.snake };
        scene.scene.launch('BattleScene', {
          enemy,
          onWin: () => {
            f.snakeDead = true;
            explore.dialogManager.say([
              '李逍遥收剑入鞘，长出了一口气。',
              '李逍遥：「老先生教的剑诀，还真管用！」',
            ]);
          },
        });
        scene.scene.pause();
      });
      // 把人往回挪半格，避免反复触发
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
      case 'aunt':
        if (!f.learnedSkill) {
          D.say([
            { n: '婶婶', t: '逍遥，又在发呆啦？那位老先生坐了半天了，快去问问他还要点什么。' },
            { n: '李逍遥', t: '知道啦知道啦，这就去。' },
          ]);
        } else if (!f.auntSick) {
          D.say([
            { n: '李逍遥', t: '婶婶，那位老先生不见了！酒钱也没……婶婶？' },
            { n: '婶婶', t: '哎哟……我这头怎么突然晕得厉害……逍遥，我眼前发黑……' },
            { n: '李逍遥', t: '婶婶！婶婶你怎么了！' },
            '婶婶身子一软倒了下去。李逍遥手忙脚乱地把她扶回了里屋的床上，又跑去请来了镇上的郎中……',
          ], () => {
            f.auntSick = true;
            // 刷新 NPC
            const newNpcs = this.setupNpcs(state, explore['mapId']);
            (explore as any).npcs = newNpcs;
          });
        } else if (f.hasMedicine) {
          D.say([
            { n: '李逍遥', t: '婶婶，快，把这株仙草吃下去！' },
            '李逍遥把灵芝仙草煎成药汤，一勺一勺喂婶婶服下。不过半炷香的工夫，婶婶的脸色竟渐渐红润起来——',
            { n: '婶婶', t: '咦……我这身子，怎么一下子轻快了？逍遥，你从哪儿求来的仙药？' },
            { n: '李逍遥', t: '我……我也记不清了。好像出了一趟远门，又好像做了一场梦……' },
            { n: '婶婶', t: '傻孩子，说什么胡话呢。总之是菩萨保佑，好了就好。' },
          ], () => {
            this.finale(scene, state);
          });
        } else {
          D.say([
            '婶婶昏睡着，眉头紧锁，呼吸微弱。',
            { n: '李逍遥', t: '婶婶，你撑住，我一定把药带回来！' },
          ]);
        }
        break;

      case 'oldman':
        if (!f.learnedSkill) {
          D.say([
            { n: '李逍遥', t: '老先生，您的酒来了。还要添点什么菜吗？' },
            { n: '老者', t: '好酒！小兄弟，你筋骨不错，眼神也亮，倒是块练剑的料子。' },
            { n: '李逍遥', t: '嘿嘿，不瞒您说，我天天梦着仗剑江湖呢。可惜没人肯教我。' },
            { n: '老者', t: '哦？那今日便是有缘。老夫这套剑诀传你，日后自有用处。' },
            '老者随手折了根筷子，在桌边比划起来。说也奇怪，那些招式李逍遥一看便懂，一学便会……',
            '李逍遥习得「仙风剑诀」！',
            { n: '老者', t: '记住，剑是凶器，救人方为侠。对了——这世上真有仙人，喏，湖心那座仙灵岛上便住着一位。' },
            { n: '李逍遥', t: '仙灵岛？小时候婶婶常拿它吓唬我，说凡人上岛有去无回……' },
            { n: '老者', t: '哈哈哈，有去无回？那要看你带不带得回。酒足矣，后会有期！' },
            '话音未落，老者身形一晃，竟已不见踪影。桌上只留下一只空酒坛。',
            { n: '李逍遥', t: '人呢？！喂——酒钱还没付呢！……这下糟了，得跟婶婶交代。' },
          ], () => {
            f.learnedSkill = true;
            const newNpcs = this.setupNpcs(state, explore['mapId']);
            (explore as any).npcs = newNpcs;
          });
        }
        break;

      case 'doctor':
        D.say([
          { n: '郎中', t: '怪哉，怪哉。这病来得又急又凶，不像寻常风寒，老朽实在无能为力。' },
          { n: '李逍遥', t: '先生，求您再想想办法！' },
          { n: '郎中', t: '唉……老朽只听过一个偏方。湖心仙灵岛上住着仙人，岛上的灵芝仙草，能起死回生。' },
          { n: '李逍遥', t: '仙灵岛……好！是仙是妖，我都去闯一闯！' },
        ]);
        break;

      case 'villager_m':
        if (f.memoryLost) {
          D.say([{ n: '镇民', t: '逍遥，你前两天去哪儿了？整个人魂不守舍的。' }]);
        } else if (f.auntSick) {
          D.say([
            { n: '镇民', t: '听说你婶婶病倒了？要去仙灵岛？那地方雾气邪门，打渔的都绕着走啊。' },
            { n: '李逍遥', t: '绕着走也得去。镇西湖边不是还拴着条小船么。' },
          ]);
        } else {
          D.say([{ n: '镇民', t: '今天天气不错。你家客栈来了位怪老头，一坛接一坛地喝，啧啧。' }]);
        }
        break;

      case 'villager_f':
        if (f.auntSick && !f.hasMedicine) {
          D.say([{ n: '大姐', t: '李婶平日待人最好了……逍遥，你可得想想办法。' }]);
        } else {
          D.say([{ n: '大姐', t: '湖心那座岛啊，起雾的夜里隐隐有歌声呢，邪门得很。' }]);
        }
        break;

      case 'well':
        D.say(['井水清凉。李逍遥探头看了看，里面只有自己晃晃悠悠的影子。']);
        break;

      case 'boat_lake':
        if (!f.auntSick) {
          D.say(['湖面雾蒙蒙的。一条小船拴在栈桥边，轻轻晃着。',
            { n: '李逍遥', t: '没事划什么船，店里还一堆活儿呢。' }]);
        } else {
          D.choice('湖心方向雾气缭绕。要划船前往仙灵岛吗？', ['出发', '再等等'], (sel) => {
            if (sel === 0) {
              D.say([
                '李逍遥解开缆绳，奋力摇桨。小船破开浓雾，莲叶在船舷两侧沙沙作响……',
                '不知过了多久，一座绿意盎然的小岛出现在眼前。',
              ], () => {
                explore.scene.restart({ mapId: 'island', tx: 9, ty: 13, dir: 'up' });
              });
            }
          });
        }
        break;

      case 'boat_island':
        if (!f.hasMedicine) {
          D.say([{ n: '李逍遥', t: '还没拿到救婶婶的药，怎么能就这么回去。' }]);
        } else {
          D.choice('要乘船离开仙灵岛吗？', ['启程回家', '再待一会'], (sel) => {
            if (sel === 0) this.leaveIsland(scene, state);
          });
        }
        break;

      case 'linger':
        if (!f.married) {
          this.meetLinger(scene, state);
        } else if (!f.hasMedicine) {
          f.hasMedicine = true;
          D.say([{ n: '赵灵儿', t: '李大哥，仙草收好了么？' }]);
        } else {
          D.say([
            { n: '赵灵儿', t: '李大哥……一路小心。' },
            { n: '赵灵儿', t: '无论隔着多远的水路，灵儿都在岛上等你回来。' },
          ]);
        }
        break;
    }
  }

  getHint(state: GameState): string {
    const f = state.flags;
    if (f.done) return '';
    if (f.hasMedicine && f.memoryLost) return '回客栈，把灵药交给婶婶';
    if (f.hasMedicine) return '回到岛南的小船，启程回家';
    if (f.married) return '';
    if (f.snakeDead) return '去岛北的灵泉看看';
    if (f.auntSick) return '去镇西湖畔，乘船前往仙灵岛';
    if (f.learnedSkill) return '去柜台看看婶婶';
    return '和客栈里的老先生聊聊';
  }

  getMusic(mapId: string): string {
    return (mapId === 'lake' || mapId === 'island') ? 'island' : 'village';
  }

  // ---------- 开场 ----------

  intro(scene: any): void {
    const explore = scene as ExploreScene;
    explore.dialogManager.say([
      '大宋年间，江南余杭。',
      '渔村少年李逍遥自幼父母双亡，与婶婶相依为命，在镇上的小客栈里帮工度日。',
      '他白日里跑堂打杂，夜里却总梦见自己仗剑江湖，成了人人敬仰的大侠……',
      { n: '婶婶', t: '逍遥——！死哪儿去了？店里来客人啦！' },
      { n: '李逍遥', t: '来啦来啦！' },
    ]);
  }

  // ---------- 大段剧情 ----------

  private meetLinger(scene: any, state: GameState): void {
    const f = state.flags;
    const explore = scene as ExploreScene;
    const D = explore.dialogManager;
    D.say([
      '灵泉边水声叮咚。一个白衣少女正背对着泉水梳理长发，听见脚步声，惊得回过头来。',
      { n: '少女', t: '你……你是什么人？怎么会上岛来？！' },
      { n: '李逍遥', t: '姑娘莫怕！在下李逍遥，余杭镇人。我婶婶病得快不行了，听说岛上有仙草能救命，这才冒昧闯上来。' },
      { n: '少女', t: '原来是为了救人……我叫赵灵儿。仙草倒是有，只是——' },
      { n: '??', t: '大胆狂徒！光天化日，竟敢私闯仙灵岛，惊扰我家小姐！' },
      '一位拄杖的老妪不知何时立在了身后，目光如电。',
      { n: '赵灵儿', t: '姥姥别动怒！李大哥不是坏人，他是为了救他婶婶……' },
      { n: '姥姥', t: '哼。规矩就是规矩——凡人见了灵儿的面，要么留在岛上一辈子，要么……' },
      { n: '李逍遥', t: '要么怎样？您老人家快说，我婶婶还等着药呢！' },
      { n: '姥姥', t: '要么，就娶她为妻，做我仙灵岛的女婿！' },
    ], () => {
      this.proposeChoice(scene, state);
    });
  }

  private proposeChoice(scene: any, state: GameState): void {
    const explore = scene as ExploreScene;
    const D = explore.dialogManager;
    D.choice('娶赵灵儿为妻？', ['我愿意', '这也太突然了'], (sel) => {
      if (sel === 1) {
        D.say([
          { n: '姥姥', t: '突然？那便把你变成岛上的一只青蛙，慢慢想个明白！' },
          { n: '赵灵儿', t: '姥姥——！' },
          { n: '李逍遥', t: '等等等等！我想好了，我想好了！' },
        ], () => {
          this.proposeChoice(scene, state);
        });
      } else {
        D.say([
          { n: '李逍遥', t: '灵儿姑娘心地这么好，人又这么好看……我，我愿意！' },
          { n: '赵灵儿', t: '（低下头，耳根都红了）……全凭姥姥做主。' },
          { n: '姥姥', t: '好。今夜便在水月宫中拜堂成亲！' },
        ], () => {
          explore.startWedding();
        });
      }
    });
  }

  private leaveIsland(scene: any, state: GameState): void {
    const f = state.flags;
    const explore = scene as ExploreScene;
    const D = explore.dialogManager;
    D.say([
      '翌日清晨，灵儿一路把李逍遥送到岛南的栈桥边。',
      { n: '赵灵儿', t: '李大哥，救完婶婶，要快些回来……' },
      { n: '李逍遥', t: '放心，少则三日，多则五日，我一定回来接你！' },
      '小船离岸。雾气深处，姥姥的声音幽幽传来——',
      { n: '姥姥', t: '凡尘之人，不该带走岛上的记忆。孩子，莫怪姥姥心狠……' },
      '一道白光掠过湖面。李逍遥只觉脑中一阵恍惚，眼皮重得抬不起来……',
    ], () => {
      explore.flashWhite(() => {
        f.memoryLost = true;
        explore.scene.restart({ mapId: 'lake', tx: 3, ty: 6, dir: 'right' });
        // 延迟一帧后播放对话
        setTimeout(() => {
          const D2 = (scene as ExploreScene).dialogManager;
          if (D2) {
            D2.say([
              { n: '李逍遥', t: '咦？我怎么睡在船上……这里是镇西的湖边？' },
              { n: '李逍遥', t: '手里这株仙草是……算了，想不起来。对了，婶婶还病着，先回客栈要紧！' },
            ]);
          }
        }, 100);
      });
    });
  }

  private finale(scene: any, state: GameState): void {
    const explore = scene as ExploreScene;
    const D = explore.dialogManager;
    const f = state.flags;
    D.say([
      '婶婶的病好了，小客栈的日子又恢复了平静。',
      '只是李逍遥总觉得，自己忘了一件顶顶要紧的事。夜里梦见莲花满塘，醒来枕边竟有泪痕。',
      '而湖心的仙灵岛上，有个白衣的女孩，仍日日立在水边，等着那只回来接她的小船……',
    ], () => {
      f.done = true;
      explore.scene.start('EndingScene');
    });
  }
}
