import React from 'react';
import { useGame } from '../context/GameContext';
import { BoostType } from '../types/game';
import { FaGem, FaClock, FaBolt, FaCoins } from 'react-icons/fa';
import { playUpgradeSound } from '../utils/sounds';

interface BoostConfig {
  type: BoostType;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  cost: number;
}

const boostConfigs: (BoostConfig & { cost: number })[] = [
  {
    type: 'materialValue',
    name: '2X Material Value',
    description: 'Double the value of all materials for 30 seconds',
    icon: <FaCoins className="text-yellow-400" />,
    color: 'yellow',
    cost: 25,
  },
  {
    type: 'productionSpeed',
    name: '3X Production Speed',
    description: 'Triple production speed for 20 seconds',
    icon: <FaBolt className="text-blue-400" />,
    color: 'blue',
    cost: 50,
  },
  {
    type: 'clickPower',
    name: '5X Click Power',
    description: 'Quintuple black hole click value for 15 seconds',
    icon: <FaClock className="text-purple-400" />,
    color: 'fuchsia',
    cost: 75,
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function BoostsModal({ isOpen, onClose }: Props) {
  const { state, dispatch } = useGame();
  const { cosmicGems, activeBoosts } = state;

  const handleActivateBoost = (boostType: BoostType, cost: number) => {
    if (cosmicGems >= cost) {
      if (activeBoosts[boostType]?.endsAt && activeBoosts[boostType]!.endsAt! > Date.now()) {
        return;
      }
      
      playUpgradeSound();
      dispatch({ type: 'ACTIVATE_BOOST', payload: { boostType, cost } });
      
      dispatch({ type: 'SAVE_GAME_STATE' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-200">Boosts</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            ✕
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4 text-fuchsia-400">
          <FaGem />
          <span className="font-medium">{cosmicGems} Cosmic Gems</span>
        </div>

        <div className="space-y-4">
          {boostConfigs.map((boost) => {
            const isActive = activeBoosts[boost.type];
            const timeLeft = isActive ? Math.max(0, Math.ceil((activeBoosts[boost.type]!.endsAt! - Date.now()) / 1000)) : 0;

            return (
              <div 
                key={boost.type}
                className="bg-gray-700/50 border border-gray-600 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {boost.icon}
                    <div>
                      <h3 className="font-medium text-gray-200">{boost.name}</h3>
                      <p className="text-sm text-gray-400">{boost.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-fuchsia-400">
                    <span>{boost.cost}</span>
                    <FaGem className="text-sm" />
                  </div>
                </div>

                {isActive ? (
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-${boost.color}-500/50 transition-all duration-300`}
                      style={{ 
                        width: `${(timeLeft / activeBoosts[boost.type]!.duration) * 100}%`,
                      }}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => handleActivateBoost(boost.type, boost.cost)}
                    disabled={cosmicGems < boost.cost}
                    className={`w-full px-3 py-1.5 rounded bg-${boost.color}-500/10 border border-${boost.color}-500/30 
                              hover:bg-${boost.color}-500/20 transition-all duration-300 text-gray-300 
                              hover:text-white disabled:opacity-50 disabled:cursor-not-allowed mt-2`}
                  >
                    Activate
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 