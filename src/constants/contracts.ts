export const FACTORY_CONTRACT_ABI = [
  {
    name: "createVoiceVault",
    type: "function",
    inputs: [
      { name: "initialOwner", type: "address" },
      { name: "cid", type: "string" },
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
      { name: "baseUri", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
];

export const NFT_CONTRACT_BYTECODE = "0x..."; // Add your contract bytecode here
