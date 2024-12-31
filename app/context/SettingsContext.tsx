'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toggleBackgroundMusic, resetAudio, initializeMusic } from '../utils/sounds';

type Settings = {
  soundEnabled: boolean;
  musicEnabled: boolean;
};

const SettingsContext = createContext<{
  settings: Settings;
  toggleSound: () => void;
  toggleMusic: () => void;
}>({
  settings: {
    soundEnabled: true,
    musicEnabled: false
  },
  toggleSound: () => {},
  toggleMusic: () => {}
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    // Only access localStorage in the browser
    if (typeof window === 'undefined') {
      return {
        soundEnabled: true,
        musicEnabled: false
      };
    }

    // Load settings from localStorage if available
    const savedSettings = localStorage.getItem('gameSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      soundEnabled: true,
      musicEnabled: false
    };
  });

  // Save settings to localStorage when they change (only in browser)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gameSettings', JSON.stringify(settings));
    }
  }, [settings]);

  const toggleSound = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      soundEnabled: !prev.soundEnabled
    }));
  }, []);

  const toggleMusic = useCallback(() => {
    if (!settings.musicEnabled) {
      // Turning music on
      setSettings(prev => ({
        ...prev,
        musicEnabled: true
      }));
      initializeMusic();
    } else {
      // Turning music off
      setSettings(prev => ({
        ...prev,
        musicEnabled: false
      }));
      toggleBackgroundMusic(false);
    }
  }, [settings.musicEnabled]);

  return (
    <SettingsContext.Provider value={{ settings, toggleSound, toggleMusic }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
} 