import { useContext, useState } from "react";
import CurrentPool from "../ex-components/2048components/currentPool";
import NextPool from "../ex-components/2048components/nextPool";
import { formatEther } from "viem";
import { useAccount, useBalance, usePublicClient } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
// import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";

interface EnterGameButtonProps {
  heading?: string;
  type?: string;
  onGameEntered?: () => void;
}

export default function EnterGameButton({ heading = "Can you make it to 2048?", onGameEntered }: EnterGameButtonProps) {
   const [isLoading, setIsLoading] = useState(false);
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const { data: balance } = useBalance({
    address: address,
  });

  // Temporarily disabled to avoid undefined references during development
  // const { data: entryFee } = useScaffoldReadContract({
  //   contractName: "Monad2048",
  //   functionName: "gameHashOf",
  //   args: [gameHash],
  // });
  const entryFee: bigint | undefined = undefined;

  // Placeholder flag to avoid undefined variable errors
  const hasInsufficientFunds = false;

  const handleEnterGame = async () => {
    if (!entryFee) return;
    try {
      setIsLoading(true);
      // Skipping contract interactions during development
      const gameId: bigint | undefined = undefined;

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
              Current balance: {balance ? formatEther(balance.value) : "0"} ETH
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
              Entry fee: <span className="font-semibold text-gray-800">{formatEther(entryFee ?? 0n)} ETH</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
