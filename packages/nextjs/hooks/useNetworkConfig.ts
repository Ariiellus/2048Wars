"use client";

import { useEffect, useState } from "react";
import { type NetworkEnvironment, networkConfig } from "~~/utils/setup";

/**
 * React Hook for Network Configuration
 * Provides reactive network state that updates when network changes
 */
export function useNetworkConfig() {
  const [currentNetwork, setCurrentNetwork] = useState<NetworkEnvironment>(() =>
    networkConfig.instance.getCurrentNetwork(),
  );

  useEffect(() => {
    // Subscribe to network changes
    const unsubscribe = networkConfig.instance.subscribe((network: NetworkEnvironment) => {
      setCurrentNetwork(network);
    });

    return unsubscribe;
  }, []);

  return {
    currentNetwork,
    config: networkConfig.instance.getConfig(),
    chain: networkConfig.instance.getChain(),
    rpcUrl: networkConfig.getRpcUrl(),
    contractAddress: networkConfig.getContractAddress(),
    blockExplorer: networkConfig.getBlockExplorer(),
    isDevelopment: networkConfig.isDevelopment(),
    switchNetwork: networkConfig.switchNetwork,
    availableNetworks: networkConfig.getAvailableNetworks(),
  };
}

/**
 * Hook to get current chain (reactive)
 */
export function useCurrentChain() {
  const { chain } = useNetworkConfig();
  return chain;
}

/**
 * Hook to get contract address (reactive)
 */
export function useContractAddress() {
  const { contractAddress } = useNetworkConfig();
  return contractAddress;
}
