import { base, baseSepolia } from "viem/chains";
import type { Chain } from "viem/chains";

export type NetworkEnvironment = "PRODUCTION" | "DEVELOPMENT";

export interface NetworkConfig {
  chain: Chain;
  rpcUrl: string;
  contractAddress: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// Contract addresses per network
const CONTRACTS = {
  PRODUCTION: {
    Play2048Wars: "0xab28bfd96898fe18d3cb956a8a2bea7b09a469d1", // Mainnet
  },
  DEVELOPMENT: {
    Play2048Wars: "0xf9015AF3a03c86bd8B64B26adcfaB6E7162aA3Dc", // Base Sepolia
  },
};

// RPC Configuration
const getRpcUrl = (isDevelopment: boolean): string => {
  const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF";

  if (process.env.NEXT_PUBLIC_RPC_URL) {
    return process.env.NEXT_PUBLIC_RPC_URL;
  }

  return isDevelopment
    ? `https://base-sepolia.g.alchemy.com/v2/${alchemyKey}`
    : `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`;
};

// Determine if we're in development mode
const isDevelopmentMode = (): boolean => {
  return process.env.NEXT_PUBLIC_IS_DEVELOPMENT === "true";
};

// Determine default network based on environment
// PRODUCTION mode (default): Always returns "PRODUCTION" (Base Mainnet)
// DEVELOPMENT mode: Returns "DEVELOPMENT" (Base Sepolia) unless explicitly set to "PRODUCTION"
const getDefaultNetwork = (): NetworkEnvironment => {
  // In production mode (NEXT_PUBLIC_IS_DEVELOPMENT not set or false): Always use PRODUCTION
  if (!isDevelopmentMode()) {
    return "PRODUCTION";
  }

  // In development mode only: Check if explicitly set in env
  const envNetwork = process.env.NEXT_PUBLIC_DEFAULT_NETWORK as NetworkEnvironment | undefined;
  if (envNetwork === "PRODUCTION" || envNetwork === "DEVELOPMENT") {
    return envNetwork;
  }

  // In development mode: Default to testnet (Base Sepolia)
  return "DEVELOPMENT";
};

// Network configurations
const NETWORK_CONFIGS: Record<NetworkEnvironment, NetworkConfig> = {
  PRODUCTION: {
    chain: base,
    rpcUrl: getRpcUrl(false),
    contractAddress: CONTRACTS.PRODUCTION.Play2048Wars,
    blockExplorer: base.blockExplorers.default.url,
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  DEVELOPMENT: {
    chain: baseSepolia,
    rpcUrl: getRpcUrl(true),
    contractAddress: CONTRACTS.DEVELOPMENT.Play2048Wars,
    blockExplorer: baseSepolia.blockExplorers.default.url,
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
};

class NetworkConfigManager {
  private currentNetwork: NetworkEnvironment;
  private listeners: Set<(network: NetworkEnvironment) => void> = new Set();

  constructor() {
    // Initialize with default network
    // Default is PRODUCTION unless NEXT_PUBLIC_IS_DEVELOPMENT=true
    this.currentNetwork = getDefaultNetwork();

    // In development mode only: Load user preference from localStorage
    // In production mode: Always use PRODUCTION (no switching allowed)
    if (typeof window !== "undefined" && isDevelopmentMode()) {
      const saved = localStorage.getItem("preferred_network") as NetworkEnvironment | null;
      if (saved === "PRODUCTION" || saved === "DEVELOPMENT") {
        this.currentNetwork = saved;
      }
    }
  }

  /**
   * Get current network environment
   */
  getCurrentNetwork(): NetworkEnvironment {
    return this.currentNetwork;
  }

  /**
   * Get current network configuration
   */
  getConfig(): NetworkConfig {
    return NETWORK_CONFIGS[this.currentNetwork];
  }

  /**
   * Get configuration for a specific network
   */
  getConfigFor(network: NetworkEnvironment): NetworkConfig {
    return NETWORK_CONFIGS[network];
  }

  /**
   * Switch to a different network
   * Only works in development mode
   */
  switchNetwork(network: NetworkEnvironment): boolean {
    if (!isDevelopmentMode()) {
      console.warn("Network switching is only available in development mode");
      return false;
    }

    if (this.currentNetwork === network) {
      return false; // No change
    }

    this.currentNetwork = network;

    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("preferred_network", network);
    }

    // Notify listeners
    this.notifyListeners(network);

    return true;
  }

  /**
   * Check if in development mode
   */
  isDevelopment(): boolean {
    return isDevelopmentMode();
  }

  /**
   * Subscribe to network changes
   */
  subscribe(callback: (network: NetworkEnvironment) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of network change
   */
  private notifyListeners(network: NetworkEnvironment): void {
    this.listeners.forEach(callback => callback(network));
  }

  /**
   * Get all available networks
   */
  getAvailableNetworks(): NetworkEnvironment[] {
    return ["PRODUCTION", "DEVELOPMENT"];
  }

  /**
   * Get chain for current network
   */
  getChain(): Chain {
    return this.getConfig().chain;
  }

  /**
   * Get RPC URL for current network
   */
  getRpcUrl(): string {
    return this.getConfig().rpcUrl;
  }

  /**
   * Get contract address for current network
   */
  getContractAddress(): string {
    return this.getConfig().contractAddress;
  }

  /**
   * Get block explorer URL for current network
   */
  getBlockExplorer(): string {
    return this.getConfig().blockExplorer;
  }

  /**
   * Get all chains (for wallet configuration)
   */
  getAllChains(): Chain[] {
    return [base, baseSepolia];
  }

  /**
   * Get target chains based on current configuration
   * Returns current chain first, followed by alternative
   */
  getTargetChains(): Chain[] {
    const current = this.getChain();
    const all = this.getAllChains();
    return [current, ...all.filter(c => c.id !== current.id)];
  }
}

// Singleton instance - lazy initialized
let _networkConfig: NetworkConfigManager | null = null;

/**
 * Get or create the singleton instance
 * This ensures we always get the current instance with up-to-date state
 */
function getNetworkConfigInstance(): NetworkConfigManager {
  if (!_networkConfig) {
    _networkConfig = new NetworkConfigManager();
  }
  return _networkConfig;
}

// Export singleton instance getter (always returns current instance)
export const networkConfig = {
  get instance() {
    return getNetworkConfigInstance();
  },
  getCurrentNetwork: () => getNetworkConfigInstance().getCurrentNetwork(),
  getConfig: () => getNetworkConfigInstance().getConfig(),
  getConfigFor: (network: NetworkEnvironment) => getNetworkConfigInstance().getConfigFor(network),
  switchNetwork: (network: NetworkEnvironment) => getNetworkConfigInstance().switchNetwork(network),
  isDevelopment: () => getNetworkConfigInstance().isDevelopment(),
  subscribe: (callback: (network: NetworkEnvironment) => void) => getNetworkConfigInstance().subscribe(callback),
  getAvailableNetworks: () => getNetworkConfigInstance().getAvailableNetworks(),
  getChain: () => getNetworkConfigInstance().getChain(),
  getRpcUrl: () => getNetworkConfigInstance().getRpcUrl(),
  getContractAddress: () => getNetworkConfigInstance().getContractAddress(),
  getBlockExplorer: () => getNetworkConfigInstance().getBlockExplorer(),
  getAllChains: () => getNetworkConfigInstance().getAllChains(),
  getTargetChains: () => getNetworkConfigInstance().getTargetChains(),
};

// Export utility functions that always call the latest instance
export const getCurrentChain = () => getNetworkConfigInstance().getChain();
export const getCurrentRpcUrl = () => getNetworkConfigInstance().getRpcUrl();
export const getContractAddress = () => getNetworkConfigInstance().getContractAddress();
export const getBlockExplorer = () => getNetworkConfigInstance().getBlockExplorer();
export const isDevMode = () => getNetworkConfigInstance().isDevelopment();
export const switchNetwork = (network: NetworkEnvironment) => getNetworkConfigInstance().switchNetwork(network);
export const getTargetNetworks = () => getNetworkConfigInstance().getTargetChains();

// Export for React components
export default networkConfig;
