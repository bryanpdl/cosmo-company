import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Node as NodeType } from '../types/game';
import { useGame } from '../context/GameContext';
import { formatNumber } from '../utils/formatters';
import { FaBolt, FaCoins, FaClock } from 'react-icons/fa';
import { playUpgradeSound, playUnlockSound } from '../utils/sounds';

interface NodeProps {
  node: NodeType;
}

export function Node({ node }: NodeProps) {
  const { state, dispatch } = useGame();
  const [progress, setProgress] = useState(0);
  const progressRef = React.useRef<number>(0);
  const animationRef = React.useRef<number | undefined>(undefined);

  const getUpgradeCost = (type: 'production' | 'value') => {
    const nodeIndex = state.nodes.findIndex(n => n.id === node.id);
    const baseUpgradeCost = 15 * Math.pow(2, nodeIndex); // Base cost doubles for each node
    return Math.floor(baseUpgradeCost * Math.pow(1.5, node.level[type] - 1));
  };

  useEffect(() => {
    if (!node.isUnlocked) return;

    let lastTime = performance.now();
    const nodeIndex = state.nodes.findIndex(n => n.id === node.id);
    const baseSpeed = 7 / Math.pow(1.5, nodeIndex); // Each node is 1.5x slower than the previous
    const productionSpeedBoost = state.activeBoosts.productionSpeed?.endsAt && state.activeBoosts.productionSpeed.endsAt > Date.now()
      ? state.activeBoosts.productionSpeed.multiplier
      : 1;
    const productionPerMs = (node.productionRate * node.level.production * baseSpeed * state.globalUpgrades.nodeEfficiency.multiplier * productionSpeedBoost) / 1000;

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      progressRef.current += productionPerMs * deltaTime;
      
      if (progressRef.current >= 100) {
        dispatch({
          type: 'PRODUCE_MATERIAL',
          payload: { nodeId: node.id, amount: 1 },
        });
        progressRef.current = 0;
      }

      setProgress(progressRef.current);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [node, dispatch, state.activeBoosts.productionSpeed]);

  const handleUnlock = () => {
    if (state.money >= node.unlockCost) {
      playUnlockSound();
      dispatch({ type: 'UNLOCK_NODE', payload: { nodeId: node.id } });
    }
  };

  const handleUpgrade = (upgradeType: 'production' | 'value') => {
    if (state.money >= getUpgradeCost(upgradeType)) {
      playUpgradeSound();
      dispatch({
        type: 'UPGRADE_NODE',
        payload: { nodeId: node.id, upgradeType }
      });
    }
  };

  // Calculate the current value with all multipliers
  const getCurrentValue = () => {
    const nodeValueMultiplier = 1 + (node.level.value - 1) * 0.15;
    const globalMultiplier = state.globalUpgrades.materialValue.multiplier;
    const boostMultiplier = state.activeBoosts.materialValue?.endsAt && state.activeBoosts.materialValue.endsAt > Date.now()
      ? state.activeBoosts.materialValue.multiplier
      : 1;

    return node.material.baseValue * nodeValueMultiplier * globalMultiplier * boostMultiplier;
  };

  // Display the current value
  const displayValue = formatNumber(getCurrentValue());

  return (
    <motion.div
      className="relative p-4 rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {!node.isUnlocked ? (
        <div className="text-center">
          <h3 className="text-xl font-bold mb-4">{node.name}</h3>
          <button
            className={`w-full py-2 rounded-lg border transition-all duration-300
                      ${state.money >= node.unlockCost 
                        ? 'bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                        : 'bg-gray-700/30 border-gray-600/30 hover:bg-gray-700/50'} 
                      disabled:opacity-50 disabled:cursor-not-allowed`}
            onClick={handleUnlock}
            disabled={state.money < node.unlockCost}
          >
            <div className="text-sm font-bold text-gray-300">Unlock</div>
            <div className={`text-xs ${state.money >= node.unlockCost ? 'text-cyan-400/75' : 'text-gray-400/75'}`}>
              ${formatNumber(node.unlockCost)}
            </div>
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-xl font-bold">{node.name}</h3>
            <div className="text-sm text-green-400">
              ${displayValue}
            </div>
          </div>
          <div className="flex gap-4 text-sm text-gray-400 mb-4">
            <div className="flex items-center gap-1">
              <FaBolt className="text-cyan-400" />
              Lv.{node.level.production}
            </div>
            <div className="flex items-center gap-1">
              <FaCoins className="text-purple-400" />
              Lv.{node.level.value}
            </div>
            <div className="flex items-center gap-1">
              <FaClock className="text-yellow-400" />
              {(() => {
                const nodeIndex = state.nodes.findIndex(n => n.id === node.id);
                const baseSpeed = 7 / Math.pow(1.5, nodeIndex);
                const productionSpeedBoost = state.activeBoosts.productionSpeed?.endsAt && state.activeBoosts.productionSpeed.endsAt > Date.now()
                  ? state.activeBoosts.productionSpeed.multiplier
                  : 1;
                const productionPerMs = (node.productionRate * node.level.production * baseSpeed * state.globalUpgrades.nodeEfficiency.multiplier * productionSpeedBoost) / 1000;
                const materialsPerSecond = (productionPerMs * 1000) / 100; // Convert to materials per second
                return materialsPerSecond.toFixed(1);
              })()} MPS
            </div>
          </div>

          {/* Production Progress */}
          <div className="mb-4">
            <div className="text-gray-400 flex justify-between items-center mb-2">
              <span>Production</span>
              {(() => {
                const nodeIndex = state.nodes.findIndex(n => n.id === node.id);
                const baseSpeed = 7 / Math.pow(1.5, nodeIndex);
                const productionSpeedBoost = state.activeBoosts.productionSpeed?.endsAt && state.activeBoosts.productionSpeed.endsAt > Date.now()
                  ? state.activeBoosts.productionSpeed.multiplier
                  : 1;
                const productionPerMs = (node.productionRate * node.level.production * baseSpeed * state.globalUpgrades.nodeEfficiency.multiplier * productionSpeedBoost) / 1000;
                const materialsPerSecond = (productionPerMs * 1000) / 100;
                const isHighSpeed = materialsPerSecond >= 2.0;
                return (
                  <span>{isHighSpeed ? '100' : Math.floor(progress)}%</span>
                );
              })()}
            </div>
            <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
              {(() => {
                const nodeIndex = state.nodes.findIndex(n => n.id === node.id);
                const baseSpeed = 7 / Math.pow(1.5, nodeIndex);
                const productionSpeedBoost = state.activeBoosts.productionSpeed?.endsAt && state.activeBoosts.productionSpeed.endsAt > Date.now()
                  ? state.activeBoosts.productionSpeed.multiplier
                  : 1;
                const productionPerMs = (node.productionRate * node.level.production * baseSpeed * state.globalUpgrades.nodeEfficiency.multiplier * productionSpeedBoost) / 1000;
                const materialsPerSecond = (productionPerMs * 1000) / 100;
                const isHighSpeed = materialsPerSecond >= 2.0;

                if (isHighSpeed) {
                  return (
                    <motion.div
                      className="absolute h-full w-full bg-gradient-to-r from-cyan-500/50 to-cyan-400/50"
                      animate={{
                        filter: [
                          'brightness(1) blur(0px)',
                          'brightness(1.5) blur(1px)',
                          'brightness(1) blur(0px)',
                        ],
                        opacity: [0.8, 1, 0.8]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  );
                }

                return (
                  <motion.div
                    className="absolute h-full bg-gradient-to-r from-cyan-500/50 to-cyan-400/50"
                    style={{ width: `${progress}%` }}
                    animate={{
                      filter: [
                        'brightness(1)',
                        'brightness(1.2)',
                        'brightness(1)',
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                );
              })()}
            </div>
          </div>

          {/* Upgrade Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 
                       hover:bg-cyan-500/20 transition-all duration-300 disabled:opacity-50 
                       disabled:cursor-not-allowed group"
              onClick={() => handleUpgrade('production')}
              disabled={state.money < getUpgradeCost('production')}
            >
              <div className="text-sm font-bold text-gray-300 group-hover:text-white flex items-center justify-center gap-1">
                <FaBolt className="text-cyan-400 group-hover:text-cyan-300" />
                Speed +
              </div>
              <div className="text-xs text-cyan-400/75">${formatNumber(getUpgradeCost('production'))}</div>
            </button>

            <button
              className="px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 
                       hover:bg-purple-500/20 transition-all duration-300 disabled:opacity-50 
                       disabled:cursor-not-allowed group"
              onClick={() => handleUpgrade('value')}
              disabled={state.money < getUpgradeCost('value')}
            >
              <div className="text-sm font-bold text-gray-300 group-hover:text-white flex items-center justify-center gap-1">
                <FaCoins className="text-purple-400 group-hover:text-purple-300" />
                Value +
              </div>
              <div className="text-xs text-purple-400/75">${formatNumber(getUpgradeCost('value'))}</div>
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
} 