# Privy Integration Setup Guide

## Overview

Your 2048Wars app now uses **Privy** for wallet authentication instead of RainbowKit. Privy provides:

- ✅ Email/social login with embedded wallets
- ✅ Seamless onboarding (no wallet installation required)
- ✅ User-friendly authentication flow
- ✅ Full wagmi compatibility (existing code works!)

## 1. Get Your Privy App ID

1. Go to [https://dashboard.privy.io](https://dashboard.privy.io)
2. Create a new app
3. Copy your **App ID**

## 2. Configure Environment Variables

Create `packages/nextjs/.env.local`:

```bash
# Required: Privy App ID
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here

# Optional: Alchemy API Key for better RPC performance
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
```

## 3. Configure Your Privy App

In the [Privy Dashboard](https://dashboard.privy.io):

### Allowed Domains

Add your domains:

- `localhost:3000` (development)
- Your production domain

### Login Methods

The app is configured for:

- **Email** (one-time passcode)
- **External wallets** (MetaMask, Coinbase Wallet, etc.)

### Embedded Wallets

- ✅ Automatically create wallets for users without one
- ✅ Ethereum wallets enabled
- ⚠️ Add Solana if needed

### Supported Chains

Configure in **Settings > Chains**:

- Base Sepolia (testnet)
- Base (mainnet) - when ready to deploy

## 4. How It Works

### Authentication Flow

```
User clicks "Connect Wallet"
  ↓
Privy login modal opens
  ↓
User chooses login method:
  - Email (OTP sent)
  - Existing wallet (MetaMask, etc.)
  ↓
If no wallet: Privy creates embedded wallet
  ↓
User is authenticated!
```

### Embedded Wallet Features

- **No seed phrase required** - Privy manages it securely
- **Email recovery** - Users can recover access
- **Cross-device** - Same wallet across devices
- **Standard Web3** - Works with all your existing wagmi code

## 5. Code Changes Made

### 📄 `ScaffoldEthAppWithProviders.tsx`

- Replaced `RainbowKitProvider` with `PrivyProvider`
- Added `PrivyWagmiConnector` for wagmi compatibility
- Configured theme, branding, and login methods

### 📄 `components/scaffold-eth/PrivyConnectButton`

- New custom connect button
- Shows user's address when connected
- Logout functionality

### 📄 `Header.tsx`

- Replaced `RainbowKitCustomConnectButton` with `PrivyConnectButton`

### ✅ Existing Code Still Works!

All your existing components using wagmi hooks (`useAccount`, `useBalance`, `useWriteContract`, etc.) continue to work without changes because Privy provides a wagmi connector.

## 6. Using Privy Hooks (Advanced)

While most code can use wagmi hooks, Privy provides additional functionality:

### Get User Info

```typescript
import { usePrivy, useWallets } from '@privy-io/react-auth';

function Component() {
  const { user, authenticated, ready } = usePrivy();
  const { wallets } = useWallets();

  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');

  return <div>{user?.email?.address}</div>;
}
```

### Programmatic Transactions (No Popups!)

For embedded wallets, you can send transactions without confirmation popups:

```typescript
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { encodeFunctionData } from 'viem';

function SendMove() {
  const { wallets } = useWallets();
  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');

  const sendMove = async () => {
    if (!embeddedWallet) return;

    const provider = await embeddedWallet.getEthereumProvider();

    // Send transaction - no popup!
    const txHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [{
        to: contractAddress,
        data: encodeFunctionData({ abi, functionName: 'play', args: [...] }),
        value: '0x0',
      }],
    });
  };
}
```

## 7. Migration Checklist

- [x] Install Privy packages
- [x] Replace RainbowKit with Privy in providers
- [x] Create Privy connect button
- [x] Update Header component
- [ ] Get Privy App ID from dashboard
- [ ] Add NEXT_PUBLIC_PRIVY_APP_ID to .env.local
- [ ] Configure allowed domains in Privy dashboard
- [ ] Test login flow
- [ ] Test transactions

## 8. Testing

```bash
# Start the app
yarn start

# Test flow:
1. Click "Connect Wallet"
2. Choose "Email" and enter your email
3. Enter the OTP code
4. Verify you see your embedded wallet address
5. Try entering the game (transaction)
6. Verify moves work
7. Test logout
```

## 9. Troubleshooting

### "Failed to fetch config"

- Check your `NEXT_PUBLIC_PRIVY_APP_ID` is set correctly
- Verify the App ID is valid in Privy dashboard

### "Domain not allowed"

- Add your domain to **Settings > Allowed Domains** in Privy dashboard
- For local dev, add `localhost:3000`

### "Embedded wallet not found"

- Ensure `embeddedWallets.createOnLogin` is set in PrivyProvider config
- Check if user logged in with email (embedded wallet) vs external wallet

### Transactions fail

- Verify you're on the correct network (Base Sepolia)
- Check wallet has sufficient funds
- Review transaction in Privy dashboard logs

## 10. Production Deployment

Before going live:

1. **Update allowed domains** in Privy dashboard
2. **Add production URL** to allowed domains
3. **Configure production chains** (Base mainnet)
4. **Test thoroughly** on testnet first
5. **Monitor** Privy dashboard for errors

## Resources

- 📚 [Privy Docs](https://docs.privy.io)
- 🎨 [Customization Guide](https://docs.privy.io/guide/react/configuration/appearance)
- 🔐 [Security Best Practices](https://docs.privy.io/guide/security)
- 💬 [Privy Discord](https://privy.io/discord)

---

**Your 2048Wars app is now powered by Privy! 🎮✨**
