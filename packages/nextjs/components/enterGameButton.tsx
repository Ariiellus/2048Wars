import { useState } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount, useBalance } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";

interface EnterGameButtonProps {
  heading?: string;
  type?: string;
  onGameEntered: () => void;
}

export default function EnterGameButton({ heading = "Can you make it to 2048?", onGameEntered }: EnterGameButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useAccount();

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

      if (onGameEntered) {
        onGameEntered();
      }
    } catch (error) {
      console.error("Failed to enter game:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100 max-w-md mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">{heading}</h1>

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
