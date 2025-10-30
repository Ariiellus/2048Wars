import tileStyles from "~~/styles/2048styles/tile.module.css";
import FunPurpleButton from "./FunPurpleButton";

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
    score: number;
    tiles: Tile[];
    gameOver: boolean;
    gameError: boolean;
    gameErrorText: string;
    resyncGame: () => void;
    initializeGame: () => void;
};

export default function Board({
    containerRef,
    tiles,
    score,
    gameOver,
    gameError,
    gameErrorText,
    resyncGame,
    initializeGame,
}: BoardProps) {
    // Calculate the position of a tile
    const getTilePosition = (row: number, col: number) => {
        return {
            top: `calc(${row * 25}% + 0.5rem)`,
            left: `calc(${col * 25}% + 0.5rem)`,
            width: "calc(25% - 1rem)",
            height: "calc(25% - 1rem)",
        };
    };

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
                className="relative rounded-lg p-2 w-full max-w-md aspect-square"
                style={{ backgroundColor: "var(--secondary-background)" }}
            >
                {/* Grid background */}
                <div className="grid grid-cols-4 grid-rows-4 gap-2 h-full w-full">
                    {Array(16)
                        .fill(0)
                        .map((_, index) => (
                            <div
                                key={`cell-${index}`}
                                className="rounded-md"
                                style={{ backgroundColor: "var(--cell-background)" }}
                            />
                        ))}
                </div>

                {/* Tiles */}
                {tiles.map((tile: Tile) => (
                    <div
                        key={tile.id}
                        className={`absolute rounded-md flex items-center justify-center ${getTileColor(
                            tile.value
                        )}`}
                        style={{
                            ...getTilePosition(tile.row, tile.col),
                            zIndex: 10,
                            transition: "all 150ms ease-in-out",
                            transform: tile.mergedFrom
                                ? "scale(1.1)"
                                : tile.isNew
                                ? "scale(0.5)"
                                : "scale(1)",
                            animation: tile.mergedFrom
                                ? "merge 200ms ease-in-out"
                                : tile.isNew
                                ? "appear 200ms ease-in-out forwards"
                                : "none",
                        }}
                    >
                        <span
                            className={`font-bold ${getTileFontSize(
                                tile.value
                            )}`}
                        >
                            {tile.value}
                        </span>
                    </div>
                ))}

                {/* Game error overlay */}
                {gameError && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg z-20">
                        <div className="p-6 bg-white rounded-lg text-center">
                            <h2 className="text-2xl font-bold mb-4">
                                Oops! Game Error :(
                            </h2>
                            <p className="mb-2 text-red-500">
                                <span className="text-red-600 font-bold">
                                    Error
                                </span>
                                : {gameErrorText}
                            </p>
                            <p className="mb-4">Your score: {score}</p>
                            <FunPurpleButton
                                text="Re-sync game"
                                onClick={resyncGame}
                            />
                        </div>
                    </div>
                )}
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
