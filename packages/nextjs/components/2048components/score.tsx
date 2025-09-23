import { useContext } from "react";
import { GameContext } from "~~/context/game-context";
import styles from "~~/styles/2048styles/score.module.css";

export default function Score() {
  const { score } = useContext(GameContext);

  return (
    <div className={styles.score}>
      Score
      <div>{score}</div>
    </div>
  );
}
