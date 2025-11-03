import { useCallback, useEffect, useRef } from "react";
import { publicClient } from "../utils/client";
import { GAME_CONTRACT_ADDRESS } from "../utils/constants";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Hex, createWalletClient, custom, encodeFunctionData, formatEther } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { base } from "viem/chains";

export function useTransactions() {
  // User and Wallet objects.
  const { user } = usePrivy();
  const { ready, wallets } = useWallets();

  // Fetch user nonce on new login.
  const userNonce = useRef(0);
  const userBalance = useRef(0n);
  const userAddress = useRef("");

  // Resets nonce and balance
  const resetNonceAndBalance = useCallback(async () => {
    if (!user) {
      return;
    }
    const [privyUser] = user.linkedAccounts.filter(
      account => account.type === "wallet" && account.walletClientType === "privy",
    );
    if (!privyUser || !(privyUser as any).address) {
      return;
    }
    const privyUserAddress = (privyUser as any).address;

    const nonce = await publicClient.getTransactionCount({
      address: privyUserAddress as Hex,
    });
    const balance = await publicClient.getBalance({
      address: privyUserAddress as Hex,
    });

    console.log("Setting nonce: ", nonce);
    console.log("Setting balance: ", balance.toString());

    userNonce.current = nonce;
    userBalance.current = balance;
    userAddress.current = privyUserAddress;
  }, [user]);

  // Fetch provider on new login.
  const walletClient = useRef<any>(null);
  useEffect(() => {
    async function getWalletClient() {
      if (!ready || !wallets) return;

      const userWallet = wallets.find(w => w.walletClientType == "privy");
      if (!userWallet) return;

      const ethereumProvider = await userWallet.getEthereumProvider();
      const provider = createWalletClient({
        chain: base,
        transport: custom(ethereumProvider),
      });

      console.log("Setting provider: ", provider);
      walletClient.current = provider;
    }

    getWalletClient();
  }, [user, ready, wallets]);

  // Sends a transaction and wait for receipt.
  async function sendRawTransactionAndConfirm({
    gas,
    data,
    nonce,
    maxFeePerGas,
    maxPriorityFeePerGas,
  }: {
    successText?: string;
    gas: bigint;
    data: Hex;
    nonce: number;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
  }) {
    let e: Error | null = null;

    try {
      // Sign and send transaction.
      const provider = walletClient.current;
      if (!provider) {
        throw Error("Wallet not found.");
      }
      const privyUserAddress = userAddress.current;
      if (!privyUserAddress) {
        throw Error("Privy user not found.");
      }

      const startTime = Date.now();

      // Fetch current gas prices from the network for Base mainnet
      const gasPrice = await publicClient.getGasPrice();

      // Use 1.2x multiplier for fast confirmation
      const optimizedMaxFeePerGas = maxFeePerGas ?? (gasPrice * BigInt(120)) / BigInt(100);
      const optimizedMaxPriorityFeePerGas = maxPriorityFeePerGas ?? gasPrice / BigInt(10); // 10% of base fee

      console.log("Transaction parameters:", {
        to: GAME_CONTRACT_ADDRESS,
        account: privyUserAddress,
        nonce,
        gas: gas.toString(),
        networkGasPrice: gasPrice.toString(),
        maxFeePerGas: optimizedMaxFeePerGas.toString(),
        maxPriorityFeePerGas: optimizedMaxPriorityFeePerGas.toString(),
        dataLength: data.length,
      });

      // Use sendTransaction directly - it works better with Privy's embedded wallets
      const transactionHash: Hex = await provider.sendTransaction({
        account: privyUserAddress as Hex,
        to: GAME_CONTRACT_ADDRESS,
        data,
        nonce,
        gas,
        maxFeePerGas: optimizedMaxFeePerGas,
        maxPriorityFeePerGas: optimizedMaxPriorityFeePerGas,
        chain: base,
        type: "eip1559",
      });

      const time = Date.now() - startTime;

      // Fire toast info with benchmark and transaction hash.
      console.log(`Transaction sent in ${time} ms: ${transactionHash}`);

      // Confirm transaction
      const receipt = await waitForTransactionReceipt(publicClient, {
        hash: transactionHash,
      });

      if (receipt.status == "reverted") {
        throw new Error(`Transaction reverted: ${transactionHash}`);
      }
    } catch (error) {
      e = error as Error;
    }

    if (e) {
      throw e;
    }
  }

  // Returns a the latest stored baord of a game as an array.
  async function getLatestGameBoard(
    gameId: Hex,
  ): Promise<
    readonly [
      readonly [
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
      bigint,
      bigint,
    ]
  > {
    const [latestBoard, nextMoveNumber, score] = await publicClient.readContract({
      address: GAME_CONTRACT_ADDRESS,
      abi: [
        {
          type: "function",
          name: "getBoard",
          inputs: [
            {
              name: "gameId",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          outputs: [
            {
              name: "boardArr",
              type: "uint8[16]",
              internalType: "uint8[16]",
            },
            {
              name: "nextMoveNumber",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "score",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
      ],
      functionName: "getBoard",
      args: [gameId],
    });

    return [latestBoard, nextMoveNumber, score];
  }

  // Initializes a game. Calls `prepareGame` and `startGame`.
  async function initializeGameTransaction(
    gameId: Hex,
    boards: readonly [bigint, bigint, bigint, bigint],
    moves: readonly [number, number, number],
  ): Promise<void> {
    // Ensure userAddress is set
    if (!userAddress.current) {
      await resetNonceAndBalance();
    }

    if (!userAddress.current) {
      throw Error("User address not available.");
    }

    // Fetch fresh balance to avoid stale data
    const freshBalance = await publicClient.getBalance({
      address: userAddress.current as Hex,
    });

    console.log("Fresh balance:", formatEther(freshBalance), "ETH");
    console.log("Balance in wei:", freshBalance.toString());

    if (parseFloat(formatEther(freshBalance)) < 0.0001) {
      throw Error("Signer has insufficient balance.");
    }

    // Sign and send transaction: start game
    console.log("Starting game!");
    console.log("Game ID:", gameId);
    console.log("Boards:", boards);
    console.log("Moves:", moves);

    const data = encodeFunctionData({
      abi: [
        {
          type: "function",
          name: "startGame",
          inputs: [
            {
              name: "gameId",
              type: "bytes32",
              internalType: "bytes32",
            },
            {
              name: "boards",
              type: "uint128[4]",
              internalType: "uint128[4]",
            },
            {
              name: "moves",
              type: "uint8[3]",
              internalType: "uint8[3]",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
      ],
      functionName: "startGame",
      args: [gameId, boards, moves],
    });

    // Estimate gas
    let estimatedGas: bigint;
    try {
      estimatedGas = await publicClient.estimateGas({
        account: userAddress.current as Hex,
        to: GAME_CONTRACT_ADDRESS,
        data,
      });
      console.log("Estimated gas:", estimatedGas.toString());
      // Add 20% buffer to estimated gas
      estimatedGas = (estimatedGas * BigInt(120)) / BigInt(100);
      console.log("Gas with buffer:", estimatedGas.toString());
    } catch (error) {
      console.error("Gas estimation failed:", error);
      // Fallback to a reasonable default
      estimatedGas = BigInt(300_000);
      console.log("Using fallback gas:", estimatedGas.toString());
    }

    const nonce = userNonce.current;
    userNonce.current = nonce + 1;
    userBalance.current = freshBalance;

    await sendRawTransactionAndConfirm({
      nonce: nonce,
      successText: "Started game!",
      gas: estimatedGas,
      data,
    });
  }

  async function playNewMoveTransaction(gameId: Hex, board: bigint, move: number, moveCount: number): Promise<void> {
    // Sign and send transaction: play move
    console.log(`Playing move ${moveCount}!`);

    // Ensure userAddress is set
    if (!userAddress.current) {
      await resetNonceAndBalance();
    }

    if (!userAddress.current) {
      throw Error("User address not available.");
    }

    // Fetch fresh balance to avoid stale data
    const freshBalance = await publicClient.getBalance({
      address: userAddress.current as Hex,
    });

    console.log("Fresh balance:", formatEther(freshBalance), "ETH");
    console.log("Balance in wei:", freshBalance.toString());

    if (parseFloat(formatEther(freshBalance)) < 0.0001) {
      throw Error("Signer has insufficient balance.");
    }

    const nonce = userNonce.current;
    userNonce.current = nonce + 1;
    userBalance.current = freshBalance;

    await sendRawTransactionAndConfirm({
      nonce,
      successText: `Played move ${moveCount}`,
      gas: BigInt(400_000), // Includes move validation + hasValidMovesRemaining + score calculation + potential game end with winner assignment
      data: encodeFunctionData({
        abi: [
          {
            type: "function",
            name: "play",
            inputs: [
              {
                name: "gameId",
                type: "bytes32",
                internalType: "bytes32",
              },
              {
                name: "move",
                type: "uint8",
                internalType: "uint8",
              },
              {
                name: "resultBoard",
                type: "uint128",
                internalType: "uint128",
              },
            ],
            outputs: [],
            stateMutability: "nonpayable",
          },
        ],
        functionName: "play",
        args: [gameId, move, board],
      }),
    });
  }

  return {
    resetNonceAndBalance,
    initializeGameTransaction,
    playNewMoveTransaction,
    getLatestGameBoard,
  };
}
