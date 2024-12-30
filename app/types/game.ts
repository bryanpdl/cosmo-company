export type UpgradeType = 'production' | 'value';
export type GlobalUpgradeType = 'materialValue' | 'nodeEfficiency' | 'storageOptimization';

export interface Material {
  id: string;
  name: string;
  baseValue: number;
  color: string;
}

export interface Node {
  id: string;
  name: string;
  material: Material;
  productionRate: number;
  valueMultiplier: number;
  isUnlocked: boolean;
  unlockCost: number;
  level: {
    production: number;
    value: number;
  };
}

export interface LoadingDock {
  capacity: number;
  stored: { [key: string]: number };
  level: number;
  hasManager: boolean;
}

export interface GlobalUpgrades {
  materialValue: {
    level: number;
    multiplier: number;
  };
  nodeEfficiency: {
    level: number;
    multiplier: number;
  };
  storageOptimization: {
    level: number;
    multiplier: number;
  };
}

export interface GameState {
  money: number;
  nodes: Node[];
  loadingDock: LoadingDock;
  globalUpgrades: GlobalUpgrades;
  _shouldSave?: boolean;
}

export type GameAction =
  | { type: 'PRODUCE_MATERIAL'; payload: { nodeId: string; amount: number } }
  | { type: 'SELL_MATERIALS' }
  | { type: 'UPGRADE_NODE'; payload: { nodeId: string; upgradeType: UpgradeType } }
  | { type: 'UNLOCK_NODE'; payload: { nodeId: string } }
  | { type: 'UPGRADE_DOCK' }
  | { type: 'UPGRADE_GLOBAL'; payload: { upgradeType: GlobalUpgradeType } }
  | { type: 'LOAD_GAME_STATE'; payload: GameState }
  | { type: 'SAVE_GAME_STATE' }; 