import { render } from "@testing-library/react";
import Board from "@/components/board";
import GameProvider from "@/context/game-context";

describe("Board", () => {
  it("should render board with 16 cells", () => {
    const { container } = render(
      <GameProvider>
        <Board />
      </GameProvider>,
    );
    const cellElements = container.querySelectorAll(".cell");
    expect(cellElements).toHaveLength(16);
  });

  it("should render board with 2 tiles", () => {
    const { container } = render(
      <GameProvider>
        <Board />
      </GameProvider>,
    );
    const tileElements = container.querySelectorAll(".tile");
    expect(tileElements).toHaveLength(2);
  });
});
