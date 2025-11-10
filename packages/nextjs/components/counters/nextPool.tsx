import { formatEther } from "viem";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { AllowedChainIds } from "~~/utils/scaffold-eth";

export default function NextPool() {
  const { targetNetwork } = useTargetNetwork();
  const { data: getNextRoundPool } = useScaffoldReadContract({
    contractName: "Play2048Wars",
    functionName: "getNextRoundPool",
    chainId: targetNetwork.id as AllowedChainIds,
  });

  return (
    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-center">
        <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">Next Pool</div>
        <div className="text-xl font-bold text-purple-800">{formatEther(BigInt(getNextRoundPool || "0"))} ETH</div>
      </div>
    </div>
  );
}
