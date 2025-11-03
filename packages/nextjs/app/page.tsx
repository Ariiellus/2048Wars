"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import Play2048 from "~~/components/Play2048";
import CurrentPool from "~~/components/counters/currentPool";
import NextPool from "~~/components/counters/nextPool";
import EnterGameButton from "~~/components/enterGameButton";
import { PrivyConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import "~~/styles/2048styles/globals.css";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [isGameLoading, setIsGameLoading] = useState(false);
  const { data: playerGameId, refetch: refetchGameId } = useScaffoldReadContract({
    contractName: "Play2048Wars",
    functionName: "getPlayerGameId",
    args: [connectedAddress as `0x${string}`] as const,
  });

  // Check if player has an active game (playerGameId != 0x0...0)
  const hasActiveGame =
    playerGameId && playerGameId !== "0x0000000000000000000000000000000000000000000000000000000000000000";

  const handleGameEntered = async () => {
    setIsGameLoading(true);

    // Poll for the gameId to be updated on-chain
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const result = await refetchGameId();

      if (result.data && result.data !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        // Game ID is now set, stop loading
        setIsGameLoading(false);
        return;
      }

      attempts++;
    }

    // If we timeout, still stop loading
    setIsGameLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto p-2">
      <header className="text-center mb-4">
        <h2>
          <span className="block text-4xl font-bold">Welcome to 2048Wars!</span>
        </h2>
      </header>
      <main>
        {!connectedAddress && (
          <div className="flex justify-center">
            <PrivyConnectButton />
          </div>
        )}
        {connectedAddress && (
          <>
            {!hasActiveGame && !isGameLoading && (
              <div className="flex justify-center">
                <EnterGameButton onGameEntered={handleGameEntered} />
              </div>
            )}
            {isGameLoading && (
              <div className="flex flex-col items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Welcome to 2048Wars!</h3>
                <p className="text-gray-600 text-center">
                  Setting up your game session...
                  <br />
                  <span className="text-sm">Please wait while we prepare your game board.</span>
                </p>
              </div>
            )}
            {hasActiveGame && !isGameLoading && (
              <>
                <div className="flex justify-center mt-4">
                  <Play2048 />
                </div>
                <div className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <CurrentPool />
                    <NextPool />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Home;
