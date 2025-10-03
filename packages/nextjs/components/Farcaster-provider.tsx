"use client";

import { useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        // Initialize the Farcaster SDK
        await sdk.actions.ready();
        console.log("Farcaster SDK initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Farcaster SDK:", error);
      }
    };

    initializeFarcaster();
  }, []);

  return <>{children}</>;
}
