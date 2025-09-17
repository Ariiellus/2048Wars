import styles from "@/styles/board.module.css";
import Tile from "@/components/tile";
import gameReducer, { initialState } from "@/reducers/game-reducer";
import { useEffect, useReducer, useRef } from "react";
import { Tile as TileModel } from "@/models/tile";

export default function Board() {
  const [gameState, dispatch] = useReducer(gameReducer, initialState);
  const initialized = useRef(false);

  const renderGrid = () => {
    const cells: React.ReactNode[] = [];
    const totalCellsCount = 16;

    for (let i = 0; i < totalCellsCount; i++) {
      cells.push(<div className={styles.cell} key={i} />);
    }

    return cells;
  };

  const renderTiles = () => {
    return Object.values(gameState.tiles).map(
      (tile: TileModel, index: number) => {
        return <Tile key={`${index}`} {...tile} />;
      },
    );
  };

  useEffect(() => {
    if (initialized.current === false) {
      dispatch({ type: "CREATE_TILE", tile: { position: [0, 1], value: 2 } });
      dispatch({ type: "CREATE_TILE", tile: { position: [0, 2], value: 2 } });
      initialized.current = true;
    }
  }, []);

  return (
    <div className={styles.board}>
      <div className={styles.tiles}>{renderTiles()}</div>
      <div className={styles.grid}>{renderGrid()}</div>
    </div>
  );
}
