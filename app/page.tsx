'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GameProvider } from './context/GameContext';
import { Node } from './components/Node';
import { LoadingDock } from './components/LoadingDock';
import { GlobalUpgrades } from './components/GlobalUpgrades';
import { Modal } from './components/Modal';
import { useGame } from './context/GameContext';
import { formatNumber } from './utils/formatters';
import { FaFlask, FaUserAstronaut, FaVolumeMute, FaVolumeUp, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from './context/AuthContext';
import { ParticleBackground } from './components/ParticleBackground';
import { useSettings } from './context/SettingsContext';
import { playButtonSound } from './utils/sounds';

function GameContent() {
  const { state, isLoading } = useGame();
  const { user, signInWithGoogle, signOutUser } = useAuth();
  const { settings, toggleSound, initializeMusic, toggleMusic } = useSettings();
  const { nodes, money } = state;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isResearchOpen, setIsResearchOpen] = useState(false);

  // Initialize music when user signs in
  useEffect(() => {
    if (user && !settings.musicInitialized) {
      initializeMusic();
    }
  }, [user, settings.musicInitialized, initializeMusic]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button
          onClick={signInWithGoogle}
          className="px-6 py-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 
                   hover:bg-cyan-500/20 transition-all duration-300 text-gray-300 
                   hover:text-white flex items-center gap-2"
        >
          <FaUserAstronaut className="text-xl" />
          Sign In with Google
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl text-cyan-400 flex items-center gap-4"
        >
          <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin" />
          Loading Game...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <ParticleBackground />
      {/* Header */}
      <div className="max-w-7xl mx-auto flex justify-between items-start mb-8">
        <div>
          <motion.h1
            className="text-4xl font-bold bg-gradient-to-r from-cyan-200 via-cyan-400 to-cyan-200 
                       bg-clip-text text-transparent text-left bg-[length:200%_auto] sm-text-2xl"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{ animation: 'gradientMove 3s linear infinite' }}
          >
            Cosmo Company
          </motion.h1>
          <motion.div
            className="text-2xl font-bold mt-2 text-left"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            ${formatNumber(money)}
          </motion.div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-4">
          {/* Research Button */}
          <button
            onClick={() => {
              playButtonSound();
              setIsResearchOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 
                     hover:bg-cyan-500/20 transition-all duration-300 text-gray-300 
                     hover:text-white flex items-center gap-2"
          >
            <FaFlask className="text-lg" />
            Research
          </button>

          {/* Avatar & Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                playButtonSound();
                setIsDropdownOpen(!isDropdownOpen);
              }}
              className="w-12 h-12 rounded-full bg-gray-800 border-2 border-gray-700 hover:border-cyan-500/50 
                       transition-colors duration-300 flex items-center justify-center"
            >
              {user ? (
                <img
                  src={user.photoURL || undefined}
                  alt={user.displayName || 'User'}
                  className="w-full h-full rounded-full"
                />
              ) : (
                <FaUserAstronaut className="text-2xl" />
              )}
            </button>
            
            {isDropdownOpen && (
              <div className="absolute z-50 right-0 mt-2 w-48 rounded-lg shadow-lg bg-gray-800/90 backdrop-blur-sm border border-gray-700">
                <div className="py-1">
                  <button
                    onClick={() => {
                      playButtonSound();
                      toggleSound();
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 transition-colors duration-200"
                  >
                    {settings.soundEnabled ? <FaVolumeUp className="text-cyan-400" /> : <FaVolumeMute className="text-gray-400" />}
                    {settings.soundEnabled ? 'Effects On' : 'Effects Off'}
                  </button>
                  <button
                    onClick={() => {
                      playButtonSound();
                      toggleMusic();
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 transition-colors duration-200"
                  >
                    {settings.musicEnabled ? <FaVolumeUp className="text-purple-400" /> : <FaVolumeMute className="text-gray-400" />}
                    {settings.musicEnabled ? 'Music On' : 'Music Off'}
                  </button>
                  <button
                    onClick={() => {
                      playButtonSound();
                      signOutUser();
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 transition-colors duration-200"
                  >
                    <FaSignOutAlt className="text-red-400" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Nodes Grid */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {nodes.map((node) => (
            <Node key={node.id} node={node} />
          ))}
        </div>

        {/* Loading Dock */}
        <div className="lg:col-span-1">
          <LoadingDock />
        </div>
      </div>

      {/* Research Modal */}
      <Modal
        isOpen={isResearchOpen}
        onClose={() => setIsResearchOpen(false)}
        title="Research Lab"
      >
        <GlobalUpgrades />
      </Modal>
    </div>
  );
}

export default function Home() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}
