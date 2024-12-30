import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { GlobalUpgradeType } from '../types/game';
import { formatNumber } from '../utils/formatters';
import { IoChevronDown } from 'react-icons/io5';
import { playButtonSound, playUpgradeSound } from '../utils/sounds';

interface UpgradeCardProps {
  title: string;
  description: string;
  type: GlobalUpgradeType;
  level: number;
  multiplier: number;
  isOpen: boolean;
  onToggle: () => void;
}

function UpgradeCard({ title, description, type, level, multiplier, isOpen, onToggle }: UpgradeCardProps) {
  const { state, dispatch } = useGame();
  
  const getUpgradeCost = () => {
    return Math.floor(10000 * Math.pow(2, level - 1));
  };

  const getNextMultiplier = () => {
    const baseIncrease = type === 'storageOptimization' ? 0.10 : 0.05;
    return 1 + ((level) * baseIncrease);
  };

  const handleUpgrade = () => {
    if (state.money >= getUpgradeCost()) {
      playUpgradeSound();
      dispatch({ type: 'UPGRADE_GLOBAL', payload: { upgradeType: type } });
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700">
      <button
        className="w-full px-4 py-3 flex items-center justify-between text-left"
        onClick={() => {
          playButtonSound();
          onToggle();
        }}
      >
        <div>
          <h3 className="text-lg font-bold text-gray-300">{title}</h3>
          <p className="text-sm text-gray-400">Level {level}</p>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-400"
        >
          <IoChevronDown className="text-xl" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="p-3 bg-gray-900/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">{description}</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-cyan-400">Current: {(multiplier * 100).toFixed(0)}%</span>
                  <span className="text-green-400">Next: {(getNextMultiplier() * 100).toFixed(0)}%</span>
                </div>
              </div>
              
              <button
                className="w-full mt-3 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 
                         hover:bg-cyan-500/20 transition-all duration-300 disabled:opacity-50 
                         disabled:cursor-not-allowed"
                onClick={handleUpgrade}
                disabled={state.money < getUpgradeCost()}
              >
                <div className="text-sm font-bold text-gray-300">Upgrade</div>
                <div className="text-xs text-cyan-400/75">${formatNumber(getUpgradeCost())}</div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function GlobalUpgrades() {
  const { state } = useGame();
  const [openCard, setOpenCard] = useState<GlobalUpgradeType | null>(null);

  const upgrades = [
    {
      type: 'materialValue' as GlobalUpgradeType,
      title: 'Material Value',
      description: 'Increases the value of all materials produced by your nodes.',
      level: state.globalUpgrades.materialValue.level,
      multiplier: state.globalUpgrades.materialValue.multiplier,
    },
    {
      type: 'nodeEfficiency' as GlobalUpgradeType,
      title: 'Node Efficiency',
      description: 'Increases the production speed of all nodes.',
      level: state.globalUpgrades.nodeEfficiency.level,
      multiplier: state.globalUpgrades.nodeEfficiency.multiplier,
    },
    {
      type: 'storageOptimization' as GlobalUpgradeType,
      title: 'Storage Optimization',
      description: 'Increases the capacity bonus from Loading Dock upgrades.',
      level: state.globalUpgrades.storageOptimization.level,
      multiplier: state.globalUpgrades.storageOptimization.multiplier,
    },
  ];

  return (
    <div className="space-y-3">
      {upgrades.map((upgrade) => (
        <UpgradeCard
          key={upgrade.type}
          {...upgrade}
          isOpen={openCard === upgrade.type}
          onToggle={() => setOpenCard(openCard === upgrade.type ? null : upgrade.type)}
        />
      ))}
    </div>
  );
} 