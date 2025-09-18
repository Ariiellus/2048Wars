import gameReducer, { initialState } from "@/reducers/game-reducer";
import { createContext, PropsWithChildren, useReducer, Dispatch } from "react";
import { tileCountPerDimension } from "@constants";
import { isNil } from "lodash";
import { Action } from "@/reducers/game-reducer";
import { Tile } from "@/models/tile";

export const GameContext = createContext({
  appendRandomTile: () => {},
  gameState: initialState,
  dispatch: (() => {}) as Dispatch<Action>,
  getTiles: (() => []) as () => Tile[],
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
const getTiles =() => {
  return gameState.tilesByIds.map((tileId: string) => gameState.tiles[tileId]);
}

  return (
    <GameContext.Provider value={{ appendRandomTile, getTiles, dispatch, gameState }}>
      {children}
    </GameContext.Provider>
  );
}
