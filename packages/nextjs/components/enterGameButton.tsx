import { useState } from "react";
import GameInfo from "./GameInfo";
import PlayerVerification from "./PlayerVerification";
import { PrivyConnectButton } from "./scaffold-eth/PrivyConnectButton";
import { usePrivy } from "@privy-io/react-auth";
import { Hex, createWalletClient, custom, encodeFunctionData, parseEther } from "viem";
import { baseSepolia } from "viem/chains";
import { useBalance } from "wagmi";
import { useActiveWallet } from "~~/hooks/useActiveWallet";
import { GAME_CONTRACT_ADDRESS } from "~~/utils/constants";
import { notification } from "~~/utils/scaffold-eth";

interface EnterGameButtonProps {
  onGameEntered: () => void;
  entryFee?: bigint;
  isWinner?: boolean;
  currentPool?: bigint;
  timeRemaining?: bigint;
}

export default function EnterGameButton({
  onGameEntered,
  entryFee,
  isWinner,
  currentPool,
  timeRemaining,
}: EnterGameButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { ready, authenticated } = usePrivy();
  const { activeWallet, address } = useActiveWallet();

  const { data: balance } = useBalance({
    address: address,
    chainId: baseSepolia.id,
  });

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

      // Get Ethereum provider from Privy wallet
      const ethereumProvider = await activeWallet.getEthereumProvider();
      const walletClient = createWalletClient({
        chain: baseSepolia,
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
        chain: baseSepolia,
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

          <GameInfo currentPool={currentPool} timeRemaining={timeRemaining} />
        </div>
      </div>
    </div>
  );
}
