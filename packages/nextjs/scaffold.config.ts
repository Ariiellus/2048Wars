import * as chains from "viem/chains";
import { networkConfig } from "~~/utils/setup";

export type BaseConfig = {
  targetNetworks: readonly chains.Chain[];
  pollingInterval: number;
  alchemyApiKey: string;
  rpcOverrides?: Record<number, string>;
  walletConnectProjectId: string;
  onlyLocalBurnerWallet: boolean;
};

export type ScaffoldConfig = BaseConfig;

export const DEFAULT_ALCHEMY_API_KEY = "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF";

const getRpcUrlForChain = (chainId: number): string => {
  const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || DEFAULT_ALCHEMY_API_KEY;

  if (chainId === chains.base.id && process.env.NEXT_PUBLIC_COINBASE_API_KEY) {
    return `https://api.developer.coinbase.com/rpc/v1/base/${process.env.NEXT_PUBLIC_COINBASE_API_KEY}`;
  }

  if (chainId === chains.base.id) {
    return networkConfig.getConfigFor("PRODUCTION").rpcUrl;
  } else if (chainId === chains.baseSepolia.id) {
    return networkConfig.getConfigFor("DEVELOPMENT").rpcUrl;
  }

  const chainName = chainId === chains.base.id ? "base-mainnet" : "base-sepolia";
  return `https://${chainName}.g.alchemy.com/v2/${alchemyKey}`;
};

const scaffoldConfig: ScaffoldConfig = {
  targetNetworks: networkConfig.getTargetChains(),
  // The interval at which your front-end polls the RPC servers for new data (it has no effect if you only target the local network (default is 4000))
  pollingInterval: 30000,
  // This is ours Alchemy's default API key.
  // You can get your own at https://dashboard.alchemyapi.io
  // It's recommended to store it in an env variable:
  // .env.local for local testing, and in the Vercel/system env config for live apps.
  alchemyApiKey: process.env.ALCHEMY_API_KEY || DEFAULT_ALCHEMY_API_KEY,
  // The key is the chain ID, and the value is the HTTP RPC URL
  rpcOverrides: {
    [chains.baseSepolia.id]: getRpcUrlForChain(chains.baseSepolia.id),
    [chains.base.id]: getRpcUrlForChain(chains.base.id),
  },
  // This is ours WalletConnect's default project ID.
  // You can get your own at https://cloud.walletconnect.com
  // It's recommended to store it in an env variable:
  // .env.local for local testing, and in the Vercel/system env config for live apps.
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "3a8170812b534d0ff9d794f19a901d64",
  onlyLocalBurnerWallet: true,
};

export default scaffoldConfig;
