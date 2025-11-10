"use client";

import { useEffect, useState } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { Footer } from "~~/components/Footer";
import { Header } from "~~/components/Header";
import { useInitializeNativeCurrencyPrice } from "~~/hooks/scaffold-eth";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import { getCurrentChain } from "~~/utils/setup";

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  useInitializeNativeCurrencyPrice();

  return (
    <>
      <div className={`flex flex-col min-h-screen `}>
        <Header />
        <main className="relative flex flex-col flex-1">{children}</main>
        <Footer />
      </div>
      <Toaster />
    </>
  );
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export const ScaffoldEthAppWithProviders = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);
  const [isInFarcaster] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Suppress Privy's internal DOM warnings and empty errors
    const originalError = console.error;
    const originalWarn = console.warn;
    let isInitializing = true;

    // Allow errors to flow after initial mount
    setTimeout(() => {
      isInitializing = false;
    }, 2000);

    console.error = (...args: any[]) => {
      // During initialization, suppress all Privy-related errors
      if (isInitializing) {
        const stack = new Error().stack || "";
        if (stack.includes("privy") || stack.includes("Privy") || stack.includes("@privy-io")) {
          return;
        }
      }

      // Skip if no arguments
      if (args.length === 0) return;

      // Check first argument for empty object patterns
      const firstArg = args[0];

      // Skip null or undefined
      if (firstArg === null || firstArg === undefined) return;

      // Skip empty objects - check multiple ways
      if (typeof firstArg === "object") {
        try {
          const keys = Object.keys(firstArg);
          const stringified = JSON.stringify(firstArg);

          // Skip if empty object by any measure
          if (keys.length === 0 || stringified === "{}" || stringified === "[]" || stringified === "null") {
            return;
          }
        } catch {
          // If object operations fail, skip it to be safe
          return;
        }
      }

      try {
        const msg = String(firstArg);
        const stringified = typeof firstArg === "object" ? JSON.stringify(firstArg) : "";

        if (
          !msg || // Skip empty strings
          msg === "[object Object]" || // Skip generic object toString
          msg === "undefined" ||
          msg === "null" ||
          msg.includes("clip-path") ||
          msg.includes("clipPath") ||
          msg.includes("Invalid DOM property") ||
          msg.includes("cannot be a descendant of") ||
          msg.includes("cannot contain a nested") ||
          msg.includes("React does not recognize") ||
          msg.includes("isActive") ||
          msg.includes('Each child in a list should have a unique "key" prop') ||
          stringified.includes("wallet_requestPermissions") || // Skip duplicate wallet permission requests
          stringified.includes("Connection request already pending")
        ) {
          return;
        }
        originalError.call(console, ...args);
      } catch {
        // Silently fail - don't create error loops
      }
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

  if (!privyAppId) {
    console.warn("NEXT_PUBLIC_PRIVY_APP_ID is not set!");
  }

  // Configure login methods based on context
  const loginMethods = isInFarcaster ? ["email", "wallet"] : ["email", "wallet"];

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        appearance: {
          theme: mounted ? (isDarkMode ? "dark" : "light") : "light",
          accentColor: "#2299dd",
          logo: "/2048Wars-Logo.png",
          landingHeader: isInFarcaster ? "Sign in with Farcaster" : "Login",
          loginMessage: isInFarcaster ? "Sign in to play 2048Wars" : "Login to continue",
        },
        loginMethods: loginMethods as any,
        embeddedWallets: {
          ethereum: {
            createOnLogin: "all-users",
          },
          showWalletUIs: false,
        },
        externalWallets: {
          coinbaseWallet: {},
          walletConnect: {
            enabled: true,
          },
        },
        mfa: {
          noPromptOnMfaRequired: false,
        },
        walletConnectCloudProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
        defaultChain: getCurrentChain(),
        supportedChains: wagmiConfig.chains as any,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <ProgressBar height="3px" color="#2299dd" />
          <ScaffoldEthApp>{children}</ScaffoldEthApp>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
};
