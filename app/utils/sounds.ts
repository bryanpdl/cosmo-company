// Sound effect paths
const SOUND_EFFECTS = {
  buttonClick: '/sounds/button-click.wav',
  upgrade: '/sounds/upgrade.wav',
  sell: '/sounds/sell.wav',
  unlock: '/sounds/unlock.wav',
} as const;

const MUSIC_TRACKS = {
  ambient: '/sounds/ambient.mp3',
} as const;

type SoundEffect = keyof typeof SOUND_EFFECTS;
type MusicTrack = keyof typeof MUSIC_TRACKS;

// Cache for audio objects
const audioCache: { [K in SoundEffect]?: HTMLAudioElement } = {};
const musicCache: { [K in MusicTrack]?: HTMLAudioElement } = {};

// Initialize audio objects
function initializeAudio(effect: SoundEffect): HTMLAudioElement {
  if (!audioCache[effect]) {
    const audio = new Audio(SOUND_EFFECTS[effect]);
    audio.preload = 'auto';
    audioCache[effect] = audio;
  }
  return audioCache[effect]!;
}

// Initialize music objects
function initializeMusic(track: MusicTrack): HTMLAudioElement {
  if (!musicCache[track]) {
    const audio = new Audio(MUSIC_TRACKS[track]);
    audio.preload = 'auto';
    audio.loop = true;
    audio.volume = 0.15; // Lower volume for background music
    musicCache[track] = audio;
  }
  return musicCache[track]!;
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

// Play or pause background music
export function toggleBackgroundMusic(shouldPlay: boolean): void {
  try {
    const audio = initializeMusic('ambient');
    
    if (shouldPlay) {
      audio.play().catch(error => {
        console.error('Error playing background music:', error);
      });
    } else {
      audio.pause();
      audio.currentTime = 0; // Reset to beginning
    }
  } catch (error) {
    console.error('Error handling background music:', error);
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