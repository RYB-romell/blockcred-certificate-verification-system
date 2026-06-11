// src/blockchain.js

import { ethers } from "ethers";
import { contractAddress, contractABI } from "./contract.js";

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";

const SEPOLIA_NETWORK_PARAMS = {
  chainId: SEPOLIA_CHAIN_ID_HEX,
  chainName: "Sepolia Test Network",
  nativeCurrency: {
    name: "Sepolia ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://rpc.sepolia.org"],
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};

export const hasMetaMask = () => {
  return typeof window !== "undefined" && Boolean(window.ethereum);
};

const validateContractConfig = () => {
  if (!contractAddress) {
    throw new Error("Contract address is missing. Check src/contract.js.");
  }

  if (!Array.isArray(contractABI) || contractABI.length === 0) {
    throw new Error("Contract ABI is missing or invalid. Check src/contract.js.");
  }

  if (!ethers.utils.isAddress(contractAddress)) {
    throw new Error("Contract address is invalid. Check src/contract.js.");
  }
};

export const getBrowserProvider = () => {
  if (!hasMetaMask()) {
    throw new Error("MetaMask is not installed. Please install MetaMask first.");
  }

  return new ethers.providers.Web3Provider(window.ethereum, "any");
};

export const switchToSepolia = async () => {
  if (!hasMetaMask()) {
    throw new Error("MetaMask is not installed.");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
    });
  } catch (error) {
    if (error?.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [SEPOLIA_NETWORK_PARAMS],
        });

        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
        });

        return;
      } catch (addError) {
        console.error("Add Sepolia error:", addError);

        if (addError?.code === 4001) {
          throw new Error("Adding Sepolia was rejected in MetaMask.");
        }

        throw new Error(
          "Could not add Sepolia to MetaMask. Please add Sepolia manually."
        );
      }
    }

    if (error?.code === 4001) {
      throw new Error("Network switch was rejected in MetaMask.");
    }

    throw new Error("Could not switch MetaMask to Sepolia Test Network.");
  }
};

export const ensureSepoliaNetwork = async (provider) => {
  const finalProvider = provider || getBrowserProvider();
  let network = await finalProvider.getNetwork();

  if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
    await switchToSepolia();

    network = await finalProvider.getNetwork();

    if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
      throw new Error("Please switch MetaMask to Sepolia Test Network.");
    }
  }

  return network;
};

export const requestWalletAccounts = async () => {
  if (!hasMetaMask()) {
    throw new Error("MetaMask is not installed. Please install MetaMask first.");
  }

  try {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!accounts || accounts.length === 0) {
      throw new Error("No wallet account was selected.");
    }

    return accounts;
  } catch (error) {
    if (error?.code === 4001) {
      throw new Error("MetaMask connection was rejected.");
    }

    throw error;
  }
};

export const getContractWithSigner = async () => {
  validateContractConfig();

  await requestWalletAccounts();

  const provider = getBrowserProvider();

  await ensureSepoliaNetwork(provider);

  const signer = provider.getSigner();
  const signerAddress = await signer.getAddress();

  const contract = new ethers.Contract(contractAddress, contractABI, signer);

  return {
    provider,
    signer,
    contract,
    signerAddress,
  };
};

export const getAdminContractWithSigner = async () => {
  try {
    const { provider, signer, contract, signerAddress } =
      await getContractWithSigner();

    if (typeof contract.owner !== "function") {
      throw new Error(
        "Contract ABI does not contain owner(). Check src/contract.js."
      );
    }

    const ownerAddress = await contract.owner();

    if (!ownerAddress || !ethers.utils.isAddress(ownerAddress)) {
      throw new Error("Contract owner address could not be read.");
    }

    if (signerAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
      throw new Error(
        `Wrong admin wallet. Connected wallet: ${signerAddress}. Contract owner: ${ownerAddress}.`
      );
    }

    return {
      provider,
      signer,
      contract,
      signerAddress,
      ownerAddress,
    };
  } catch (error) {
    if (error?.code === 4001) {
      throw new Error("MetaMask request was rejected.");
    }

    throw error;
  }
};

export const getReadOnlyContract = (rpcUrl) => {
  validateContractConfig();

  if (!rpcUrl) {
    throw new Error("Missing Sepolia RPC URL.");
  }

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

  return new ethers.Contract(contractAddress, contractABI, provider);
};