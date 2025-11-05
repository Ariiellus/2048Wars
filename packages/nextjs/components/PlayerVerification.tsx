import { formatEther } from "viem";
import { baseSepolia } from "viem/chains";
import { useBalance } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

interface PlayerVerificationProps {
  address: `0x${string}` | undefined;
  hasInsufficientFunds: boolean;
  amountNeeded: bigint;
}

export default function PlayerVerification({ address, hasInsufficientFunds, amountNeeded }: PlayerVerificationProps) {
  const { data: balance } = useBalance({
    address: address,
    chainId: baseSepolia.id,
  });

  const { data: winnersList } = useScaffoldReadContract({
    contractName: "Play2048Wars",
    functionName: "getAllWinners",
  });

  if (winnersList && winnersList.includes(address as `0x${string}`)) {
    return (
      <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200">
        <p className="font-bold text-sm text-green-800 mb-1">You are a winner!</p>
        <p className="text-sm text-green-700">Wait for the next round to play again.</p>
      </div>
    );
  } else {
    if (!hasInsufficientFunds) {
      return null;
    }

    return (
      <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
        <p className="font-bold text-sm text-red-800 mb-1">Insufficient funds!</p>
        <p className="text-sm text-red-700">
          Deposit at least {parseFloat(formatEther(amountNeeded)).toFixed(6)} ETH to enter the game.
        </p>
        <p className="text-xs text-red-600 mt-1">
          Current balance: {balance ? parseFloat(formatEther(BigInt(balance.value))).toFixed(6) : "0"} ETH
        </p>
      </div>
    );
  }
}
