import styles from "~~/styles/2048styles/counter.module.css";

type MovesProps = {
  moves: number;
};

export default function Moves({ moves }: MovesProps) {
  return (
    <div className={styles.moves}>
      Moves
      <div>{moves}</div>
    </div>
  );
}
