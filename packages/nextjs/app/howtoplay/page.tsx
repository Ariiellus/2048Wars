"use client";

import type { NextPage } from "next";
import { formatEther } from "viem";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";

const HowToPlay: NextPage = () => {
  const { data: getCurrentRoundPool } = useScaffoldReadContract({
    contractName: "Play2048Wars",
    functionName: "getCurrentRoundPool",
  });

  return (
    <div className="container mx-auto my-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-violet-600 p-4">
            <h1 className="text-2xl font-bold text-white text-center">How to play?</h1>
          </div>
        </div>

        <div className="flex flex-col max-w-3xl mx-auto px-6 py-8 space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-2">
            <p className="text-2xl font-semibold text-gray-800">
              Reach the highest score of the week and gain a share of the pool
            </p>
          </div>

          {/* How to Play Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-gray-200 pb-2">
              How to Play
            </h3>
            <div className="space-y-3 text-gray-700">
              <p className="text-base leading-relaxed">
                <span className="font-semibold">The Grid:</span> The game is played on a 4x4 grid.
              </p>
              <p className="text-base leading-relaxed">
                <span className="font-semibold">Movement:</span> Swipe to move the tiles. All tiles move in the same direction, and a new tile appears in a random empty space.
              </p>
              <p className="text-base leading-relaxed">
                <span className="font-semibold">Merging:</span> When two tiles of the same value collide, they merge into a single tile with the sum of their values.
              </p>
              <p className="text-base leading-relaxed">
                <span className="font-semibold">Objective:</span> Reach the highest score of the week to win.
              </p>
              <p className="text-base leading-relaxed bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <span className="font-semibold">Winning Condition:</span> To win a part of the pool, you need to reach at least one tile with the value of 2048.
              </p>
            </div>
          </div>

          {/* Economics Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-gray-200 pb-2">
              Economics of the Game
            </h3>
            <div className="space-y-3 text-gray-700">
              <p className="text-base leading-relaxed">
                <span className="font-semibold">Entry Fee:</span> 0.001 ETH per game
              </p>
              <p className="text-base leading-relaxed">
                <span className="font-semibold">Prize Distribution:</span> 50% of the pool is distributed to the winners of the current round, and the other 50% is used to fund the next round.
              </p>
              <p className="text-base leading-relaxed bg-blue-50 border-l-4 border-blue-500 p-3 rounded">The prize pool for this round is <span className="text-green-500">{formatEther(BigInt(getCurrentRoundPool || "0"))}</span> ETH</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowToPlay;
