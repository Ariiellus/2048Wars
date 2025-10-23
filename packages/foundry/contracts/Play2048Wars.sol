// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Manager2048Wars} from "./Manager2048Wars.sol";

/**
 * @title Play2048Wars
 * @notice Main contract for playing 2048 Wars with checkpoint system
 * @dev Inherits from Manager2048Wars for tournament functionality
 * @dev Implements checkpoint system for game recovery
 */
contract Play2048Wars is Manager2048Wars {

  event GameCompleted(address indexed player, uint256 gameId, uint256 finalScore);
  event GameOver(address indexed player, uint256 gameId);
  event CheckpointSaved(address indexed player, uint256 gameId, uint256 board, uint8 moves, uint256 score);
  
  // Game state mappings
  mapping(address => uint256) public playerGameId;         // Active game ID per player
  uint256 public nextGameId;                               // Next available game ID
  uint256 public totalGamesPlayed;                         // Total games played

  // Final results mappings
  mapping(address => uint256) public playerFinalScore;     // Final score for last completed game per player
  mapping(address => uint256) public playerFinalMoves;     // Final moves played for last completed game per player

  // Checkpoint mappings for game recovery
  mapping(address => uint256) public playerCheckpointGameId;    // Game ID of last checkpoint
  mapping(address => bytes32) public playerCheckpointBoardHash; // Board state hash at last checkpoint
  mapping(address => uint256) public playerCheckpointScore;    // Score at last checkpoint
  mapping(address => uint8) public playerCheckpointMoves;       // Moves played at last checkpoint
  mapping(address => uint256) public playerCheckpointTime;     // Timestamp of last checkpoint

  constructor(uint256 _entryFee, address _owner) Manager2048Wars(_entryFee, _owner) {
    nextGameId = 1;
    totalGamesPlayed = 0;
  }

  function enterGame() public payable override {
    super.enterGame();
    // Assign a unique gameId to the player
    playerGameId[msg.sender] = nextGameId++;
    totalGamesPlayed++;
  }

  function gameWon(uint256 gameId, uint256 score, uint256 movesPlayed, address /* player */) public {
    require(playerGameId[msg.sender] == gameId, "Invalid game");

    playerFinalMoves[msg.sender] = movesPlayed;
    playerFinalScore[msg.sender] = score;

    emit GameCompleted(msg.sender, gameId, score);

    assignWinner(msg.sender);
    isPlayer[msg.sender] = false;
  }

  function gameLost(uint256 gameId) public {
    require(playerGameId[msg.sender] == gameId, "Invalid game");

    isPlayer[msg.sender] = false;
    emit GameOver(msg.sender, gameId);
  }

  /**
   * @notice Save a checkpoint of the current game state for recovery
   * @param gameId The game ID to checkpoint
   * @param boardArray Current board state as array (16 tiles)
   * @param moves Number of moves played so far
   * @param score Current score
   */
  function checkpoint(uint256 gameId, uint8[16] calldata boardArray, uint8 moves, uint256 score) public {
    require(isPlayer[msg.sender], "Must be a registered player");
    require(playerGameId[msg.sender] == gameId, "Invalid game");

    // Create hash of the board array using ABI encoding
    bytes32 boardHash = keccak256(abi.encode(boardArray));

    playerCheckpointGameId[msg.sender] = gameId;
    playerCheckpointBoardHash[msg.sender] = boardHash;
    playerCheckpointScore[msg.sender] = score;
    playerCheckpointMoves[msg.sender] = moves;
    playerCheckpointTime[msg.sender] = block.timestamp;

    emit CheckpointSaved(msg.sender, gameId, uint256(boardHash), moves, score);
  }

  function getPlayerGameId(address player) public view returns (uint256) {
    return playerGameId[player];
  }

  function getGameStats() public view returns (uint256 totalGames, uint256 nextId) {
    return (totalGamesPlayed, nextGameId);
  }

  /**
   * @notice Get the last checkpoint data for a player
   * @param player Player address
   * @return gameId Game ID of the checkpoint
   * @return boardHash Board state hash at checkpoint
   * @return score Score at checkpoint
   * @return moves Moves played at checkpoint
   * @return timestamp When checkpoint was saved
   */
  function getPlayerCheckpoint(address player) public view returns (
    uint256 gameId,
    bytes32 boardHash,
    uint256 score,
    uint8 moves,
    uint256 timestamp
  ) {
    return (
      playerCheckpointGameId[player],
      playerCheckpointBoardHash[player],
      playerCheckpointScore[player],
      playerCheckpointMoves[player],
      playerCheckpointTime[player]
    );
  }

  /**
   * @notice Check if a player has a valid checkpoint
   * @param player Player address
   * @return hasCheckpoint Whether player has a checkpoint
   */
  function hasCheckpoint(address player) public view returns (bool) {
    return playerCheckpointGameId[player] != 0;
  }

  /**
   * @notice Verify if a board array matches the stored checkpoint
   * @param player Player address
   * @param boardArray Board array to verify
   * @return isValid Whether the board array matches the checkpoint
   */
  function verifyCheckpointBoard(address player, uint8[16] calldata boardArray) public view returns (bool isValid) {
    bytes32 storedHash = playerCheckpointBoardHash[player];
    bytes32 providedHash = keccak256(abi.encode(boardArray));
    return storedHash == providedHash;
  }
}