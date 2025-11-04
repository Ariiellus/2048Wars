import { useCallback, useEffect, useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { base } from "viem/chains";

export const useEnsureBaseChain = (autoSwitch: boolean = false) => {
  const { wallets } = useWallets();
  const [isCorrectChain, setIsCorrectChain] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);

  const embeddedWallet = wallets.find(wallet => wallet.walletClientType === "privy");
  const externalWallet = wallets.find(wallet => wallet.walletClientType !== "privy");
  const activeWallet = embeddedWallet || externalWallet;

  const switchToBase = useCallback(async () => {
    if (!activeWallet) return false;

    try {
      setIsSwitching(true);
      const ethereumProvider = await activeWallet.getEthereumProvider();

      // Check current chain
      const currentChainId = await ethereumProvider.request({ method: "eth_chainId" });
      const currentChainIdNumber = parseInt(currentChainId as string, 16);

      if (currentChainIdNumber === base.id) {
        setIsCorrectChain(true);
        return true;
      }

      // Try to switch chain
      try {
        await ethereumProvider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${base.id.toString(16)}` }],
        });
        setIsCorrectChain(true);
        return true;
      } catch (switchError: any) {
        // Chain not added to wallet, try adding it
        if (switchError.code === 4902) {
          await ethereumProvider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${base.id.toString(16)}`,
                chainName: base.name,
                nativeCurrency: base.nativeCurrency,
                rpcUrls: [base.rpcUrls.default.http[0]],
                blockExplorerUrls: [base.blockExplorers?.default.url],
              },
            ],
          });
          setIsCorrectChain(true);
          return true;
        } else {
          throw switchError;
        }
      }
    } catch (error) {
      console.error("Failed to switch to Base chain:", error);
      return false;
    } finally {
      setIsSwitching(false);
    }
  }, [activeWallet]);

  useEffect(() => {
    const checkChain = async () => {
      if (!activeWallet) return;

      try {
        const ethereumProvider = await activeWallet.getEthereumProvider();
        const currentChainId = await ethereumProvider.request({ method: "eth_chainId" });
        const currentChainIdNumber = parseInt(currentChainId as string, 16);

        const onCorrectChain = currentChainIdNumber === base.id;
        setIsCorrectChain(onCorrectChain);

        if (!onCorrectChain && autoSwitch) {
          await switchToBase();
        }
      } catch (error) {
        console.error("Failed to check chain:", error);
      }
    };

    checkChain();
  }, [activeWallet, autoSwitch, switchToBase]);

  return {
    isCorrectChain,
    isSwitching,
    switchToBase,
  };
};
