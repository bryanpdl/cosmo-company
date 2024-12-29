import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { GameState } from '../types/game';

export interface SavedGameState extends GameState {
  lastUpdated: any; // FirebaseTimestamp
  version: number;
}

const CURRENT_VERSION = 1;

export async function saveGameState(userId: string, gameState: GameState): Promise<void> {
  const gameStateDoc = doc(db, 'users', userId, 'gameState', 'current');
  const userDoc = doc(db, 'users', userId);
  
  const savedState: SavedGameState = {
    ...gameState,
    lastUpdated: serverTimestamp(),
    version: CURRENT_VERSION,
  };

  try {
    // Update game state
    await setDoc(gameStateDoc, savedState);
    // Update last saved timestamp in user doc
    await setDoc(userDoc, { lastSaved: serverTimestamp() }, { merge: true });
  } catch (error) {
    console.error('Error saving game state:', error);
    throw error;
  }
}

export async function loadGameState(userId: string): Promise<GameState | null> {
  const gameStateDoc = doc(db, 'users', userId, 'gameState', 'current');
  
  try {
    const docSnap = await getDoc(gameStateDoc);
    if (docSnap.exists()) {
      const savedState = docSnap.data() as SavedGameState;
      // Here we could handle version migrations if needed
      return savedState;
    }
    return null;
  } catch (error) {
    console.error('Error loading game state:', error);
    throw error;
  }
}

export async function initializeUser(userId: string, displayName: string, email: string): Promise<void> {
  const userDoc = doc(db, 'users', userId);
  
  try {
    // Check if user document already exists
    const docSnap = await getDoc(userDoc);
    if (!docSnap.exists()) {
      await setDoc(userDoc, {
        uid: userId,
        displayName,
        email,
        lastSaved: serverTimestamp(),
        totalPlayTime: 0,
        joinedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error initializing user:', error);
    throw error;
  }
} 