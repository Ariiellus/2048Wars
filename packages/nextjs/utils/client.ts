import { baseSepolia } from "viem/chains";
import { createPublicClient, http } from "viem";

const environment = process.env.NEXT_PUBLIC_APP_ENVIRONMENT ?? "dev";

// Prefer explicit URL, else build Coinbase Base Sepolia URL from key, else default chain RPC
const rpc =
    process.env.NEXT_PUBLIC_RPC_URL ||
    (process.env.NEXT_PUBLIC_COINBASE_API_KEY
        ? `https://api.developer.coinbase.com/rpc/v1/base-sepolia/${process.env.NEXT_PUBLIC_COINBASE_API_KEY}`
        : undefined) ||
    "https://sepolia.base.org"

export const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(rpc),
});
