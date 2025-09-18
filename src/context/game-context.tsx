import {
  PropsWithChildren,
  createContext,
  useEffect,
  useReducer,
  Dispatch,
} from "react";
import { isNil } from "lodash";
import {
  mergeAnimationDuration,
  tileCountPerDimension,
} from "@constants";
import { Tile } from "@/models/tile";
import gameReducer, { initialState, Action } from "@/reducers/game-reducer";

export const GameContext = createContext({
  score: 0,
  getTiles: (() => []) as () => Tile[],
  dispatch: (() => {}) as Dispatch<Action>,
});

export default function GameProvider({ children }: PropsWithChildren) {
  const [gameState, dispatch] = useReducer(gameReducer, initialState);

  const getEmptyCells = () => {
    const results: [number, number][] = [];
    for (let y = 0; y < tileCountPerDimension; y++) {
      for (let x = 0; x < tileCountPerDimension; x++) {
        if (isNil(gameState.board[y][x])) {
          results.push([x, y]);
        }
      }
    }
    return results;
  };

  const appendRandomTile = () => {
    const emptyCells = getEmptyCells();
    if (emptyCells.length > 0) {
      const cellIndex = Math.floor(Math.random() * emptyCells.length);
      const newTile = {
        position: emptyCells[cellIndex],
        value: Math.random() < 0.9 ? 2 : 4,
      };
      dispatch({ type: "CREATE_TILE", tile: newTile });
    }
  };
  const getTiles = () => {
    return gameState.tilesByIds.map(
      (tileId: string) => gameState.tiles[tileId],
    );
  };

  useEffect(() => {
    if (gameState.hasChanged) {
      setTimeout(() => {
        dispatch({ type: "CLEAN_UP" });
        appendRandomTile();
      }, mergeAnimationDuration);
    }
  }, [gameState.hasChanged]);

  return (
    <GameContext.Provider
      value={{score: gameState.score, getTiles, dispatch}}
    >
      {children}
    </GameContext.Provider>
  );
}
