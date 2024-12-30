import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { GameState } from '../types/game';

export interface SavedGameState extends GameState {
  lastUpdated: any; // FirebaseTimestamp
  version: number;
  clientTimestamp?: number; // Client-side timestamp for version control
}

const CURRENT_VERSION = 1;

export async function saveGameState(userId: string, gameState: GameState): Promise<void> {
  console.log('Starting save operation for user:', userId);
  
  if (!userId) {
    console.error('No userId provided for save operation');
    throw new Error('No userId provided');
  }

  const gameStateDoc = doc(db, 'users', userId, 'gameState', 'current');
  const userDoc = doc(db, 'users', userId);
  
  // Add a client-side timestamp for version control
  const clientTimestamp = Date.now();
  const savedState: SavedGameState = {
    ...gameState,
    lastUpdated: serverTimestamp(),
    clientTimestamp,
    version: CURRENT_VERSION,
  };

  try {
    // Check if there's a more recent save with significantly different state
    const currentDoc = await getDoc(gameStateDoc);
    if (currentDoc.exists()) {
      const currentState = currentDoc.data() as SavedGameState;
      if (currentState.clientTimestamp && currentState.clientTimestamp > clientTimestamp) {
        // Compare important state values to determine if we should skip
        const isStateSimilar = 
          currentState.money === savedState.money &&
          currentState.loadingDock.level === savedState.loadingDock.level &&
          JSON.stringify(currentState.nodes) === JSON.stringify(savedState.nodes);
        
        if (isStateSimilar) {
          console.log('Skipping save - more recent state exists and is similar');
          return;
        }
      }
    }

    console.log('Preparing to save state:', {
      money: savedState.money,
      docksLevel: savedState.loadingDock.level,
      nodes: savedState.nodes.map(n => ({ id: n.id, level: n.level })),
      timestamp: new Date(clientTimestamp).toISOString()
    });

    // Update game state
    console.log('Saving game state...');
    await setDoc(gameStateDoc, savedState);
    console.log('Game state saved successfully');
    
    // Update last saved timestamp in user doc
    console.log('Updating user document...');
    await setDoc(userDoc, { lastSaved: serverTimestamp() }, { merge: true });
    console.log('User document updated successfully');
  } catch (error) {
    console.error('Error saving game state:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

export async function loadGameState(userId: string): Promise<GameState | null> {
  const gameStateDoc = doc(db, 'users', userId, 'gameState', 'current');
  
  try {
    const docSnap = await getDoc(gameStateDoc);
    if (docSnap.exists()) {
      const savedState = docSnap.data() as SavedGameState;
      
      // Migrate old states to include new upgrades and remove deprecated ones
      const migratedGlobalUpgrades = {
        materialValue: savedState.globalUpgrades.materialValue,
        nodeEfficiency: savedState.globalUpgrades.nodeEfficiency,
        storageOptimization: savedState.globalUpgrades.storageOptimization || {
          level: 1,
          multiplier: 1,
        }
      };

      // Migrate node names to remove "Generator" suffix
      const migratedNodes = savedState.nodes.map(node => ({
        ...node,
        name: node.material.name
      }));

      // Add hasManager field if it doesn't exist
      const migratedLoadingDock = {
        ...savedState.loadingDock,
        hasManager: 'hasManager' in savedState.loadingDock ? savedState.loadingDock.hasManager : false
      };

      // Create migrated state with updated nodes, upgrades, and loading dock
      const migratedState = {
        ...savedState,
        globalUpgrades: migratedGlobalUpgrades,
        nodes: migratedNodes,
        loadingDock: migratedLoadingDock
      };
      
      // Save the migrated state back to Firebase to clean up old fields
      await setDoc(gameStateDoc, migratedState);

      return migratedState;
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