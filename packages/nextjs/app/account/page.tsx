"use client";

import { useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { formatEther, parseEther } from "viem";
import { createWalletClient, custom } from "viem";
import { mainnet } from "viem/chains";
import { useBalance, useEnsName } from "wagmi";
import { getCurrentChain } from "~~/utils/setup";

export default function AccountPage() {
  const { wallets } = useWallets();
  const [amount, setAmount] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState("");
  const [transferFrom, setTransferFrom] = useState<"embedded" | "external">("external");

  // Get embedded and external wallets
  const embeddedWallet = wallets.find(wallet => wallet.walletClientType === "privy");
  const externalWallet = wallets.find(wallet => wallet.walletClientType !== "privy");

  // Get balances
  const { data: embeddedBalance, refetch: refetchEmbeddedBalance } = useBalance({
    address: embeddedWallet?.address as `0x${string}` | undefined,
  });

  const { data: externalBalance, refetch: refetchExternalBalance } = useBalance({
    address: externalWallet?.address as `0x${string}` | undefined,
  });

  // Get ENS names
  const { data: embeddedEns } = useEnsName({
    address: embeddedWallet?.address as `0x${string}` | undefined,
    chainId: mainnet.id,
  });

  const { data: externalEns } = useEnsName({
    address: externalWallet?.address as `0x${string}` | undefined,
    chainId: mainnet.id,
  });

  // Format balance to 6 decimals max
  const formatBalance = (value: bigint | undefined) => {
    if (!value) return "0";
    const formatted = formatEther(value);
    const num = parseFloat(formatted);
    return num.toFixed(6).replace(/\.?0+$/, "");
  };

  // Get source and destination info
  const sourceWallet = transferFrom === "embedded" ? embeddedWallet : externalWallet;
  const destinationWallet = transferFrom === "embedded" ? externalWallet : embeddedWallet;
  const sourceBalance = transferFrom === "embedded" ? embeddedBalance : externalBalance;
  const sourceEns = transferFrom === "embedded" ? embeddedEns : externalEns;
  const destinationEns = transferFrom === "embedded" ? externalEns : embeddedEns;

  // Set max amount from source wallet
  const setMaxAmount = () => {
    if (sourceBalance && sourceBalance.value) {
      // Calculate gas buffer (0.0001 ETH or 10% of balance, whichever is smaller)
      const gasBuffer = parseEther("0.0001");
      const tenPercent = sourceBalance.value / BigInt(10);
      const actualBuffer = gasBuffer < tenPercent ? gasBuffer : tenPercent;

      // If balance is very small, use 90% of it
      const maxValue =
        sourceBalance.value > actualBuffer
          ? sourceBalance.value - actualBuffer
          : (sourceBalance.value * BigInt(9)) / BigInt(10);
      const formattedValue = formatEther(maxValue);
      setAmount(formattedValue);
    }
  };

  const handleTransfer = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setIsTransferring(true);
    setError("");

    try {
      if (!sourceWallet || !destinationWallet) {
        throw new Error("Both wallets must be connected");
      }

      // Get provider and create wallet client
      const ethereumProvider = await sourceWallet.getEthereumProvider();
      const walletClient = createWalletClient({
        chain: getCurrentChain(),
        transport: custom(ethereumProvider),
      });

      // Send transaction
      const hash = await walletClient.sendTransaction({
        account: sourceWallet.address as `0x${string}`,
        to: destinationWallet.address as `0x${string}`,
        value: parseEther(amount),
        chain: getCurrentChain(),
      });

      setAmount("");

      // Wait a bit for transaction to be mined, then refresh balances
      setTimeout(async () => {
        await Promise.all([refetchEmbeddedBalance(), refetchExternalBalance()]);
      }, 2000);
    } catch (err: any) {
      console.error("Transfer error:", err);
      setError(err.message || "Transfer failed");
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-8">Account Management</h1>

      {/* Wallet Status */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Embedded Wallet Card */}
        <div className="bg-base-200 rounded-xl p-6 border border-base-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Game Account</h2>
          </div>
          {embeddedWallet ? (
            <>
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold tracking-tight">{formatBalance(embeddedBalance?.value)}</p>
                  <p className="text-lg text-gray-400">ETH</p>
                </div>
              </div>
              <div className="pt-4 border-t border-base-300">
                {embeddedEns ? (
                  <>
                    <p className="font-mono text-sm mb-1">{embeddedEns}</p>
                    <p className="font-mono text-xs text-gray-500 break-all">{embeddedWallet.address}</p>
                  </>
                ) : (
                  <p className="font-mono text-xs text-gray-400 break-all">{embeddedWallet.address}</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-gray-500">No embedded wallet found</p>
          )}
        </div>

        {/* External Wallet Card */}
        <div className="bg-base-200 rounded-xl p-6 border border-base-300 w-90">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Connected Wallet</h2>
          </div>
          {externalWallet ? (
            <>
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold tracking-tight">{formatBalance(externalBalance?.value)}</p>
                  <p className="text-lg text-gray-400">ETH</p>
                </div>
              </div>
              <div className="pt-4 border-t border-base-300">
                {externalEns ? (
                  <>
                    <p className="font-mono text-sm mb-1">{externalEns}</p>
                    <p className="font-mono text-xs text-gray-500 break-all">{externalWallet.address}</p>
                  </>
                ) : (
                  <p className="font-mono text-xs text-gray-400 break-all">{externalWallet.address}</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-gray-500">No external wallet connected</p>
          )}
        </div>
      </div>

      {/* Transfer Section */}
      {embeddedWallet && externalWallet ? (
        <div className="max-w-2xl mx-auto">
          <div className="bg-base-200 rounded-xl p-6 border border-base-300">
            <h2 className="text-xl font-semibold mb-6">Transfer Funds</h2>

            {/* Source Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Transfer From</label>
              <select
                value={transferFrom}
                onChange={e => {
                  setTransferFrom(e.target.value as "embedded" | "external");
                  setAmount(""); // Clear amount when switching
                }}
                className="select select-bordered w-full"
                disabled={isTransferring}
              >
                <option value="external">{externalEns || externalWallet?.address}</option>
                <option value="embedded">{embeddedEns || embeddedWallet?.address}</option>
              </select>
            </div>

            {/* Destination Info */}
            <div className="bg-base-300 rounded-lg p-2 mb-4">
              <p className="font-mono text-sm text-black-700 break-all">
                To: <span className="text-xs text-black-500"> {destinationEns || destinationWallet?.address}</span>
              </p>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Amount (ETH)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  placeholder="0.0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="input input-bordered w-full pr-20"
                  disabled={isTransferring}
                />
                <button
                  onClick={setMaxAmount}
                  disabled={isTransferring}
                  className="btn btn-sm btn-ghost absolute right-1 top-1"
                >
                  Max
                </button>
              </div>
            </div>

            {/* Transfer Button */}
            {amount && parseFloat(amount) > 0 && (
              <button
                onClick={handleTransfer}
                disabled={isTransferring}
                className="btn btn-primary w-full rounded-xl mb-6"
              >
                {isTransferring
                  ? "Processing..."
                  : `Transfer ${amount} ETH to ${transferFrom === "embedded" ? "Connected" : "Embedded"} Wallet`}
              </button>
            )}

            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="alert alert-warning max-w-2xl mx-auto">
          <span>Please connect both your embedded wallet and an external wallet to transfer funds.</span>
        </div>
      )}
    </div>
  );
}
