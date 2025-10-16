import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { GameContext } from "~~/context/game-context";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";
import styles from "~~/styles/2048styles/splash.module.css";

export default function GameWonButton({ heading = "You have reached 2048!", type = "WON" }) {
  const { startGame, score, moves } = useContext(GameContext);
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useAccount();

  const { writeContractAsync: writePlay2048WarsAsync } = useScaffoldWriteContract({
    contractName: "Play2048Wars",
  });

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
    () => !!address && typeof activeGameId === "bigint" && (activeGameId as bigint) > 0n,
    [address, activeGameId],
  );

  const handleGameWon = useCallback(async () => {
    if (!canSubmit) return;
    try {
      setIsLoading(true);
      await writePlay2048WarsAsync({
        functionName: "gameWon",
        args: [activeGameId as bigint, BigInt(score ?? 0), BigInt(moves ?? 0), address!],
      });
      startGame();
    } finally {
      setIsLoading(false);
    }
  }, [canSubmit, writePlay2048WarsAsync, activeGameId, score, moves, address, startGame]);

  const handleGameLost = useCallback(async () => {
    if (!canSubmit) return;
    try {
      setIsLoading(true);
      await writePlay2048WarsAsync({
        functionName: "gameLost",
        args: [activeGameId as bigint],
      });
      startGame();
    } finally {
      setIsLoading(false);
    }
  }, [canSubmit, writePlay2048WarsAsync, activeGameId, startGame]);

  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);

  useEffect(() => {
    if (!canSubmit || isLoading || hasAutoSubmitted) return;
    (async () => {
      setHasAutoSubmitted(true);
      if (type === "WON") {
        await handleGameWon();
      } else {
        await handleGameLost();
      }
    })();
  }, [type, canSubmit, isLoading, hasAutoSubmitted, handleGameWon, handleGameLost]);

  const handlePrimary = type === "WON" ? handleGameWon : handleGameLost;

  return (
    <div className={`${styles.splash} ${type === "WON" && styles.win}`}>
      <div>
        <h1>{heading}</h1>
        {type === "WON" ? (
          hasAutoSubmitted ? (
            <button className={styles.button} disabled>
              Submitting win...
            </button>
          ) : (
            <button className={styles.button} disabled={!canSubmit || isLoading} onClick={handlePrimary}>
              Confirm Win
            </button>
          )
        ) : (
          <button className={styles.button} disabled>
            Submitting loss...
          </button>
        )}
      </div>
    </div>
  );
}
