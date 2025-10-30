/**
 * Game Recovery Prompt Component
 *
 * Shows a modal when a saved game is detected, allowing user to:
 * - Continue from checkpoint
 * - Start a new game
 */

import { useEffect, useState } from "react";
import { useGameRecovery } from "../../hooks/useGameRecovery";

interface RecoveryInfo {
  gameId: bigint;
  moveNumber: number;
  score: number;
  timestamp: number;
}

interface GameRecoveryPromptProps {
  onContinue: () => void;
  onNewGame: () => void;
  autoCheck?: boolean;
}

export function GameRecoveryPrompt({ onContinue, onNewGame, autoCheck = true }: GameRecoveryPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [recoveryInfo, setRecoveryInfo] = useState<RecoveryInfo | null>(null);
  const { checkRecoveryAvailable } = useGameRecovery();

  useEffect(() => {
    if (autoCheck) {
      checkRecoveryAvailable().then(state => {
        if (state.canRecover && state.checkpoint) {
          setRecoveryInfo({
            gameId: state.checkpoint.gameId,
            moveNumber: state.checkpoint.moveNumber,
            score: state.checkpoint.score,
            timestamp: state.checkpoint.timestamp,
          });
          setShowPrompt(true);
        } else if (state.canRecover && state.pendingMoves.length > 0) {
          // Has pending moves but no checkpoint yet
          const lastMove = state.pendingMoves[state.pendingMoves.length - 1];
          setRecoveryInfo({
            gameId: state.gameId!,
            moveNumber: lastMove.moveNumber,
            score: lastMove.score,
            timestamp: lastMove.timestamp,
          });
          setShowPrompt(true);
        }
      });
    }
  }, [autoCheck, checkRecoveryAvailable]);

  const handleContinue = () => {
    setShowPrompt(false);
    onContinue();
  };

  const handleNewGame = () => {
    setShowPrompt(false);
    onNewGame();
  };

  if (!showPrompt || !recoveryInfo) {
    return null;
  }

  const timeSince = Date.now() - recoveryInfo.timestamp;
  const minutesAgo = Math.floor(timeSince / 60000);
  const hoursAgo = Math.floor(minutesAgo / 60);
  const daysAgo = Math.floor(hoursAgo / 24);

  let timeText = "";
  if (daysAgo > 0) {
    timeText = `${daysAgo} day${daysAgo > 1 ? "s" : ""} ago`;
  } else if (hoursAgo > 0) {
    timeText = `${hoursAgo} hour${hoursAgo > 1 ? "s" : ""} ago`;
  } else if (minutesAgo > 0) {
    timeText = `${minutesAgo} minute${minutesAgo > 1 ? "s" : ""} ago`;
  } else {
    timeText = "just now";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Game Found! 🎮</h2>

        <div className="mb-6 space-y-2">
          <p className="text-gray-700 dark:text-gray-300">
            We found a saved game from <strong>{timeText}</strong>
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Move:</span>
              <span className="font-bold text-gray-900 dark:text-white">{recoveryInfo.moveNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Score:</span>
              <span className="font-bold text-gray-900 dark:text-white">{recoveryInfo.score}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Game ID:</span>
              <span className="font-mono text-sm text-gray-900 dark:text-white">
                {recoveryInfo.gameId.toString().slice(0, 8)}...
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleContinue}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Continue Game
          </button>
          <button
            onClick={handleNewGame}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            New Game
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          Your progress is saved on the blockchain
        </p>
      </div>
    </div>
  );
}
