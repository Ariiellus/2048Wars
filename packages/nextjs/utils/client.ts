import { createPublicClient, http } from "viem";
import { getCurrentChain, getCurrentRpcUrl } from "~~/utils/setup";

export const publicClient = createPublicClient({
  chain: getCurrentChain(),
  transport: http(getCurrentRpcUrl()),
});
