import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "~~/styles/2048styles/splash.module.css";

type Tile = {
  id: string;
  value: number;
  row: number;
  col: number;
  mergedFrom?: string[];
  isNew?: boolean;
};

interface GameWonButtonProps {
  tiles: Tile[];
  hasValidMoves: boolean;
}

export default function GameWonButton({ tiles, hasValidMoves }: GameWonButtonProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  // Check if the board has a 2048 tile
  const has2048Tile = tiles.some(tile => tile.value >= 2048);

  // Determine if the game is over (no valid moves left)
  const gameOver = !hasValidMoves;

  // Determine win/loss
  const hasWon = gameOver && has2048Tile;
  const hasLost = gameOver && !has2048Tile;

  useEffect(() => {
    // Reset countdown when game ends
    if (gameOver) {
      setCountdown(3);

      // Start countdown
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          console.log("Countdown tick:", prev);
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Redirect after 5 seconds
      const redirectTimeout = setTimeout(() => {
        console.log("Redirecting...", { hasWon, hasLost });
        if (hasWon) {
          // Redirect to leaderboard if player won (has 2048 tile)
          router.push("/leaderboard");
        } else if (hasLost) {
          // Redirect to main page if player lost (no 2048 tile)
          router.push("/");
        }
      }, 3000);

      return () => {
        console.log("Cleaning up intervals");
        clearInterval(countdownInterval);
        clearTimeout(redirectTimeout);
      };
    }
  }, [gameOver, hasWon, hasLost, router]);

  // Don't show the splash if the game is still ongoing
  if (!gameOver) {
    return null;
  }

  const actualType = hasWon ? "WON" : "LOST";
  const displayHeading = hasWon ? "You have reached 2048!" : "Game Over!";

  return (
    <div className={`${styles.splash} ${actualType === "WON" && styles.win}`}>
      <div
        className="rounded-3xl shadow-2xl p-8 md:p-12 max-w-md mx-4 transform transition-all duration-500"
        style={{ backgroundColor: "var(--tile-background)" }}
      >
        {/* Trophy or X icon */}
        <div className="flex justify-center mb-6">
          {hasWon ? (
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg animate-bounce"
              style={{ background: "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)" }}
            >
              <svg
                className="w-14 h-14 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          ) : (
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" }}
            >
              <svg
                className="w-14 h-14 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>

        {/* Heading */}
        <h1
          className="text-4xl md:text-5xl font-bold text-center mb-4"
          style={{
            color: hasWon ? "#ea580c" : "var(--primary-text-color)",
            textShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          {displayHeading}
        </h1>

        {/* Message */}
        <p className="text-center text-lg mb-6" style={{ color: "var(--score-text-color)" }}>
          {actualType === "WON"
            ? "Congratulations! You've mastered the game!"
            : "No more valid moves available. Better luck next time!"}
        </p>

        {/* Countdown */}
        <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: "var(--secondary-background)" }}>
          <p className="text-center text-sm mb-2" style={{ color: "var(--primary-text-color)" }}>
            {hasWon ? "Redirecting to leaderboard in" : "Redirecting to main page in"}
          </p>
          <div className="flex justify-center">
            <div
              key={countdown}
              className="text-6xl font-bold tabular-nums"
              style={{
                color: hasWon ? "#ea580c" : "#ef4444",
                animation: "pulse 1s cubic-bezier(0.4, 0, 0.6, 1)",
              }}
            >
              {countdown}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
