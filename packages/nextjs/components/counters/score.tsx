// Hooks
import { useEffect, useRef, useState } from "react";
// Styles
import styles from "~~/styles/2048styles/counter.module.css";

type ScoreProps = {
  score: number;
};

export default function Score({ score }: ScoreProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Cancel any ongoing animation
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    const startScore = displayScore;
    const targetScore = score;

    // If scores are the same, do nothing
    if (startScore === targetScore) {
      return;
    }

    // Only animate if score increased (prevents backward jumps)
    if (targetScore > startScore) {
      const duration = 150; // Total animation duration in ms
      const startTime = Date.now();

      const animate = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;

        if (elapsed < duration) {
          const progress = elapsed / duration;
          const nextScore = Math.round(startScore + (targetScore - startScore) * progress);
          setDisplayScore(nextScore);
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setDisplayScore(targetScore);
          animationRef.current = null;
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    } else {
      // If score decreased (shouldn't happen in normal gameplay),
      // just set it immediately without animation
      setDisplayScore(targetScore);
    }

    // Cleanup function to cancel animation on unmount
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [score, displayScore]);

  return (
    <div className={styles.score}>
      Score
      <div>{displayScore}</div>
    </div>
  );
}
