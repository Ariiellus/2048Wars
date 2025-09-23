"use client";

import type { NextPage } from "next";
import { useAccount } from "wagmi";
import Board from "~~/components/2048components/board";
import Score from "~~/components/2048components/score";
import GameProvider from "~~/context/game-context";
import "~~/styles/2048styles/globals.css";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <GameProvider>
      <div className="flex flex-col py-10">
        <div className="px-5 w-full max-w-md mx-auto">
          <header className="text-center mb-4">
            <h1>
              <span className="block text-2xl mb-2">Welcome to</span>
              <span className="block text-4xl font-bold">2048Wars!</span>
            </h1>
          </header>
          <main>
            <Score />
            <div className="flex justify-center mt-4">
              <Board />
            </div>
          </main>
          <div className="text-center mt-4 text-sm text-gray-600">
            <p className="font-bold">Player: </p>
            {connectedAddress ? connectedAddress : "Not connected"}
          </div>
        </div>
      </div>
    </GameProvider>
  );
};

export default Home;
