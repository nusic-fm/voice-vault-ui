import { Contract, ethers } from "ethers";
import { FACTORY_CONTRACT_ABI } from "../constants/contracts";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error("Please install MetaMask to continue");
  }

  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  // if (accounts.length === 0) {
  //   await switchToAeneidNetwork();
  // }
  return accounts[0];
};

export const switchToAeneidNetwork = async () => {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "1315" }],
    });
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "1315",
            chainName: "Story Aeneid Testnet",
            nativeCurrency: {
              name: "IP",
              symbol: "IP",
              decimals: 18,
            },
            rpcUrls: ["https://aeneid.storyrpc.io"],
            blockExplorerUrls: ["https://aeneid.storyscan.xyz"],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
};

export const deployAIVoiceNFT = async (
  ownerAddress: string,
  cid: string,
  name: string,
  symbol: string,
  baseUri: string
) => {
  if (!window.ethereum) {
    throw new Error("Please install MetaMask");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new Contract(
    import.meta.env.VITE_FACTORY_ADDRESS,
    FACTORY_CONTRACT_ABI,
    signer
  );
  const tx = await contract.createVoiceVault(
    signer.address,
    cid,
    name,
    symbol,
    baseUri
  );
  await tx.wait();
  return tx;
};

export const getVaultAddress = async (walletAddress: string) => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const contract = new Contract(
    import.meta.env.VITE_FACTORY_ADDRESS,
    FACTORY_CONTRACT_ABI,
    provider
  );
  const vaultAddress = await contract.voiceVaults(walletAddress);
  return vaultAddress;
};

export const getVoiceVaultCid = async (voiceVaultAddress: string) => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const contract = new Contract(
    import.meta.env.VITE_FACTORY_ADDRESS,
    FACTORY_CONTRACT_ABI,
    provider
  );
  const cid = await contract.cidByVoiceVaults(voiceVaultAddress);
  return cid;
};

export const signMessageWithWalletAddress = async (messageToSign: string) => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const signature = await signer.signMessage(messageToSign);
  console.log("Message to sign:", messageToSign.toString());
  console.log("Signature:", signature);
  return signature;
};
