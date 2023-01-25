import {
    Box,
    Box__factory,
    MyGovernor,
    MyGovernor__factory,
    MyGovernorHelper,
    MyGovernorHelper__factory,
    ProjectTimelock,
    ProjectTimelock__factory,
    ProjectNftToken,
    ProjectNftToken__factory,
    ProjectGovernor,
    ProjectGovernor__factory
  } from "../../typechain";
import { task } from "hardhat/config";
import { getExpectedContractAddress } from "../utils";
import newBoxAbi from "../../artifacts/contracts/BoxLocal.sol/BoxLocal.json";
import govContract from "../../artifacts/contracts/MyGovernor.sol/MyGovernor.json";
// import nftContract from "../../artifacts/contracts/MyNftToken.sol/MyNftToken.json";
task("deploy:Dao").setAction(async function (_, { ethers, run }) {
    console.log("Deploying sub DAO");

    const NEWBOX_ADDRESS = "0xE8F9b7F0cA9449829B44fdbaD9f6E3e265eC707E";
    const GOV_ADDRESS = "0x4ddeDC96DC7C3444A6D4AA4c13bC6E1Ad5203932";
    const proposalID = "96346686350071577925378164822342255975975089637671800064016481723603450803366";

    // ____________________ DEPLOY NEW

    const timelockDelay = 2;

    const newTokenFactory: ProjectNftToken__factory = await ethers.getContractFactory("ProjectNftToken");
    const signerAddress = await newTokenFactory.signer.getAddress();
    console.log("Signer is: ", signerAddress);
    const signer = await ethers.getSigner(signerAddress);

    const governorExpectedAddress = await getExpectedContractAddress(signer);

    const newToken: ProjectNftToken = <ProjectNftToken>await newTokenFactory.deploy(governorExpectedAddress, GOV_ADDRESS);
    await newToken.deployed();

    //   const governorHelperExpectedAddress = await getExpectedContractAddress(signer);

    const projectTimelockFactory: ProjectTimelock__factory = await ethers.getContractFactory("ProjectTimelock");
    const projectTimelock: ProjectTimelock = <ProjectTimelock>await projectTimelockFactory.deploy(governorExpectedAddress, timelockDelay);
    await projectTimelock.deployed();

    const localGovernor: ProjectGovernor__factory = await ethers.getContractFactory("ProjectGovernor");
    const localGov: ProjectGovernor= <ProjectGovernor> await localGovernor.deploy(newToken.address, projectTimelock.address, GOV_ADDRESS, proposalID);
    await localGov.deployed();

    //   // DAO DEPLOYED!!!
  console.log("SUBdao deployed to: ", {
    governor: localGov.address,
    timelock: projectTimelock.address,
    token: newToken.address,
    // box: box.address,
    // helper: governorHelper.address,
    // governorHelperExpectedAddress
  });
    // ___________ deploy the Box and transfer ownership to timlock: ___________
    console.log("----------------------------------------------------");
    console.log("Deploying Box and transfering ownership to timelock...");
        // ____________ NEW PROJECT TOKEN INTERACTIONS _________________________
    const newBox = new ethers.Contract(
        NEWBOX_ADDRESS,
        newBoxAbi.abi,
        signer
        );

    // originally had no input args to constructor because owned by timelock
    await newBox.deployed();

    const theGovernor = new ethers.Contract(
        GOV_ADDRESS,
        govContract.abi,
        signer,
        );
    await theGovernor.transferBoxOwnership(newBox.address, projectTimelock.address,{gasLimit: 25000});

        // ______________________________________________________

    console.log("ownership of box transferred")
    // set whitelist

    // wait 5 blocks until proceed
    function delay(milliseconds: number) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    console.log("Starting, will sleep for 5 secs now");
    delay(5000).then(() => console.log("Normal code execution continues now"));
    //   require(, 'Need to wait 5 minutes');
    await run("verify:verify", {
        address: newToken.address,
        constructorArguments: [localGov.address, GOV_ADDRESS],
    });

    const proposalAsUint = ethers.BigNumber.from(proposalID);
    await run("verify:verify", {
        address: localGov.address,
        constructorArguments: [newToken.address, projectTimelock.address, GOV_ADDRESS, proposalAsUint],
    });
});
