import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { formatNumber } from '../utils/formatters';
import { playUpgradeSound, playBlackholeClickSound, playGemEarnedSound } from '../utils/sounds';
import { FaGem } from 'react-icons/fa';

export default function BlackHole() {
  const { state, dispatch } = useGame();
  const blackHole = {
    level: state.blackHole?.level ?? 1,
    autoClicker: state.blackHole?.autoClicker ?? { level: 0, clicksPerSecond: 0 }
  };
  const [isClicking, setIsClicking] = React.useState(false);
  const MAX_AUTO_CLICKER_LEVEL = 6;
  const CLICKS_THRESHOLD_FOR_GEM = 750; // 1000 clicks = 1 cosmic gem

  const [clickCount, setClickCount] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('blackHoleClickCount') || '0');
    }
    return 0;
  });

  // Save click count to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('blackHoleClickCount', clickCount.toString());
  }, [clickCount]);

  const handleClick = () => {
    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);
    
    const gemsEarned = Math.floor(newClickCount / CLICKS_THRESHOLD_FOR_GEM) - Math.floor(clickCount / CLICKS_THRESHOLD_FOR_GEM);
    
    // Manual clicks should play sound and show animation
    if (blackHole.autoClicker.level < 4) {
      playBlackholeClickSound();
      setIsClicking(true);
      setTimeout(() => setIsClicking(false), 150);
    }
    
    if (gemsEarned > 0) {
      playGemEarnedSound();
    }
    
    dispatch({ 
      type: 'CLICK_BLACK_HOLE',
      payload: { gemsEarned }
    });
  };

  // Handle auto-clicks with RAF for better timing
  useEffect(() => {
    if (!blackHole.autoClicker?.level) return;

    const clicksPerSecond = Math.min(Math.pow(2, blackHole.autoClicker.level - 1), 32);
    const interval = 1000 / clicksPerSecond;
    let lastClick = performance.now();
    let animationFrameId: number;

    const autoClick = (currentTime: number) => {
      if (currentTime - lastClick >= interval) {
        const newClickCount = clickCount + 1;
        setClickCount(newClickCount);
        
        const gemsEarned = Math.floor(newClickCount / CLICKS_THRESHOLD_FOR_GEM) - Math.floor(clickCount / CLICKS_THRESHOLD_FOR_GEM);
        
        if (gemsEarned > 0) {
          playGemEarnedSound();
        }
        
        dispatch({ 
          type: 'CLICK_BLACK_HOLE',
          payload: { gemsEarned }
        });
        
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
  }, [blackHole.autoClicker?.level, clickCount]);

  const handleUpgrade = () => {
    playUpgradeSound();
    dispatch({ type: 'UPGRADE_BLACK_HOLE' });
  };

  const handleAutoClickerUpgrade = () => {
    if (blackHole.autoClicker.level >= MAX_AUTO_CLICKER_LEVEL) return;
    playUpgradeSound();
    dispatch({ type: 'UPGRADE_BLACK_HOLE_AUTO_CLICKER' });
  };

  // Calculate upgrade costs and values
  const upgradeCost = Math.floor(1000 * Math.pow(2, blackHole.level - 1));
  const autoClickerUpgradeCost = blackHole.autoClicker.level === 0 
    ? 5_000_000 
    : Math.floor(5_000_000 * Math.pow(2, blackHole.autoClicker.level));

  const isAutoClickerMaxed = blackHole.autoClicker.level >= MAX_AUTO_CLICKER_LEVEL;

  // Calculate click value with boosts
  const getClickValue = () => {
    const baseValue = Math.floor(10 * Math.pow(1.5, state.blackHole.level - 1));
    const clickBoost = state.activeBoosts.clickPower?.endsAt && state.activeBoosts.clickPower.endsAt > Date.now()
      ? state.activeBoosts.clickPower.multiplier
      : 1;
    return Math.floor(baseValue * clickBoost);
  };

  const rawClickValue = getClickValue();
  const clicksPerSecond = blackHole.autoClicker.level === 0 
    ? 0 
    : Math.min(Math.pow(2, blackHole.autoClicker.level - 1), 32);
  const clicksPerMinute = clicksPerSecond * 60;
  const moneyPerMinute = rawClickValue * clicksPerSecond * 60;
  const gemsPerMinute = Math.floor((clicksPerMinute / CLICKS_THRESHOLD_FOR_GEM) || 0);

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 flex flex-col items-center">
      <h2 className="text-xl font-bold text-gray-200 mb-2">Cosmic Void</h2>
      <div className="text-sm text-gray-400 mb-4">Level {blackHole.level}</div>
      
      {/* Clickable Black Hole */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        animate={{ scale: blackHole.autoClicker.level < 4 && isClicking ? 0.95 : 1 }}
        onClick={handleClick}
        className="w-[150px] h-[150px] relative mb-4 group"
      >
        {blackHole.autoClicker.level >= 4 && (
          <motion.div
            className="absolute inset-0 rounded-full bg-pink-500/20"
            animate={{
              boxShadow: [
                '0 0 20px 10px rgba(255, 186, 255, 0.2)',
                '0 0 40px 20px rgba(255, 186, 255, 0.4)',
                '0 0 20px 10px rgba(255, 186, 255, 0.2)'
              ],
              scale: [0.55, 0.55, 0.55]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
        <motion.img
          src="/images/blackhole.png"
          alt="Black Hole"
          className="w-full h-full object-contain relative z-10"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <span className="text-cyan-400 font-bold text-lg">+${formatNumber(rawClickValue)}</span>
        </div>
      </motion.button>

      {/* Stats */}
      <div className="w-full space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Click Value: ${formatNumber(rawClickValue)}
          </div>
          {blackHole.autoClicker.level > 0 && (
            <div className="text-sm text-cyan-400">
              {formatNumber(clicksPerSecond)}/s
            </div>
          )}
        </div>
        {blackHole.autoClicker.level > 0 && (
          <div className="flex justify-between items-center">
            <div className="text-sm text-fuchsia-400 flex items-center gap-1">
              <FaGem className="text-sm" /> {gemsPerMinute}/min
            </div>
            <div className="text-sm text-green-400">
              ${formatNumber(moneyPerMinute)}/min
            </div>
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
          disabled={state.money < autoClickerUpgradeCost || isAutoClickerMaxed}
          className={`w-full px-4 py-2 rounded ${
            isAutoClickerMaxed 
              ? 'bg-gray-500/10 border border-gray-500/30 cursor-not-allowed' 
              : 'bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20'
          } transition-all duration-300 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {blackHole.autoClicker.level === 0 ? (
            <>Unlock Auto-Clicker</>
          ) : isAutoClickerMaxed ? (
            <div className="text-gray-400">MAXED</div>
          ) : (
            <>Upgrade Auto-Clicker</>
          )}
          {!isAutoClickerMaxed && (
            <div>
              (${formatNumber(autoClickerUpgradeCost)})
            </div>
          )}
        </button>
      </div>
    </div>
  );
} 