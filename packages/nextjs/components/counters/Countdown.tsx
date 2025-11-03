import { useEffect, useState } from "react";

type CountdownProps = {
  gameError: boolean;
  resyncGame: () => void;
};

export default function Countdown({ gameError, resyncGame }: CountdownProps) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!gameError) {
      setCountdown(3);
      return;
    }

    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          resyncGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameError, resyncGame]);

  if (!gameError) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-lg z-20">
      <div className="p-6 bg-white rounded-lg text-center">
        <h2 className="text-2xl font-bold mb-4">Slow down, turbo!:(</h2>
        <p className="mb-2 text-red-500">
          <span className="text-red-600 font-bold">You are playing too fast!</span>:
        </p>
        <p className="mb-4 text-lg font-semibold">
          Loading checkpoint in <span className="text-purple-600">{countdown}</span> seconds...
        </p>
      </div>
    </div>
  );
}
