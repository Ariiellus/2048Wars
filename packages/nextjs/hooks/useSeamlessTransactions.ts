import { useState } from "react";
import { useSendTransaction, useWallets } from "@privy-io/react-auth";
import toast from "react-hot-toast";
import { encodeFunctionData, parseEther } from "viem";
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
  const gameWon = async (gameId: bigint, score: bigint, moves: bigint) => {
    if (!address) throw new Error("No address available");

    const contract = deployedContracts[84532].Play2048Wars;
    const contractAddress = contract.address as `0x${string}`;

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
  const gameLost = async (gameId: bigint) => {
    const contract = deployedContracts[84532].Play2048Wars;
    const contractAddress = contract.address as `0x${string}`;

    const data = encodeFunctionData({
      abi: contract.abi,
      functionName: "gameLost",
      args: [gameId],
    });

    return await sendSeamlessTransaction(contractAddress, data);
  };

  /**
   * Enter the game and become a registered player
   */
  const enterGame = async () => {
    try {
      toast.loading("Entering game...", { id: "enter-game" });
      const contract = deployedContracts[84532].Play2048Wars;
      const contractAddress = contract.address as `0x${string}`;

      const data = encodeFunctionData({
        abi: contract.abi,
        functionName: "enterGame",
        args: [],
      });

      const result = await sendSeamlessTransaction(contractAddress, data, parseEther("0.001"));
      toast.success("Successfully entered the game!", { id: "enter-game" });
      return result;
    } catch (error) {
      toast.error("Failed to enter game", { id: "enter-game" });
      throw error;
    }
  };

  /**
   * Save game checkpoint for recovery
   * Tracks current board array, moves, score, gameId for browser restoration
   */
  const checkpoint = async (gameId: bigint, boardArray: number[], moves: number, score: number) => {
    try {
      toast.loading("Saving checkpoint...", { id: "checkpoint" });
      const contract = deployedContracts[84532].Play2048Wars;
      const contractAddress = contract.address as `0x${string}`;

      // Convert board array to uint8[16] format
      const boardUint8 = new Uint8Array(16);
      for (let i = 0; i < Math.min(boardArray.length, 16); i++) {
        boardUint8[i] = boardArray[i];
      }

      const data = encodeFunctionData({
        abi: contract.abi,
        functionName: "checkpoint",
        args: [
          gameId,
          Array.from(boardUint8) as [
            number,
            number,
            number,
            number,
            number,
            number,
            number,
            number,
            number,
            number,
            number,
            number,
            number,
            number,
            number,
            number,
          ],
          moves,
          BigInt(score),
        ],
      });

      const result = await sendSeamlessTransaction(contractAddress, data);
      toast.success("Checkpoint saved!", { id: "checkpoint" });
      return result;
    } catch (error) {
      toast.error("Failed to save checkpoint", { id: "checkpoint" });
      throw error;
    }
  };

  return {
    enterGame,
    gameWon,
    gameLost,
    checkpoint,
    isLoading,
    hasEmbeddedWallet: !!embeddedWallet,
  };
};
