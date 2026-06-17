/** 敌人配置 */
export interface EnemyConfig {
  name: string;
  hp: number;
  atkMin: number;
  atkMax: number;
  spriteKey: string;
  intro?: string;
}

/** 战斗菜单项 */
export interface BattleMenuItem {
  key: string;
  label: string;
  off?: boolean;
}

/** 战斗场景启动数据 */
export interface BattleSceneData {
  enemy: EnemyConfig;
  onWin: () => void;
}
