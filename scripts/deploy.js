import Hardhat from "hardhat";
const { ethers } = Hardhat;
async function main() {
  const ContractFactory = await ethers.getContractFactory("BlockCred");
  const contract = await ContractFactory.deploy();
  await contract.deployed();
  console.log("BlockCred deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});