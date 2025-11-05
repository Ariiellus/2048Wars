import { useEffect, useState } from "react";
import { formatEther } from "viem";

interface GameInfoProps {
  currentPool?: bigint;
  timeRemaining?: bigint;
}

const formatTimeRemaining = (seconds: number | bigint | undefined): string => {
  if (!seconds) return "0 days, 0 hours, 0 minutes, 0 seconds";

  const totalSeconds = Number(seconds);
  if (totalSeconds <= 0) return "0 days, 0 hours, 0 minutes, 0 seconds";

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  return `${days} ${days === 1 ? "day" : "days"}, ${hours} ${hours === 1 ? "hour" : "hours"}, ${minutes} ${minutes === 1 ? "minute" : "minutes"}, ${secs} ${secs === 1 ? "second" : "seconds"}`;
};

export default function GameInfo({ currentPool, timeRemaining }: GameInfoProps) {
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    if (timeRemaining !== undefined) {
      setCountdown(Number(timeRemaining));
    }
  }, [timeRemaining]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center space-y-3 pt-2">
      <div>
        <p className="text-base font-semibold text-600 mb-1">
          Pool Amount:{" "}
          <span className="text-lg font-normal text-gray-800">{formatEther(BigInt(currentPool || "0"))} ETH</span>
        </p>
      </div>
      <div>
        <p className="text-base font-semibold text-600 mb-1">Round ends in:</p>
        <p className="text-lg text-gray-800">{formatTimeRemaining(countdown)}</p>
      </div>
    </div>
  );
}
