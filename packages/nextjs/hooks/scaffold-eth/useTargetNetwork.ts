import { useEffect, useMemo, useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { useAccount, useSwitchChain } from "wagmi";
import scaffoldConfig from "~~/scaffold.config";
import { useGlobalState } from "~~/services/store/store";
import { ChainWithAttributes, NETWORKS_EXTRA_DATA } from "~~/utils/scaffold-eth";
import { type NetworkEnvironment, networkConfig } from "~~/utils/setup";

/**
 * Retrieves the target network based on networkConfig from setup.ts.
 * The frontend configuration is the source of truth - the wallet will be switched to match it.
 */
export function useTargetNetwork(): { targetNetwork: ChainWithAttributes } {
  const { chain, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const { wallets } = useWallets();
  const setTargetNetwork = useGlobalState(({ setTargetNetwork }) => setTargetNetwork);
  const globalTargetNetwork = useGlobalState(({ targetNetwork }) => targetNetwork);

  // Trigger re-render when the networkConfig changes
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const unsubscribe = networkConfig.subscribe((_network: NetworkEnvironment) => {
      forceUpdate(value => value + 1);
    });
    return unsubscribe;
  }, []);

  // Always use the current network from networkConfig as the source of truth
  const configuredChain = networkConfig.getChain();

  // Switch wallet to match the configured network if it's connected and on a different chain
  useEffect(() => {
    if (isConnected && chain && switchChain && configuredChain.id !== chain.id) {
      const matchingNetwork = scaffoldConfig.targetNetworks.find(n => n.id === configuredChain.id);
      if (matchingNetwork) {
        try {
          switchChain({ chainId: configuredChain.id });
        } catch (error: any) {
          console.warn("Failed to switch wallet chain:", error);
        }
      }
    }
  }, [isConnected, chain, switchChain, configuredChain]);

  // Also try to switch Privy wallet if available
  useEffect(() => {
    async function switchPrivyChain() {
      if (wallets && wallets.length > 0 && isConnected) {
        try {
          const activeWallet = wallets.find(w => w.walletClientType === "privy") || wallets[0];
          if (activeWallet) {
            const provider = await activeWallet.getEthereumProvider();
            if (provider && "request" in provider) {
              const chainIdHex = await provider.request({ method: "eth_chainId" });
              if (chainIdHex) {
                const currentChainId = parseInt(chainIdHex as string, 16);
                if (currentChainId !== configuredChain.id) {
                  try {
                    await provider.request({
                      method: "wallet_switchEthereumChain",
                      params: [{ chainId: `0x${configuredChain.id.toString(16)}` }],
                    });
                  } catch (switchError: any) {
                    if (switchError.code === 4902) {
                      const chainConfig = networkConfig.getConfig();
                      await provider.request({
                        method: "wallet_addEthereumChain",
                        params: [
                          {
                            chainId: `0x${configuredChain.id.toString(16)}`,
                            chainName: configuredChain.name,
                            nativeCurrency: {
                              name: chainConfig.nativeCurrency.name,
                              symbol: chainConfig.nativeCurrency.symbol,
                              decimals: chainConfig.nativeCurrency.decimals,
                            },
                            rpcUrls: [chainConfig.rpcUrl],
                            blockExplorerUrls: [chainConfig.blockExplorer],
                          },
                        ],
                      });
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.warn("Error switching Privy wallet chain:", error);
        }
      }
    }
    switchPrivyChain();
  }, [wallets, isConnected, configuredChain]);

  const targetNetworkWithAttributes = useMemo<ChainWithAttributes>(() => {
    return {
      ...configuredChain,
      ...NETWORKS_EXTRA_DATA[configuredChain.id],
    };
  }, [configuredChain]);

  useEffect(() => {
    if (globalTargetNetwork.id !== targetNetworkWithAttributes.id) {
      setTargetNetwork(targetNetworkWithAttributes);
    }
  }, [targetNetworkWithAttributes, globalTargetNetwork.id, setTargetNetwork]);

  return useMemo(() => ({ targetNetwork: targetNetworkWithAttributes }), [targetNetworkWithAttributes]);
}
