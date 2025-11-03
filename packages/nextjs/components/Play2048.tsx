"use client";

// Hooks
import { useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
// Utils
import { Hex, encodePacked, hexToBigInt, keccak256, toHex } from "viem";
// UI
import Board from "~~/components/Board";
import Container from "~~/components/Container";
import { FaucetDialog } from "~~/components/FaucetDialog";
import Moves from "~~/components/counters/moves";
import Score from "~~/components/counters/score";
import { Toaster } from "~~/components/ui/sonner";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useTransactions } from "~~/hooks/useTransactions";

// Types
enum Direction {
  UP,
  DOWN,
  LEFT,
  RIGHT,
}
type Tile = {
  id: string;
  value: number;
  row: number;
  col: number;
  mergedFrom?: string[];
  isNew?: boolean;
};
type EncodedMove = {
  board: bigint; // 128 bits
  move: number; // 8 bits
};
type BoardState = {
  tiles: Tile[];
};

export default function Game2048() {
  // =============================================================//
  //                      Custom Hook Values                      //
  // =============================================================//

  const { user } = usePrivy();

  const { resetNonceAndBalance, getLatestGameBoard, playNewMoveTransaction, initializeGameTransaction } =
    useTransactions();

  // =============================================================//
  //                         Game State                           //
  // =============================================================//

  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameError, setGameError] = useState<boolean>(false);
  const [_gameErrorText, setGameErrorText] = useState<string>("");
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [faucetModalOpen, setFaucetModalOpen] = useState<boolean>(false);
  const [activeGameId, setActiveGameId] = useState<Hex>("0x");
  const [encodedMoves, setEncodedMoves] = useState<EncodedMove[]>([]);
  const [playedMovesCount, setPlayedMovesCount] = useState<number>(0);
  const [_lastMoveScoreIncrement, setLastMoveScoreIncrement] = useState<number>(0);
  const [localScore, setLocalScore] = useState<number>(0); // Local cumulative score

  const [boardState, setBoardState] = useState<BoardState>({
    tiles: [],
  });
  const [resetBoards, setResetBoards] = useState<BoardState[]>([]);

  // =============================================================//
  //                   Detect and execute moves                   //
  // =============================================================//

  // Reset board on error.
  useEffect(() => {
    const boards = resetBoards;

    if (boards.length > 0) {
      // Just use the first board for error reset
      setBoardState(boards[0]);
    }
  }, [resetBoards]);

  function resetBoardOnError(premoveBoard: BoardState, currentMove: number, error: Error) {
    if (!gameError) {
      setGameError(true);
      setGameErrorText(error.message);

      setResetBoards(current => [...current, premoveBoard]);
      setPlayedMovesCount(currentMove);

      setIsAnimating(false);
    }

    if (error.message.includes("insufficient balance")) {
      setFaucetModalOpen(true);
    }
  }

  // Handle keyboard / swipe events
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = gameContainerRef.current;
    if (!container) return;

    const handleKeyDown = async (event: KeyboardEvent) => {
      if (!user || gameOver || isAnimating || faucetModalOpen) return;

      switch (event.key) {
        case "ArrowUp":
          await move(Direction.UP);
          break;
        case "ArrowDown":
          await move(Direction.DOWN);
          break;
        case "ArrowLeft":
          await move(Direction.LEFT);
          break;
        case "ArrowRight":
          await move(Direction.RIGHT);
          break;
      }
    };

    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    };

    const handleTouchEnd = async (e: TouchEvent) => {
      e.preventDefault();
      if (!user || gameOver || isAnimating) return;

      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;

      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 50) await move(Direction.RIGHT);
        else if (dx < -50) await move(Direction.LEFT);
      } else {
        if (dy > 50) await move(Direction.DOWN);
        else if (dy < -50) await move(Direction.UP);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    }); // 👈 passive: false is REQUIRED
    container.addEventListener("touchend", handleTouchEnd, {
      passive: false,
    });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [user, boardState, gameOver, isAnimating, faucetModalOpen]);

  // Move tiles in the specified direction
  const move = async (direction: Direction) => {
    const premoveBoard = boardState;
    const currentMove = playedMovesCount;

    try {
      // Create a copy of the board state
      const newBoardState: BoardState = {
        tiles: JSON.parse(JSON.stringify(boardState.tiles)),
      };

      // Reset the merged and new flags
      newBoardState.tiles.forEach(tile => {
        tile.mergedFrom = undefined;
        tile.isNew = false;
      });

      // Get the traversal order based on the direction
      const traversals = getTraversalDirections(direction);

      let moved = false;
      let scoreIncrement = 0; // Track score from merges in this move

      // Process the tiles in the correct order
      traversals.row.forEach(row => {
        traversals.col.forEach(col => {
          const tile = newBoardState.tiles.find(t => t.row === row && t.col === col);

          if (tile) {
            const { newRow, newCol, merged } = findFarthestPosition(newBoardState, tile, direction);

            if (merged) {
              // Merge with the tile at the new position
              const targetTile = newBoardState.tiles.find(t => t.row === newRow && t.col === newCol);

              if (targetTile) {
                // Create a new tile with the merged value
                const mergedValue = tile.value * 2;
                const mergedTile: Tile = {
                  id: generateTileId(),
                  value: mergedValue,
                  row: newRow,
                  col: newCol,
                  mergedFrom: [tile.id, targetTile.id],
                };

                // Remove the original tiles
                newBoardState.tiles = newBoardState.tiles.filter(t => t.id !== tile.id && t.id !== targetTile.id);

                // Add the merged tile
                newBoardState.tiles.push(mergedTile);

                // Score increment = merged tile value (e.g., merging two 4s gives 8, score += 8)
                scoreIncrement += mergedValue;

                moved = true;
              }
            } else if (tile.row !== newRow || tile.col !== newCol) {
              // Move the tile to the new position
              tile.row = newRow;
              tile.col = newCol;

              moved = true;
            }
          }
        });
      });

      // If the board changed, add a new random tile
      if (moved) {
        // Update local score immediately for instant feedback
        const newLocalScore = localScore + scoreIncrement;
        setLocalScore(newLocalScore);
        setLastMoveScoreIncrement(scoreIncrement);

        // Pause moves
        setIsAnimating(true);

        // Create a new copy to avoid mutation issues
        const updatedBoardState = {
          tiles: [...newBoardState.tiles],
        };
        addRandomTileViaSeed(updatedBoardState, activeGameId, currentMove);

        // Add move
        const encoded = tilesToEncodedMove(updatedBoardState.tiles, direction);
        const newEncodedMoves = [...encodedMoves, encoded];
        const moveCount = playedMovesCount;

        if (moveCount == 3) {
          const boards = [
            newEncodedMoves[0].board,
            newEncodedMoves[1].board,
            newEncodedMoves[2].board,
            newEncodedMoves[3].board,
          ] as readonly [bigint, bigint, bigint, bigint];

          const moves = [newEncodedMoves[1].move, newEncodedMoves[2].move, newEncodedMoves[3].move] as readonly [
            number,
            number,
            number,
          ];

          // Update board state with tiles immediately
          setBoardState({ tiles: [...updatedBoardState.tiles] });
          setEncodedMoves(newEncodedMoves);
          setPlayedMovesCount(moveCount + 1);

          initializeGameTransaction(activeGameId, boards, moves)
            .then(() => {
              // Don't sync with contract - localScore is already correct
              // Only sync when resyncing game or on error recovery
              setLastMoveScoreIncrement(0); // Reset after confirmation
            })
            .catch(error => {
              console.error("Error in init transaction:", error);
              // Rollback local score on error - revert to score before this move
              setLocalScore(prev => prev - scoreIncrement);
              setLastMoveScoreIncrement(0); // Reset on error
              resetBoardOnError(premoveBoard, currentMove, error);
            });
        } else if (moveCount > 3) {
          // Update board state with tiles immediately
          setBoardState({ tiles: [...updatedBoardState.tiles] });
          setEncodedMoves(newEncodedMoves);
          setPlayedMovesCount(moveCount + 1);

          playNewMoveTransaction(activeGameId as Hex, encoded.board, encoded.move, moveCount)
            .then(() => {
              // Don't sync with contract - localScore is already correct
              // Only sync when resyncing game or on error recovery
              setLastMoveScoreIncrement(0); // Reset after confirmation
            })
            .catch(error => {
              console.error("Error in move transaction:", error);
              // Rollback local score on error - revert to score before this move
              setLocalScore(prev => prev - scoreIncrement);
              setLastMoveScoreIncrement(0); // Reset on error
              resetBoardOnError(premoveBoard, currentMove, error);
            });
        } else {
          // For moves 1-3, just update local state (no contract interaction yet)
          setBoardState({ tiles: updatedBoardState.tiles });
          setEncodedMoves(newEncodedMoves);
          setPlayedMovesCount(moveCount + 1);
          setLastMoveScoreIncrement(0); // No optimistic update for moves 1-3
        }

        // Check if the game is over
        if (checkGameOver(updatedBoardState)) {
          setGameOver(true);
        }

        // Resume moves
        await new Promise(resolve => setTimeout(resolve, 150));
        setIsAnimating(false);
      }
    } catch (error) {
      console.error("Error in move operation:", error);
      resetBoardOnError(premoveBoard, currentMove, error as Error);
    }
  };

  // =============================================================//
  //                      Initialize new game                     //
  // =============================================================//

  const [address, setAddress] = useState("");
  useEffect(() => {
    if (!user) {
      setAddress("");
      return;
    }

    const [privyUser] = user.linkedAccounts.filter(
      account => account.type === "wallet" && account.walletClientType === "privy",
    );
    if (!privyUser || !(privyUser as any).address) {
      setAddress("");
      return;
    }

    setAddress((privyUser as any).address);
  }, [user]);

  // Fetch the player's gameId from the contract
  const { data: contractGameId } = useScaffoldReadContract({
    contractName: "Play2048Wars",
    functionName: "getPlayerGameId",
    args: [address as `0x${string}`],
  });

  // Track if we've initialized to prevent multiple initializations
  const hasInitializedRef = useRef(false);

  // Auto-initialize or resync game when address is available and board is empty
  useEffect(() => {
    // Only initialize once when conditions are met
    if (
      address &&
      contractGameId &&
      boardState.tiles.length === 0 &&
      !gameOver &&
      !gameError &&
      !isAnimating &&
      !hasInitializedRef.current
    ) {
      hasInitializedRef.current = true;

      // Check if gameId is not zero (player has an active game)
      if (contractGameId !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        // Resync existing game from contract
        setActiveGameId(contractGameId as Hex);
        resyncGameFromContract(contractGameId as Hex);
      } else {
        // Start new local game (will be synced to contract after 3 moves)
        initializeGame();
      }
    }
  }, [address, contractGameId, boardState.tiles.length, gameOver, gameError, isAnimating]);

  // Initialize the game with two random tiles
  const initializeGame = () => {
    setResetBoards([]);
    setLocalScore(0); // Reset score for new game

    const newBoardState: BoardState = {
      tiles: [],
    };

    // Add two random tiles
    addRandomTile(newBoardState);
    addRandomTile(newBoardState);

    setPlayedMovesCount(1);
    // Use the gameId from the contract
    if (contractGameId && contractGameId !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
      setActiveGameId(contractGameId as Hex);
    }
    setEncodedMoves([tilesToEncodedMove(newBoardState.tiles, 0)]);

    setBoardState(newBoardState);
    setGameError(false);
    setGameOver(false);

    // Allow re-initialization if user manually resets
    hasInitializedRef.current = true;
  };

  // Add a random tile to the board (2 with 90% chance, 4 with 10% chance)
  const addRandomTile = (boardState: BoardState) => {
    const emptyCells = [];

    // Find all empty cells
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (!boardState.tiles.some(tile => tile.row === row && tile.col === col)) {
          emptyCells.push({ row, col });
        }
      }
    }

    // If there are no empty cells, return
    if (emptyCells.length === 0) return;

    // Choose a random empty cell
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];

    // Create a new tile
    const newTile: Tile = {
      id: generateTileId(),
      value: Math.random() < 0.9 ? 2 : 4,
      row: randomCell.row,
      col: randomCell.col,
      isNew: true,
    };

    boardState.tiles.push(newTile);
  };

  // =============================================================//
  //                      Re-sync ongoing game                    //
  // =============================================================//

  // Resumes a game where it was left off (uses activeGameId from state)
  const resyncGame = async () => {
    await resyncGameFromContract(activeGameId);
  };

  // Resumes a game from a specific gameId
  const resyncGameFromContract = async (gameId: Hex) => {
    try {
      const [latestBoard, nextMoveNumber, contractScore] = await getLatestGameBoard(gameId);

      // Sync localScore with contract score only if it's different
      const newScore = Number(contractScore);
      setLocalScore(newScore);

      // Check if the game has been started on-chain (nextMoveNumber > 0)
      if (nextMoveNumber === 0n) {
        // Game exists but hasn't been started yet (user entered but didn't play 3 moves)
        // Start a fresh local game
        initializeGame();
        return;
      }

      const newBoardState: BoardState = {
        tiles: [],
      };

      let nonzero = false;
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          const value = latestBoard[4 * i + j];
          if (value > 0) {
            nonzero = true;

            const newTile: Tile = {
              id: generateTileId(),
              value: 2 ** value,
              row: i,
              col: j,
              isNew: true,
            };

            newBoardState.tiles.push(newTile);
          }
        }
      }

      setResetBoards([]);
      await resetNonceAndBalance();
      if (!nonzero) {
        // Board is empty on-chain, start fresh
        initializeGame();
      } else {
        // Resume from on-chain state
        setBoardState(newBoardState);
        setPlayedMovesCount(parseInt(nextMoveNumber.toString()));
        setGameErrorText("");
        setGameError(false);
      }
    } catch (error) {
      console.error("Error resyncing game:", error);
      // If there's an error fetching the board, start a fresh game
      initializeGame();
    }
  };

  // =============================================================//
  //                      Board logic helpers                     //
  // =============================================================//

  // Generate a unique ID for tiles
  const generateTileId = () => {
    return keccak256(toHex(Math.random().toString()));
  };

  // Add a random tile to the board (2 with 90% chance, 4 with 10% chance)
  const addRandomTileViaSeed = (boardState: BoardState, gameId: Hex, moveNumber: number) => {
    const emptyCells = [];

    // Find all empty cells
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (!boardState.tiles.some(tile => tile.row === row && tile.col === col)) {
          emptyCells.push({ row, col });
        }
      }
    }

    // If there are no empty cells, return
    if (emptyCells.length === 0) return;

    // Choose a random empty cell
    const seed = hexToBigInt(keccak256(encodePacked(["bytes32", "uint256"], [gameId, BigInt(moveNumber)])));
    const index = parseInt((seed % BigInt(emptyCells.length)).toString());
    const randomCell = emptyCells[index];

    // Choose random value.
    const value = parseInt((seed % BigInt(100)).toString()) > 90 ? 4 : 2;

    // Create a new tile
    const newTile: Tile = {
      id: generateTileId(),
      value,
      row: randomCell.row,
      col: randomCell.col,
      isNew: true,
    };

    boardState.tiles.push(newTile);
  };

  // Convert the tiles array to a 2D grid for easier processing
  const getTilesGrid = (tiles: Tile[]): (Tile | null)[][] => {
    const grid: (Tile | null)[][] = Array(4)
      .fill(null)
      .map(() => Array(4).fill(null));

    tiles.forEach(tile => {
      grid[tile.row][tile.col] = tile;
    });

    return grid;
  };

  // Check if the game is over
  const checkGameOver = (boardState: BoardState) => {
    // If there are empty cells, the game is not over
    if (boardState.tiles.length < 16) return false;

    const grid = getTilesGrid(boardState.tiles);

    // Check if there are any adjacent cells with the same value
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const tile = grid[row][col];
        if (tile) {
          // Check right
          if (col < 3 && grid[row][col + 1] && grid[row][col + 1]!.value === tile.value) {
            return false;
          }
          // Check down
          if (row < 3 && grid[row + 1][col] && grid[row + 1][col]!.value === tile.value) {
            return false;
          }
        }
      }
    }

    return true;
  };

  function tilesToEncodedMove(tiles: Tile[], direction: Direction): EncodedMove {
    const boardArray: number[] = new Array(16).fill(0);

    tiles.forEach(tile => {
      const index = tile.row * 4 + tile.col;
      boardArray[index] = Math.log2(tile.value);
    });

    let board = BigInt(0);
    for (let i = 0; i < 16; i++) {
      board |= BigInt(boardArray[i]) << BigInt((15 - i) * 8);
    }

    const move = direction;

    return { board, move };
  }

  // Get the traversal order based on the direction
  const getTraversalDirections = (direction: Direction) => {
    const traversals = {
      row: [0, 1, 2, 3],
      col: [0, 1, 2, 3],
    };

    // Process tiles in the correct order based on the direction
    if (direction === Direction.RIGHT) traversals.col = [3, 2, 1, 0];
    if (direction === Direction.DOWN) traversals.row = [3, 2, 1, 0];

    return traversals;
  };

  // Find the farthest position a tile can move in the specified direction
  const findFarthestPosition = (boardState: BoardState, tile: Tile, direction: Direction) => {
    let { row, col } = tile;
    let newRow = row;
    let newCol = col;
    let merged = false;

    // Calculate the vector for the direction
    const vector = getVector(direction);

    // Move as far as possible in the direction
    do {
      row = newRow;
      col = newCol;
      newRow = row + vector.row;
      newCol = col + vector.col;
    } while (isWithinBounds(newRow, newCol) && !isCellOccupied(boardState, newRow, newCol));

    // Check if we can merge with the tile at the new position
    if (isWithinBounds(newRow, newCol) && canMergeWithTile(boardState, tile, newRow, newCol)) {
      merged = true;
    } else {
      // If we can't merge, use the previous position
      newRow = row;
      newCol = col;
    }

    return { newRow, newCol, merged };
  };

  // Get the vector for the direction
  const getVector = (direction: Direction) => {
    const vectors = {
      [Direction.UP]: { row: -1, col: 0 },
      [Direction.RIGHT]: { row: 0, col: 1 },
      [Direction.DOWN]: { row: 1, col: 0 },
      [Direction.LEFT]: { row: 0, col: -1 },
    };

    return vectors[direction];
  };

  // Check if the position is within the bounds of the board
  const isWithinBounds = (row: number, col: number) => {
    return row >= 0 && row < 4 && col >= 0 && col < 4;
  };

  // Check if the cell is occupied
  const isCellOccupied = (boardState: BoardState, row: number, col: number) => {
    return boardState.tiles.some(tile => tile.row === row && tile.col === col);
  };

  // Check if the tile can merge with the tile at the specified position
  const canMergeWithTile = (boardState: BoardState, tile: Tile, row: number, col: number) => {
    const targetTile = boardState.tiles.find(t => t.row === row && t.col === col);
    return targetTile && targetTile.value === tile.value && !targetTile.mergedFrom;
  };

  // Display

  const [isLaptopOrLess, setIsLaptopOrLess] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1024px)");
    const handleResize = () => setIsLaptopOrLess(mediaQuery.matches);

    // Set initial value
    handleResize();

    // Listen for changes
    mediaQuery.addEventListener("change", handleResize);
    return () => mediaQuery.removeEventListener("change", handleResize);
  }, []);

  return (
    <Container>
      <div className="flex flex-col flex-1">
        <div className="grid grid-cols-2 gap-4">
          <Score score={localScore} />
          <Moves moves={playedMovesCount} />
        </div>

        <div className="flex justify-center mt-4">
          <Board
            containerRef={gameContainerRef}
            tiles={boardState.tiles}
            gameOver={gameOver}
            gameError={gameError}
            resyncGame={resyncGame}
            initializeGame={initializeGame}
          />
        </div>

        <FaucetDialog resyncGame={resyncGame} isOpen={faucetModalOpen} setIsOpen={setFaucetModalOpen} />
      </div>

      <Toaster
        visibleToasts={isLaptopOrLess ? 1 : 3}
        position={isLaptopOrLess ? "top-center" : "bottom-right"}
        richColors
        expand={true}
      />
    </Container>
  );
}
