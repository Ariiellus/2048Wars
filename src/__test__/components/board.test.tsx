import { render } from "@testing-library/react";
import Board from "@/components/board";

describe("Board", () => {
  it("should render board with 16 cells", () => {
    const { container } = render(<Board />);
    const cellElements = container.querySelectorAll(".cell");
    expect(cellElements).toHaveLength(16);
  });

  it("should render board with 2 tiles", () => {
    const { container } = render(<Board />);
    const tileElements = container.querySelectorAll(".tile");
    expect(tileElements).toHaveLength(2);
  });
});
