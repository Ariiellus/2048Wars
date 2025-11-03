import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

// Prefer explicit URL, else build Coinbase Base mainnet URL from key, else default chain RPC
const rpc =
  process.env.NEXT_PUBLIC_RPC_URL ||
  (process.env.NEXT_PUBLIC_COINBASE_API_KEY
    ? `https://api.developer.coinbase.com/rpc/v1/base/${process.env.NEXT_PUBLIC_COINBASE_API_KEY}`
    : undefined) ||
  "https://mainnet.base.org";

export const publicClient = createPublicClient({
  chain: base,
  transport: http(rpc),
});
