'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toggleBackgroundMusic, resetAudio, initializeMusic } from '../utils/sounds';

type Settings = {
  soundEnabled: boolean;
  musicEnabled: boolean;
  musicInitialized: boolean;
};

const SettingsContext = createContext<{
  settings: Settings;
  toggleSound: () => void;
  toggleMusic: () => void;
  initializeMusic: () => void;
}>({
  settings: {
    soundEnabled: true,
    musicEnabled: true,
    musicInitialized: false
  },
  toggleSound: () => {},
  toggleMusic: () => {},
  initializeMusic: () => {}
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    // Load settings from localStorage if available
    const savedSettings = localStorage.getItem('gameSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      soundEnabled: true,
      musicEnabled: true,
      musicInitialized: false
    };
  });

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('gameSettings', JSON.stringify(settings));
  }, [settings]);

  const toggleSound = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      soundEnabled: !prev.soundEnabled
    }));
  }, []);

  const toggleMusic = useCallback(() => {
    // Only try to play music if it's being enabled
    if (!settings.musicEnabled) {
      setSettings(prev => ({
        ...prev,
        musicEnabled: true,
        musicInitialized: true
      }));
      initializeMusic();
    } else {
      setSettings(prev => ({
        ...prev,
        musicEnabled: false
      }));
    }
  }, [settings.musicEnabled]);

  // Initialize music only after first user interaction
  const initializeMusicAfterInteraction = useCallback(() => {
    if (!settings.musicInitialized && settings.musicEnabled) {
      initializeMusic();
      setSettings(prev => ({
        ...prev,
        musicInitialized: true
      }));
    }
  }, [settings.musicInitialized, settings.musicEnabled]);

  return (
    <SettingsContext.Provider value={{ settings, toggleSound, toggleMusic, initializeMusic: initializeMusicAfterInteraction }}>
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