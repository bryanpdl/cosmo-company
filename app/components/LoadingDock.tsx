import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { formatNumber } from '../utils/formatters';
import { playUpgradeSound, playSellSound } from '../utils/sounds';

export function LoadingDock() {
  const { state, dispatch } = useGame();
  const { money, loadingDock } = state;

  const totalStored = Object.values(loadingDock.stored).reduce((sum, amount) => sum + amount, 0);
  const percentFull = (totalStored / loadingDock.capacity) * 100;

  const getDockUpgradeCost = () => {
    return Math.floor(100 * Math.pow(1.5, loadingDock.level - 1));
  };

  const handleUpgrade = () => {
    if (money >= getDockUpgradeCost()) {
      playUpgradeSound();
      dispatch({ type: 'UPGRADE_DOCK' });
    }
  };

  const handleSell = () => {
    if (totalStored > 0) {
      playSellSound();
      dispatch({ type: 'SELL_MATERIALS' });
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-300">Loading Dock</h2>
        <button
          className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 
                   hover:bg-cyan-500/20 transition-all duration-300 disabled:opacity-50 
                   disabled:cursor-not-allowed"
          onClick={handleUpgrade}
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
      <div className="space-y-2 mb-4">
        {Object.entries(loadingDock.stored).map(([materialId, amount]) => {
          const material = state.nodes.find(n => n.material.id === materialId)?.material;
          if (!material || amount === 0) return null;
          return (
            <div key={materialId} className="flex justify-between items-center text-sm">
              <span className={`text-${material.color}-400`}>{material.name}</span>
              <span className="text-gray-400">{amount}</span>
            </div>
          );
        })}
      </div>

      {/* Sell Button */}
      <button
        className="w-full py-2 rounded-lg bg-green-500/10 border border-green-500/30 
                 hover:bg-green-500/20 transition-all duration-300 disabled:opacity-50 
                 disabled:cursor-not-allowed"
        onClick={handleSell}
        disabled={totalStored === 0}
      >
        <div className="text-sm font-bold text-gray-300">Sell All Materials</div>
      </button>
    </div>
  );
} 