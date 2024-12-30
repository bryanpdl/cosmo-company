'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toggleBackgroundMusic, resetAudio } from '../utils/sounds';

interface Settings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  musicInitialized: boolean;
}

interface SettingsContextType {
  settings: Settings;
  toggleSound: () => void;
  toggleMusic: () => void;
  initializeMusic: () => void;
}

const defaultSettings: Settings = {
  soundEnabled: true,
  musicEnabled: true,
  musicInitialized: false,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    // Load settings from localStorage on initial render
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('gameSettings');
      if (savedSettings) {
        try {
          return JSON.parse(savedSettings);
        } catch {
          return defaultSettings;
        }
      }
    }
    return defaultSettings;
  });

  // Update background music when music settings change
  useEffect(() => {
    if (settings.musicInitialized) {
      toggleBackgroundMusic(settings.musicEnabled);
    }
  }, [settings.musicEnabled, settings.musicInitialized]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('gameSettings', JSON.stringify(settings));
  }, [settings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetAudio();
    };
  }, []);

  const toggleSound = () => {
    setSettings(prev => ({
      ...prev,
      soundEnabled: !prev.soundEnabled
    }));
  };

  const toggleMusic = () => {
    setSettings(prev => ({
      ...prev,
      musicEnabled: !prev.musicEnabled
    }));
  };

  const initializeMusic = () => {
    if (!settings.musicInitialized) {
      setSettings(prev => ({
        ...prev,
        musicInitialized: true
      }));
      if (settings.musicEnabled) {
        toggleBackgroundMusic(true);
      }
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, toggleSound, toggleMusic, initializeMusic }}>
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