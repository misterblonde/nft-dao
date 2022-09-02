import { keccak256 } from "ethers/lib/utils";
import { task } from "hardhat/config";

import {
  Box,
  Box__factory,
  MyGovernor,
  MyGovernor__factory,
  MyGovernorHelper,
  MyGovernorHelper__factory,
  MyNftToken,
  MyNftToken__factory,
  Timelock,
  Timelock__factory,
  ProjectNftToken,
  ProjectNftToken__factory,
  ProjectGovernor,
  ProjectGovernor__factory
} from "../../typechain";
import { getExpectedContractAddress } from "../utils";

task("deploy:Dao").setAction(async function (_, { ethers, run }) {
    console.log("Deploying sub DAO");


    const GOV_ADDRESS = "0x412869745d728CFa7EAC614D4e81f3Df42c87374"
    const TIMELOCK_ADDRESS = "0x74d35B785f8bC3bF3CEC9006CEf672DBa68857bB"
    const proposalID = "31395016386585969917763761123704365097410000323246340454152448345831000970524";

    // const GOV_CONTRACT: address = "0xcDd1D94DFf6b0001f5A2eAb93151C9F5d55C5639";
    const newTokenFactory: ProjectNftToken__factory = await ethers.getContractFactory("ProjectNftToken");

    const signerAddress = await newTokenFactory.signer.getAddress();
    const signer = await ethers.getSigner(signerAddress);

    const balance0ETH = await  ethers.provider.getBalance(signerAddress)
    console.log(signerAddress);
    console.log("ETH balance: ", balance0ETH);

    // deploy new Project Token
    const expectedProjGovAddress = await getExpectedContractAddress(signer);
    const newTokenContract: ProjectNftToken = <ProjectNftToken> await newTokenFactory.connect(signer).deploy(expectedProjGovAddress, GOV_ADDRESS);
    await newTokenContract.deployed();

    const localAddresses = [signerAddress];
    await newTokenContract
    .connect(signer)
    .setWhitelist(localAddresses, {
    gasLimit: 250000,
    });

    // deploy local GOv
      const localGovernor: ProjectGovernor__factory = await ethers.getContractFactory("ProjectGovernor");

      const proposalAsUint = ethers.BigNumber.from(proposalID);

      const localGov: ProjectGovernor= <ProjectGovernor> await localGovernor.connect(signer).deploy(newTokenContract.address, TIMELOCK_ADDRESS, GOV_ADDRESS, proposalAsUint);
      await localGov.deployed();

    // ____________ NEW PROJECT TOKEN INTERACTIONS _________________________
    //   const newBoxContract = new ethers.Contract(
    //     newContract,
    //     newBoxAbi.abi,
    //     this.provider
    //   );

  // ___________ deploy the Box and transfer ownership to timlock: ___________
  console.log("----------------------------------------------------");
  console.log("Deploying Box and transfering ownership to timelock...");
  // Deploy according to dao.ts style deployment:

  // DAO DEPLOYED!!!
  console.log("SUBdao deployed to: ", {
    expectedProjGovAddress,
    governor: localGov.address,
    // timelock: timelock.address,
    token: newTokenContract.address,
    // box: box.address,
    // helper: governorHelper.address,
    // governorHelperExpectedAddress
  });

  // wait 5 blocks until proceed
  function delay(milliseconds: number) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  console.log("Starting, will sleep for 5 secs now");
  delay(5000).then(() => console.log("Normal code execution continues now"));
  //   require(, 'Need to wait 5 minutes');
  await run("verify:verify", {
    address: newTokenContract.address,
    constructorArguments: [expectedProjGovAddress, GOV_ADDRESS],
  });

  await run("verify:verify", {
    address: localGov.address,
    constructorArguments: [newTokenContract.address, TIMELOCK_ADDRESS, GOV_ADDRESS, proposalAsUint],
  });
});
