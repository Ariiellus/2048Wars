// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title 2048Wars V1
 * @notice This contract is used to manage the entrance and distribute funds to winners
 * @notice 50% of entrance fees goes to a pool that is distributed to winners each week
 * @notice 50% remain for the next round
 * @notice This first version only takes entry fee, check if player complete the game and add winners to a list
 */

contract EntryFee is Ownable, ReentrancyGuard {
  uint256 public entryFee;
  mapping(address => bool) public isPlayer;
  mapping(address => bool) public isWinner;
  address[] public winnersList;
  address[] public playersList;

  event PlayerAssigned(address indexed player);
  event WinnerAssigned(address indexed player);
  event GameEntered(address indexed player);
  event NewRoundStarted();

  uint256 public currentRound;
  uint256 public nextRoundStart;
  uint256 public currentRoundPool;
  uint256 public nextRoundPool;

  constructor(uint256 _entryFee, address _owner) Ownable(_owner) {
    entryFee = _entryFee;
    nextRoundStart = block.timestamp + 1 weeks;
    currentRoundPool = 0;
    nextRoundPool = 0;
    currentRound = 1;
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
  function startNewRound() public {
    require(block.timestamp > nextRoundStart, "Next round not started");
    require(winnersList.length > 0, "No winners to distribute to");

    // Distribute pool before starting new round
    distributePool();

    nextRoundStart = block.timestamp + 1 weeks;
    currentRound++;
    currentRoundPool = nextRoundPool;
    nextRoundPool = 0;
    emit NewRoundStarted();
  }

  /**
   * @notice This function will be more expensive to call if the current round has not started
   */
  function enterGame() public payable {
    require(!isWinner[msg.sender], "You already won, wait for next round");
    require(msg.value == entryFee, "Invalid entry fee");

    if (getTimeRemainingOfCurrentRound() == 0) {
      startNewRound();
    }

    (bool success, ) = payable(address(this)).call{ value: msg.value }("");
    if (success) {
      assignRoleToPlayer(msg.sender);
    } else {
      revert("Failed to enter game");
    }
    emit GameEntered(msg.sender);
  }

  function assignRoleToPlayer(address _player) internal {
    isPlayer[_player] = true;
    playersList.push(_player);
    emit PlayerAssigned(_player);
  }

  function assignWinner(address _winner) internal {
    isWinner[_winner] = true;
    winnersList.push(_winner);
    emit WinnerAssigned(_winner);
  }

  /// Pool Distribution functions

  function distributePool() internal nonReentrant {
    require(getTimeRemainingOfCurrentRound() == 0, "Round not finished");
    require(winnersList.length > 0, "No winners to distribute to");

    uint256 pool = getCurrentRoundPool();
    uint256 amountPerWinner = pool / winnersList.length;

    for (uint256 i = 0; i < winnersList.length; i++) {
      payable(winnersList[i]).transfer(amountPerWinner);
    }

    restartMappings();
  }

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
    uint256 timeRemaining = nextRoundStart - block.timestamp;
    if (timeRemaining < 0) {
      return 0;
    }
    return timeRemaining;
  }

  function getCurrentRoundPool() public view returns (uint256) {
    return address(this).balance / 2;
  }

  function getNextRoundPool() public view returns (uint256) {
    return address(this).balance / 2; // In the future add creator fee
  }

  function getTopTenWinners() public view returns (address[] memory) {
    uint256 count = winnersList.length < 10 ? winnersList.length : 10;
    address[] memory winners = new address[](count);
    for (uint256 i = 0; i < count; i++) {
      winners[i] = winnersList[i];
    }
    return winners;
  }

  function getAllWinners() public view returns (address[] memory) {
    return winnersList;
  }

  receive() external payable {}
}
