import { PropsWithChildren, createContext, useCallback, useEffect, useReducer } from "react";
import { gameWinTileValue, mergeAnimationDuration, tileCountPerDimension } from "../constants";
import { Tile } from "../models/tile";
import gameReducer, { initialState } from "../reducers/game-reducer";
import { isNil, throttle } from "lodash";

type MoveDirection = "MOVE_UP" | "MOVE_DOWN" | "MOVE_LEFT" | "MOVE_RIGHT";

export const GameContext = createContext({
  score: 0,
  status: "ONGOING",
  moveTiles: (_direction: MoveDirection) => {},
  getTiles: () => [] as Tile[],
  startGame: () => {},
});

export default function GameProvider({ children }: PropsWithChildren) {
  const [gameState, dispatch] = useReducer(gameReducer, initialState);

  const getEmptyCells = useCallback(() => {
    const results: [number, number][] = [];

    for (let x = 0; x < tileCountPerDimension; x++) {
      for (let y = 0; y < tileCountPerDimension; y++) {
        if (isNil(gameState.board[y][x])) {
          results.push([x, y]);
        }
      }
    }
    return results;
  }, [gameState.board]);

  const appendRandomTile = useCallback(() => {
    const emptyCells = getEmptyCells();
    if (emptyCells.length > 0) {
      const cellIndex = Math.floor(Math.random() * emptyCells.length);
      const newTile = {
        position: emptyCells[cellIndex],
        value: 2,
      };
      dispatch({ type: "CREATE_TILE", tile: newTile });
    }
  }, [getEmptyCells]);

  const getTiles = () => {
    return gameState.tilesByIds.map(tileId => gameState.tiles[tileId]);
  };

  const moveTiles = useCallback(
    (type: MoveDirection) => {
      const throttledDispatch = throttle(() => dispatch({ type }), mergeAnimationDuration * 1.05, { trailing: false });
      throttledDispatch();
    },
    [dispatch],
  );

  /*
   * @notice: this is the initial state for the game
   * @notice: this will not manage the randomness for the creation of new tiles after every move
   */
  const startGame = () => {
    dispatch({ type: "RESET_GAME" });
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
    dispatch({ type: "CREATE_TILE", tile: { position: position1, value: 2 } });
    dispatch({ type: "CREATE_TILE", tile: { position: position2, value: 2 } });
  };

  const checkGameState = useCallback(() => {
    const isWon = Object.values(gameState.tiles).filter(t => t.value === gameWinTileValue).length > 0;

    if (isWon) {
      dispatch({ type: "UPDATE_STATUS", status: "WON" });
      return;
    }

    const { tiles, board } = gameState;

    const maxIndex = tileCountPerDimension - 1;
    for (let x = 0; x < maxIndex; x += 1) {
      for (let y = 0; y < maxIndex; y += 1) {
        if (isNil(gameState.board[x][y]) || isNil(gameState.board[x + 1][y]) || isNil(gameState.board[x][y + 1])) {
          return;
        }

        if (tiles[board[x][y]].value === tiles[board[x + 1][y]].value) {
          return;
        }

        if (tiles[board[x][y]].value === tiles[board[x][y + 1]].value) {
          return;
        }
      }
    }

    dispatch({ type: "UPDATE_STATUS", status: "LOST" });
  }, [gameState]);

  useEffect(() => {
    if (gameState.hasChanged) {
      setTimeout(() => {
        dispatch({ type: "CLEAN_UP" });
        appendRandomTile();
      }, mergeAnimationDuration);
    }
  }, [gameState.hasChanged, appendRandomTile]);

  useEffect(() => {
    if (!gameState.hasChanged) {
      checkGameState();
    }
  }, [gameState.hasChanged, checkGameState]);

  return (
    <GameContext.Provider
      value={{
        score: gameState.score,
        status: gameState.status,
        getTiles,
        moveTiles,
        startGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
