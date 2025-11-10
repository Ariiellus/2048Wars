import { useGlobalState } from "~~/services/store/store";
import { AllowedChainIds } from "~~/utils/scaffold-eth";
import { ChainWithAttributes, NETWORKS_EXTRA_DATA } from "~~/utils/scaffold-eth/networks";
import { networkConfig } from "~~/utils/setup";

/**
 * Given a chainId, retrieves the network object from networkConfig,
 * if not found default to network set by `useTargetNetwork` hook
 */
export function useSelectedNetwork(chainId?: AllowedChainIds): ChainWithAttributes {
  const globalTargetNetwork = useGlobalState(({ targetNetwork }) => targetNetwork);

  if (chainId) {
    const targetChains = networkConfig.getTargetChains();
    const targetNetwork = targetChains.find(network => network.id === chainId);

    if (targetNetwork) {
      return { ...targetNetwork, ...NETWORKS_EXTRA_DATA[targetNetwork.id] };
    }
  }

  return globalTargetNetwork;
}
