"use client";

import { useEffect, useRef, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { getAddress } from "viem";
import { useBalance } from "wagmi";
import {
  ArrowLeftOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import { BlockieAvatar, isENS } from "~~/components/scaffold-eth";
import { useCopyToClipboard, useOutsideClick } from "~~/hooks/scaffold-eth";

export const PrivyConnectButton = () => {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const [mounted, setMounted] = useState(false);
  const [selectingNetwork, setSelectingNetwork] = useState(false);
  const dropdownRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prioritize embedded wallet for seamless transactions
  const embeddedWallet = wallets.find(wallet => wallet.walletClientType === "privy");
  const externalWallet = wallets.find(wallet => wallet.walletClientType !== "privy");
  const activeWallet = embeddedWallet || externalWallet;
  const address = activeWallet?.address as `0x${string}` | undefined;

  const { data: balance } = useBalance({
    address: address,
  });

  const { copyToClipboard: copyAddressToClipboard, isCopiedToClipboard: isAddressCopiedToClipboard } =
    useCopyToClipboard();

  const closeDropdown = () => {
    setSelectingNetwork(false);
    dropdownRef.current?.removeAttribute("open");
  };

  useOutsideClick(dropdownRef, closeDropdown);

  if (!ready || !mounted) {
    return (
      <button className="btn btn-primary btn-sm" disabled>
        Loading...
      </button>
    );
  }

  if (!authenticated) {
    return (
      <button className="btn btn-primary btn-sm" onClick={login}>
        Connect Wallet
      </button>
    );
  }

  if (!address) return null;

  const checkSumAddress = getAddress(address);
  const displayName = `${checkSumAddress.slice(0, 6)}...${checkSumAddress.slice(-4)}`;
  const blockExplorerAddressLink = `https://sepolia.basescan.org/address/${checkSumAddress}`;

  return (
    <details ref={dropdownRef} className="dropdown dropdown-end leading-3">
      <summary className="btn btn-secondary btn-sm pl-1 pr-1 py-1 shadow-md dropdown-toggle gap-0 h-auto! rounded-xl">
        <BlockieAvatar address={checkSumAddress} size={30} />
        <span className="ml-3 mr-2">
          {isENS(displayName) ? displayName : checkSumAddress?.slice(0, 6) + "..." + checkSumAddress?.slice(-4)}
        </span>
        <ChevronDownIcon className="h-6 w-4 ml-2 sm:ml-0" />
      </summary>
      <ul className="dropdown-content menu z-2 p-2 mt-2 shadow-center shadow-accent bg-base-200 rounded-xl gap-1">
        <li className={selectingNetwork ? "hidden" : ""}>
          <div className="h-8 btn-sm rounded-xl! flex gap-3 py-3 cursor-pointer">
            <span className="whitespace-nowrap font-semibold">
              {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : "0 ETH"}
            </span>
          </div>
        </li>
        <li className={selectingNetwork ? "hidden" : ""}>
          <div
            className="h-8 btn-sm rounded-xl! flex gap-3 py-3 cursor-pointer"
            onClick={() => copyAddressToClipboard(checkSumAddress)}
          >
            {isAddressCopiedToClipboard ? (
              <>
                <CheckCircleIcon className="text-xl font-normal h-6 w-4 ml-2 sm:ml-0" aria-hidden="true" />
                <span className="whitespace-nowrap">Copied!</span>
              </>
            ) : (
              <>
                <DocumentDuplicateIcon className="text-xl font-normal h-6 w-4 ml-2 sm:ml-0" aria-hidden="true" />
                <span className="whitespace-nowrap">Copy address</span>
              </>
            )}
          </div>
        </li>
        <li className={selectingNetwork ? "hidden" : ""}>
          <label htmlFor="qrcode-modal" className="h-8 btn-sm rounded-xl! flex gap-3 py-3">
            <QrCodeIcon className="h-6 w-4 ml-2 sm:ml-0" />
            <span className="whitespace-nowrap">View QR Code</span>
          </label>
        </li>
        <li className={selectingNetwork ? "hidden" : ""}>
          <button className="h-8 btn-sm rounded-xl! flex gap-3 py-3" type="button">
            <ArrowTopRightOnSquareIcon className="h-6 w-4 ml-2 sm:ml-0" />
            <a target="_blank" href={blockExplorerAddressLink} rel="noopener noreferrer" className="whitespace-nowrap">
              View on Block Explorer
            </a>
          </button>
        </li>
        <li className={selectingNetwork ? "hidden" : ""}>
          <div className="h-8 btn-sm rounded-xl! flex gap-3 py-3">
            <span className="text-sm text-purple-600 font-medium">
              {embeddedWallet ? "Embedded Wallet" : "External Wallet"}
            </span>
          </div>
        </li>
        <li className={selectingNetwork ? "hidden" : ""}>
          <button
            className="menu-item text-error h-8 btn-sm rounded-xl! flex gap-3 py-3"
            type="button"
            onClick={() => logout()}
          >
            <ArrowLeftOnRectangleIcon className="h-6 w-4 ml-2 sm:ml-0" /> <span>Disconnect</span>
          </button>
        </li>
      </ul>
    </details>
  );
};
