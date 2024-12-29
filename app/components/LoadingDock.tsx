import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { formatNumber } from '../utils/formatters';

export function LoadingDock() {
  const { state, dispatch } = useGame();
  const { loadingDock, money } = state;

  const totalStored = Object.values(loadingDock.stored).reduce((a, b) => a + b, 0);
  const percentFull = (totalStored / loadingDock.capacity) * 100;

  const getDockUpgradeCost = () => {
    return Math.floor(100 * Math.pow(1.5, loadingDock.level - 1));
  };

  const getMaterialName = (materialId: string) => {
    const node = state.nodes.find(n => n.material.id === materialId);
    return node?.material.name || materialId;
  };

  const getMaterialValue = (materialId: string, amount: number) => {
    const material = state.nodes.find(n => n.material.id === materialId)?.material;
    const node = state.nodes.find(n => n.material.id === materialId);
    if (!material || !node) return 0;
    
    // Calculate value with node's value level multiplier
    const nodeValueMultiplier = 1 + (node.level.value - 1) * 0.15; // 15% increase per level
    const baseValue = material.baseValue * amount;
    // Apply both node's value multiplier and global multiplier
    return baseValue * nodeValueMultiplier * state.globalUpgrades.materialValue.multiplier;
  };

  const totalValue = Object.entries(loadingDock.stored).reduce((total, [materialId, amount]) => 
    total + getMaterialValue(materialId, amount), 0);

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-300">Loading Dock</h2>
        <button
          className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 
                   hover:bg-cyan-500/20 transition-all duration-300 disabled:opacity-50 
                   disabled:cursor-not-allowed"
          onClick={() => dispatch({ type: 'UPGRADE_DOCK' })}
          disabled={money < getDockUpgradeCost()}
        >
          <div className="text-sm font-bold text-gray-300">Upgrade</div>
          <div className="text-xs text-cyan-400/75">${formatNumber(getDockUpgradeCost())}</div>
        </button>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">Storage Level {loadingDock.level}</span>
          <span className="text-gray-400">{totalStored}/{loadingDock.capacity}</span>
        </div>
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 transition-all duration-300"
            style={{ width: `${Math.min(percentFull, 100)}%` }}
          />
        </div>
      </div>

      {/* Materials List */}
      <div className="space-y-2">
        {Object.entries(loadingDock.stored).map(([materialId, amount]) => (
          <div key={materialId} className="flex justify-between items-center">
            <span className="text-gray-400">{getMaterialName(materialId)}</span>
            <span className="text-gray-300">{amount}</span>
          </div>
        ))}
      </div>

      {/* Total Value */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Total Value:</span>
          <span className="text-green-400">${formatNumber(totalValue)}</span>
        </div>
        <button
          className="w-full mt-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 
                   hover:bg-green-500/20 transition-all duration-300 disabled:opacity-50 
                   disabled:cursor-not-allowed"
          onClick={() => dispatch({ type: 'SELL_MATERIALS' })}
          disabled={totalStored === 0}
        >
          Sell All Materials
        </button>
      </div>
    </div>
  );
} 