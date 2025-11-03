import Countdown from "./counters/Countdown";
import tileStyles from "~~/styles/2048styles/tile.module.css";

type Tile = {
  id: string;
  value: number;
  row: number;
  col: number;
  mergedFrom?: string[];
  isNew?: boolean;
};

type BoardProps = {
  containerRef: any;
  tiles: Tile[];
  gameOver: boolean;
  gameError: boolean;
  resyncGame: () => void;
  initializeGame: () => void;
};

export default function Board({ containerRef, tiles, gameOver: _gameOver, gameError, resyncGame }: BoardProps) {
  // Get the background color for a tile based on its value
  const getTileColor = (value: number) => {
    switch (value) {
      case 2:
        return tileStyles.tile2;
      case 4:
        return tileStyles.tile4;
      case 8:
        return tileStyles.tile8;
      case 16:
        return tileStyles.tile16;
      case 32:
        return tileStyles.tile32;
      case 64:
        return tileStyles.tile64;
      case 128:
        return tileStyles.tile128;
      case 256:
        return tileStyles.tile256;
      case 512:
        return tileStyles.tile512;
      case 1024:
        return tileStyles.tile1024;
      case 2048:
        return tileStyles.tile2048;
      default:
        return "";
    }
  };

  // Get the font size for a tile based on its value
  const getTileFontSize = (value: number) => {
    if (value < 100) return "text-3xl";
    if (value < 1000) return "text-2xl";
    return "text-xl";
  };

  return (
    <>
      <div
        ref={containerRef}
        className="relative rounded-lg p-2 w-full max-w-md aspect-square grid grid-cols-4 grid-rows-4 gap-2"
        style={{ backgroundColor: "var(--secondary-background)" }}
      >
        {/* Create 16 cells for the grid */}
        {Array(16)
          .fill(0)
          .map((_, index) => {
            const row = Math.floor(index / 4);
            const col = index % 4;
            const tile = tiles.find(t => t.row === row && t.col === col);

            return (
              <div
                key={`cell-${index}`}
                className="rounded-md relative"
                style={{ backgroundColor: "var(--cell-background)" }}
              >
                {tile && (
                  <div
                    className={`absolute inset-0 rounded-md flex items-center justify-center ${getTileColor(tile.value)}`}
                    style={{
                      transition: "all 150ms ease-in-out",
                      transform: tile.isNew ? "scale(0.5)" : "scale(1)",
                      animation: tile.mergedFrom
                        ? "merge 200ms ease-in-out"
                        : tile.isNew
                          ? "appear 200ms ease-in-out forwards"
                          : "none",
                    }}
                  >
                    <span className={`font-bold ${getTileFontSize(tile.value)}`}>{tile.value}</span>
                  </div>
                )}
              </div>
            );
          })}

        {/* Game error overlay */}
        <Countdown gameError={gameError} resyncGame={resyncGame} />
      </div>

      <style>{`
        @keyframes appear {
            0% { transform: scale(0.5); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
        }

        @keyframes merge {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
        `}</style>
    </>
  );
}
