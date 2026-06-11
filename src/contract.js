// src/contract.js

export const contractAddress = "0x52a76D4ce80b018F613E5750a4F588B932b96e87";

export const contractNetwork = {
  name: "Sepolia Test Network",
  chainId: 11155111,
  chainIdHex: "0xaa36a7",
  explorerUrl: "https://sepolia.etherscan.io",
};

export const getContractExplorerUrl = () => {
  return `${contractNetwork.explorerUrl}/address/${contractAddress}`;
};

export const getTransactionExplorerUrl = (transactionHash) => {
  if (!transactionHash) return "";
  return `${contractNetwork.explorerUrl}/tx/${transactionHash}`;
};

export const contractABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "certId",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "studentName",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "degree",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "issueDate",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "pdfHash",
        type: "string",
      },
    ],
    name: "CertificateIssued",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "certId",
        type: "string",
      },
    ],
    name: "CertificateRevoked",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    name: "certificateHashes",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    name: "certificates",
    outputs: [
      {
        internalType: "string",
        name: "certId",
        type: "string",
      },
      {
        internalType: "string",
        name: "studentName",
        type: "string",
      },
      {
        internalType: "string",
        name: "degree",
        type: "string",
      },
      {
        internalType: "string",
        name: "pdfHash",
        type: "string",
      },
      {
        internalType: "bool",
        name: "revoked",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "issueDate",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "certId",
        type: "string",
      },
    ],
    name: "getCertificate",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "certId",
        type: "string",
      },
    ],
    name: "getCertificateHash",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "certId",
        type: "string",
      },
      {
        internalType: "string",
        name: "studentName",
        type: "string",
      },
      {
        internalType: "string",
        name: "degree",
        type: "string",
      },
      {
        internalType: "string",
        name: "pdfHash",
        type: "string",
      },
    ],
    name: "issueCertificateWithHash",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "certId",
        type: "string",
      },
    ],
    name: "revokeCertificate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];