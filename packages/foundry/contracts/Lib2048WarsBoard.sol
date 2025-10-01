// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

library Lib2048WarsBoard {

  error Lib2048WarsBoard__InvalidMoveDirection();
  error Lib2048WarsBoard__InvalidPosition();
  error Lib2048WarsBoard__InvalidValue();

  enum MoveDirection {
    UP,
    DOWN,
    LEFT,
    RIGHT
  }
  
  uint256 constant BOARD_MASK = 0xFFFFFFFFFFFFFFFF; // 64 bits for 16 cells
  uint256 constant CELL_MASK = 0xF; // 4 bits per cell
  uint8 constant BOARD_SIZE = 4;
  uint8 constant TOTAL_CELLS = 16;

  struct BoardState {
    uint256 board; // Packed 4x4 grid
    uint256 score;
    bool hasChanged;
  }

  // Initial board is provided by the code in the frontend
  function getInitialBoard(uint8 position1, uint8 position2) internal pure returns (BoardState memory) {
    require(position1 != position2, "Positions cannot be the same");
    require(position1 < TOTAL_CELLS && position2 < TOTAL_CELLS, "Positions must be between 0 and 15");

    BoardState memory state;
    state.board = 0; // Initialize empty board
    
    state.board = setCellValue(state.board, position1, 2);
    state.board = setCellValue(state.board, position2, 2);
    
    state.score = 0;
    state.hasChanged = false;
    
    return state;
  }

  function getCellValue(uint256 board, uint8 position) internal pure returns (uint8) {
    require(position < TOTAL_CELLS, "Invalid position");
    return uint8((board >> (position * 4)) & CELL_MASK);
  }

  function setCellValue(uint256 board, uint8 position, uint8 value) internal pure returns (uint256) {
    require(position < TOTAL_CELLS, "Invalid position");
    require(value <= 15, "Value too large");
    
    // Clear the cell
    uint256 clearedBoard = board & ~(CELL_MASK << (position * 4));
    // Set the new value
    return clearedBoard | (uint256(value) << (position * 4));
  }

  // Get all empty positions
  function getEmptyPositions(uint256 board) internal pure returns (uint8[] memory) {
    uint8[] memory emptyPositions = new uint8[](TOTAL_CELLS);
    uint8 count = 0;
    
    for (uint8 i = 0; i < TOTAL_CELLS; i++) {
      if (getCellValue(board, i) == 0) {
        emptyPositions[count] = i;
        count++;
      }
    }
    
    // Resize array to actual count
    uint8[] memory result = new uint8[](count);
    for (uint8 i = 0; i < count; i++) {
      result[i] = emptyPositions[i];
    }
    
    return result;
  }

  // Convert position index (0-15) to [x, y] coordinates
  function indexToCoordinates(uint8 position) internal pure returns (uint8 x, uint8 y) {
    require(position < TOTAL_CELLS, "Invalid position");
    x = uint8(position % BOARD_SIZE);
    y = uint8(position / BOARD_SIZE);
  }

  // Convert [x, y] coordinates to position index (0-15)
  function coordinatesToIndex(uint8 x, uint8 y) internal pure returns (uint8) {
    require(x < BOARD_SIZE && y < BOARD_SIZE, "Invalid coordinates");
    return uint8(y * BOARD_SIZE + x);
  }

  // Get board as 2D array for easier manipulation
  function getBoard2D(uint256 board) internal pure returns (uint8[4][4] memory) {
    uint8[4][4] memory board2D;
    
    for (uint8 y = 0; y < BOARD_SIZE; y++) {
      for (uint8 x = 0; x < BOARD_SIZE; x++) {
        uint8 position = coordinatesToIndex(x, y);
        board2D[y][x] = getCellValue(board, position);
      }
    }
    
    return board2D;
  }

  // Set board from 2D array
  function setBoard2D(uint8[4][4] memory board2D) internal pure returns (uint256) {
    uint256 board = 0;
    
    for (uint8 y = 0; y < BOARD_SIZE; y++) {
      for (uint8 x = 0; x < BOARD_SIZE; x++) {
        uint8 position = coordinatesToIndex(x, y);
        board = setCellValue(board, position, board2D[y][x]);
      }
    }
    
    return board;
  }

  // Check if board is full
  function isBoardFull(uint256 board) internal pure returns (bool) {
    return getEmptyPositions(board).length == 0;
  }

  // Get all non-zero values on the board
  function getTileValues(uint256 board) internal pure returns (uint8[] memory) {
    uint8[] memory values = new uint8[](TOTAL_CELLS);
    uint8 count = 0;
    
    for (uint8 i = 0; i < TOTAL_CELLS; i++) {
      uint8 value = getCellValue(board, i);
      if (value > 0) {
        values[count] = value;
        count++;
      }
    }
    
    // Resize array to actual count
    uint8[] memory result = new uint8[](count);
    for (uint8 i = 0; i < count; i++) {
      result[i] = values[i];
    }
    
    return result;
  }

  /**
   * @notice Executes a move in the specified direction with frontend-provided new tile
   * @param state Current board state
   * @param direction Direction to move (UP, DOWN, LEFT, RIGHT)
   * @param newTilePosition Position for the new tile (0-15)
   * @param newTileValue Value for the new tile (2 or 4)
   * @return newState Updated board state after the move
   */
  function nextMove(BoardState memory state, MoveDirection direction, uint8 newTilePosition, uint8 newTileValue) internal pure returns (BoardState memory) {
    BoardState memory newState = state;
    newState.hasChanged = false;
    
    uint8[4][4] memory board = getBoard2D(state.board);
    uint8[4][4] memory newBoard;
    
    if (direction == MoveDirection.LEFT) {
      newBoard = moveLeft(board);
    } else if (direction == MoveDirection.RIGHT) {
      newBoard = moveRight(board);
    } else if (direction == MoveDirection.UP) {
      newBoard = moveUp(board);
    } else if (direction == MoveDirection.DOWN) {
      newBoard = moveDown(board);
    } else {
      revert Lib2048WarsBoard__InvalidMoveDirection();
    }
    
    // Check if board changed
    newState.hasChanged = !boardsEqual(board, newBoard);
    
    if (newState.hasChanged) {
      // Add tile provided by frontend
      newBoard = addTileAtPosition(newBoard, newTilePosition, newTileValue);
      newState.board = setBoard2D(newBoard);
    }
    
    return newState;
  }

  /**
   * @notice Move tiles left and merge
   */
  function moveLeft(uint8[4][4] memory board) internal pure returns (uint8[4][4] memory) {
    uint8[4][4] memory newBoard;
    
    for (uint8 y = 0; y < BOARD_SIZE; y++) {
      uint8[] memory row = new uint8[](4);
      uint8 writeIndex = 0;
      
      // Extract non-zero values
      for (uint8 x = 0; x < BOARD_SIZE; x++) {
        if (board[y][x] != 0) {
          row[writeIndex] = board[y][x];
          writeIndex++;
        }
      }
      
      // Merge adjacent equal values
      uint8 mergeIndex = 0;
      for (uint8 i = 0; i < writeIndex; i++) {
        if (i + 1 < writeIndex && row[i] == row[i + 1]) {
          // Merge tiles
          newBoard[y][mergeIndex] = row[i] + 1; // Increment power of 2
          i++; // Skip next tile
        } else {
          newBoard[y][mergeIndex] = row[i];
        }
        mergeIndex++;
      }
    }
    
    return newBoard;
  }

  /**
   * @notice Move tiles right and merge
   */
  function moveRight(uint8[4][4] memory board) internal pure returns (uint8[4][4] memory) {
    uint8[4][4] memory newBoard;
    
    for (uint8 y = 0; y < BOARD_SIZE; y++) {
      uint8[] memory row = new uint8[](4);
      uint8 writeIndex = 0;
      
      // Extract non-zero values in reverse order
      for (uint8 x = BOARD_SIZE; x > 0; x--) {
        if (board[y][x-1] != 0) {
          row[writeIndex] = board[y][x-1];
          writeIndex++;
        }
      }
      
      // Merge adjacent equal values
      uint8 mergeIndex = 0;
      for (uint8 i = 0; i < writeIndex; i++) {
        if (i + 1 < writeIndex && row[i] == row[i + 1]) {
          // Merge tiles
          newBoard[y][BOARD_SIZE - 1 - mergeIndex] = row[i] + 1;
          i++; // Skip next tile
        } else {
          newBoard[y][BOARD_SIZE - 1 - mergeIndex] = row[i];
        }
        mergeIndex++;
      }
    }
    
    return newBoard;
  }

  /**
   * @notice Move tiles up and merge
   */
  function moveUp(uint8[4][4] memory board) internal pure returns (uint8[4][4] memory) {
    uint8[4][4] memory newBoard;
    
    for (uint8 x = 0; x < BOARD_SIZE; x++) {
      uint8[] memory col = new uint8[](4);
      uint8 writeIndex = 0;
      
      // Extract non-zero values
      for (uint8 y = 0; y < BOARD_SIZE; y++) {
        if (board[y][x] != 0) {
          col[writeIndex] = board[y][x];
          writeIndex++;
        }
      }
      
      // Merge adjacent equal values
      uint8 mergeIndex = 0;
      for (uint8 i = 0; i < writeIndex; i++) {
        if (i + 1 < writeIndex && col[i] == col[i + 1]) {
          // Merge tiles
          newBoard[mergeIndex][x] = col[i] + 1;
          i++; // Skip next tile
        } else {
          newBoard[mergeIndex][x] = col[i];
        }
        mergeIndex++;
      }
    }
    
    return newBoard;
  }

  /**
   * @notice Move tiles down and merge
   */
  function moveDown(uint8[4][4] memory board) internal pure returns (uint8[4][4] memory) {
    uint8[4][4] memory newBoard;
    
    for (uint8 x = 0; x < BOARD_SIZE; x++) {
      uint8[] memory col = new uint8[](4);
      uint8 writeIndex = 0;
      
      // Extract non-zero values in reverse order
      for (uint8 y = BOARD_SIZE; y > 0; y--) {
        if (board[y-1][x] != 0) {
          col[writeIndex] = board[y-1][x];
          writeIndex++;
        }
      }
      
      // Merge adjacent equal values
      uint8 mergeIndex = 0;
      for (uint8 i = 0; i < writeIndex; i++) {
        if (i + 1 < writeIndex && col[i] == col[i + 1]) {
          // Merge tiles
          newBoard[BOARD_SIZE - 1 - mergeIndex][x] = col[i] + 1;
          i++; // Skip next tile
        } else {
          newBoard[BOARD_SIZE - 1 - mergeIndex][x] = col[i];
        }
        mergeIndex++;
      }
    }
    
    return newBoard;
  }

  /**
   * @notice Check if two boards are equal
   */
  function boardsEqual(uint8[4][4] memory board1, uint8[4][4] memory board2) internal pure returns (bool) {
    for (uint8 y = 0; y < BOARD_SIZE; y++) {
      for (uint8 x = 0; x < BOARD_SIZE; x++) {
        if (board1[y][x] != board2[y][x]) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * @notice Add a tile at the specified position (provided by frontend)
   * @param board Current board state
   * @param position Position to add tile (0-15)
   * @param value Value of the tile (2 or 4)
   * @return Updated board with new tile
   */
  function addTileAtPosition(uint8[4][4] memory board, uint8 position, uint8 value) internal pure returns (uint8[4][4] memory) {
    require(value == 2 || value == 4, "Invalid tile value");
    require(position < TOTAL_CELLS, "Invalid position");
    
    uint8 x = position % BOARD_SIZE;
    uint8 y = position / BOARD_SIZE;
    require(board[y][x] == 0, "Position not empty");
    
    board[y][x] = value;
    return board;
  }

  /**
   * @notice Get empty positions from 2D board
   */
  function getEmptyPositionsFrom2D(uint8[4][4] memory board) internal pure returns (uint8[] memory) {
    uint8[] memory emptyPositions = new uint8[](16);
    uint8 count = 0;
    
    for (uint8 y = 0; y < BOARD_SIZE; y++) {
      for (uint8 x = 0; x < BOARD_SIZE; x++) {
        if (board[y][x] == 0) {
          emptyPositions[count] = y * BOARD_SIZE + x;
          count++;
        }
      }
    }
    
    // Resize array
    uint8[] memory result = new uint8[](count);
    for (uint8 i = 0; i < count; i++) {
      result[i] = emptyPositions[i];
    }
    
    return result;
  }

  // Validate that an initial seed has exactly two tiles with value 2 and the rest 0
  function validateInitialPosition(uint256 initialSeed) internal pure returns (bool) {
    uint8[] memory values = getTileValues(initialSeed);
    if (values.length != 2) {
      return false;
    }
    return values[0] == 2 && values[1] == 2;
  }

  // Build initial board hash from two [x,y] positions
  function getInitialHash(uint8[] memory positionTile1, uint8[] memory positionTile2) internal pure returns (uint256) {
    require(positionTile1.length == 2 && positionTile2.length == 2, "Invalid positions");
    uint8 x1 = positionTile1[0];
    uint8 y1 = positionTile1[1];
    uint8 x2 = positionTile2[0];
    uint8 y2 = positionTile2[1];
    uint8 pos1 = coordinatesToIndex(x1, y1);
    uint8 pos2 = coordinatesToIndex(x2, y2);
    require(pos1 != pos2, "Positions cannot be the same");

    uint256 board = 0;
    board = setCellValue(board, pos1, 2);
    board = setCellValue(board, pos2, 2);
    return board;
  }

  // BATCH SYSTEM 

  uint8 constant MAX_BATCH_SIZE = 10;

  struct MoveBatch {
    MoveDirection[] directions; 
    uint8[] newTilePositions;  
    uint8[] newTileValues;     
    uint256[] expectedBoards;  
    bool isValid;              
    string validationError;    
  }

  // Process a batch of moves and validate each one
  // @param initialState Starting board state
  // @param directions Array of move directions (max 10)
  // @param newTilePositions Array of new tile positions for each move
  // @param newTileValues Array of new tile values for each move
  // @param expectedBoards Array of expected board states for verification
  // @return batchResult Result containing final state and validation info
  function processMoveBatch(
    BoardState memory initialState,
    MoveDirection[] memory directions,
    uint8[] memory newTilePositions,
    uint8[] memory newTileValues,
    uint256[] memory expectedBoards
  ) external pure returns (MoveBatch memory batchResult, BoardState memory finalState) {
    require(directions.length <= MAX_BATCH_SIZE, "Batch too large");
    require(directions.length == expectedBoards.length, "Directions and expected boards length mismatch");
    require(directions.length == newTilePositions.length, "Directions and tile positions length mismatch");
    require(directions.length == newTileValues.length, "Directions and tile values length mismatch");
    require(directions.length > 0, "Empty batch");

    batchResult.directions = directions;
    batchResult.newTilePositions = newTilePositions;
    batchResult.newTileValues = newTileValues;
    batchResult.expectedBoards = expectedBoards;
    batchResult.isValid = true;
    batchResult.validationError = "";

    // Process each move in sequence
    BoardState memory currentState = initialState;
    
    for (uint8 i = 0; i < directions.length; i++) {
      // Execute the move with frontend-provided tile
      BoardState memory newState = nextMove(currentState, directions[i], newTilePositions[i], newTileValues[i]);
      
      // Verify the move is valid by comparing with expected board
      if (newState.board != expectedBoards[i]) {
        batchResult.isValid = false;
        batchResult.validationError = string(abi.encodePacked("Invalid move at index ", uint2str(i)));
        return (batchResult, currentState); // Return current state if validation fails
      }
      
      // Update current state
      currentState = newState;
    }

    finalState = currentState;
    return (batchResult, finalState);
  }

  /**
   * @notice Validate a single move by comparing input/output states
   * @param previousBoard Board state before the move
   * @param direction Direction of the move
   * @param newTilePosition Position for the new tile
   * @param newTileValue Value for the new tile
   * @param nextBoard Expected board state after the move
   * @return isValid Whether the move is valid
   * @return errorMessage Error message if invalid
   */
  function validateMove(
    uint256 previousBoard,
    MoveDirection direction,
    uint8 newTilePosition,
    uint8 newTileValue,
    uint256 nextBoard
  ) external pure returns (bool isValid, string memory errorMessage) {
    // Create board state from previous board
    BoardState memory state;
    state.board = previousBoard;
    state.score = 0; // Score tracking can be added later
    state.hasChanged = false;

    // Execute the move with frontend-provided tile
    BoardState memory resultState = nextMove(state, direction, newTilePosition, newTileValue);

    // Compare results
    if (resultState.board == nextBoard) {
      return (true, "");
    } else {
      return (false, "Move result does not match expected board state");
    }
  }

  /**
   * @notice Validate a batch of moves without executing them
   * @param startBoard Starting board state
   * @param directions Array of move directions
   * @param newTilePositions Array of new tile positions for each move
   * @param newTileValues Array of new tile values for each move
   * @param expectedBoards Array of expected board states
   * @return isValid Whether all moves in the batch are valid
   * @return errorIndex Index of first invalid move (if any)
   * @return errorMessage Error message for the invalid move
   */
  function validateMoveBatch(
    uint256 startBoard,
    MoveDirection[] memory directions,
    uint8[] memory newTilePositions,
    uint8[] memory newTileValues,
    uint256[] memory expectedBoards
  ) external pure returns (bool isValid, uint8 errorIndex, string memory errorMessage) {
    require(directions.length <= MAX_BATCH_SIZE, "Batch too large");
    require(directions.length == expectedBoards.length, "Directions and expected boards length mismatch");
    require(directions.length == newTilePositions.length, "Directions and tile positions length mismatch");
    require(directions.length == newTileValues.length, "Directions and tile values length mismatch");
    require(directions.length > 0, "Empty batch");

    BoardState memory currentState;
    currentState.board = startBoard;
    currentState.score = 0;
    currentState.hasChanged = false;

    // Validate each move in sequence
    for (uint8 i = 0; i < directions.length; i++) {
      BoardState memory resultState = nextMove(currentState, directions[i], newTilePositions[i], newTileValues[i]);
      
      if (resultState.board != expectedBoards[i]) {
        return (false, i, "Move validation failed");
      }
      
      currentState = resultState;
    }

    return (true, 0, "");
  }

  /**
   * @notice Calculate score based on tile values
   * @param board Board state
   * @return score Calculated score
   */
  function calculateScore(uint256 board) internal pure returns (uint256 score) {
    uint8[4][4] memory board2D = getBoard2D(board);
    
    for (uint8 y = 0; y < BOARD_SIZE; y++) {
      for (uint8 x = 0; x < BOARD_SIZE; x++) {
        if (board2D[y][x] > 0) {
          // Score is sum of all tile values
          score += uint256(2) ** uint256(board2D[y][x]);
        }
      }
    }
    
    return score;
  }

  /**
   * @notice Check if the game is over (no valid moves possible)
   * @param board Current board state
   * @return gameOver Whether the game is over
   */
  function isGameOver(uint256 board) internal pure returns (bool gameOver) {
    // If board is not full, game is not over
    if (!isBoardFull(board)) {
      return false;
    }

    // Check if any adjacent tiles can be merged
    uint8[4][4] memory board2D = getBoard2D(board);
    
    // Check horizontal merges
    for (uint8 y = 0; y < BOARD_SIZE; y++) {
      for (uint8 x = 0; x < BOARD_SIZE - 1; x++) {
        if (board2D[y][x] == board2D[y][x + 1]) {
          return false; // Can merge horizontally
        }
      }
    }
    
    // Check vertical merges
    for (uint8 y = 0; y < BOARD_SIZE - 1; y++) {
      for (uint8 x = 0; x < BOARD_SIZE; x++) {
        if (board2D[y][x] == board2D[y + 1][x]) {
          return false; // Can merge vertically
        }
      }
    }
    
    return true; // No possible merges
  }

  /**
   * @notice Convert uint to string (helper function)
   */
  function uint2str(uint8 _i) internal pure returns (string memory) {
    if (_i == 0) {
      return "0";
    }
    uint8 j = _i;
    uint8 len;
    while (j != 0) {
      len++;
      j /= 10;
    }
    bytes memory bstr = new bytes(len);
    uint8 k = len;
    while (_i != 0) {
      k = k-1;
      uint8 temp = (48 + uint8(_i - _i / 10 * 10));
      bytes1 b1 = bytes1(temp);
      bstr[k] = b1;
      _i /= 10;
    }
    return string(bstr);
  }
}