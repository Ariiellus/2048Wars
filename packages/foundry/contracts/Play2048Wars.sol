// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Board } from "./LibBoard.sol";
import { Manager2048Wars } from "./Manager2048Wars.sol";

struct GameState {
  uint8 move;
  uint64 score;
  uint56 nextMove;
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
  mapping(address => bytes32) public playerGameId; // Active game ID per player
  mapping(address => uint256) public playerGameNonce; // Game nonce per player for unique IDs
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

    // Check: game has valid board transformations and calculate initial score.
    uint64 totalScore = 0;
    for (uint256 i = 1; i < 4; i++) {
      (uint128 expectedBoard, uint64 moveScore) = Board.processMove(
        boards[i - 1],
        moves[i - 1],
        uint256(keccak256(abi.encodePacked(gameId, i)))
      );
      require(expectedBoard == boards[i], GameBoardInvalid());
      totalScore += moveScore;
    }

    // Mark the game-start as played.
    gameHashOf[hashedBoards] = gameId;

    // Set initial score from the first 3 moves
    state[gameId] = GameState({ move: moves[2], score: totalScore, nextMove: uint56(4), board: boards[3] });

    emit NewGame(msg.sender, gameId, boards[3]);
  }

  /**
   * @notice Makes a new move in a game.
   * @param gameId The unique ID of the game.
   * @param resultBoard The result of applying a move on the latest board.
   */
  function play(bytes32 gameId, uint8 move, uint128 resultBoard) external correctGameId(msg.sender, gameId) {
    GameState memory latestState = state[gameId];

    // Validate move and calculate score from the actual merge logic
    (uint128 expectedBoard, uint64 scoreIncrement) = Board.processMove(
      latestState.board,
      move,
      uint256(keccak256(abi.encodePacked(gameId, uint256(latestState.nextMove))))
    );

    // Check: playing a valid move (result board matches expected)
    require(expectedBoard == resultBoard, GameBoardInvalid());

    emit NewMove(msg.sender, gameId, move, resultBoard);

    uint64 newScore = latestState.score + scoreIncrement;

    // Update board and score
    state[gameId] = GameState({ move: move, score: newScore, nextMove: latestState.nextMove + 1, board: resultBoard });

    if (!Board.hasValidMovesRemaining(resultBoard)) {
      if (Board.hasTileReached2048(resultBoard)) {
        gameWon(uint256(gameId), newScore, latestState.nextMove + 1, msg.sender);
      } else {
        gameLost(uint256(gameId), msg.sender);
      }
    }
  }

  // =============================================================//
  //                           INTERNAL                           //
  // =============================================================//

  function gameWon(uint256 gameId, uint256 score, uint256 movesPlayed, address player) internal {
    playerFinalMoves[player] = movesPlayed;
    playerFinalScore[player] = score;

    assignWinner(player);
    isPlayer[player] = false;

    emit GameCompleted(player, gameId, score);

    // Reset gameId so player can start a new game
    playerGameId[player] = bytes32(0);
  }

  function gameLost(uint256 gameId, address player) internal {
    isPlayer[player] = false;
    emit GameOver(player, gameId);

    // Reset gameId so player can start a new game
    playerGameId[player] = bytes32(0);
  }

  // =============================================================//
  //                           PUBLIC                             //
  // =============================================================//

  function enterGame() public payable override {
    // Check if player already has an active game
    require(playerGameId[msg.sender] == bytes32(0), "You already have an active game");

    // Call parent enterGame to handle round management and player registration
    super.enterGame();

    uint256 nonce = playerGameNonce[msg.sender]++;
    bytes32 gameId = bytes32((uint256(uint160(msg.sender)) << 96) | nonce);

    playerGameId[msg.sender] = gameId;
    totalGamesPlayed++;

    emit GameStarted(msg.sender, uint256(gameId));
  }

  // =============================================================//
  //                           GETTERS                            //
  // =============================================================//

  function getPlayerGameId(address player) public view returns (bytes32) {
    return playerGameId[player];
  }

  function getGameStats() public view returns (uint256 totalGames) {
    return totalGamesPlayed;
  }

  // =============================================================//
  //                             VIEW                             //
  // =============================================================//

  function nextMove(bytes32 gameId) public view returns (uint56) {
    return state[gameId].nextMove;
  }

  function latestBoard(bytes32 gameId) public view returns (uint128) {
    return state[gameId].board;
  }

  function currentScore(bytes32 gameId) public view returns (uint64) {
    return state[gameId].score;
  }

  /**
   * @notice Returns the latest board position of a game.
   * @dev Each array position stores the log_2 of that tile's value.
   * @param gameId The unique ID of a game.
   */
  function getBoard(
    bytes32 gameId
  ) external view returns (uint8[16] memory boardArr, uint256 nextMoveNumber, uint256 score) {
    uint128 b = latestBoard(gameId);
    for (uint8 i = 0; i < 16; i++) {
      boardArr[i] = Board.getTile(b, i);
    }
    nextMoveNumber = nextMove(gameId);
    score = currentScore(gameId);
  }
}
