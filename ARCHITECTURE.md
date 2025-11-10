# 2048Wars Network Configuration Architecture

## Overview

The network configuration system provides two operational modes controlled by the `NEXT_PUBLIC_IS_DEVELOPMENT` environment variable, ensuring zero overhead in production while enabling powerful development tools.

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                   Environment Variable                    │
│            NEXT_PUBLIC_IS_DEVELOPMENT = ?                 │
└─────────────────┬────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
     false              true
   (or unset)        (Development)
        │                   │
        │                   │
┌───────▼────────┐  ┌───────▼────────────────────────────┐
│  PRODUCTION    │  │       DEVELOPMENT MODE              │
│     MODE       │  │                                     │
│                │  │  ┌──────────────────────────────┐  │
│  Hard-coded:   │  │  │  1. Check .env variable:    │  │
│  - Base Sepolia│  │  │     DEFAULT_NETWORK         │  │
│  - No UI       │  │  └──────────────────────────────┘  │
│  - No storage  │  │              ↓                      │
│                │  │  ┌──────────────────────────────┐  │
└────────┬───────┘  │  │  2. Check localStorage:      │  │
         │          │  │     preferred_network        │  │
         │          │  └──────────────────────────────┘  │
         │          │              ↓                      │
         │          │  ┌──────────────────────────────┐  │
         │          │  │  3. Initialize Network:      │  │
         │          │  │     - Base / Base Sepolia    │  │
         │          │  │     - Show UI Switcher       │  │
         │          │  │     - Enable localStorage    │  │
         │          │  └──────────────────────────────┘  │
         │          └─────────────────┬──────────────────┘
         │                            │
         └────────────────┬───────────┘
                          │
        ┌─────────────────▼────────────────────┐
        │    Network Config Manager             │
        │    (Lazy Singleton)                   │
        │                                       │
        │  - getCurrentNetwork()                │
        │  - getChain()                         │
        │  - getRpcUrl()                        │
        │  - getContractAddress()               │
        │  - switchNetwork() [dev only]         │
        └─────────────────┬─────────────────────┘
                          │
        ┌─────────────────▼─────────────────────┐
        │      Module-Level Imports              │
        │                                       │
        │  ┌─────────────────────────────────┐ │
        │  │  constants.ts                   │ │
        │  │  GAME_CONTRACT_ADDRESS          │ │
        │  └─────────────────────────────────┘ │
        │                                       │
        │  ┌─────────────────────────────────┐ │
        │  │  client.ts                      │ │
        │  │  publicClient (chain, RPC)      │ │
        │  └─────────────────────────────────┘ │
        │                                       │
        │  ┌─────────────────────────────────┐ │
        │  │  scaffold.config.ts             │ │
        │  │  targetNetworks, rpcOverrides   │ │
        │  └─────────────────────────────────┘ │
        └─────────────────┬─────────────────────┘
                          │
        ┌─────────────────▼─────────────────────┐
        │    React Components & Providers        │
        │                                       │
        │  ┌──────────────┐  ┌──────────────┐  │
        │  │    Privy     │  │    Wagmi     │  │
        │  │   Provider   │  │   Provider   │  │
        │  └──────────────┘  └──────────────┘  │
        │                                       │
        │  ┌──────────────────────────────────┐ │
        │  │  Components:                     │ │
        │  │  - enterGameButton               │ │
        │  │  - PlayerVerification            │ │
        │  │  - useTransactions               │ │
        │  │  - Play2048                      │ │
        │  └──────────────────────────────────┘ │
        │                                       │
        │  ┌──────────────────────────────────┐ │
        │  │  NetworkSwitcher UI              │ │
        │  │  (only if IS_DEVELOPMENT=true)   │ │
        │  └──────────────────────────────────┘ │
        └───────────────────────────────────────┘
```

---

## Data Flow: Production Mode

```
IS_DEVELOPMENT=false
        ↓
getDefaultNetwork() → "testnet"
        ↓
NetworkConfigManager initialized
        ↓
getCurrentChain() → baseSepolia (84532)
getContractAddress() → "0xf9015...A3Dc"
getRpcUrl() → "https://base-sepolia.g.alchemy.com/..."
        ↓
Module imports freeze these values
        ↓
publicClient created with baseSepolia
GAME_CONTRACT_ADDRESS = "0xf9015...A3Dc"
targetNetworks = [baseSepolia, base]
        ↓
Privy/Wagmi initialize with baseSepolia
        ↓
Components use baseSepolia for all operations
        ↓
NetworkSwitcher.tsx → returns null (hidden)
```

**Result:** Behaves exactly like main branch before refactoring.

---

## Data Flow: Development Mode (Initial Load)

```
IS_DEVELOPMENT=true
        ↓
getDefaultNetwork() → reads NEXT_PUBLIC_DEFAULT_NETWORK
        ↓
Check localStorage for "preferred_network"
        ↓
(If found) Use localStorage value
(If not)   Use DEFAULT_NETWORK or "testnet"
        ↓
NetworkConfigManager initialized with chosen network
        ↓
[User selected Base Sepolia]
getCurrentChain() → baseSepolia (84532)
getContractAddress() → "0xf9015...A3Dc"
getRpcUrl() → "https://base-sepolia.g.alchemy.com/..."
        ↓
Module imports freeze these values
        ↓
publicClient created with baseSepolia
GAME_CONTRACT_ADDRESS = "0xf9015...A3Dc"
targetNetworks = [baseSepolia, base]
        ↓
Privy/Wagmi initialize with baseSepolia
        ↓
Components use baseSepolia for all operations
        ↓
NetworkSwitcher.tsx → renders UI in bottom-right
```

---

## Data Flow: Development Mode (Network Switch)

```
User clicks "Base Mainnet" in NetworkSwitcher
        ↓
networkConfig.switchNetwork("mainnet") called
        ↓
Update internal state: currentNetwork = "mainnet"
        ↓
Save to localStorage: "preferred_network" = "mainnet"
        ↓
Notify subscribers (React hook updates)
        ↓
window.location.reload() triggered
        ↓
───────── PAGE RELOADS ─────────
        ↓
NetworkConfigManager constructor runs again
        ↓
Check localStorage → finds "mainnet"
        ↓
Initialize with mainnet configuration
        ↓
getCurrentChain() → base (8453)
getContractAddress() → "0x0000...0000"
getRpcUrl() → "https://base-mainnet.g.alchemy.com/..."
        ↓
All modules re-import with new values
        ↓
publicClient recreated with base
GAME_CONTRACT_ADDRESS = "0x0000...0000"
targetNetworks = [base, baseSepolia]
        ↓
Privy/Wagmi reinitialize with base
        ↓
Components mount fresh with base
        ↓
NetworkSwitcher shows "Base" as active
```

---

## Component Integration

### How Privy Uses the Config

```typescript
// ScaffoldEthAppWithProviders.tsx
<PrivyProvider
  defaultChain={getCurrentChain()} // ← Called at render time
  supportedChains={wagmiConfig.chains}
>
```

**At page load:**

- `getCurrentChain()` called → Returns baseSepolia or base
- Privy initializes with that chain
- Wallet connections use that chain

**After network switch + reload:**

- `getCurrentChain()` called again → Returns new chain
- Privy initializes with new chain
- Previous session cleared

---

### How Components Get Chain ID

```typescript
// enterGameButton.tsx, PlayerVerification.tsx
const { data: balance } = useBalance({
  chainId: getCurrentChain().id, // ← Called on each render
});
```

**At page load:**

- `getCurrentChain().id` → Returns 84532 (Base Sepolia)
- Balance fetched from Base Sepolia

**After network switch + reload:**

- `getCurrentChain().id` → Returns 8453 (Base)
- Balance fetched from Base

---

### How Transactions Use Network

```typescript
// useTransactions.tsx
const provider = createWalletClient({
  chain: getCurrentChain(), // ← Called when wallet client created
  transport: custom(ethereumProvider),
});

const txHash = await provider.sendTransaction({
  chain: getCurrentChain(), // ← Called when sending transaction
  // ...
});
```

**At page load:**

- Wallet client created with baseSepolia
- Transactions sent to Base Sepolia

**After network switch + reload:**

- Wallet client recreated with base
- Transactions sent to Base

---

## Key Design Decisions

### 1. Why Module-Level Constants Are OK

```typescript
// constants.ts
export const GAME_CONTRACT_ADDRESS = getContractAddress();
```

**Problem:** This is evaluated once at module load.

**Solution:** Page reload after network switch.

- Old value frozen? Doesn't matter - page reloads
- All modules re-execute
- `getContractAddress()` called again with new network
- New constant created

### 2. Why Lazy Singleton

```typescript
let _networkConfig: NetworkConfigManager | null = null;

function getNetworkConfigInstance() {
  if (!_networkConfig) {
    _networkConfig = new NetworkConfigManager();
  }
  return _networkConfig;
}
```

**Reason:**

- Delays creation until first use
- Ensures `window` and `localStorage` available (client-side)
- Environment variables loaded
- Only creates one instance per page load

### 3. Why Page Reload Instead of Hot Swap

**Complexity of Hot Swap:**

- Would need to recreate `publicClient`
- Would need to reset all Wagmi cache
- Would need to reconnect Privy
- Would need to update 20+ components
- Would need complex state management

**Simplicity of Reload:**

- Everything reinitializes naturally
- No stale state possible
- Privy reconnects automatically
- Wagmi rehydrates from scratch
- Zero risk of missed updates

---

## Production Deployment Checklist

- [ ] Set `NEXT_PUBLIC_IS_DEVELOPMENT=false` in Vercel
- [ ] Or omit the variable entirely
- [ ] Verify NetworkSwitcher is hidden
- [ ] Verify always uses Base Sepolia
- [ ] Update mainnet contract address when deployed
- [ ] Test that localStorage is not used

---

## Development Workflow

1. **Set up .env.local:**

   ```bash
   NEXT_PUBLIC_IS_DEVELOPMENT=true
   NEXT_PUBLIC_DEFAULT_NETWORK=testnet
   ```

2. **Start dev server:**

   ```bash
   yarn start
   ```

3. **Look for purple widget** in bottom-right corner

4. **Switch networks:**
   - Click "Base Mainnet" → Page reloads → App uses Base
   - Click "Base Sepolia" → Page reloads → App uses Base Sepolia

5. **Preference persists:**
   - Close browser
   - Reopen
   - Last selected network is used

---

## File Dependency Graph

```
.env.local (IS_DEVELOPMENT)
        ↓
networkConfig.ts (NetworkConfigManager)
        ↓
        ├─→ constants.ts (GAME_CONTRACT_ADDRESS)
        ├─→ client.ts (publicClient)
        └─→ scaffold.config.ts (targetNetworks)
                ↓
        ┌───────┴────────┐
        │                │
ScaffoldEthAppWithProviders  Components
(Privy defaultChain)         (useBalance, etc)
        │                │
        └───────┬────────┘
                ↓
          User Interface
```

---

## FAQ

**Q: Can I use hot swap instead of reload?**
A: Technically yes, but requires significant refactoring. Would need to make all constants into dynamic getters and reset all providers. Page reload is simpler and safer.

**Q: Does this work with Privy embedded wallets?**
A: Yes! Privy reads `defaultChain` from `getCurrentChain()` on page load. After network switch + reload, Privy reinitializes with new chain.

**Q: What happens if I switch networks mid-transaction?**
A: Not possible - the UI reloads immediately, canceling any pending operations.

**Q: Can I add more networks (e.g., Optimism)?**
A: Yes! Add to `CONTRACTS` object in `networkConfig.ts`, add network type to `NetworkEnvironment`, and extend `NETWORK_CONFIGS`.

**Q: Does this increase bundle size?**
A: In production mode (IS_DEVELOPMENT=false): No, NetworkSwitcher doesn't render. In development: Yes, adds ~5KB for the switcher component.

---

**End of Architecture Documentation**
