import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { GameContext } from "~~/context/game-context";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useSeamlessTransactions } from "~~/hooks/useSeamlessTransactions";
import styles from "~~/styles/2048styles/splash.module.css";

export default function GameWonButton({ heading = "You have reached 2048!", type = "WON" }) {
  const { startGame, score, moves } = useContext(GameContext);
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useAccount();
  const {
    submitGameWin,
    submitGameLoss,
    isLoading: isTransactionLoading,
    hasEmbeddedWallet,
  } = useSeamlessTransactions();

  const { data: playerGame } = useScaffoldReadContract({
    contractName: "Play2048Wars",
    functionName: "getPlayerGame",
    args: [address],
  });

  const activeGameId = useMemo(() => {
    const g: any = playerGame as any;
    const gid = g?.gameId ?? g?.[0];
    return typeof gid === "bigint" && gid > 0n ? (gid as bigint) : undefined;
  }, [playerGame]);

  const canSubmit = useMemo(
    () => !!address && typeof activeGameId === "bigint" && (activeGameId as bigint) > 0n && hasEmbeddedWallet,
    [address, activeGameId, hasEmbeddedWallet],
  );

  const handleGameWon = useCallback(async () => {
    if (!canSubmit || !activeGameId) return;
    try {
      setIsLoading(true);
      await submitGameWin(activeGameId, BigInt(score ?? 0), BigInt(moves ?? 0));
      startGame();
    } catch (error) {
      console.error("Failed to submit win:", error);
    } finally {
      setIsLoading(false);
    }
  }, [canSubmit, activeGameId, submitGameWin, score, moves, startGame]);

  const handleGameLost = useCallback(async () => {
    if (!canSubmit || !activeGameId) return;
    try {
      setIsLoading(true);
      await submitGameLoss(activeGameId);
      startGame();
    } catch (error) {
      console.error("Failed to submit loss:", error);
    } finally {
      setIsLoading(false);
    }
  }, [canSubmit, activeGameId, submitGameLoss, startGame]);

  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const isProcessing = isLoading || isTransactionLoading;

  useEffect(() => {
    if (!canSubmit || isProcessing || hasAutoSubmitted) return;
    (async () => {
      setHasAutoSubmitted(true);
      if (type === "WON") {
        await handleGameWon();
      } else {
        // For losses, submit and redirect after 3 seconds
        await handleGameLost();
        setIsRedirecting(true);
        setTimeout(() => {
          startGame(); // This will redirect to main page
        }, 3000);
      }
    })();
  }, [type, canSubmit, isProcessing, hasAutoSubmitted, handleGameWon, handleGameLost, startGame]);

  const handlePrimary = type === "WON" ? handleGameWon : handleGameLost;

  return (
    <div className={`${styles.splash} ${type === "WON" && styles.win}`}>
      <div>
        <h1>{heading}</h1>
        {type === "WON" ? (
          hasAutoSubmitted ? (
            <button className={styles.button} disabled>
              {isProcessing ? "Submitting win..." : "Processing..."}
            </button>
          ) : (
            <button className={styles.button} disabled={!canSubmit || isProcessing} onClick={handlePrimary}>
              {isProcessing ? "Processing..." : "Confirm Win"}
            </button>
          )
        ) : (
          <button className={styles.button} disabled>
            {isProcessing ? "Submitting loss..." : isRedirecting ? "Redirecting in 3 seconds..." : "Processing..."}
          </button>
        )}
        {!hasEmbeddedWallet && (
          <p className="text-sm text-yellow-600 mt-2">⚠️ Embedded wallet required for seamless transactions</p>
        )}
      </div>
    </div>
  );
}
