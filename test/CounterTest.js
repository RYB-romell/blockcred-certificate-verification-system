const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateVerification Contract", function () {
  let contract;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const ContractFactory = await ethers.getContractFactory("CertificateVerification");
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("should issue a certificate", async function () {
    await contract.issueCertificate("CT01", "Alice", "BSc", 20260517);
    const cert = await contract.certificates("CT01");
    expect(cert.certId).to.equal("CT01");
    expect(cert.studentName).to.equal("Alice");
    expect(cert.isRevoked).to.equal(false);
  });

  it("should revoke a certificate", async function () {
    await contract.issueCertificate("CT02", "Bob", "MSc", 20260517);
    await contract.revokeCertificate("CT02");
    const cert = await contract.certificates("CT02");
    expect(cert.isRevoked).to.equal(true);
  });

  it("should verify a certificate", async function () {
    await contract.issueCertificate("CT03", "Charlie", "PhD", 20260517);
    const [isValid, isRevoked] = await contract.verifyCertificate("CT03");
    expect(isValid).to.equal(true);
    expect(isRevoked).to.equal(false);
  });
});