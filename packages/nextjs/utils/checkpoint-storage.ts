/**
 * Utility functions for managing game checkpoints in localStorage
 * Handles saving, loading, and clearing checkpoint data
 */

export interface CheckpointData {
  gameId: string;
  boardArray: number[];
  moves: number;
  score: number;
  timestamp: number;
  address: string; // Player address
}

const CHECKPOINT_KEY = "2048wars_checkpoint";

/**
 * Save checkpoint data to localStorage
 */
export const saveCheckpointToStorage = (data: CheckpointData): void => {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(CHECKPOINT_KEY, serialized);
    console.log("💾 Checkpoint saved to localStorage:", {
      gameId: data.gameId,
      moves: data.moves,
      score: data.score,
      timestamp: new Date(data.timestamp).toISOString(),
    });
  } catch (error) {
    console.error("❌ Failed to save checkpoint to localStorage:", error);
  }
};

/**
 * Load checkpoint data from localStorage
 */
export const loadCheckpointFromStorage = (): CheckpointData | null => {
  try {
    const serialized = localStorage.getItem(CHECKPOINT_KEY);
    if (!serialized) {
      console.log("📭 No checkpoint found in localStorage");
      return null;
    }

    const data = JSON.parse(serialized) as CheckpointData;

    // Validate checkpoint data
    if (
      !data.gameId ||
      !Array.isArray(data.boardArray) ||
      typeof data.moves !== "number" ||
      typeof data.score !== "number"
    ) {
      console.warn("⚠️ Invalid checkpoint data in localStorage, clearing...");
      clearCheckpointFromStorage();
      return null;
    }

    console.log("📂 Checkpoint loaded from localStorage:", {
      gameId: data.gameId,
      moves: data.moves,
      score: data.score,
      timestamp: new Date(data.timestamp).toISOString(),
      age: Date.now() - data.timestamp,
    });

    return data;
  } catch (error) {
    console.error("❌ Failed to load checkpoint from localStorage:", error);
    clearCheckpointFromStorage();
    return null;
  }
};

/**
 * Clear checkpoint data from localStorage
 */
export const clearCheckpointFromStorage = (): void => {
  try {
    localStorage.removeItem(CHECKPOINT_KEY);
    console.log("🗑️ Checkpoint cleared from localStorage");
  } catch (error) {
    console.error("❌ Failed to clear checkpoint from localStorage:", error);
  }
};

/**
 * Check if checkpoint exists and is recent (within 24 hours)
 */
export const isCheckpointRecent = (checkpoint: CheckpointData | null): boolean => {
  if (!checkpoint) return false;

  const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const age = Date.now() - checkpoint.timestamp;

  return age < maxAge;
};

/**
 * Get checkpoint age in human-readable format
 */
export const getCheckpointAge = (checkpoint: CheckpointData | null): string => {
  if (!checkpoint) return "No checkpoint";

  const age = Date.now() - checkpoint.timestamp;
  const minutes = Math.floor(age / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
};
