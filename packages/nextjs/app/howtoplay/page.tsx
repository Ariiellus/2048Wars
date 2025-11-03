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

          {/* About 2048 Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-gray-200 pb-2">About 2048</h3>
            <div className="space-y-3 text-gray-700">
              <p className="text-base leading-relaxed">
                2048 is a simple yet addictive puzzle game where you slide numbered tiles on a board to merge them. The
                goal is to create a tile with the number 2048. If you run out of moves, the game ends.
              </p>
              <p className="text-base leading-relaxed">
                This is an optimized mini App version of 2048. It is easy to pick up but challenging to master. How far
                can you get?
              </p>
            </div>
          </div>

          {/* How to Play Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-gray-200 pb-2">How to Play</h3>
            <div className="space-y-3 text-gray-700">
              <p className="text-base leading-relaxed">
                <span className="font-semibold">The Grid:</span> The game is played on a 4x4 grid.
              </p>
              <p className="text-base leading-relaxed">
                <span className="font-semibold">Movement:</span> Swipe to move the tiles. All tiles move in the same
                direction, and a new tile appears in a random empty space.
              </p>
              <p className="text-base leading-relaxed">
                <span className="font-semibold">Merging:</span> When two tiles of the same value collide, they merge
                into a single tile with the sum of their values.
              </p>
              <p className="text-base leading-relaxed">
                <span className="font-semibold">Objective:</span> Reach the highest score of the week to win.
              </p>
              <p className="text-base leading-relaxed bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <span className="font-semibold">Winning Condition:</span> To win a part of the pool, you need to reach
                at least one tile with the value of 2048.
              </p>
            </div>
          </div>

          {/* Economics Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-gray-200 pb-2">Economics of the Game</h3>
            <div className="space-y-3 text-gray-700">
              <p className="text-base leading-relaxed">
                <span className="font-semibold">Entry Fee:</span> 0.001 ETH per game
              </p>
              <p className="text-base leading-relaxed">
                <span className="font-semibold">Prize Distribution:</span> 50% of the pool is distributed to the winners
                of the current round, and the other 50% is used to fund the next round.
              </p>
              <p className="text-base leading-relaxed bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                The prize pool for this round is{" "}
                <span className="text-green-600 font-bold">{formatEther(BigInt(getCurrentRoundPool || "0"))}</span> ETH
              </p>
            </div>
          </div>

          {/* Credits Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-gray-200 pb-2">Credits</h3>
            <div className="space-y-3 text-gray-700">
              <p className="text-base leading-relaxed">
                This version of 2048 would not exist without the work of the open-source community that contribute
                indirectly to the different versions of the game across the time.
              </p>
              <p className="text-base leading-relaxed">
                <span className="font-semibold">The Creator:</span> The{" "}
                <a
                  href="https://play2048.co/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  original 2048
                </a>{" "}
                was built by{" "}
                <a
                  href="https://github.com/gabrielecirulli"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Gabriele Cirulli
                </a>{" "}
                in March 2014.
              </p>
              <p className="text-base leading-relaxed">
                An onchain version of this game was built by the Monad team.{" "}
                <a
                  href="https://2048.monad.xyz/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Monad2048
                </a>{" "}
                demonstrated that high performance games can be built on the blockchain.
              </p>
              <p className="text-base leading-relaxed">
                I also want to highlight the work of{" "}
                <a
                  href="https://www.udemy.com/course/2048-in-react-and-nextjs/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Mateusz Sokola
                </a>
                , which course helped me to understand the foundations of React that allowed me to build this game.
              </p>
              <p className="text-base leading-relaxed">
                Last but not least, thanks to BuidlGuidl for educate and empower a new generation of web3 developers
                through{" "}
                <a
                  href="https://speedrunethereum.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Speedrun Ethereum
                </a>{" "}
                and all their initiatives.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowToPlay;
