// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title 2048Wars Manager Contract
 * @notice This contract is used to manage the entrance and distribute funds to winners
 * @notice 50% of entrance fees goes to a pool that is distributed to winners each week
 * @notice 50% remain for the next round
 */

contract Manager2048Wars is Ownable, ReentrancyGuard {
  uint256 public entryFee;
  mapping(address => bool) public isPlayer;
  mapping(address => bool) public isWinner;
  address[] public winnersList;
  address[] public playersList;

  event PlayerAssigned(address indexed player);
  event WinnerAssigned(address indexed player);
  event GameEntered(address indexed player);
  event NewRoundStarted();
  event NoWinnersInRound(uint256 indexed round, uint256 poolAmount);

  uint256 public roundNumber;
  uint256 public nextRoundStart;

  constructor(uint256 _entryFee, address _owner) Ownable(_owner) {
    require(_owner != address(0), "Owner cannot be zero address");
    require(_entryFee > 0, "Entry fee must be greater than 0");
    entryFee = _entryFee; // 0.001 ether per game
    nextRoundStart = block.timestamp + 15 minutes; // each round lasts 15 minutes
    roundNumber = 1;
  }

  /// Entrance Conditions

  function setNewEntryFee(uint256 _entryFee) public onlyOwner {
    entryFee = _entryFee;
  }

  /**
   * @notice A new round begins each week
   * @notice Round start only after funds are distributed to the winners of the previous round
   * @notice First user to enter game call this function
   */
  function startNewRound() internal {
    require(block.timestamp > nextRoundStart, "Next round not started");

    // Distribute pool before starting new round (only if there are winners)
    if (winnersList.length > 0) {
      distributePool();
    } else {
      // If no winners, roll the current round pool into next round
      // This prevents funds from being locked forever
      uint256 currentPool = address(this).balance / 2;
      emit NoWinnersInRound(roundNumber, currentPool);
      // Pool automatically rolls to next round (no action needed)
    }

    nextRoundStart = block.timestamp + 15 minutes; // Fixed: should be 1 week, not 1 hour
    roundNumber++;
    emit NewRoundStarted();
  }

  /**
   * @notice This function will be more expensive the first time it is called after a new round has started
   */
  function enterGame() public payable virtual {
    require(!isPlayer[msg.sender], "You already entered the game");
    require(!isWinner[msg.sender], "You already won, wait for next round");

    require(msg.value == entryFee, "Invalid entry fee");

    if (getTimeRemainingOfCurrentRound() == 0) {
      startNewRound();
    }

    assignRoleToPlayer(msg.sender);
    emit GameEntered(msg.sender);
  }

  function assignRoleToPlayer(address _player) internal {
    isPlayer[_player] = true;
    playersList.push(_player);
    emit PlayerAssigned(_player);
  }

  function assignWinner(address _winner) internal {
    require(!isWinner[_winner], "Already a winner");
    require(isPlayer[_winner], "Not a player");

    isWinner[_winner] = true;
    winnersList.push(_winner);
    emit WinnerAssigned(_winner);
  }

  /// Pool Distribution functions

  /**
   * @notice Distribute the pool to the winners of the current round
   * @notice First player of each round will distribute the pool
   */
  function distributePool() internal nonReentrant {
    require(getTimeRemainingOfCurrentRound() == 0, "Round not finished");
    require(winnersList.length > 0, "No winners to distribute to");

    uint256 pool = getCurrentRoundPool();
    require(pool > 0, "No pool to distribute");
    
    uint256 amountPerWinner = pool / winnersList.length;
    require(amountPerWinner > 0, "Amount per winner too small");

    for (uint256 i = 0; i < winnersList.length; i++) {
      payable(winnersList[i]).transfer(amountPerWinner);
    }

    restartMappings();
  }

  /**
   * @notice Clear all the data of the current round
   */
  function restartMappings() internal {
    for (uint256 i = 0; i < winnersList.length; i++) {
      isWinner[winnersList[i]] = false;
      isPlayer[winnersList[i]] = false;
    }
    for (uint256 i = 0; i < playersList.length; i++) {
      isPlayer[playersList[i]] = false;
    }
    winnersList = new address[](0);
    playersList = new address[](0);
  }

  /// Getter functions
  function getEntryFee() public view returns (uint256) {
    return entryFee;
  }

  function getTimeRemainingOfCurrentRound() public view returns (uint256) {
    if (block.timestamp >= nextRoundStart) {
      return 0;
    }
    return nextRoundStart - block.timestamp;
  }

  function getCurrentRoundPool() public view returns (uint256) {
    return address(this).balance / 2;
  }

  function getNextRoundPool() public view returns (uint256) {
    return address(this).balance / 2; // In the future add creator fee
  }

  function getAllWinners() public view returns (address[] memory) {
    return winnersList;
  }

  receive() external payable {}
}
