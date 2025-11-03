/**
 * Utility to clear corrupted checkpoint data
 * Run this in browser console: clearCorruptedCheckpoints()
 */

export function clearCorruptedCheckpoints() {
  const keys = Object.keys(localStorage);
  let cleared = 0;

  keys.forEach(key => {
    if (key.includes("game-") && (key.includes("-checkpoint") || key.includes("-moves"))) {
      localStorage.removeItem(key);
      cleared++;
      console.log(`🗑️ Cleared: ${key}`);
    }
  });

  console.log(`✅ Cleared ${cleared} checkpoint items`);
  console.log("Please refresh the page and start a new game");
}

// Make it available globally in dev
if (typeof window !== "undefined") {
  (window as any).clearCorruptedCheckpoints = clearCorruptedCheckpoints;
}
