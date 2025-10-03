"use client";

import Moves from "../components/2048components/moves";
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
      <div className="flex flex-col py-2">
        <div className="   w-full max-w-md mx-auto">
          <header className="text-center mb-4">
            <h2>
              <span className="block text-2xl font-bold">Welcome to 2048Wars!</span>
            </h2>
          </header>
          <main>
            <div className="grid grid-cols-2 gap-4">
              <Moves />
              <Score />
            </div>
            <div className="flex justify-center mt-4">
              <Board />
            </div>
          </main>
          <div className="text-center mt-2 text-sm text-gray-600">
            <p className="font-bold">Player: </p>
            {connectedAddress ? connectedAddress : "Not connected"}
          </div>
        </div>
      </div>
    </GameProvider>
  );
};

export default Home;
