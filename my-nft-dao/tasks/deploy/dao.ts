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

    // const GOV_CONTRACT: address = "0xcDd1D94DFf6b0001f5A2eAb93151C9F5d55C5639"; 
    const newTokenFactory: ProjectNftToken__factory = await ethers.getContractFactory("ProjectNftToken");

    const signerAddress = await newTokenFactory.signer.getAddress();
    const signer = await ethers.getSigner(signerAddress);

    const balance0ETH = await  ethers.provider.getBalance(signerAddress)
    console.log(signerAddress);
    // const waffle = require("hardhat");
    // const provider = waffle.provider;
    // const balance0ETH = await signer.getBalance(signerAddress);
    console.log("ETH balance: ", balance0ETH);

    const expectedProjGovAddress = await getExpectedContractAddress(signer);

    // 2385665740711696627050825523340144238840120702510655699431661617360378182991
    const newTokenContract: ProjectNftToken = <ProjectNftToken> await newTokenFactory.connect(signer).deploy(expectedProjGovAddress, "0xcDd1D94DFf6b0001f5A2eAb93151C9F5d55C5639");
    await newTokenContract.deployed();
//   console.log(governorHelper)
    const localAddresses = [signerAddress];
    await newTokenContract
    .connect(signer)
    .setWhitelist(localAddresses, {
    gasLimit: 250000,
    });
// deploy local GOv
      const localGovernor: ProjectGovernor__factory = await ethers.getContractFactory("ProjectGovernor");

      const proposalAsUint = ethers.BigNumber.from("2385665740711696627050825523340144238840120702510655699431661617360378182991");


      const localGov: ProjectGovernor= <ProjectGovernor> await localGovernor.connect(signer).deploy(newTokenContract.address, "0xf39A740E90bCd0F817a12A8De9422037A828B405", "0xcDd1D94DFf6b0001f5A2eAb93151C9F5d55C5639", proposalAsUint);
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
    address: newTokenContract.address,
    constructorArguments: [expectedProjGovAddress, "0xcDd1D94DFf6b0001f5A2eAb93151C9F5d55C5639"],
  });

  await run("verify:verify", {
    address: localGov.address,
    constructorArguments: [newTokenContract.address, "0xf39A740E90bCd0F817a12A8De9422037A828B405", "0xcDd1D94DFf6b0001f5A2eAb93151C9F5d55C5639", proposalAsUint],
  });
});
