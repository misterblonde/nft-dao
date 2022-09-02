// import { keccak256 } from "ethers/lib/utils";
// import { task } from "hardhat/config";

// // from '../../typechain' import {MyGovernor,
// //     MyGovernor__factory,
// //     MyNftToken,
// //     MyNftToken__factory,
// //     Timelock,
// //     Timelock__factory,}
// import {
//   Box,
//   Box__factory,
//   MyGovernor,
//   MyGovernor__factory,
//   MyGovernorHelper,
//   MyGovernorHelper__factory,
//   MyNftToken,
//   MyNftToken__factory,
//   Timelock,
//   Timelock__factory,
// } from "../../typechain";
// import { getExpectedContractAddress } from "../utils";

// task("deploy:Dao").setAction(async function (_, { ethers, run }) {
//   const timelockDelay = 2;

//   const tokenFactory: MyNftToken__factory = await ethers.getContractFactory("MyNftToken");

//   const signerAddress = await tokenFactory.signer.getAddress();
//   const signer = await ethers.getSigner(signerAddress);

//   const governorExpectedAddress = await getExpectedContractAddress(signer);

//   const token: MyNftToken = <MyNftToken>await tokenFactory.deploy();
//   await token.deployed();

//   const governorHelperExpectedAddress = await getExpectedContractAddress(signer);

//   const timelockFactory: Timelock__factory = await ethers.getContractFactory("Timelock");
//   const timelock: Timelock = <Timelock>await timelockFactory.deploy(governorExpectedAddress, timelockDelay);
//   await timelock.deployed();

//   const governorFactory: MyGovernor__factory = await ethers.getContractFactory("MyGovernor");
//   const governor: MyGovernor = <MyGovernor> await governorFactory.deploy(token.address, timelock.address, governorHelperExpectedAddress);
//   await governor.deployed();

//   const governorHelperFactory: MyGovernorHelper__factory = await ethers.getContractFactory("MyGovernorHelper");
//   const governorHelper: MyGovernorHelper = <MyGovernorHelper>await governorHelperFactory.deploy(governor.address);
//   await governorHelper.deployed();
// //   console.log(governorHelper)

//   // ___________ deploy the Box and transfer ownership to timlock: ___________
//   console.log("----------------------------------------------------");
//   console.log("Deploying Box and transfering ownership to timelock...");
//   // Deploy according to dao.ts style deployment:
//   const boxFactory: Box__factory = await ethers.getContractFactory("Box");
//   const box: Box = <Box>await boxFactory.deploy(governor.address, governorHelper.address);
//   // originally had no input args to constructor because owned by timelock
//   await box.deployed();

//   await box.transferOwnership(timelock.address);

//   // DAO DEPLOYED!!!
//   console.log("Dao deployed to: ", {
//     governorExpectedAddress,
//     governor: governor.address,
//     timelock: timelock.address,
//     token: token.address,
//     box: box.address,
//     helper: governorHelper.address,
//     governorHelperExpectedAddress
//   });

//   // Transfer ownership to the timelock to allow it to perform actions on the NFT contract as part of proposal execution
//   await token.transferOwnership(timelock.address);

//   console.log("Granted the timelock ownership of the NFT Token");

//   // wait 5 blocks until proceed
//   //   uint public blockNumber = block.number;
//   //   bytes32 public blockHashNow;
//   //   bytes32 public blockHashPrevious;
//   function delay(milliseconds: number) {
//     return new Promise(resolve => setTimeout(resolve, milliseconds));
//   }

//   console.log("Starting, will sleep for 5 secs now");
//   delay(5000).then(() => console.log("Normal code execution continues now"));
//   //   require(, 'Need to wait 5 minutes');
//   await run("verify:verify", {
//     address: token.address,
//   });

//   await run("verify:verify", {
//     address: timelock.address,
//     constructorArguments: [governor.address, timelockDelay],
//   });

//   await run("verify:verify", {
//     address: governorHelper.address,
//     constructorArguments: [governor.address],
//     //token.address, timelock.address, governorHelper.address
//   });

//   await run("verify:verify", {
//     address: governor.address,
//     constructorArguments: [token.address, timelock.address, governorHelper.address],
//     //token.address, timelock.address, governorHelper.address
//   });

//   await run("verify:verify", {
//     address: box.address,
//     constructorArguments: [governor.address, governorHelper.address],
//   });
// });
