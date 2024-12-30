import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { formatNumber } from '../utils/formatters';
import { playUpgradeSound, playSellSound } from '../utils/sounds';

export function LoadingDock() {
  const { state, dispatch } = useGame();
  const { loadingDock, nodes, globalUpgrades } = state;

  // Calculate total value of stored materials
  const totalValue = Object.entries(loadingDock.stored).reduce((sum, [materialId, amount]) => {
    const node = nodes.find(n => n.material.id === materialId);
    if (node) {
      const nodeValueMultiplier = 1 + (node.level.value - 1) * 0.15; // 15% increase per level
      const baseValue = node.material.baseValue * amount;
      return sum + (baseValue * nodeValueMultiplier * globalUpgrades.materialValue.multiplier);
    }
    return sum;
  }, 0);

  const totalStored = Object.values(loadingDock.stored).reduce((sum, amount) => sum + amount, 0);

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-200">Loading Dock</h2>
        <div className="text-sm text-gray-400">
          {totalStored}/{loadingDock.capacity}
        </div>
      </div>

      {/* Materials List */}
      <div className="space-y-2 mb-4">
        {Object.entries(loadingDock.stored).map(([materialId, amount]) => {
          const material = nodes.find(n => n.material.id === materialId)?.material;
          if (!material || amount === 0) return null;
          return (
            <div key={materialId} className="flex justify-between items-center">
              <span className="text-gray-200 font-medium">{material.name}</span>
              <span className="text-gray-400">{amount}</span>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={() => {
            playSellSound();
            dispatch({ type: 'SELL_MATERIALS' });
          }}
          disabled={totalStored === 0}
          className="w-full px-4 py-2 rounded bg-cyan-500/10 border border-cyan-500/30 
                   hover:bg-cyan-500/20 transition-all duration-300 text-gray-300 
                   hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sell All (${formatNumber(totalValue)})
        </button>
        <button
          onClick={() => {
            playUpgradeSound();
            dispatch({ type: 'UPGRADE_DOCK' });
          }}
          className="w-full px-4 py-2 rounded bg-purple-500/10 border border-purple-500/30 
                   hover:bg-purple-500/20 transition-all duration-300 text-gray-300 
                   hover:text-white"
        >
          Upgrade Storage (${formatNumber(Math.floor(100 * Math.pow(1.5, loadingDock.level - 1)))})
        </button>
      </div>
    </div>
  );
} 