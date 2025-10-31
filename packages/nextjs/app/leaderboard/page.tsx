"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useAccount, usePublicClient } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";

interface LeaderboardEntry {
  player: string;
  score: number;
  moves: number;
}

const Leaderboard: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const publicClient = usePublicClient();

  const { data: contractInfo } = useDeployedContractInfo("Play2048Wars");

  const { data: winnersList } = useScaffoldReadContract({
    contractName: "Play2048Wars",
    functionName: "getAllWinners",
  });

  useEffect(() => {
    async function fetchWinnersData() {
      if (!winnersList || winnersList.length === 0 || !publicClient || !contractInfo) {
        setLeaderboardData([]);
        return;
      }

      const promises = winnersList.map(async (winner: string) => {
        try {
          const [score, moves] = await Promise.all([
            publicClient.readContract({
              address: contractInfo.address,
              abi: contractInfo.abi,
              functionName: "playerFinalScore",
              args: [winner as `0x${string}`],
            }),
            publicClient.readContract({
              address: contractInfo.address,
              abi: contractInfo.abi,
              functionName: "playerFinalMoves",
              args: [winner as `0x${string}`],
            }),
          ]);

          return {
            player: winner,
            score: Number(score),
            moves: Number(moves),
          };
        } catch (error) {
          console.error(`Error fetching data for ${winner}:`, error);
          return null;
        }
      });

      const results = await Promise.all(promises);
      const validData = results.filter(
        (entry: LeaderboardEntry | null): entry is LeaderboardEntry => entry !== null,
      ) as LeaderboardEntry[];

      validData.sort((a, b) => b.score - a.score);

      setLeaderboardData(validData);
    }

    fetchWinnersData();
  }, [winnersList, publicClient, contractInfo]);

  return (
    <div className="container mx-auto my-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🏆 2048Wars Leaderboard</h1>
          <p className="text-lg text-gray-600">Compete for a share of the prize pool by achieving the highest score!</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4">
            <h2 className="text-2xl font-bold text-white text-center">Top Players</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {leaderboardData.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-6xl mb-4">🎮</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No scores yet!</h3>
                <p className="text-gray-500">Be the first to submit a score and claim the top spot!</p>
              </div>
            ) : (
              leaderboardData.map((entry, index) => (
                <div key={`${entry.player}-${index}`} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <Address address={entry.player as `0x${string}`} />
                          {entry.player.toLowerCase() === connectedAddress?.toLowerCase() && (
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{entry.score.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">points</div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {entry.moves > 0 ? `${entry.moves} moves` : "No data"}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {connectedAddress && leaderboardData.find(e => e.player.toLowerCase() === connectedAddress.toLowerCase()) && (
          <div className="mt-8">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Number(
                      leaderboardData.find(e => e.player.toLowerCase() === connectedAddress.toLowerCase())?.score || 0,
                    ).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Current Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Number(
                      leaderboardData.find(e => e.player.toLowerCase() === connectedAddress.toLowerCase())?.moves || 0,
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Moves Played</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
