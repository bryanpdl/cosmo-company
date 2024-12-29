import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Node as NodeType } from '../types/game';
import { useGame } from '../context/GameContext';
import { formatNumber } from '../utils/formatters';

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
    const productionPerMs = (node.productionRate * node.level.production * baseSpeed) / 1000;

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
  }, [node, dispatch]);

  if (!node.isUnlocked) {
    return (
      <div className="flex flex-col p-6 bg-gray-800/30 rounded-lg border border-gray-700/50 backdrop-blur-sm">
        <motion.div
          className="opacity-50 cursor-pointer"
          whileHover={{ scale: 1.02 }}
          onClick={() => dispatch({ type: 'UNLOCK_NODE', payload: { nodeId: node.id } })}
        >
          <h3 className="text-xl font-bold text-gray-400">{node.name}</h3>
          <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
            <p className="text-sm text-gray-500 mb-2">Unlock Cost</p>
            <p className="text-2xl font-bold text-gray-400">${formatNumber(node.unlockCost)}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative p-6 bg-gray-800/30 rounded-lg border border-gray-700/50 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-xl font-bold bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent">
          {node.name}
        </h3>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full bg-${node.material.color}-500`} />
            <span className="text-sm text-gray-400">Speed Lv.{node.level.production}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full bg-purple-500`} />
            <span className="text-sm text-gray-400">Value Lv.{node.level.value}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Production</span>
          <motion.span 
            className="text-lg font-bold text-gray-300"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {Math.floor(progress)}%
          </motion.span>
        </div>
        <div className="relative h-3 bg-gray-900/50 rounded-full overflow-hidden">
          <motion.div
            className={`absolute h-full bg-${node.material.color}-500/50`}
            style={{ width: `${progress}%` }}
          />
          <div className={`absolute h-full bg-gradient-to-r from-transparent via-${node.material.color}-400/20 to-transparent`}
               style={{ width: '200%', left: '-50%', animation: 'shimmer 2s linear infinite' }} />
          {/* Glow Effect */}
          <motion.div
            className={`absolute inset-0 bg-${node.material.color}-500`}
            style={{
              width: `${progress}%`,
              opacity: 0.3 + (progress / 200), // Starts at 0.3 opacity and increases to 0.8
              animation: 'progressGlow 2s ease-in-out infinite',
              filter: `blur(${3 + (progress / 20)}px)`, // Blur increases more with progress
              boxShadow: `0 0 ${10 + (progress / 5)}px ${2 + (progress / 10)}px ${node.material.color}`,
            }}
          />
        </div>
      </div>

      {/* Upgrade Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          className={`p-3 rounded-lg bg-${node.material.color}-500/10 border border-${node.material.color}-500/30 
                     hover:bg-${node.material.color}-500/20 transition-all duration-300 disabled:opacity-50 
                     disabled:cursor-not-allowed group`}
          onClick={() => dispatch({
            type: 'UPGRADE_NODE',
            payload: { nodeId: node.id, upgradeType: 'production' }
          })}
          disabled={state.money < getUpgradeCost('production')}
        >
          <div className="text-sm font-bold text-gray-300 group-hover:text-white">Speed +</div>
          <div className={`text-xs text-${node.material.color}-400/75`}>
            ${formatNumber(getUpgradeCost('production'))}
          </div>
        </button>
        <button
          className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 
                     hover:bg-purple-500/20 transition-all duration-300 disabled:opacity-50 
                     disabled:cursor-not-allowed group"
          onClick={() => dispatch({
            type: 'UPGRADE_NODE',
            payload: { nodeId: node.id, upgradeType: 'value' }
          })}
          disabled={state.money < getUpgradeCost('value')}
        >
          <div className="text-sm font-bold text-gray-300 group-hover:text-white">Value +</div>
          <div className="text-xs text-purple-400/75">
            ${formatNumber(getUpgradeCost('value'))}
          </div>
        </button>
      </div>
    </div>
  );
} 