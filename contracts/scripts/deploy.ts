import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const Factory = await ethers.getContractFactory("UrbanLandRegistry");
  const contract = await Factory.deploy(deployer.address);
  await contract.waitForDeployment();
  console.log("UrbanLandRegistry deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
