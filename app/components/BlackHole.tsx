import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { formatNumber } from '../utils/formatters';
import { playUpgradeSound, playBlackholeClickSound } from '../utils/sounds';

export default function BlackHole() {
  const { state, dispatch } = useGame();
  const blackHole = {
    level: state.blackHole?.level ?? 1,
    autoClicker: state.blackHole?.autoClicker ?? { level: 0, clicksPerSecond: 0 }
  };
  const [isClicking, setIsClicking] = React.useState(false);

  const triggerClick = (playSound: boolean = false) => {
    if (playSound) {
      playBlackholeClickSound();
    }
    dispatch({ type: 'CLICK_BLACK_HOLE' });
    setIsClicking(true);
    setTimeout(() => setIsClicking(false), 150);
  };

  const handleClick = () => {
    triggerClick(true); // Manual clicks play sound
  };

  const handleUpgrade = () => {
    playUpgradeSound();
    dispatch({ type: 'UPGRADE_BLACK_HOLE' });
  };

  const handleAutoClickerUpgrade = () => {
    playUpgradeSound();
    dispatch({ type: 'UPGRADE_BLACK_HOLE_AUTO_CLICKER' });
  };

  // Auto-clicker effect with RAF for better timing
  useEffect(() => {
    if (!blackHole.autoClicker?.level) return;

    const clicksPerSecond = Math.pow(2, blackHole.autoClicker.level - 1);
    const interval = 1000 / clicksPerSecond;
    let lastClick = performance.now();
    let animationFrameId: number;

    const autoClick = (currentTime: number) => {
      if (currentTime - lastClick >= interval) {
        triggerClick(false); // Auto-clicks don't play sound
        lastClick = currentTime;
      }
      animationFrameId = requestAnimationFrame(autoClick);
    };

    animationFrameId = requestAnimationFrame(autoClick);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [blackHole.autoClicker?.level]);

  // Calculate upgrade costs and values
  const upgradeCost = Math.floor(1000 * Math.pow(2, blackHole.level - 1));
  const clickValue = Math.floor(10 * Math.pow(1.5, blackHole.level - 1));
  const autoClickerUpgradeCost = blackHole.autoClicker.level === 0 
    ? 5_000_000 
    : Math.floor(5_000_000 * Math.pow(2, blackHole.autoClicker.level));
  const clicksPerSecond = blackHole.autoClicker.level === 0 
    ? 0 
    : Math.pow(2, blackHole.autoClicker.level - 1);

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 flex flex-col items-center">
      <h2 className="text-xl font-bold text-gray-200 mb-2">Cosmic Void</h2>
      <div className="text-sm text-gray-400 mb-4">Level {blackHole.level}</div>
      
      {/* Clickable Black Hole */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        animate={{ scale: isClicking ? 0.95 : 1 }}
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

      {/* Stats */}
      <div className="w-full space-y-2 mb-4">
        <div className="text-sm text-gray-400">
          Click Value: ${formatNumber(clickValue)}
        </div>
        {blackHole.autoClicker.level > 0 && (
          <div className="text-sm text-cyan-400">
            Auto-Clicks: {formatNumber(clicksPerSecond)}/s
          </div>
        )}
      </div>

      {/* Upgrade Buttons */}
      <div className="w-full space-y-2">
        <button
          onClick={handleUpgrade}
          disabled={state.money < upgradeCost}
          className="w-full px-4 py-2 rounded bg-purple-500/10 border border-purple-500/30 
                    hover:bg-purple-500/20 transition-all duration-300 text-gray-300 
                    hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Upgrade (${formatNumber(upgradeCost)})
        </button>

        <button
          onClick={handleAutoClickerUpgrade}
          disabled={state.money < autoClickerUpgradeCost}
          className="w-full px-4 py-2 rounded bg-cyan-500/10 border border-cyan-500/30 
                    hover:bg-cyan-500/20 transition-all duration-300 text-gray-300 
                    hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {blackHole.autoClicker.level === 0 ? (
            <>Unlock Auto-Clicker</>
          ) : (
            <>Upgrade Auto-Clicker</>
          )}
          <div>
            (${formatNumber(autoClickerUpgradeCost)})
          </div>
        </button>
      </div>
    </div>
  );
} 