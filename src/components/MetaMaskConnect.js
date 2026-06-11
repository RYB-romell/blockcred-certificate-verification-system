// src/components/MetaMaskConnect.js

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  FaCheckCircle,
  FaEthereum,
  FaExclamationTriangle,
  FaPlug,
  FaWallet,
} from "react-icons/fa";

const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";
const SEPOLIA_CHAIN_ID_DECIMAL = 11155111;

const shortenAddress = (address) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const hasEthereum = () => {
  return typeof window !== "undefined" && Boolean(window.ethereum);
};

const MetaMaskConnect = () => {
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(null);
  const [loading, setLoading] = useState(false);

  const isSepolia = Number(chainId) === SEPOLIA_CHAIN_ID_DECIMAL;
  const walletAvailable = hasEthereum();

  const readWalletState = async () => {
    if (!hasEthereum()) return;

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      const accounts = await provider.listAccounts();
      const network = await provider.getNetwork();

      setAccount(accounts[0] || "");
      setChainId(network.chainId);
    } catch (error) {
      console.error("Wallet state error:", error);
    }
  };

  useEffect(() => {
    readWalletState();

    if (!hasEthereum()) return undefined;

    const handleAccountsChanged = async (accounts) => {
      setAccount(accounts[0] || "");
      await readWalletState();
    };

    const handleChainChanged = async () => {
      await readWalletState();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  const connectWallet = async () => {
    if (!hasEthereum()) {
      alert("MetaMask is not installed. Please install MetaMask first.");
      return;
    }

    setLoading(true);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();

      setAccount(accounts[0] || "");
      setChainId(network.chainId);
    } catch (error) {
      console.error("MetaMask connection failed:", error);

      if (error?.code === 4001) {
        alert("MetaMask connection was rejected.");
      } else {
        alert("Could not connect to MetaMask. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const switchToSepolia = async () => {
    if (!hasEthereum()) return;

    setLoading(true);

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      });

      await readWalletState();
    } catch (error) {
      console.error("Switch network error:", error);

      if (error?.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: SEPOLIA_CHAIN_ID_HEX,
                chainName: "Sepolia Test Network",
                nativeCurrency: {
                  name: "Sepolia ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://rpc.sepolia.org"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });

          await readWalletState();
        } catch (addError) {
          console.error("Add Sepolia error:", addError);
          alert("Could not add Sepolia. Please add Sepolia manually in MetaMask.");
        }
      } else if (error?.code === 4001) {
        alert("Network switch was rejected.");
      } else {
        alert("Please switch MetaMask to Sepolia Test Network.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!walletAvailable) {
    return (
      <span
        className="bc-hdr-btn"
        title="MetaMask is not installed"
        style={{
          color: "#FDE68A",
          borderColor: "rgba(253,230,138,0.32)",
          background: "rgba(253,230,138,0.10)",
        }}
      >
        <FaExclamationTriangle />
        No MetaMask
      </span>
    );
  }

  if (!account) {
    return (
      <button
        type="button"
        className="bc-hdr-btn"
        onClick={connectWallet}
        disabled={loading}
        title="Connect your MetaMask wallet"
      >
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm" />
            Connecting
          </>
        ) : (
          <>
            <FaWallet />
            Connect Wallet
          </>
        )}
      </button>
    );
  }

  if (!isSepolia) {
    return (
      <button
        type="button"
        className="bc-hdr-btn"
        onClick={switchToSepolia}
        disabled={loading}
        title="Switch MetaMask to Sepolia Test Network"
        style={{
          color: "#FDE68A",
          borderColor: "rgba(253,230,138,0.32)",
          background: "rgba(253,230,138,0.10)",
        }}
      >
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm" />
            Switching
          </>
        ) : (
          <>
            <FaEthereum />
            Switch to Sepolia
          </>
        )}
      </button>
    );
  }

  return (
    <span
      className="bc-hdr-btn"
      title={`Connected wallet: ${account}`}
      style={{
        color: "#A7F3D0",
        borderColor: "rgba(16,185,129,0.35)",
        background: "rgba(16,185,129,0.12)",
      }}
    >
      <FaCheckCircle />
      {shortenAddress(account)}
      <FaPlug style={{ opacity: 0.65 }} />
    </span>
  );
};

export default MetaMaskConnect;