import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { GameState, Node as GameNode } from '../types/game';
import { initialNodes } from '../context/GameContext';

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
  try {
    const docRef = doc(db, 'users', userId, 'gameState', 'current');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as GameState;
      
      // Ensure all nodes exist by merging with initialNodes
      const existingNodes = data.nodes || [];
      const mergedNodes = initialNodes.map((initialNode: GameNode, index: number) => {
        const existingNode = existingNodes.find(n => n.id === initialNode.id);
        return existingNode ? {
          ...existingNode,
          // Always use the latest name and material data
          name: initialNode.name,
          material: initialNode.material
        } : {
          ...initialNode,
          isUnlocked: index === 0,
          level: { production: 1, value: 1 }
        };
      });
      
      // Initialize or migrate properties for existing users
      const migratedState = {
        ...data,
        nodes: mergedNodes,
        loadingDock: {
          capacity: data.loadingDock.capacity,
          stored: data.loadingDock.stored,
          level: data.loadingDock.level,
          hasManager: data.loadingDock.hasManager ?? false,
        },
        blackHole: {
          level: data.blackHole?.level ?? 1,
          autoClicker: data.blackHole?.autoClicker ?? {
            level: 0,
            clicksPerSecond: 0
          }
        },
        activeBoosts: data.activeBoosts ?? {},
        cosmicGems: data.cosmicGems ?? 0,
      };

      // If state was updated, save the changes
      if (JSON.stringify(data) !== JSON.stringify(migratedState)) {
        await saveGameState(userId, migratedState);
      }

      return migratedState;
    }
    return null;
  } catch (error) {
    console.error('Error loading game state:', error);
    return null;
  }
}

export async function initializeUser(userId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    const initialState: GameState = {
      money: 0,
      cosmicGems: 0,
      nodes: initialNodes,
      loadingDock: {
        capacity: 100,
        stored: {},
        level: 1,
        hasManager: false,
      },
      globalUpgrades: {
        materialValue: { level: 1, multiplier: 1 },
        nodeEfficiency: { level: 1, multiplier: 1 },
        storageOptimization: { level: 1, multiplier: 1 },
      },
      blackHole: {
        level: 1,
        autoClicker: {
          level: 1,
          clicksPerSecond: 0,
        },
      },
      activeBoosts: {},
    };

    await setDoc(userRef, initialState);
  }
} 