// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {2048WarsManager} from "./2048WarsManager.sol";


contract 2048Wars is 2048WarsManager {

  function startGame() public {
    super.startNewRound();
  }
}