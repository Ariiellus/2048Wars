"use client";

import { useState } from "react";
// import Moves from "../components/2048components/moves";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import Play2048 from "~~/components/Play2048";
// import CurrentPool from "~~/components/2048components/currentPool";
// import NextPool from "~~/components/2048components/nextPool";
// import Score from "~~/components/2048components/score";
import EnterGameButton from "~~/components/enterGameButton";
import { PrivyConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import "~~/styles/2048styles/globals.css";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [isGameLoading, setIsGameLoading] = useState(false);
  const { data: playerGameId } = useScaffoldReadContract({
    contractName: "Play2048Wars",
    functionName: "getPlayerGameId",
    args: [connectedAddress as `0x${string}`] as const,
  });

  // Check if player has an active game (playerGameId > 0)
  const hasActiveGame = playerGameId && BigInt(playerGameId) > 0n;

  const handleGameEntered = async () => {
    setIsGameLoading(true);
    setTimeout(async () => {
      // Wait a bit for the transaction to be confirmed
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsGameLoading(false);
    }, 2000);
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
                <div className="grid grid-cols-2 gap-4">
                  {/* <Moves /> */}
                  {/* <Score /> */}
                </div>
                <div className="flex justify-center mt-4">
                  <Play2048 />
                </div>
                <div className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* <CurrentPool /> */}
                    {/* <NextPool /> */}
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
