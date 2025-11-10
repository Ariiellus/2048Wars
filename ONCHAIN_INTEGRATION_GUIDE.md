# 2048Wars - OnchainKit Integration Guide

Complete guide for integrating Coinbase OnchainKit transactions into your 2048Wars game.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Current Setup](#current-setup)
3. [Transaction Flow](#transaction-flow)
4. [Usage Examples](#usage-examples)
5. [Environment Variables](#environment-variables)
6. [Testing](#testing)

---

## Architecture Overview

### Provider Hierarchy

```
PrivyProvider (Wallet Auth)
  └─ QueryClientProvider (React Query)
      └─ WagmiProvider (Ethereum Interactions)
          └─ OnchainKitProvider (Transaction Components)
              └─ Your App Components
```

### Key Components

1. **OnchainProvider** (`components/OnchainProvider.tsx`)
   - Wraps OnchainKitProvider with network-aware configuration
   - Dynamically uses current chain from `networkConfig`

2. **TransactionWrapper** (`components/TransactionWrapper.tsx`)
   - Flexible component for all blockchain transactions
   - Supports: `enterGame`, `startGame`, `play`

3. **Network Configuration** (`utils/networkConfig.ts`)
   - Centralized network management
   - Handles Base Mainnet & Base Sepolia switching
   - Contract address management

---

## Current Setup

### ✅ Already Integrated

The OnchainKit provider is already set up in your app at:

- **Location**: `components/ScaffoldEthAppWithProviders.tsx` (Line 172)
- **Status**: ✅ Integrated with network configuration
- **Features**:
  - Dynamic chain switching
  - Automatic contract address resolution
  - Query client shared with Wagmi

### Provider Stack (Bottom to Top)

```tsx
// app/layout.tsx
<ScaffoldEthAppWithProviders>
  {/* Your pages render here */}
</ScaffoldEthAppWithProviders>

// ScaffoldEthAppWithProviders.tsx
<PrivyProvider>
  <QueryClientProvider>
    <WagmiProvider>
      <OnchainKitProvider chain={currentChain}> {/* ← Uses your network config */}
        <YourApp />
      </OnchainKitProvider>
    </WagmiProvider>
  </QueryClientProvider>
</PrivyProvider>
```

---

## Transaction Flow

### 1. Enter Game (Pay Entry Fee)

**Contract Function**: `enterGame()`
**Cost**: 0.001 ETH
**Purpose**: Register player for current round

```tsx
import TransactionWrapper from "@/components/TransactionWrapper";

function EnterGameButton() {
  return (
    <TransactionWrapper
      functionName="enterGame"
      value={BigInt(1000000000000000)} // 0.001 ETH in wei
    />
  );
}
```

**What happens**:

1. User clicks transaction button
2. Wallet prompts for 0.001 ETH payment
3. Contract registers player for current round
4. Emits `GameEntered` event
5. Generates unique `gameId` for player

---

### 2. Start Game (Initialize Board)

**Contract Function**: `startGame(bytes32, uint128[4], uint8[3])`
**Purpose**: Submit initial game board and first 3 moves

```tsx
import TransactionWrapper from "@/components/TransactionWrapper";

function StartGameButton({ gameId, initialBoards, initialMoves }: Props) {
  return (
    <TransactionWrapper
      functionName="startGame"
      args={[
        gameId, // bytes32: Unique game identifier
        initialBoards, // uint128[4]: [startBoard, board1, board2, board3]
        initialMoves, // uint8[3]: [move1, move2, move3]
      ]}
    />
  );
}
```

**Board Encoding**:

- Each tile position = 4 bits (stores log₂ of tile value)
- 16 tiles × 4 bits = 64 bits total
- Values: 0=empty, 1=2, 2=4, 3=8, ... 11=2048

**What happens**:

1. Contract validates starting position
2. Verifies each move transformation
3. Calculates initial score
4. Stores game state on-chain
5. Emits `NewGame` event

---

### 3. Play Move (Submit Gameplay)

**Contract Function**: `play(bytes32, uint8, uint128)`
**Purpose**: Submit each move during gameplay

```tsx
import TransactionWrapper from "@/components/TransactionWrapper";

function PlayMoveButton({ gameId, move, resultBoard }: Props) {
  return (
    <TransactionWrapper
      functionName="play"
      args={[
        gameId, // bytes32: Game ID
        move, // uint8: 0=up, 1=right, 2=down, 3=left
        resultBoard, // uint128: Resulting board state
      ]}
    />
  );
}
```

**Move Values**:

- `0` = Up (↑)
- `1` = Right (→)
- `2` = Down (↓)
- `3` = Left (←)

**What happens**:

1. Contract validates move against current board
2. Verifies result matches expected transformation
3. Updates score based on merges
4. Stores new board state
5. Checks for win/loss conditions
6. Emits `NewMove` event

---

## Usage Examples

### Example 1: Complete Game Flow Component

```tsx
"use client";
import { useState } from "react";
import TransactionWrapper from "@/components/TransactionWrapper";
import { useAccount } from "wagmi";

export function GameFlow() {
  const { address } = useAccount();
  const [gameState, setGameState] = useState<"idle" | "entered" | "started" | "playing">("idle");
  const [gameId, setGameId] = useState<string>();

  // Step 1: Enter game
  if (gameState === "idle") {
    return (
      <div>
        <h2>Enter 2048Wars</h2>
        <p>Entry Fee: 0.001 ETH</p>
        <TransactionWrapper functionName="enterGame" value={BigInt(1000000000000000)} />
      </div>
    );
  }

  // Step 2: Start game with initial moves
  if (gameState === "entered") {
    return (
      <div>
        <h2>Initialize Your Game</h2>
        <TransactionWrapper functionName="startGame" args={[gameId, boards, moves]} />
      </div>
    );
  }

  // Step 3: Play moves
  if (gameState === "playing") {
    return (
      <div>
        <h2>Play 2048Wars</h2>
        <TransactionWrapper functionName="play" args={[gameId, currentMove, resultBoard]} />
      </div>
    );
  }

  return null;
}
```

---

### Example 2: Custom Transaction Button

```tsx
import { Transaction, TransactionButton, TransactionStatus } from "@coinbase/onchainkit/transaction";
import { useNetworkConfig } from "@/hooks/useNetworkConfig";

export function CustomEnterGameButton() {
  const { chain, contractAddress } = useNetworkConfig();

  const handleSuccess = response => {
    console.log("Entered game!", response);
    // Update UI, fetch game ID, etc.
  };

  return (
    <Transaction
      contracts={[
        {
          address: contractAddress,
          abi: play2048WarsABI,
          functionName: "enterGame",
          value: BigInt(1000000000000000),
        },
      ]}
      chainId={chain.id}
      onSuccess={handleSuccess}
    >
      <TransactionButton className="custom-button" />
      <TransactionStatus />
    </Transaction>
  );
}
```

---

### Example 3: Reading Game State

```tsx
import { useReadContract } from "wagmi";
import { useContractAddress } from "@/hooks/useNetworkConfig";

export function GameStats({ gameId }: { gameId: string }) {
  const contractAddress = useContractAddress();

  const { data: board } = useReadContract({
    address: contractAddress,
    abi: play2048WarsABI,
    functionName: "getBoard",
    args: [gameId],
  });

  const { data: score } = useReadContract({
    address: contractAddress,
    abi: play2048WarsABI,
    functionName: "currentScore",
    args: [gameId],
  });

  return (
    <div>
      <p>Score: {score?.toString()}</p>
      <p>Board: {/* Render board array */}</p>
    </div>
  );
}
```

---

## Environment Variables

### Required Variables

```env
# .env.local
NEXT_PUBLIC_CDP_API_KEY=your_coinbase_api_key_here
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wc_project_id_here

# Optional: Override network defaults
NEXT_PUBLIC_IS_DEVELOPMENT=true
NEXT_PUBLIC_DEFAULT_NETWORK=testnet
NEXT_PUBLIC_RPC_URL=https://your-custom-rpc.com
```

### Get API Keys

1. **Coinbase Developer Platform**: https://portal.cdp.coinbase.com/
   - Create new project
   - Generate OnchainKit API key
   - Add to `NEXT_PUBLIC_CDP_API_KEY`

2. **Privy**: https://dashboard.privy.io/
   - Already configured in your app

3. **WalletConnect**: https://cloud.walletconnect.com/
   - Already configured in your app

---

## Testing

### Test on Base Sepolia (Testnet)

```bash
# 1. Ensure testnet mode
echo "NEXT_PUBLIC_IS_DEVELOPMENT=true" >> .env.local
echo "NEXT_PUBLIC_DEFAULT_NETWORK=testnet" >> .env.local

# 2. Get testnet ETH
# Visit: https://faucet.quicknode.com/base/sepolia

# 3. Run app
npm run dev

# 4. Test transactions
# Contract Address: 0xf9015AF3a03c86bd8B64B26adcfaB6E7162aA3Dc (Base Sepolia)
```

### Test Flow

1. **Connect Wallet**
   - Click "Connect Wallet"
   - Approve connection

2. **Enter Game**

   ```tsx
   <TransactionWrapper functionName="enterGame" value={BigInt(1000000000000000)} />
   ```

   - Approve 0.001 ETH transaction
   - Wait for confirmation
   - Check console for `GameEntered` event

3. **Start Game**
   - Generate game ID from entered game
   - Create initial board states
   - Submit first 3 moves

4. **Play Moves**
   - Submit moves one at a time
   - Verify board transformations
   - Check score updates

---

## Network Switching

Your app supports both Base Mainnet and Base Sepolia:

```tsx
import { useNetworkConfig } from "@/hooks/useNetworkConfig";

function NetworkStatus() {
  const { currentNetwork, switchNetwork, isDevelopment } = useNetworkConfig();

  return (
    <div>
      <p>Current: {currentNetwork}</p>
      {isDevelopment && <button onClick={() => switchNetwork("mainnet")}>Switch to Mainnet</button>}
    </div>
  );
}
```

**Note**: Network switching is only available in development mode.

---

## Contract Addresses

### Production (Base Mainnet)

- **Address**: `0xab28bFd96898Fe18d3cB956a8A2BEa7B09a469d1`
- **Chain ID**: `8453`
- **Explorer**: https://basescan.org/address/0xab28bFd96898Fe18d3cB956a8A2BEa7B09a469d1

### Testnet (Base Sepolia)

- **Address**: `0xf9015AF3a03c86bd8B64B26adcfaB6E7162aA3Dc`
- **Chain ID**: `84532`
- **Explorer**: https://sepolia.basescan.org/address/0xf9015AF3a03c86bd8B64B26adcfaB6E7162aA3Dc

---

## Troubleshooting

### Issue: Transaction not showing up

**Solution**: Ensure OnchainKit provider is in component tree

```tsx
// Check app/layout.tsx has ScaffoldEthAppWithProviders
<ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
```

### Issue: Wrong network

**Solution**: Switch network in wallet or update config

```tsx
const { switchNetwork } = useNetworkConfig();
switchNetwork("testnet"); // or 'mainnet'
```

### Issue: Transaction fails

**Solution**: Check contract address and network

```tsx
const { contractAddress, chain } = useNetworkConfig();
console.log("Using contract:", contractAddress, "on chain:", chain.name);
```

---

## Advanced: Custom ABI

If you need additional contract functions:

```tsx
// Add to TransactionWrapper.tsx
const play2048WarsABI = [
  // ... existing functions
  {
    inputs: [],
    name: "getEntryFee",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Add more as needed
] as const;
```

---

## Quick Reference

### Import Paths

```tsx
import TransactionWrapper from "~~/components/TransactionWrapper";
import { useNetworkConfig } from "~~/hooks/useNetworkConfig";
import { GAME_CONTRACT_ADDRESS } from "~~/utils/constants";
```

### Common Values

```tsx
const ENTRY_FEE = BigInt(1000000000000000); // 0.001 ETH
const MOVES = { UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3 };
```

---

## Next Steps

1. ✅ OnchainKit is integrated
2. ✅ TransactionWrapper is ready
3. ✅ Network configuration is set up
4. 🔲 Implement game board encoding logic
5. 🔲 Add transaction callbacks to update UI
6. 🔲 Test full game flow on testnet
7. 🔲 Deploy to production

---

## Support

- **Docs**: https://onchainkit.xyz/
- **GitHub**: https://github.com/coinbase/onchainkit
- **Base Docs**: https://docs.base.org/

Happy Building! 🎮⛓️
