import { act, renderHook } from "@testing-library/react";
import gameReducer, { initialState } from "@/reducers/game-reducer";
import { Tile } from "@/models/tile";
import { useReducer } from "react";
import { isNil } from "lodash";

describe("gameReducer", () => {
  describe("create_tile", () => {
    it("should create a new tile", () => {
      const tile: Tile = {
        position: [0, 0],
        value: 2,
      };

      const { result } = renderHook(() =>
        useReducer(gameReducer, initialState),
      );
      const [, dispatch] = result.current;

      act(() => dispatch({ type: "CREATE_TILE", tile }));

      const [state] = result.current;

      expect(state.board[0][0]).toBeDefined();
      expect(Object.values(state.tiles)).toEqual([tile]);
    });
  });

  describe("move_up", () => {
    it("should move the tiles to the top of the board", () => {
      const tile1: Tile = {
        position: [0, 1],
        value: 2,
      };

      const tile2: Tile = {
        position: [1, 3],
        value: 2,
      };

      const { result } = renderHook(() =>
        useReducer(gameReducer, initialState),
      );
      const [, dispatch] = result.current;

      act(() => {
        dispatch({ type: "CREATE_TILE", tile: tile1 });
        dispatch({ type: "CREATE_TILE", tile: tile2 });
      });

      const [stateBefore] = result.current;
      expect(isNil(stateBefore.board[0][0])).toBeTruthy();
      expect(isNil(stateBefore.board[0][1])).toBeTruthy();
      expect(typeof stateBefore.board[1][0]).toBe("string");
      expect(typeof stateBefore.board[3][1]).toBe("string");

      // console.log("stateBefore", stateBefore);

      act(() => dispatch({ type: "MOVE_UP" }));

      const [stateAfter] = result.current;
      expect(typeof stateAfter.board[0][0]).toBe("string");
      expect(typeof stateAfter.board[0][1]).toBe("string");
      expect(isNil(stateAfter.board[1][0])).toBeTruthy();
      expect(isNil(stateAfter.board[3][1])).toBeTruthy();

      // console.log("stateAfter", stateAfter);
    });
  });

  describe("move_down", () => {
    it("should move the tiles to the top of the board", () => {
      const tile1: Tile = {
        position: [0, 1],
        value: 2,
      };

      const tile2: Tile = {
        position: [1, 3],
        value: 2,
      };

      const { result } = renderHook(() =>
        useReducer(gameReducer, initialState),
      );
      const [, dispatch] = result.current;

      act(() => {
        dispatch({ type: "CREATE_TILE", tile: tile1 });
        dispatch({ type: "CREATE_TILE", tile: tile2 });
      });

      const [stateBefore] = result.current;
      expect(isNil(stateBefore.board[0][0])).toBeTruthy();
      expect(typeof stateBefore.board[1][0]).toBe("string");
      expect(typeof stateBefore.board[3][1]).toBe("string");

      // console.log("stateBefore", stateBefore);

      act(() => dispatch({ type: "MOVE_DOWN" }));

      const [stateAfter] = result.current;
      expect(typeof stateAfter.board[3][0]).toBe("string");
      expect(typeof stateAfter.board[3][1]).toBe("string");
      expect(isNil(stateAfter.board[1][0])).toBeTruthy();

      // console.log("stateAfter", stateAfter);
    });
  });
});
