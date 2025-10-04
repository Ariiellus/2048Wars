# Welcome to 2048Wars!

2048Wars is the classic 2048 game with a twist. You can win weekly rewards by getting into the top 10. Each game costs 0.001 ETH. 50% of the pool is distributed to the winners of the round and the other 50% is used to fund the next round.

Check out these resources to deep dive into the game:

- [Create 2048 Game From Scratch Course](https://www.udemy.com/share/10acpw3@_RWwH14KAy8taXto5sfMrrU18LqLPwYgjjjs4Ghy1wYSwoeug-8iMoZG_N9UixP2/)
- [The Mathematics of 2048](https://jdlm.info/articles/2018/03/18/markov-decision-process-2048.html)
- [2048: A Guide to Building High Performance Games on Monad](https://blog.monad.xyz/blog/build-2048)
- [2048 Source Code by Gabriele Cirulli](https://github.com/gabrielecirulli/2048?tab=readme-ov-file)

## Game rules

This game follows the traditional 2048 game rules:

- The game is played on a 4x4 grid.
- Only legal moves are up, down, left, right.
- The game begins with two tiles with value 2 on the board.
- After each move, a new tile will randomly appear in a random empty space on the board.
- When two tiles of the same value collide, they merge into a single tile with the sum of their values.
- The resulting tile cannot merge with another tile again during the same move (known as "non-greedy" movement).
- The game is won when a tile with a value of 2048 appears on the board.
- The game ends when there are no empty spaces left on the board and no adjacent tiles with the same value, meaning no valid moves are possible.

Fun fact: the largest theoretically possible tile is 131,072.

**Randomness:**
To avoid determinism, the game picks offchain a random available cell, then adds a new tile either with value 2, with probability 0.9, or value 4, with probability 0.1.

## How to play
