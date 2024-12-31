'use client';
import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react';
import { GameState, Material, Node, UpgradeType, GlobalUpgradeType } from '../types/game';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import { loadGameState, saveGameState } from '../firebase/gameService';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
  { id: 'cosmicShard', name: 'Cosmic Shard', baseValue: 250, color: 'amber' },
  { id: 'timeEssence', name: 'Time Essence', baseValue: 500, color: 'orange' },
  { id: 'voidCrystal', name: 'Void Crystal', baseValue: 800, color: 'violet' },
  { id: 'starEssence', name: 'Star Essence', baseValue: 1200, color: 'yellow' },
  { id: 'realityFragment', name: 'Reality Fragment', baseValue: 1800, color: 'rose' },
  { id: 'eternityMatter', name: 'Eternity Matter', baseValue: 2500, color: 'emerald' },
  { id: 'infinityDust', name: 'Infinity Dust', baseValue: 3500, color: 'teal' },
  { id: 'omnipotenceOrb', name: 'Omnipotence Orb', baseValue: 5000, color: 'red' },
];

// Initial nodes
export const initialNodes: Node[] = materials.map((material, index) => ({
  id: `node-${index}`,
  name: material.name,
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
  cosmicGems: 0,
  nodes: initialNodes,
  loadingDock: {
    capacity: 25,
    stored: {},
    level: 1,
    hasManager: false,
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
  blackHole: {
    level: 1,
    autoClicker: {
      level: 0,
      clicksPerSecond: 0,
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
  | { type: 'SAVE_GAME_STATE' }
  | { type: 'PURCHASE_DOCK_MANAGER' }
  | { type: 'CLICK_BLACK_HOLE'; payload: { gemsEarned: number } }
  | { type: 'UPGRADE_BLACK_HOLE' }
  | { type: 'UPGRADE_BLACK_HOLE_AUTO_CLICKER' };

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
          const nodeValueMultiplier = 1 + (node.level.value - 1) * 0.15;
          const baseValue = material.baseValue * amount;
          totalValue += baseValue * nodeValueMultiplier * state.globalUpgrades.materialValue.multiplier;
        }
      });

      // Apply payload boost
      const payloadBoostMultiplier = 1 + (Math.floor(state.loadingDock.level / 1) * 0.01);
      const boostedValue = totalValue * payloadBoostMultiplier;

      return {
        ...state,
        money: state.money + boostedValue,
        loadingDock: {
          ...state.loadingDock,
          stored: {},
        },
        _shouldSave: true,
      };
    }

    case 'UPGRADE_NODE': {
      const { nodeId: targetNodeId, upgradeType } = action.payload;
      const targetNode = state.nodes.find(n => n.id === targetNodeId);
      if (!targetNode) return state;
      
      const nodeIndex = state.nodes.findIndex(n => n.id === targetNodeId);
      const baseUpgradeCost = 15 * Math.pow(2, nodeIndex);
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
                  ? 1 + (node.level.production * 0.01)
                  : node.productionRate,
                level: {
                  ...node.level,
                  [upgradeType]: node.level[upgradeType] + 1,
                },
              }
            : node
        ),
        _shouldSave: true,
      };
    }

    case 'UNLOCK_NODE': {
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
        _shouldSave: true,
      };
    }

    case 'UPGRADE_DOCK': {
      const dockUpgradeCost = Math.floor(100 * Math.pow(1.5, state.loadingDock.level - 1));
      if (state.money < dockUpgradeCost) return state;

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
        _shouldSave: true,
      };
    }

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
            multiplier: 1 + (currentLevel * (upgradeType === 'storageOptimization' ? 0.10 : 0.05)),
          },
        },
        _shouldSave: true,
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

    case 'PURCHASE_DOCK_MANAGER': {
      if (state.money < 500000 || state.loadingDock.hasManager) return state;

      return {
        ...state,
        money: state.money - 500000,
        loadingDock: {
          ...state.loadingDock,
          hasManager: true,
        },
        _shouldSave: true,
      };
    }

    case 'CLICK_BLACK_HOLE': {
      const clickValue = Math.floor(10 * Math.pow(1.5, state.blackHole.level - 1));
      
      return {
        ...state,
        money: state.money + clickValue,
        cosmicGems: (state.cosmicGems || 0) + action.payload.gemsEarned,
        _shouldSave: state._shouldSave || action.payload.gemsEarned > 0
      };
    }

    case 'UPGRADE_BLACK_HOLE': {
      const upgradeCost = Math.floor(1000 * Math.pow(2, state.blackHole.level - 1));
      if (state.money < upgradeCost) return state;

      return {
        ...state,
        money: state.money - upgradeCost,
        blackHole: {
          ...state.blackHole,
          level: state.blackHole.level + 1,
        },
        _shouldSave: true,
      };
    }

    case 'UPGRADE_BLACK_HOLE_AUTO_CLICKER': {
      const upgradeCost = state.blackHole.autoClicker.level === 0 
        ? 5_000_000 
        : Math.floor(5_000_000 * Math.pow(2, state.blackHole.autoClicker.level));
        
      if (state.money < upgradeCost) return state;

      return {
        ...state,
        money: state.money - upgradeCost,
        blackHole: {
          ...state.blackHole,
          autoClicker: {
            level: state.blackHole.autoClicker.level + 1,
            clicksPerSecond: Math.pow(2, state.blackHole.autoClicker.level)
          },
        },
        _shouldSave: true,
      };
    }

    default:
      return state;
  }
}

const GameContext = createContext<{
  state: GameState;
  dispatch: (action: GameAction) => Promise<void>;
  isLoading: boolean;
}>({
  state: initialState,
  dispatch: async () => {},
  isLoading: true,
});

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, { ...initialState, _shouldSave: false });
  const [isLoading, setIsLoading] = useState(true);
  const { user, signOutUser } = useAuth();
  const { settings } = useSettings();
  const currentSessionId = React.useRef(Date.now().toString());

  // Check if this is the most recent session
  const checkSession = async () => {
    if (!user) return true;
    try {
      const lastSessionRef = doc(db, 'users', user.uid);
      const lastSessionSnap = await getDoc(lastSessionRef);
      const lastSessionData = lastSessionSnap.data();
      
      if (lastSessionData?.lastSessionId && 
          lastSessionData.lastSessionId !== currentSessionId.current && 
          Number(lastSessionData.lastSessionId) > Number(currentSessionId.current)) {
        console.log('Newer session detected, signing out older session...');
        signOutUser();
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking session:', error);
      return true;
    }
  };

  // Wrap dispatch to check session before processing actions
  const wrappedDispatch = async (action: GameAction) => {
    // Skip session check for LOAD_GAME_STATE action
    if (action.type === 'LOAD_GAME_STATE') {
      dispatch(action);
      return;
    }

    const isCurrentSession = await checkSession();
    if (isCurrentSession) {
      dispatch(action);
    }
  };

  // Load game state when user signs in
  useEffect(() => {
    let unsubscribe: () => void;

    async function loadGame() {
      setIsLoading(true);
      if (user) {
        try {
          // Set up auth state listener for multiple tabs/windows
          unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser?.uid === user.uid) {
              // Update the session ID in Firestore
              const lastSessionRef = doc(db, 'users', user.uid);
              await setDoc(lastSessionRef, {
                lastSessionId: currentSessionId.current
              }, { merge: true });
            }
          });

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

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  // Save game state when _shouldSave is true
  useEffect(() => {
    if (!user || isLoading || !state._shouldSave) return;

    console.log('Saving game state...');
    const saveGame = async () => {
      try {
        const { _shouldSave, ...stateToSave } = state;
        await saveGameState(user.uid, stateToSave);
        console.log('Game saved successfully:', new Date().toLocaleTimeString());
        dispatch({ type: 'SAVE_GAME_STATE' });
      } catch (error) {
        console.error('Error saving game state:', error);
      }
    };

    saveGame();
  }, [user, isLoading, state._shouldSave]);

  // Save on unload
  useEffect(() => {
    if (!user || isLoading) return;

    const handleBeforeUnload = () => {
      try {
        const { _shouldSave, ...stateToSave } = state;
        saveGameState(user.uid, stateToSave);
      } catch (error) {
        console.error('Error saving on unload:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user, isLoading, state]);

  return (
    <GameContext.Provider value={{ state, dispatch: wrappedDispatch, isLoading }}>
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