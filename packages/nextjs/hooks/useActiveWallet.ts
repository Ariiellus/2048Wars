import { useWallets } from "@privy-io/react-auth";

/**
 * Custom hook to get the active wallet from Privy.
 * Prioritizes embedded wallet for seamless transactions.
 */
export function useActiveWallet() {
  const { wallets } = useWallets();

  // Prioritize embedded wallet for seamless transactions
  const embeddedWallet = wallets.find(wallet => wallet.walletClientType === "privy");
  const externalWallet = wallets.find(wallet => wallet.walletClientType !== "privy");
  const activeWallet = embeddedWallet || externalWallet;
  const address = activeWallet?.address as `0x${string}` | undefined;

  return { activeWallet, address };
}
