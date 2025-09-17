import { Tile, TileMap } from "@/models/tile";
import { uid } from "uid";
import { tileCountPerDimension } from "@constants";
import { isNil } from "lodash";

type State = { board: string[][]; tiles: TileMap };
type Action =
  | {
      type: "CREATE_TILE";
      tile: Tile;
    }
  | { type: "MOVE_UP" }
  | { type: "MOVE_DOWN" }
  | { type: "MOVE_LEFT" }
  | { type: "MOVE_RIGHT" };

export function createBoard() {
  const board: string[][] = [];

  for (let i = 0; i < tileCountPerDimension; i++) {
    board[i] = new Array(tileCountPerDimension).fill(undefined);
  }
  return board;
}

export const initialState: State = { board: createBoard(), tiles: {} };

export default function gameReducer(
  state: State = initialState,
  action: Action,
) {
  switch (action.type) {
    case "CREATE_TILE": {
      const tileId = uid();
      const [x, y] = action.tile.position;
      const newBoard = JSON.parse(JSON.stringify(state.board));
      newBoard[y][x] = tileId;

      return {
        ...state,
        board: newBoard,
        tiles: { ...state.tiles, [tileId]: action.tile },
      };
    }
    case "MOVE_UP": {
      const newBoard = createBoard();
      const newTiles: TileMap = {};

      for (let x = 0; x < tileCountPerDimension; x++) {
        let newY = 0;
        let previousTile: Tile | undefined;

        for (let y = 0; y < tileCountPerDimension; y++) {
          const tileId = state.board[y][x];
          const currentTile = state.tiles[tileId];

          if (!isNil(tileId)) {
            if (previousTile?.value === currentTile.value) {
              newTiles[tileId] = { ...currentTile, position: [x, newY - 1] };
              previousTile = undefined;
              continue;
            }

            newBoard[newY][x] = tileId;
            newTiles[tileId] = { ...currentTile, position: [x, newY] };

            previousTile = currentTile;
            newY++;
          }
        }
      }

      return {
        ...state,
        board: newBoard,
        tiles: newTiles,
      };
    }
    case "MOVE_DOWN": {
      const newBoard = createBoard();
      const newTiles: TileMap = {};

      for (let x = 0; x < tileCountPerDimension; x++) {
        let newY = tileCountPerDimension - 1;
        let previousTile: Tile | undefined;

        for (let y = tileCountPerDimension - 1; y >= 0; y--) {
          const tileId = state.board[y][x];
          const currentTile = state.tiles[tileId];

          if (!isNil(tileId)) {
            if (previousTile?.value === currentTile.value) {
              newTiles[tileId] = { ...currentTile, position: [x, newY + 1] };
              previousTile = undefined;
              continue;
            }

            newBoard[newY][x] = tileId;
            newTiles[tileId] = { ...currentTile, position: [x, newY] };

            previousTile = currentTile;
            newY--;
          }
        }
      }

      return {
        ...state,
        board: newBoard,
        tiles: newTiles,
      };
    }
    case "MOVE_LEFT": {
      const newBoard = createBoard();
      const newTiles: TileMap = {};

      for (let y = 0; y < tileCountPerDimension; y++) {
        let newX = 0;
        let previousTile: Tile | undefined;

        for (let x = 0; x < tileCountPerDimension; x++) {
          const tileId = state.board[y][x];
          const currentTile = state.tiles[tileId];

          if (!isNil(tileId)) {
            if (previousTile?.value === currentTile.value) {
              newTiles[tileId] = { ...currentTile, position: [newX - 1, y] };
              previousTile = undefined;
              continue;
            }

            newBoard[y][newX] = tileId;
            newTiles[tileId] = { ...currentTile, position: [newX, y] };

            previousTile = currentTile;
            newX++;
          }
        }
      }

      return {
        ...state,
        board: newBoard,
        tiles: newTiles,
      };
    }
    case "MOVE_RIGHT": {
      const newBoard = createBoard();
      const newTiles: TileMap = {};

      for (let y = 0; y < tileCountPerDimension; y++) {
        let newX = tileCountPerDimension - 1;
        let previousTile: Tile | undefined;
        for (let x = tileCountPerDimension - 1; x >= 0; x--) {
          const tileId = state.board[y][x];
          const currentTile = state.tiles[tileId];

          if (!isNil(tileId)) {
            if (previousTile?.value === currentTile.value) {
              newTiles[tileId] = { ...currentTile, position: [newX + 1, y] };
              previousTile = undefined;
              continue;
            }

            newBoard[y][newX] = tileId;
            newTiles[tileId] = { ...currentTile, position: [newX, y] };

            previousTile = currentTile;
            newX--;
          }
        }
      }

      return {
        ...state,
        board: newBoard,
        tiles: newTiles,
      };
    }

    default:
      return state;
  }
}
