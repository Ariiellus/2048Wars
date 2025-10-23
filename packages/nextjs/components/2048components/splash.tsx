import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { GameContext } from "~~/context/game-context";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useSeamlessTransactions } from "~~/hooks/useSeamlessTransactions";
import styles from "~~/styles/2048styles/splash.module.css";

export default function GameWonButton({ heading = "You have reached 2048!", type = "WON" }) {
  const { score, moves } = useContext(GameContext);
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { gameWon, gameLost, isLoading: isTransactionLoading, hasEmbeddedWallet } = useSeamlessTransactions();

  const { data: playerGameId } = useScaffoldReadContract({
    contractName: "Play2048Wars",
    functionName: "getPlayerGameId",
    args: [address],
  });

  const activeGameId = useMemo(() => {
    console.log("Raw playerGameId from contract:", playerGameId);
    const result = typeof playerGameId === "bigint" && playerGameId > 0n ? playerGameId : undefined;
    console.log("Processed activeGameId:", result);
    return result;
  }, [playerGameId]);

  const canSubmit = useMemo(
    () => !!address && typeof activeGameId === "bigint" && (activeGameId as bigint) > 0n && hasEmbeddedWallet,
    [address, activeGameId, hasEmbeddedWallet],
  );

  const handleGameWon = useCallback(async () => {
    if (!canSubmit || !activeGameId) return;
    try {
      setIsLoading(true);

      // Get the current gameId from contract right before submitting
      let currentGameId = activeGameId;
      if (publicClient && address) {
        try {
          const contract = deployedContracts[84532].Play2048Wars;
          const result = await publicClient.readContract({
            address: contract.address as `0x${string}`,
            abi: contract.abi,
            functionName: "getPlayerGameId",
            args: [address],
          });
          currentGameId = result as bigint;
        } catch (error) {
          console.warn("Failed to get current gameId from contract:", error);
        }
      }

      console.log("Submitting game win with gameId:", activeGameId, "score:", score, "moves:", moves);
      console.log("Current gameId from contract:", currentGameId);

      await gameWon(currentGameId, BigInt(score ?? 0), BigInt(moves ?? 0));

      // Check if user still has an active game after winning
      // If not, redirect to main page instead of starting new game
      setTimeout(() => {
        window.location.reload(); // This will redirect to main page
      }, 2000);
    } catch (error) {
      console.error("Failed to submit win:", error);
      console.error("GameId was:", activeGameId);
    } finally {
      setIsLoading(false);
    }
  }, [canSubmit, activeGameId, gameWon, score, moves, address, publicClient]);

  const handleGameLost = useCallback(async () => {
    if (!canSubmit || !activeGameId) return;
    try {
      setIsLoading(true);

      // Get the current gameId from contract right before submitting
      let currentGameId = activeGameId;
      if (publicClient && address) {
        try {
          const contract = deployedContracts[84532].Play2048Wars;
          const result = await publicClient.readContract({
            address: contract.address as `0x${string}`,
            abi: contract.abi,
            functionName: "getPlayerGameId",
            args: [address],
          });
          currentGameId = result as bigint;
        } catch (error) {
          console.warn("Failed to get current gameId from contract:", error);
        }
      }

      console.log("Submitting game loss with gameId:", activeGameId);
      console.log("Current gameId from contract:", currentGameId);

      await gameLost(currentGameId);

      // Check if user still has an active game after losing
      // If not, redirect to main page instead of starting new game
      setTimeout(() => {
        window.location.reload(); // This will redirect to main page
      }, 2000);
    } catch (error) {
      console.error("Failed to submit loss:", error);
      console.error("GameId was:", activeGameId);
    } finally {
      setIsLoading(false);
    }
  }, [canSubmit, activeGameId, gameLost, address, publicClient]);

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
        // For losses, submit and redirect after 2 seconds
        await handleGameLost();
        setIsRedirecting(true);
      }
    })();
  }, [type, canSubmit, isProcessing, hasAutoSubmitted, handleGameWon, handleGameLost]);

  const handlePrimary = type === "WON" ? handleGameWon : handleGameLost;

  return (
    <div className={`${styles.splash} ${type === "WON" && styles.win}`}>
      <div>
        <h1>{heading}</h1>
        {type === "WON" ? (
          hasAutoSubmitted ? (
            <button className={styles.button} disabled>
              {isProcessing ? "Submitting win..." : "Redirecting to main page..."}
            </button>
          ) : (
            <button className={styles.button} disabled={!canSubmit || isProcessing} onClick={handlePrimary}>
              {isProcessing ? "Processing..." : "Confirm Win"}
            </button>
          )
        ) : (
          <button className={styles.button} disabled>
            {isProcessing ? "Submitting loss..." : isRedirecting ? "Redirecting to main page..." : "Processing..."}
          </button>
        )}
        {!hasEmbeddedWallet && (
          <p className="text-sm text-yellow-600 mt-2">⚠️ Embedded wallet required for seamless transactions</p>
        )}
      </div>
    </div>
  );
}
