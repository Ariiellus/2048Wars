import { useEffect, useState } from "react";
import PlayerVerification from "./PlayerVerification";
import { PrivyConnectButton } from "./scaffold-eth/PrivyConnectButton";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Hex, createWalletClient, custom, encodeFunctionData, formatEther, parseEther } from "viem";
import { base, hardhat } from "viem/chains";
import { useBalance } from "wagmi";
import { useEnsureBaseChain, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { GAME_CONTRACT_ADDRESS } from "~~/utils/constants";
import { notification } from "~~/utils/scaffold-eth";

interface EnterGameButtonProps {
  heading?: string;
  type?: string;
  onGameEntered: () => void;
}

const formatTimeRemaining = (seconds: number | bigint | undefined): string => {
  if (!seconds) return "0 days, 0 hours, 0 minutes, 0 seconds";

  const totalSeconds = Number(seconds);
  if (totalSeconds <= 0) return "0 days, 0 hours, 0 minutes, 0 seconds";

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  return `${days} ${days === 1 ? "day" : "days"}, ${hours} ${hours === 1 ? "hour" : "hours"}, ${minutes} ${minutes === 1 ? "minute" : "minutes"}, ${secs} ${secs === 1 ? "second" : "seconds"}`;
};

export default function EnterGameButton({ onGameEntered }: EnterGameButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { switchToBase } = useEnsureBaseChain();

  const { data: getCurrentRoundPool } = useScaffoldReadContract({
    contractName: "Play2048Wars",
    functionName: "getCurrentRoundPool",
  });

  const { data: timeRemaining } = useScaffoldReadContract({
    contractName: "Play2048Wars",
    functionName: "getTimeRemainingOfCurrentRound",
  });

  // Prioritize embedded wallet for seamless transactions
  const embeddedWallet = wallets.find(wallet => wallet.walletClientType === "privy");
  const externalWallet = wallets.find(wallet => wallet.walletClientType !== "privy");
  const activeWallet = embeddedWallet || externalWallet;
  const address = activeWallet?.address as `0x${string}` | undefined;

  const { data: balance } = useBalance({
    address: address,
    chainId: base.id,
  });

  const { data: entryFee } = useScaffoldReadContract({
    contractName: "Play2048Wars",
    functionName: "getEntryFee",
  });

  const { data: winnersList } = useScaffoldReadContract({
    contractName: "Play2048Wars",
    functionName: "getAllWinners",
  });

  const isWinner = winnersList && address && winnersList.includes(address as `0x${string}`);

  useEffect(() => {
    if (timeRemaining !== undefined) {
      setCountdown(Number(timeRemaining));
    }
  }, [timeRemaining]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Check if user has enough ETH for entry fee + gas (0.0015 ETH total)
  const requiredAmount = parseEther("0.0015");
  const hasInsufficientFunds = authenticated && balance && BigInt(balance.value) < requiredAmount;

  const amountNeeded =
    authenticated && balance && BigInt(balance.value) < requiredAmount
      ? requiredAmount - BigInt(balance.value)
      : BigInt(0);

  const handleEnterGame = async () => {
    if (!entryFee) {
      console.error("Entry fee not loaded");
      return;
    }

    if (!ready || !authenticated || !activeWallet) {
      console.error("Wallet not connected");
      return;
    }

    try {
      setIsLoading(true);

      const switched = await switchToBase();
      if (!switched) {
        notification.error(
          <>
            <p className="font-bold">Failed to switch network</p>
            <p className="text-sm">Please switch to Base network manually in your wallet to continue.</p>
          </>,
        );
        setIsLoading(false);
        return;
      }

      // Get Ethereum provider from Privy wallet
      const ethereumProvider = await activeWallet.getEthereumProvider();
      const walletClient = createWalletClient({
        chain: base,
        transport: custom(ethereumProvider),
      });

      // Encode the function data
      const data = encodeFunctionData({
        abi: [
          {
            type: "function",
            name: "enterGame",
            inputs: [],
            outputs: [],
            stateMutability: "payable",
          },
        ],
        functionName: "enterGame",
      });

      // Send transaction using Privy wallet directly
      const txHash: Hex = await walletClient.sendTransaction({
        account: address as Hex,
        to: GAME_CONTRACT_ADDRESS,
        data,
        value: BigInt(entryFee),
        chain: base,
      });

      console.log("Transaction sent:", txHash);

      // Wait for the transaction to be mined and indexed
      await new Promise(resolve => setTimeout(resolve, 3000));

      if (onGameEntered) {
        onGameEntered();
      }
      setIsLoading(false);
    } catch (error: any) {
      console.error("Failed to enter game:", error);

      // Check if user rejected the transaction
      const isUserRejection =
        error?.code === 4001 || error?.message?.includes("User rejected") || error?.message?.includes("user denied");

      if (isUserRejection) {
        notification.warning("Transaction was cancelled. Please try again when ready.");
      } else {
        notification.error(
          <>
            <p className="font-bold">Transaction failed</p>
            <p className="text-sm">{error?.message || "Please check your wallet and try again."}</p>
          </>,
        );
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100 max-w-md mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Can you make it to 2048?</h2>

        <PlayerVerification
          address={address as `0x${string}` | undefined}
          hasInsufficientFunds={hasInsufficientFunds || false}
          amountNeeded={amountNeeded}
        />

        <div className="space-y-4">
          {!authenticated ? (
            <PrivyConnectButton />
          ) : (
            !isWinner &&
            !hasInsufficientFunds && (
              <button
                className={`w-full px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                  isLoading
                    ? "bg-blue-400 text-white cursor-wait"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                }`}
                onClick={handleEnterGame}
                disabled={isLoading || !entryFee || !authenticated}
              >
                {isLoading ? "Processing..." : "Enter Game"}
              </button>
            )
          )}

          <div className="text-center space-y-3 pt-2">
            <div>
              <p className="text-base font-semibold text-600 mb-1">
                Pool Amount:{" "}
                <span className="text-lg font-normal text-gray-800">
                  {formatEther(BigInt(getCurrentRoundPool || "0"))} ETH
                </span>
              </p>
            </div>
            <div>
              <p className="text-base font-semibold text-600 mb-1">Time remaining:</p>
              <p className="text-lg text-gray-800">{formatTimeRemaining(countdown)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
