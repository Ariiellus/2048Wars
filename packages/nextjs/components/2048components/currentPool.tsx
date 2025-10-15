import { formatEther } from "viem";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";

export default function CurrentPool() {
  const { data: getCurrentRoundPool } = useScaffoldReadContract({
    contractName: "Play2048Wars",
    functionName: "getCurrentRoundPool",
  });

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-center">
        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Current Pool</div>
        <div className="text-xl font-bold text-blue-800">{formatEther(BigInt(getCurrentRoundPool || "0"))} ETH</div>
      </div>
    </div>
  );
}
