> **The classic 2048 game with a competitive twist - compete for weekly ETH rewards!**

2048Wars combines the addictive gameplay of 2048 with blockchain technology, allowing players to compete for weekly prizes. Each game costs **0.001 ETH** to enter, and all winners who reach 2048 split **50% of the prize pool**, while the remaining **50% funds the next round**.

## Features

- **Competitive Play**: Compete against other players for weekly rewards
- **Prize Pool**: 50% distributed to winners, 50% funds next round
- **On-Chain Gameplay**: All game logic and scores stored on-chain
- **Built on Base**: Fast and low-cost transactions
- **Leaderboard**: Real-time ranking system

## Game Rules

2048Wars follows the traditional 2048 game mechanics:

- **Grid**: Played on a 4×4 grid
- **Controls**: Use arrow keys (↑ ↓ ← →) or swipe gestures
- **Starting State**: Game begins with two tiles with value 2
- **New Tiles**: After each move, a new tile appears randomly in an empty space
- **Merging**: When two tiles of the same value collide, they merge into their sum
- **Non-Greedy Movement**: A tile cannot merge twice in the same move
- **Victory**: Win by creating a tile with at least value **2048**
- **Game Over**: Ends when no valid moves are possible

> **Fun Fact**: The largest theoretically possible tile is **131,072**!

## How to Play

1. **Connect Your Wallet**: Click "Connect Wallet" and approve the connection
2. **Enter the Game**: Pay the **0.001 ETH** entry fee to start a new game
3. **Play**: Use arrow keys or swipe to move tiles and merge them
4. **Reach 2048**: Try to create the 2048 tile to win!
5. **Compete**: Climb the leaderboard and reach 2048 to become a winner and earn prizes
6. **Claim Rewards**: Every week, winners receive their share of the prize pool

### Tips for Success

- Plan your moves ahead to avoid getting stuck
- Keep your highest tile in a corner
- Focus on maintaining one main direction of movement
- Watch the timer - rounds end weekly!

## Smart Contracts

### Network: Base Mainnet

- **Chain ID**: `8453`
- **Contract Address**: `0xab28bFd96898Fe18d3cB956a8A2BEa7B09a469d1`

### Contract Functions

- `enterGame()` - Pay entry fee and start a new game
- `makeMove(direction)` - Execute a game move
- `getPlayerGameId(address)` - Get current game ID for a player
- `getAllWinners()` - Get list of round winners
- `getCurrentRoundPool()` - Get current prize pool amount
- `getTimeRemainingOfCurrentRound()` - Get time remaining in current round

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, TailwindCSS
- **Blockchain**: Solidity, Foundry, Hardhat
- **Wallet**: Privy, Wagmi, RainbowKit
- **Network**: Base (Coinbase's L2)

## Resources

Learn more about 2048 and game development:

- [Create 2048 Game From Scratch Course](https://www.udemy.com/share/10acpw3@_RWwH14KAy8taXto5sfMrrU18LqLPwYgjjjs4Ghy1wYSwoeug-8iMoZG_N9UixP2/)
- [The Mathematics of 2048](https://jdlm.info/articles/2018/03/18/markov-decision-process-2048.html)
- [2048: A Guide to Building High Performance Games on Monad](https://blog.monad.xyz/blog/build-2048)
- [2048 Source Code by Gabriele Cirulli](https://github.com/gabrielecirulli/2048?tab=readme-ov-file)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
