// Sound effect paths
const SOUND_EFFECTS = {
  buttonClick: '/sounds/button-click.wav',
  upgrade: '/sounds/upgrade.wav',
  sell: '/sounds/sell.wav',
  unlock: '/sounds/unlock.wav',
  fullAlert: '/sounds/full-alert.wav',
  blackholeClick: '/sounds/blackhole-click3.wav',
} as const;

const MUSIC_TRACKS = {
  ambient: '/sounds/ambient.mp3',
} as const;

type SoundEffect = keyof typeof SOUND_EFFECTS;
type MusicTrack = keyof typeof MUSIC_TRACKS;

// Cache for audio objects
const audioCache: { [key: string]: HTMLAudioElement } = {};
const musicCache: { [key: string]: HTMLAudioElement } = {};

// Initialize audio objects
function initializeAudio(effect: SoundEffect): HTMLAudioElement {
  if (!audioCache[effect]) {
    const audio = new Audio(SOUND_EFFECTS[effect]);
    audio.preload = 'auto';
    audioCache[effect] = audio;
  }
  return audioCache[effect]!;
}

// Initialize music
export function initializeMusic() {
  if (!musicCache['ambient']) {
    const audio = new Audio(MUSIC_TRACKS.ambient);
    audio.loop = true;
    audio.volume = 0.3;
    musicCache['ambient'] = audio;
  }
  toggleBackgroundMusic(true);
}

// Toggle background music
export function toggleBackgroundMusic(enabled: boolean) {
  const audio = musicCache['ambient'];
  if (audio) {
    if (enabled) {
      audio.play().catch(error => console.error('Error playing music:', error));
    } else {
      audio.pause();
    }
  }
}

// Check if sound is enabled in settings
function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const settings = localStorage.getItem('gameSettings');
  if (!settings) return true; // Default to enabled if no settings
  try {
    const { soundEnabled } = JSON.parse(settings);
    return soundEnabled;
  } catch {
    return true; // Default to enabled if settings are invalid
  }
}

// Check if music is enabled in settings
function isMusicEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const settings = localStorage.getItem('gameSettings');
  if (!settings) return true; // Default to enabled if no settings
  try {
    const { musicEnabled } = JSON.parse(settings);
    return musicEnabled;
  } catch {
    return true; // Default to enabled if settings are invalid
  }
}

// Play a sound effect
export function playSound(effect: SoundEffect): void {
  if (!isSoundEnabled()) return;

  try {
    const audio = initializeAudio(effect);
    
    // Reset and play
    audio.currentTime = 0;
    audio.volume = 0.3; // Adjust default volume
    audio.play().catch(error => {
      console.error('Error playing sound:', error);
    });
  } catch (error) {
    console.error('Error initializing sound:', error);
  }
}

// Reset all audio
export function resetAudio(): void {
  // Reset all sound effects
  Object.values(audioCache).forEach(audio => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  });

  // Reset music
  Object.values(musicCache).forEach(audio => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  });
}

// Utility function to play button click sound
export function playButtonSound(): void {
  playSound('buttonClick');
}

// Utility function to play upgrade sound
export function playUpgradeSound(): void {
  playSound('upgrade');
}

// Utility function to play sell sound
export function playSellSound(): void {
  playSound('sell');
}

// Utility function to play unlock sound
export function playUnlockSound(): void {
  playSound('unlock');
}

export function playFullAlertSound(): void {
  playSound('fullAlert');
}

export function playBlackholeClickSound() {
  playSound('blackholeClick');
} 