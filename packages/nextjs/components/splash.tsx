import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import styles from "~~/styles/2048styles/splash.module.css";

export default function GameWonButton({ heading = "You have reached 2048!", type = "WON" }) {
  const { address } = useAccount();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { data: playerGameId } = useScaffoldReadContract({
    contractName: "Play2048Wars",
    functionName: "getPlayerGameId",
    args: [address],
  });

  const gameEnded = useMemo(() => {
    // If playerGameId is 0, the game has ended (contract sets it to 0 on loss)
    return typeof playerGameId === "bigint" && playerGameId === 0n;
  }, [playerGameId]);

  useEffect(() => {
    // When game ends, automatically redirect after a delay
    if (gameEnded && !isRedirecting) {
      setIsRedirecting(true);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }, [gameEnded, isRedirecting]);

  return (
    <div className={`${styles.splash} ${type === "WON" && styles.win}`}>
      <div>
        <h1>{heading}</h1>
        <button className={styles.button} disabled>
          {isRedirecting ? "Redirecting to main page..." : type === "WON" ? "Game won!" : "Game over!"}
        </button>
        <p className="text-sm text-gray-600 mt-2">
          {type === "WON"
            ? "Win/loss is handled automatically by the contract when you play your moves."
            : "The game automatically ended when no valid moves were available."}
        </p>
      </div>
    </div>
  );
}
