import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { formatNumber } from '../utils/formatters';
import { playButtonSound, playUpgradeSound } from '../utils/sounds';

export default function BlackHole() {
  const { state, dispatch } = useGame();
  const { blackHole = { level: 1 } } = state;

  const handleClick = () => {
    playButtonSound();
    dispatch({ type: 'CLICK_BLACK_HOLE' });
  };

  const handleUpgrade = () => {
    playUpgradeSound();
    dispatch({ type: 'UPGRADE_BLACK_HOLE' });
  };

  const upgradeCost = Math.floor(1000 * Math.pow(2, blackHole.level - 1));
  const clickValue = Math.floor(10 * Math.pow(1.5, blackHole.level - 1));

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 flex flex-col items-center">
      <h2 className="text-xl font-bold text-gray-200 mb-2">Cosmic Void</h2>
      <div className="text-sm text-gray-400 mb-4">Level {blackHole.level}</div>
      
      {/* Clickable Black Hole */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className="w-[150px] h-[150px] relative mb-4 group"
      >
        <motion.img
          src="/images/blackhole.png"
          alt="Black Hole"
          className="w-full h-full object-contain"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-cyan-400 font-bold text-lg">+${formatNumber(clickValue)}</span>
        </div>
      </motion.button>

      {/* Upgrade Button */}
      <button
        onClick={handleUpgrade}
        disabled={state.money < upgradeCost}
        className="w-full px-4 py-2 rounded bg-purple-500/10 border border-purple-500/30 
                  hover:bg-purple-500/20 transition-all duration-300 text-gray-300 
                  hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Upgrade (${formatNumber(upgradeCost)})
      </button>
      
      <div className="text-sm text-gray-400 mt-2">
        Click Value: ${formatNumber(clickValue)}
      </div>
    </div>
  );
} 