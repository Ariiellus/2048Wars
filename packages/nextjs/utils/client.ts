import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

// Prefer explicit URL, else use Base Sepolia RPC
const rpc =
  process.env.NEXT_PUBLIC_RPC_URL ||
  `https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY || "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF"}`;

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(rpc),
});
