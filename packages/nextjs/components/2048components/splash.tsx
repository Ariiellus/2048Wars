import { useContext } from "react";
import { GameContext } from "~~/context/game-context";
import styles from "~~/styles/2048styles/splash.module.css";

export default function Splash({ heading = "You won!", type = "WON" }) {
  const { startGame } = useContext(GameContext);

  return (
    <div className={`${styles.splash} ${type === "WON" && styles.win}`}>
      <div>
        <h1>{heading}</h1>
        <button className={styles.button} onClick={startGame}>
          Play again
        </button>
      </div>
    </div>
  );
}
