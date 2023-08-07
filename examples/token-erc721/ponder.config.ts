import type { Config } from "@ponder/core";

export const config: Config = {
  network: {
    name: "arbitrum",
    chainId: 42161,
    rpcUrl: process.env.PONDER_RPC_URL_42161,
  },
  contracts: [
    {
      name: "SmolBrain",
      abi: "./abis/SmolBrain.json",
      address: "0x6325439389E0797Ab35752B4F43a14C004f22A9c",
      startBlock: 3163146,
    },
  ],
};
