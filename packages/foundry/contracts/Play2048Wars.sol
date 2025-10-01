// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Manager2048Wars} from "./Manager2048Wars.sol";
import {Lib2048WarsBoard} from "./Lib2048WarsBoard.sol";

/**
 * @title Play2048Wars
 * @notice Main contract for playing 2048 Wars with batched move system
 * @dev Inherits from Manager2048Wars for tournament functionality
 * @dev Implements batched move processing for gas efficiency
 */
contract Play2048Wars is Manager2048Wars {
  using Lib2048WarsBoard for *;

  // 
  // ERRORS
  // 
  error Play2048Wars__InvalidInitialBoard();
  error Play2048Wars__GameNotStarted();
  error Play2048Wars__InvalidBatchSize();
  error Play2048Wars__BatchValidationFailed(string reason);
  error Play2048Wars__GameAlreadyStarted();
  error Play2048Wars__NotPlayer();

  // 
  // EVENTS
  // 
  event GameStarted(address indexed player, uint256 gameId, uint256 initialBoard);
  event BatchMovesProcessed(address indexed player, uint256 gameId, uint8 moveCount, uint256 finalBoard);
  event GameCompleted(address indexed player, uint256 gameId, uint256 finalScore);
  event GameOver(address indexed player, uint256 gameId);

  // 
  // STATE VARIABLES
  // 
  
  /**
   * @notice Game session structure
   */
  struct GameSession {
    uint256 gameId;           // Unique game identifier
    address player;           // Player address
    uint256 initialBoard;     // Starting board state
    uint256 currentBoard;     // Current board state
    uint256 score;            // Current score
    bool isActive;            // Whether game is still active
    uint256 startTime;        // Game start timestamp
    uint8 movesPlayed;        // Total moves played in this game
  }

  // Game state mappings
  mapping(address => GameSession) public playerGames;      // Active game per player
  mapping(uint256 => GameSession) public gameSessions;     // Game sessions by ID
  uint256 public nextGameId;                               // Next available game ID
  uint256 public totalGamesPlayed;                         // Total games played

  // 
  // CONSTRUCTOR
  // 
  constructor(uint256 _entryFee, address _owner) Manager2048Wars(_entryFee, _owner) {
    nextGameId = 1;
    totalGamesPlayed = 0;
  }

  // 
  // GAME MANAGEMENT FUNCTIONS
  // 

  /**
   * @notice Start a new game session for the calling player
   * @param initialBoard Valid initial board state (must have exactly 2 tiles with value 2)
   * @return gameId The ID of the newly created game
   */
  function startGame(uint256 initialBoard) public returns (uint256 gameId) {
    require(isPlayer[msg.sender], "Must be a registered player");
    require(playerGames[msg.sender].isActive == false, "Game already active");

    // Validate initial board
    if (!Lib2048WarsBoard.validateInitialPosition(initialBoard)) {
      revert Play2048Wars__InvalidInitialBoard();
    }

    gameId = nextGameId++;
    
    // Create new game session
    GameSession memory newGame = GameSession({
      gameId: gameId,
      player: msg.sender,
      initialBoard: initialBoard,
      currentBoard: initialBoard,
      score: 0,
      isActive: true,
      startTime: block.timestamp,
      movesPlayed: 0
    });

    // Store game session
    playerGames[msg.sender] = newGame;
    gameSessions[gameId] = newGame;
    totalGamesPlayed++;

    emit GameStarted(msg.sender, gameId, initialBoard);
    return gameId;
  }

  /**
   * @notice Process a batch of up to 10 moves for the calling player's active game
   * @param directions Array of move directions (UP=0, DOWN=1, LEFT=2, RIGHT=3)
   * @param newTilePositions Array of new tile positions for each move
   * @param newTileValues Array of new tile values for each move
   * @param expectedBoards Array of expected board states after each move (for validation)
   * @return success Whether the batch was processed successfully
   * @return finalBoard The final board state after processing all moves
   */
  function processBatchMoves(
    Lib2048WarsBoard.MoveDirection[] memory directions,
    uint8[] memory newTilePositions,
    uint8[] memory newTileValues,
    uint256[] memory expectedBoards
  ) public returns (bool success, uint256 finalBoard) {
    GameSession storage game = playerGames[msg.sender];
    
    // Validation checks
    if (!game.isActive) {
      revert Play2048Wars__GameNotStarted();
    }
    if (directions.length == 0 || directions.length > 10) {
      revert Play2048Wars__InvalidBatchSize();
    }
    if (directions.length != expectedBoards.length) {
      revert Play2048Wars__BatchValidationFailed("Directions and expected boards length mismatch");
    }
    if (directions.length != newTilePositions.length || directions.length != newTileValues.length) {
      revert Play2048Wars__BatchValidationFailed("Array length mismatch");
    }

    // Create board state from current game state
    Lib2048WarsBoard.BoardState memory currentState;
    currentState.board = game.currentBoard;
    currentState.score = game.score;
    currentState.hasChanged = false;

    // Process the batch using library function
    (Lib2048WarsBoard.MoveBatch memory batchResult, Lib2048WarsBoard.BoardState memory finalState) = 
      Lib2048WarsBoard.processMoveBatch(currentState, directions, newTilePositions, newTileValues, expectedBoards);

    // Check if batch validation passed
    if (!batchResult.isValid) {
      revert Play2048Wars__BatchValidationFailed(batchResult.validationError);
    }

    // Update game state
    game.currentBoard = finalState.board;
    game.score = Lib2048WarsBoard.calculateScore(finalState.board);
    game.movesPlayed += uint8(directions.length);

    // Check if game is over
    if (Lib2048WarsBoard.isGameOver(finalState.board)) {
      game.isActive = false;
      emit GameOver(msg.sender, game.gameId);
      emit GameCompleted(msg.sender, game.gameId, game.score);
      
      // Check if player won (reached 2048 tile)
      if (game.score >= 2048) {
        assignWinner(msg.sender);
      }
    }

    emit BatchMovesProcessed(msg.sender, game.gameId, uint8(directions.length), finalState.board);
    
    return (true, finalState.board);
  }
  
  // VALIDATION FUNCTIONS 

  /**
   * @notice Validate a single move without executing it
   * @param previousBoard Board state before the move
   * @param direction Direction of the move
   * @param newTilePosition Position for the new tile
   * @param newTileValue Value for the new tile
   * @param nextBoard Expected board state after the move
   * @return isValid Whether the move is valid
   */
  function validateMove(
    uint256 previousBoard, 
    Lib2048WarsBoard.MoveDirection direction,
    uint8 newTilePosition,
    uint8 newTileValue,
    uint256 nextBoard
  ) public pure returns (bool isValid) {
    (isValid,) = Lib2048WarsBoard.validateMove(previousBoard, direction, newTilePosition, newTileValue, nextBoard);
    return isValid;
  }

  /**
   * @notice Validate a batch of moves without executing them
   * @param startBoard Starting board state
   * @param directions Array of move directions
   * @param newTilePositions Array of new tile positions for each move
   * @param newTileValues Array of new tile values for each move
   * @param expectedBoards Array of expected board states
   * @return isValid Whether all moves are valid
   * @return errorIndex Index of first invalid move (if any)
   */
  function validateBatchMoves(
    uint256 startBoard,
    Lib2048WarsBoard.MoveDirection[] memory directions,
    uint8[] memory newTilePositions,
    uint8[] memory newTileValues,
    uint256[] memory expectedBoards
  ) public pure returns (bool isValid, uint8 errorIndex) {
    (isValid, errorIndex,) = Lib2048WarsBoard.validateMoveBatch(startBoard, directions, newTilePositions, newTileValues, expectedBoards);
    return (isValid, errorIndex);
  }

  function verifyInitialBoard(uint256 initialBoard) public pure returns (bool isValid) {
    return Lib2048WarsBoard.validateInitialPosition(initialBoard);
  }

  // GETTER FUNCTIONS

  function getPlayerGame(address player) public view returns (GameSession memory game) {
    return playerGames[player];
  }

  function getGameSession(uint256 gameId) public view returns (GameSession memory game) {
    return gameSessions[gameId];
  }

  function getInitialHash(uint8[] memory positionTile1, uint8[] memory positionTile2) public pure returns (uint256 hash) {
    return Lib2048WarsBoard.getInitialHash(positionTile1, positionTile2);
  }

  function calculateScore(uint256 board) public pure returns (uint256 score) {
    return Lib2048WarsBoard.calculateScore(board);
  }

  function isGameOver(uint256 board) public pure returns (bool gameOver) {
    return Lib2048WarsBoard.isGameOver(board);
  }

  function getGameStats() public view returns (uint256 totalGames, uint256 nextId) {
    return (totalGamesPlayed, nextGameId);
  }

  function endGame() public {
    GameSession storage game = playerGames[msg.sender];
    require(game.isActive, "No active game");
    
    game.isActive = false;
    emit GameOver(msg.sender, game.gameId);
  }
}