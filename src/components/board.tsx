import styles from "@/styles/board.module.css";
import Tile from "@/components/tile";
import { useCallback, useContext, useEffect, useRef } from "react";
import { Tile as TileModel } from "@/models/tile";
import { moveAnimationDuration, mergeAnimationDuration } from "@constants";
import { GameContext } from "@/context/game-context";

export default function Board() {
  const { appendRandomTile, getTiles, dispatch } = useContext(GameContext);
  const initialized = useRef(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      event.preventDefault(); // prevents scrolling when using arrow keys

      requestAnimationFrame(() => {
        switch (event.code) {
          case "ArrowUp":
            dispatch({ type: "MOVE_UP" });
            break;
          case "ArrowDown":
            dispatch({ type: "MOVE_DOWN" });
            break;
          case "ArrowLeft":
            dispatch({ type: "MOVE_LEFT" });
            break;
          case "ArrowRight":
            dispatch({ type: "MOVE_RIGHT" });
            break;
        }

        // Clean up after animation completes and allow new moves
        setTimeout(() => {
          dispatch({ type: "CLEAN_UP" });
          appendRandomTile();
        }, mergeAnimationDuration);
      });
    },
    [appendRandomTile, dispatch],
  );

  const renderGrid = () => {
    const cells: React.ReactNode[] = [];
    const totalCellsCount = 16;

    for (let i = 0; i < totalCellsCount; i++) {
      cells.push(<div className={styles.cell} key={i} />);
    }

    return cells;
  };

  const renderTiles = () => {
    return getTiles().map((tile: TileModel) => {
      return <Tile key={`${tile.id}`} {...tile} />;
    });
  };

  /*
   * @notice: this is the initial state for the game
   * @notice: this will not manage the randomness for the creation of new tiles after every move
   */
  useEffect(() => {
    if (initialized.current === false) {
      // Generate all possible positions on the board
      const allPositions: [number, number][] = [];
      for (let x = 0; x < 4; x++) {
        for (let y = 0; y < 4; y++) {
          allPositions.push([x, y]);
        }
      }

      // Shuffle the positions array
      for (let i = allPositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
      }

      // Take the first two positions
      const position1 = allPositions[0];
      const position2 = allPositions[1];

      dispatch({
        type: "CREATE_TILE",
        tile: { position: position1, value: 2 },
      });
      dispatch({
        type: "CREATE_TILE",
        tile: { position: position2, value: 2 },
      });

      initialized.current = true;
    }
  }, [dispatch]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const boardStyle = {
    "--move-duration": `${moveAnimationDuration}ms`,
    "--merge-duration": `${mergeAnimationDuration}ms`,
  } as React.CSSProperties;

  return (
    <div className={styles.board} style={boardStyle}>
      <div className={styles.tiles}>{renderTiles()}</div>
      <div className={styles.grid}>{renderGrid()}</div>
    </div>
  );
}
