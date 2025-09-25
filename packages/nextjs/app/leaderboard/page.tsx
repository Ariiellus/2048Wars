"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

interface LeaderboardEntry {
  player: string;
  score: number;
  timestamp: number;
}

const Leaderboard: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);

  const { data: topScores } = useScaffoldReadContract({
    contractName: "GameLeaderboard",
    functionName: "getTopScores",
    args: [10n], // Get top 10 scores
  });

  // Get player stats if connected
  const { data: playerStats } = useScaffoldReadContract({
    contractName: "GameLeaderboard",
    functionName: "getPlayerStats",
    args: connectedAddress ? [connectedAddress] : undefined,
  });

  useEffect(() => {
    if (topScores && topScores.length > 0) {
      // Convert BigInt values to numbers and format the data
      const formattedData: LeaderboardEntry[] = topScores.map((entry: any) => ({
        player: entry.player,
        score: Number(entry.score),
        timestamp: Number(entry.timestamp) * 1000, // Convert to milliseconds
      }));
      setLeaderboardData(formattedData);
    } else {
      // Use mock data when no real data is available
      const mockData: LeaderboardEntry[] = [
        { player: "0x1234567890123456789012345678901234567890", score: 15420, timestamp: Date.now() - 3600000 },
        { player: "0x2345678901234567890123456789012345678901", score: 12340, timestamp: Date.now() - 7200000 },
        { player: "0x3456789012345678901234567890123456789012", score: 9876, timestamp: Date.now() - 10800000 },
        { player: "0x4567890123456789012345678901234567890123", score: 7654, timestamp: Date.now() - 14400000 },
        { player: "0x5678901234567890123456789012345678901234", score: 5432, timestamp: Date.now() - 18000000 },
      ];
      setLeaderboardData(mockData);
    }
  }, [topScores]);

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  return (
    <div className="container mx-auto my-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🏆 2048Wars Leaderboard</h1>
          <p className="text-lg text-gray-600">Compete for the highest score and claim your place on the blockchain!</p>
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
                <div key={`${entry.player}-${entry.timestamp}`} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <Address address={entry.player} />
                          {entry.player.toLowerCase() === connectedAddress?.toLowerCase() && (
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{formatTimeAgo(entry.timestamp)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{entry.score.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">points</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {connectedAddress && playerStats && (
          <div className="mt-8">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{Number(playerStats[0]).toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Best Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{Number(playerStats[1])}</div>
                  <div className="text-sm text-gray-600">Games Played</div>
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
