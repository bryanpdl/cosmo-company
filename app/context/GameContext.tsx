import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react';
import { GameState, Material, Node, UpgradeType, GlobalUpgradeType } from '../types/game';
import { useAuth } from './AuthContext';
import { loadGameState, saveGameState } from '../firebase/gameService';

// Initial materials
const materials: Material[] = [
  { id: 'neutronium', name: 'Neutronium', baseValue: 10, color: 'cyan' },
  { id: 'cryosteel', name: 'CryoSteel', baseValue: 25, color: 'blue' },
  { id: 'voidIron', name: 'Void Iron', baseValue: 35, color: 'indigo' },
  { id: 'stellarAlloy', name: 'Stellar Alloy', baseValue: 45, color: 'sky' },
  { id: 'plasmaCore', name: 'Plasma Core', baseValue: 60, color: 'purple' },
  { id: 'darkMatter', name: 'Dark Matter', baseValue: 80, color: 'fuchsia' },
  { id: 'antimatter', name: 'Antimatter', baseValue: 90, color: 'pink' },
  { id: 'quantumDust', name: 'Quantum Dust', baseValue: 100, color: 'green' },
];

// Initial nodes
const initialNodes: Node[] = materials.map((material, index) => ({
  id: `node-${index}`,
  name: `${material.name}`,
  material,
  productionRate: 1,
  valueMultiplier: 1,
  isUnlocked: index === 0,
  unlockCost: Math.floor(Math.pow(1000, 1 + index * 0.25)), // More gradual cost scaling
  level: {
    production: 1,
    value: 1,
  },
}));

const initialState: GameState = {
  money: 0,
  nodes: initialNodes,
  loadingDock: {
    capacity: 25,
    stored: {},
    level: 1,
  },
  globalUpgrades: {
    materialValue: {
      level: 1,
      multiplier: 1,
    },
    nodeEfficiency: {
      level: 1,
      multiplier: 1,
    },
    storageOptimization: {
      level: 1,
      multiplier: 1,
    },
  },
};

// Add to GameAction type at the top
type GameAction = 
  | { type: 'PRODUCE_MATERIAL'; payload: { nodeId: string; amount: number } }
  | { type: 'SELL_MATERIALS' }
  | { type: 'UPGRADE_NODE'; payload: { nodeId: string; upgradeType: UpgradeType } }
  | { type: 'UNLOCK_NODE'; payload: { nodeId: string } }
  | { type: 'UPGRADE_DOCK' }
  | { type: 'UPGRADE_GLOBAL'; payload: { upgradeType: GlobalUpgradeType } }
  | { type: 'LOAD_GAME_STATE'; payload: GameState }
  | { type: 'SAVE_GAME_STATE' };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'PRODUCE_MATERIAL': {
      const { nodeId, amount } = action.payload;
      const node = state.nodes.find(n => n.id === nodeId);
      if (!node || !node.isUnlocked) return state;

      // Get current amount of this material
      const currentAmount = state.loadingDock.stored[node.material.id] || 0;
      
      // Calculate total storage used by all materials
      const totalStorage = Object.values(state.loadingDock.stored).reduce((sum, amt) => sum + amt, 0);
      
      // Calculate how much we can actually store
      const spaceAvailable = state.loadingDock.capacity - totalStorage;
      const amountToStore = Math.min(amount, spaceAvailable);
      
      // If no space available, return current state
      if (spaceAvailable <= 0) return state;

      return {
        ...state,
        loadingDock: {
          ...state.loadingDock,
          stored: {
            ...state.loadingDock.stored,
            [node.material.id]: currentAmount + amountToStore,
          },
        },
      };
    }

    case 'SELL_MATERIALS': {
      let totalValue = 0;
      Object.entries(state.loadingDock.stored).forEach(([materialId, amount]) => {
        const material = materials.find(m => m.id === materialId);
        const node = state.nodes.find(n => n.material.id === materialId);
        if (material && node) {
          // Calculate value with node's value level multiplier
          const nodeValueMultiplier = 1 + (node.level.value - 1) * 0.15; // 15% increase per level
          const baseValue = material.baseValue * amount;
          // Apply both node's value multiplier and global multiplier
          totalValue += baseValue * nodeValueMultiplier * state.globalUpgrades.materialValue.multiplier;
        }
      });

      return {
        ...state,
        money: state.money + totalValue,
        loadingDock: {
          ...state.loadingDock,
          stored: {},
        },
        _shouldSave: true, // Flag to trigger save
      };
    }

    case 'UPGRADE_NODE': {
      const { nodeId: targetNodeId, upgradeType } = action.payload;
      const targetNode = state.nodes.find(n => n.id === targetNodeId);
      if (!targetNode) return state;
      
      // Get node index to scale base cost
      const nodeIndex = state.nodes.findIndex(n => n.id === targetNodeId);
      const baseUpgradeCost = 15 * Math.pow(2, nodeIndex); // Base cost doubles for each node
      const upgradeCost = Math.floor(baseUpgradeCost * Math.pow(1.5, targetNode.level[upgradeType] - 1));
      
      if (state.money < upgradeCost) return state;

      return {
        ...state,
        money: state.money - upgradeCost,
        nodes: state.nodes.map(node =>
          node.id === targetNodeId
            ? {
                ...node,
                productionRate: upgradeType === 'production' 
                  ? 1 + (node.level.production * 0.01) // 1% increase per level
                  : node.productionRate,
                level: {
                  ...node.level,
                  [upgradeType]: node.level[upgradeType] + 1,
                },
              }
            : node
        ),
      };
    }

    case 'UNLOCK_NODE':
      const { nodeId: unlockNodeId } = action.payload;
      const nodeToUnlock = state.nodes.find(n => n.id === unlockNodeId);
      if (!nodeToUnlock || nodeToUnlock.isUnlocked || state.money < nodeToUnlock.unlockCost) {
        return state;
      }

      return {
        ...state,
        money: state.money - nodeToUnlock.unlockCost,
        nodes: state.nodes.map(node =>
          node.id === unlockNodeId
            ? { ...node, isUnlocked: true }
            : node
        ),
      };

    case 'UPGRADE_DOCK':
      const dockUpgradeCost = Math.floor(100 * Math.pow(1.5, state.loadingDock.level - 1));
      if (state.money < dockUpgradeCost) return state;

      // Calculate capacity increase with storage optimization multiplier
      const baseCapacityIncrease = 10;
      const optimizedCapacityIncrease = Math.floor(baseCapacityIncrease * state.globalUpgrades.storageOptimization.multiplier);

      return {
        ...state,
        money: state.money - dockUpgradeCost,
        loadingDock: {
          ...state.loadingDock,
          capacity: state.loadingDock.capacity + optimizedCapacityIncrease,
          level: state.loadingDock.level + 1,
        },
      };

    case 'UPGRADE_GLOBAL': {
      const { upgradeType } = action.payload;
      const currentLevel = state.globalUpgrades[upgradeType].level;
      const globalUpgradeCost = Math.floor(10000 * Math.pow(2, currentLevel - 1));
      
      if (state.money < globalUpgradeCost) return state;

      return {
        ...state,
        money: state.money - globalUpgradeCost,
        globalUpgrades: {
          ...state.globalUpgrades,
          [upgradeType]: {
            level: currentLevel + 1,
            multiplier: 1 + (currentLevel * (upgradeType === 'storageOptimization' ? 0.10 : 0.05)), // 10% for storage, 5% for others
          },
        },
      };
    }

    case 'LOAD_GAME_STATE':
      return {
        ...action.payload,
      };

    case 'SAVE_GAME_STATE':
      return {
        ...state,
        _shouldSave: false,
      };

    default:
      return state;
  }
}

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  isLoading: boolean;
}>({
  state: initialState,
  dispatch: () => null,
  isLoading: true,
});

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, { ...initialState, _shouldSave: false });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  // Load game state when user signs in or component mounts
  useEffect(() => {
    async function loadGame() {
      setIsLoading(true);
      if (user) {
        try {
          const savedState = await loadGameState(user.uid);
          if (savedState) {
            dispatch({ type: 'LOAD_GAME_STATE', payload: { ...savedState, _shouldSave: false } });
          }
        } catch (error) {
          console.error('Error loading game state:', error);
        }
      }
      setIsLoading(false);
    }
    
    loadGame();
  }, [user]);

  // Save game state when sell action occurs
  useEffect(() => {
    if (!user || isLoading || !state._shouldSave) return;

    console.log('Triggering save after sell action...');
    const saveGame = async () => {
      try {
        const { _shouldSave, ...stateToSave } = state;
        await saveGameState(user.uid, stateToSave);
        console.log('Game saved successfully after selling:', new Date().toLocaleTimeString());
        // Reset the save flag after successful save
        dispatch({ type: 'SAVE_GAME_STATE' });
      } catch (error) {
        console.error('Error saving game state:', error);
      }
    };

    saveGame();
  }, [user, isLoading, state._shouldSave]);

  // Additional backup auto-save every 30 seconds
  useEffect(() => {
    if (!user || isLoading) return;

    console.log('Auto-save interval started');
    const saveInterval = setInterval(async () => {
      // Don't auto-save if a manual save is pending
      if (state._shouldSave) {
        console.log('Skipping auto-save - manual save pending');
        return;
      }

      try {
        const { _shouldSave, ...stateToSave } = state;
        await saveGameState(user.uid, stateToSave);
        console.log('Auto-save completed:', new Date().toLocaleTimeString());
      } catch (error) {
        console.error('Error in auto-save:', error);
      }
    }, 30 * 1000); // Every 30 seconds

    return () => {
      console.log('Auto-save interval cleared');
      clearInterval(saveInterval);
    };
  }, [user, isLoading, state]); // Include state in dependencies

  // Save game state when user signs out or page unloads
  useEffect(() => {
    if (!user || isLoading) return;

    const handleBeforeUnload = () => {
      // Synchronous save attempt for page unload
      try {
        const { _shouldSave, ...stateToSave } = state;
        saveGameState(user.uid, stateToSave);
      } catch (error) {
        console.error('Error saving on unload:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user, state, isLoading]);

  return (
    <GameContext.Provider value={{ state, dispatch, isLoading }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
} 