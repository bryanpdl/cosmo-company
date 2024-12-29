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
    <motion.div
      className="p-6 rounded-xl bg-gray-800/50 border border-gray-700"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Loading Dock</h2>
        <div className="text-sm text-gray-400">Level {loadingDock.level}</div>
      </div>
      
      {/* Storage Meter */}
      <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden mb-2">
        <motion.div
          className="absolute h-full bg-cyan-500/50"
          initial={{ width: 0 }}
          animate={{ width: `${percentFull}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <span className="text-gray-400">
          Storage: {totalStored}/{loadingDock.capacity}
        </span>
        <button
          className="px-3 py-1 text-sm rounded-lg bg-cyan-500/10 border border-cyan-500/30 
                     hover:bg-cyan-500/20 transition-all duration-300 disabled:opacity-50 
                     disabled:cursor-not-allowed group"
          onClick={() => dispatch({ type: 'UPGRADE_DOCK' })}
          disabled={money < getDockUpgradeCost()}
        >
          <div className="text-sm font-bold text-gray-300 group-hover:text-white">Upgrade +10</div>
          <div className="text-xs text-cyan-400/75">${getDockUpgradeCost().toLocaleString()}</div>
        </button>
      </div>

      {/* Material List */}
      <div className="space-y-2 mb-6">
        {Object.entries(loadingDock.stored).map(([materialId, amount]) => {
          const value = getMaterialValue(materialId, amount);
          return (
            <div
              key={materialId}
              className="flex flex-col p-2 rounded-lg bg-gray-700/50"
            >
              <div className="flex justify-between items-center">
                <span>{getMaterialName(materialId)}</span>
                <span className="text-cyan-400">{amount}</span>
              </div>
              <div className="flex justify-end mt-1">
                <span className="text-sm text-green-400">
                  ${formatNumber(value)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sell Button */}
      <button
        className="button-primary w-full py-3 text-lg font-bold"
        onClick={() => dispatch({ type: 'SELL_MATERIALS' })}
        disabled={totalStored === 0}
      >
        Sell All Materials (${formatNumber(totalValue)})
      </button>
    </motion.div>
  );
} 