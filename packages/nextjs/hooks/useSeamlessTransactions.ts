import { useState } from "react";
import { useSendTransaction, useWallets } from "@privy-io/react-auth";
import toast from "react-hot-toast";
import { encodeFunctionData } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";

/**
 * Hook for seamless transactions using Privy's embedded wallet
 * No manual signing required - transactions happen in background
 */
export const useSeamlessTransactions = () => {
  const { wallets } = useWallets();
  const { address } = useAccount();
  const { sendTransaction } = useSendTransaction();
  const publicClient = usePublicClient();
  const [isLoading, setIsLoading] = useState(false);

  // Get the embedded wallet for seamless transactions
  const embeddedWallet = wallets.find(wallet => wallet.walletClientType === "privy");

  /**
   * Send a seamless transaction without user interaction
   */
  const sendSeamlessTransaction = async (to: `0x${string}`, data: `0x${string}`, value?: bigint) => {
    if (!embeddedWallet) {
      throw new Error("Embedded wallet not available");
    }

    try {
      setIsLoading(true);

      // Use Privy's sendTransaction which handles embedded wallets seamlessly
      const txResult = await sendTransaction({
        to,
        data,
        value: value || 0n,
      });

      // Extract hash from transaction result (could be string or object)
      const hash = typeof txResult === "string" ? txResult : txResult.hash;

      // Wait for confirmation
      if (!publicClient) {
        throw new Error("Public client not available");
      }
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === "success") {
        toast.success("Transaction confirmed!");
        return receipt;
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Seamless transaction failed:", error);
      toast.error("Transaction failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Submit game win seamlessly
   */
  const submitGameWin = async (gameId: bigint, score: bigint, moves: bigint) => {
    if (!address) throw new Error("No address available");

    // Get contract address and ABI from deployed contracts
    const contract = deployedContracts[84532].Play2048Wars;
    const contractAddress = contract.address as `0x${string}`;

    // Encode gameWon function call using viem
    const data = encodeFunctionData({
      abi: contract.abi,
      functionName: "gameWon",
      args: [gameId, score, moves, address],
    });

    return await sendSeamlessTransaction(contractAddress, data);
  };

  /**
   * Submit game loss seamlessly
   */
  const submitGameLoss = async (gameId: bigint) => {
    // Get contract address and ABI from deployed contracts
    const contract = deployedContracts[84532].Play2048Wars;
    const contractAddress = contract.address as `0x${string}`;

    // Encode gameLost function call using viem
    const data = encodeFunctionData({
      abi: contract.abi,
      functionName: "gameLost",
      args: [gameId],
    });

    return await sendSeamlessTransaction(contractAddress, data);
  };

  return {
    submitGameWin,
    submitGameLoss,
    isLoading,
    hasEmbeddedWallet: !!embeddedWallet,
  };
};
