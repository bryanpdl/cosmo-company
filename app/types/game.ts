export type UpgradeType = 'production' | 'value';
export type GlobalUpgradeType = 'materialValue' | 'nodeEfficiency' | 'storageOptimization';
export type BoostType = 'materialValue' | 'productionSpeed' | 'clickPower';

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

export interface BlackHole {
  level: number;
  autoClicker: {
    level: number;
    clicksPerSecond: number;
  };
}

export interface Boost {
  type: BoostType;
  multiplier: number;
  duration: number;  // Duration in seconds
  endsAt: number | null;  // Timestamp when boost ends, null if not active
  cost: number;  // Cost in cosmic gems
}

export interface GameState {
  money: number;
  cosmicGems: number;
  nodes: Node[];
  loadingDock: LoadingDock;
  globalUpgrades: GlobalUpgrades;
  blackHole: BlackHole;
  activeBoosts: { [key in BoostType]?: Boost };
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
  | { type: 'SAVE_GAME_STATE' }
  | { type: 'PURCHASE_DOCK_MANAGER' }
  | { type: 'CLICK_BLACK_HOLE'; payload: { gemsEarned: number } }
  | { type: 'UPGRADE_BLACK_HOLE' }
  | { type: 'UPGRADE_BLACK_HOLE_AUTO_CLICKER' }
  | { type: 'ACTIVATE_BOOST'; payload: { boostType: BoostType; cost: number } }; 