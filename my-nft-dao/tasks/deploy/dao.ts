import { keccak256 } from "ethers/lib/utils";
import { task } from "hardhat/config";

// from '../../typechain' import {MyGovernor,
//     MyGovernor__factory,
//     MyNftToken,
//     MyNftToken__factory,
//     Timelock,
//     Timelock__factory,}
import {
  Box,
  Box__factory,
  MyGovernor,
  MyGovernor__factory,
  MyNftToken,
  MyNftToken__factory,
  Timelock,
  Timelock__factory,
} from "../../typechain";
import { getExpectedContractAddress } from "../utils";

task("deploy:Dao").setAction(async function (_, { ethers, run }) {
  const timelockDelay = 2;

  const tokenFactory: MyNftToken__factory = await ethers.getContractFactory("MyNftToken");

  const signerAddress = await tokenFactory.signer.getAddress();
  const signer = await ethers.getSigner(signerAddress);

  const governorExpectedAddress = await getExpectedContractAddress(signer);

  const token: MyNftToken = <MyNftToken>await tokenFactory.deploy();
  await token.deployed();

  const timelockFactory: Timelock__factory = await ethers.getContractFactory("Timelock");
  const timelock: Timelock = <Timelock>await timelockFactory.deploy(governorExpectedAddress, timelockDelay);
  await timelock.deployed();

  const governorFactory: MyGovernor__factory = await ethers.getContractFactory("MyGovernor");
  const governor: MyGovernor = <MyGovernor>await governorFactory.deploy(token.address, timelock.address);
  await governor.deployed();

  // ___________ deploy the Box and transfer ownership to timlock: ___________
  console.log("----------------------------------------------------");
  console.log("Deploying Box and transfering ownership to timelock...");
  // Deploy according to dao.ts style deployment:
  const boxFactory: Box__factory = await ethers.getContractFactory("Box");
  const box: Box = <Box>await boxFactory.deploy();
  await box.deployed();

  await box.transferOwnership(timelock.address);

  // DAO DEPLOYED!!!
  console.log("Dao deployed to: ", {
    governorExpectedAddress,
    governor: governor.address,
    timelock: timelock.address,
    token: token.address,
    box: box.address,
  });

  // We'll mint enough NFTs to be able to pass a proposal!
  //   const myFirstMint = await token.safeMint(signerAddress);
  // await myFirstMint.wait();

  //   await token.safeMint(signerAddress);
  //   await token.safeMint(signerAddress);
  //   await token.safeMint(signerAddress);

  //   console.log("Minted 1 NFT to get us started");

  // Transfer ownership to the timelock to allow it to perform actions on the NFT contract as part of proposal execution
  await token.transferOwnership(timelock.address);

  console.log("Granted the timelock ownership of the NFT Token");

  // wait 5 blocks until proceed
  //   uint public blockNumber = block.number;
  //   bytes32 public blockHashNow;
  //   bytes32 public blockHashPrevious;
  function delay(milliseconds: number) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  console.log("Starting, will sleep for 5 secs now");
  delay(5000).then(() => console.log("Normal code execution continues now"));
  //   require(, 'Need to wait 5 minutes');
  await run("verify:verify", {
    address: token.address,
  });

  await run("verify:verify", {
    address: timelock.address,
    constructorArguments: [governor.address, timelockDelay],
  });

  await run("verify:verify", {
    address: governor.address,
    constructorArguments: [token.address, timelock.address],
  });

  await run("verify:verify", {
    address: box.address,
    constructorArguments: [],
  });
});
