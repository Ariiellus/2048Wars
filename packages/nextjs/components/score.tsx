import { useEffect, useState, useRef} from "react";
import styles from "~~/styles/2048styles/counter.module.css";

type ScoreProps = {
    score: number;
};

export default function Score({ score }: ScoreProps) {
    const [displayScore, setDisplayScore] = useState(0);
    const displayScoreRef = useRef(0);

    useEffect(() => {
        displayScoreRef.current = displayScore;
    }, [displayScore]);

    useEffect(() => {
        const targetScore = score;
        const startScore = displayScoreRef.current;

        if (startScore !== targetScore) {
            const duration = 150; // Total animation duration in ms
            const startTime = Date.now();

            const animate = () => {
                const currentTime = Date.now();
                const elapsed = currentTime - startTime;

                if (elapsed < duration) {
                    const progress = elapsed / duration;
                    const nextScore = Math.round(
                        startScore + (targetScore - startScore) * progress
                    );
                    setDisplayScore(nextScore);
                    requestAnimationFrame(animate);
                } else {
                    setDisplayScore(targetScore);
                }
            };

            requestAnimationFrame(animate);
        }
    }, [score]);

    return (
      <div className={styles.score}>
        Score
        <div>{displayScore}</div>
      </div>
    );
}
