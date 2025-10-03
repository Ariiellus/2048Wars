import { useContext } from "react";
import { GameContext } from "~~/context/game-context";
import styles from "~~/styles/2048styles/counter.module.css";

export default function Moves() {
  const { moves } = useContext(GameContext);

  return (
    <div className={styles.moves}>
      Moves
      <div>{moves}</div>
    </div>
  );
}
