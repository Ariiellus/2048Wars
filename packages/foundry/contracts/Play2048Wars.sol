// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Board } from "./LibBoard.sol";
import { Manager2048Wars } from "./Manager2048Wars.sol";

struct GameState {
  uint8 move;
  uint120 nextMove;
  uint128 board;
}

/**
 * @title  2048 Wars
 * @author Ariiellus
 * @notice The foundation of this contract is the Monad2048 contract. More info: https://blog.monad.xyz
 */
contract Play2048Wars is Manager2048Wars {
  // =============================================================//
  //                            ERRORS                            //
  // =============================================================//

  /// @dev Emitted when starting a game with a used ID.
  error GameIdUsed();
  /// @dev Emitted when starting a game that has already been played.
  error GamePlayed();
  /// @dev Emitted when submitting an invalid game board.
  error GameBoardInvalid();
  /// @dev Emitted when someone other than a game's player makes a move.
  error GamePlayerInvalid();

  // =============================================================//
  //                            EVENTS                            //
  // =============================================================//

  /// @dev Emitted when a game is started.
  event NewGame(address indexed player, bytes32 indexed id, uint256 board);
  /// @dev Emitted when a new valid move is played.
  event NewMove(address indexed player, bytes32 indexed id, uint256 move, uint256 result);
  event GameStarted(address indexed player, uint256 gameId);
  event GameCompleted(address indexed player, uint256 gameId, uint256 finalScore);
  event GameOver(address indexed player, uint256 gameId);
  event CheckpointSaved(address indexed player, uint256 gameId, uint256 board, uint8 moves, uint256 score);

  // =============================================================//
  //                           STORAGE                            //
  // =============================================================//

  /// @notice Mapping from game ID to the latest board state.
  mapping(bytes32 gameId => GameState state) public state;
  /// @notice Mapping from a hash of start position plus first 3 moves to game ID.
  mapping(bytes32 gameHash => bytes32 gameId) public gameHashOf;

  // Game state mappings
  mapping(address => uint256) public playerGameId; // Active game ID per player
  uint256 public nextGameId; // Next available game ID
  uint256 public totalGamesPlayed; // Total games played

  // Final results mappings
  mapping(address => uint256) public playerFinalScore; // Final score for last completed game per player
  mapping(address => uint256) public playerFinalMoves; // Final moves played for last completed game per player

  // =============================================================//
  //                          MODIFIERS                           //
  // =============================================================//

  modifier correctGameId(address player, bytes32 gameId) {
    require(player == address(uint160(uint256(gameId) >> 96)), GamePlayerInvalid());
    _;
  }

  constructor(uint256 _entryFee, address _owner) Manager2048Wars(_entryFee, _owner) {
    nextGameId = 1;
    totalGamesPlayed = 0;
  }

  // =============================================================//
  //                           EXTERNAL                           //
  // =============================================================//

  /**
   * @notice Starts a new game for a player.
   *
   * @param gameId The unique ID of the game.
   * @param boards An ordered series of a start board and the result boards
   *               of the first three moves.
   */
  function startGame(
    bytes32 gameId,
    uint128[4] calldata boards,
    uint8[3] calldata moves
  ) external correctGameId(msg.sender, gameId) {
    require(state[gameId].board == 0, GameIdUsed());

    // Check: this exact sequence of boards has not been played.
    bytes32 hashedBoards = keccak256(abi.encodePacked(boards));
    require(gameHashOf[hashedBoards] == bytes32(0), GamePlayed());

    // Check: game has a valid start board.
    require(Board.validateStartPosition(boards[0]), GameBoardInvalid());

    // Check: game has valid board transformations.
    for (uint256 i = 1; i < 4; i++) {
      require(
        Board.validateTransformation(
          boards[i - 1],
          moves[i - 1],
          boards[i],
          uint256(keccak256(abi.encodePacked(gameId, i)))
        ),
        GameBoardInvalid()
      );
    }

    // Mark the game-start as played.
    gameHashOf[hashedBoards] = gameId;

    state[gameId] = GameState({ move: moves[2], nextMove: uint120(4), board: boards[3] });

    emit NewGame(msg.sender, gameId, boards[3]);
  }

  /**
   * @notice Makes a new move in a game.
   * @param gameId The unique ID of the game.
   * @param resultBoard The result of applying a move on the latest board.
   */
  function play(bytes32 gameId, uint8 move, uint128 resultBoard) external correctGameId(msg.sender, gameId) {
    GameState memory latestState = state[gameId];

    // Check: playing a valid move.
    require(
      Board.validateTransformation(
        latestState.board,
        move,
        resultBoard,
        uint256(keccak256(abi.encodePacked(gameId, uint256(latestState.nextMove))))
      ),
      GameBoardInvalid()
    );

    // Update board.
    state[gameId] = GameState({ move: move, nextMove: latestState.nextMove + 1, board: resultBoard });

    // Check if game is won or lost
    if (hasTileReached2048(resultBoard)) {
      gameWon(uint256(gameId), uint256(resultBoard), latestState.nextMove + 1, msg.sender);
    } else {
      gameLost(uint256(gameId), msg.sender);
    }
  }

  // =============================================================//
  //                           INTERNAL                           //
  // =============================================================//

  function hasTileReached2048(uint128 board) internal pure returns (bool) {
    // log₂(2048) = 11, so we check if any tile has log₂ value >= 11
    // Check all 16 tile positions
    for (uint8 i = 0; i < 16; i++) {
      uint8 tileLogValue = Board.getTile(board, i);
      if (tileLogValue >= 6) {
        return true;
      }
    }
    return false;
  }

  function gameWon(uint256 gameId, uint256 score, uint256 movesPlayed, address player) internal {
    require(playerGameId[player] == gameId, "Invalid game");

    playerFinalMoves[player] = movesPlayed;
    playerFinalScore[player] = score;

    emit GameCompleted(player, gameId, score);

    assignWinner(player);
    isPlayer[player] = false;
  }

  function gameLost(uint256 gameId, address player) internal {
    require(playerGameId[player] == gameId, "Invalid game");

    isPlayer[player] = false;
    emit GameOver(player, gameId);
    
    // Reset gameId so player can start a new game
    playerGameId[player] = 0;
  }

  // =============================================================//
  //                           PUBLIC                             //
  // =============================================================//

  function enterGame() public payable override {
    // Check if player already has an active game
    require(playerGameId[msg.sender] == 0, "You already have an active game");

    // Call parent enterGame to handle round management and player registration
    super.enterGame();

    // Assign a unique gameId to the player
    playerGameId[msg.sender] = nextGameId++;
    totalGamesPlayed++;

    emit GameStarted(msg.sender, playerGameId[msg.sender]);
  }

  // =============================================================//
  //                           GETTERS                            //
  // =============================================================//

  function getPlayerGameId(address player) public view returns (uint256) {
    return playerGameId[player];
  }

  function getGameStats() public view returns (uint256 totalGames, uint256 nextId) {
    return (totalGamesPlayed, nextGameId);
  }

  // =============================================================//
  //                             VIEW                             //
  // =============================================================//

  function nextMove(bytes32 gameId) public view returns (uint120) {
    return state[gameId].nextMove;
  }

  function latestBoard(bytes32 gameId) public view returns (uint128) {
    return state[gameId].board;
  }

  /**
   * @notice Returns the latest board position of a game.
   * @dev Each array position stores the log_2 of that tile's value.
   * @param gameId The unique ID of a game.
   */
  function getBoard(bytes32 gameId) external view returns (uint8[16] memory boardArr, uint256 nextMoveNumber) {
    uint128 b = latestBoard(gameId);
    for (uint8 i = 0; i < 16; i++) {
      boardArr[i] = Board.getTile(b, i);
    }
    nextMoveNumber = nextMove(gameId);
  }
}
