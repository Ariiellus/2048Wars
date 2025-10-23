import { useContext, useState } from "react";
import CurrentPool from "./2048components/currentPool";
import NextPool from "./2048components/nextPool";
import { formatEther, parseEther } from "viem";
import { useAccount, useBalance, usePublicClient } from "wagmi";
import { GameContext } from "~~/context/game-context";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";

interface EnterGameButtonProps {
  heading?: string;
  type?: string;
  onGameEntered?: () => void;
}

export default function EnterGameButton({ heading = "Can you make it to 2048?", onGameEntered }: EnterGameButtonProps) {
  const { startGame } = useContext(GameContext);
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const { data: balance } = useBalance({
    address: address,
  });

  const { data: entryFee } = useScaffoldReadContract({
    contractName: "Play2048Wars",
    functionName: "getEntryFee",
  });

  const { writeContractAsync: writePlay2048WarsAsync } = useScaffoldWriteContract({
    contractName: "Play2048Wars",
  });

  // Check if user has enough ETH for entry fee + gas (0.0015 ETH total)
  const requiredAmount = parseEther("0.0015");
  const hasInsufficientFunds = balance && BigInt(balance.value) < requiredAmount;

  const handleEnterGame = async () => {
    if (!entryFee) return;

    try {
      setIsLoading(true);
      await writePlay2048WarsAsync({
        functionName: "enterGame",
        value: BigInt(entryFee),
      });

      // Wait a moment for the transaction to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get the gameId from the contract after entering the game
      let gameId: bigint | undefined;
      if (publicClient && address) {
        // Try to get gameId with retries
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const contract = deployedContracts[84532].Play2048Wars;
            console.log(`Attempt ${attempt + 1}: Getting gameId from contract for address:`, address);
            const result = await publicClient.readContract({
              address: contract.address as `0x${string}`,
              abi: contract.abi,
              functionName: "getPlayerGameId",
              args: [address],
            });
            gameId = result as bigint;
            console.log("Retrieved gameId:", gameId);

            // Check if gameId is valid (not 0)
            if (gameId === 0n) {
              console.warn(`Attempt ${attempt + 1}: GameId is 0, player may not be properly registered`);
              if (attempt < 2) {
                console.log("Retrying in 1 second...");
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
              }
              gameId = undefined;
            } else {
              console.log(`Successfully got gameId: ${gameId} on attempt ${attempt + 1}`);
              break;
            }
          } catch (error) {
            console.warn(`Attempt ${attempt + 1}: Failed to get gameId from contract:`, error);
            if (attempt < 2) {
              console.log("Retrying in 1 second...");
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
      } else {
        console.warn("Cannot get gameId - missing publicClient or address:", { publicClient: !!publicClient, address });
      }

      // Start the game with the retrieved gameId
      startGame(gameId);

      if (onGameEntered) {
        onGameEntered();
      }
    } catch (error) {
      console.error("Failed to enter game:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100 max-w-md mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">{heading}</h1>

        {balance && entryFee && (
          <div className="mb-8">
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
              <CurrentPool />
              <NextPool />
            </div>
          </div>
        )}

        {hasInsufficientFunds && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
            <p className="font-bold text-sm text-red-800 mb-1">Insufficient funds!</p>
            <p className="text-sm text-red-700">
              You need at least 0.0015 ETH to enter the game (0.001 ETH entry fee + 0.0005 ETH gas).
            </p>
            <p className="text-xs text-red-600 mt-1">
              Current balance: {balance ? formatEther(BigInt(balance.value)) : "0"} ETH
            </p>
          </div>
        )}

        <div className="space-y-4">
          <button
            className={`w-full px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
              hasInsufficientFunds
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : isLoading
                  ? "bg-blue-400 text-white cursor-wait"
                  : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            }`}
            onClick={handleEnterGame}
            disabled={isLoading || hasInsufficientFunds || !entryFee || !balance}
          >
            {isLoading ? "Processing..." : hasInsufficientFunds ? "Insufficient Funds" : "Enter Game"}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Entry fee: <span className="font-semibold text-gray-800">{formatEther(BigInt(entryFee || "0"))} ETH</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
