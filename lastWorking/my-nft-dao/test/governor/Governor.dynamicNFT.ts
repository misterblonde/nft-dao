// test where you actually launch the sub Gov DAO and start a vote

// test where you end the sub DAO and return all the funds
import newBoxAbi from "../../artifacts/contracts/BoxLocal.sol/BoxLocal.json";
import { VOTING_PERIOD } from "../../helper-hardhat-config";
import {
  developmentChains,
  VOTING_DELAY,
  proposalsFile,
  FUNC,
  PROPOSAL_DESCRIPTION,
  NEW_STORE_VALUE,
  MIN_DELAY,
} from "../../helper-hardhat-config";
import { moveBlocks } from "../../tasks/move-blocks";
import { moveTime } from "../../tasks/move-time";
// import { ProjectNftToken } from "../../typechain/contracts";
import { expect, assert } from "chai";
import { BigNumber, providers } from "ethers";
import { network } from "hardhat";
import { artifacts, ethers, waffle } from "hardhat";
import { getExpectedContractAddress } from "../../tasks/utils";
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
import { AbiCoder } from "@ethersproject/abi";

export function dynamicNFT(): void {
    it("subdao voted on it 3 times", async function () {
      // const test = await loadFixture(setupInitialState);
      // mint 3 NFTS
      const myFirstMint = await this.token.safeMint(this.signers.admin.address, {
        value: ethers.utils.parseUnits("0.03", "ether"),
        gasLimit: 250000,
      });
      await myFirstMint.wait();
      const myFirstAMint = await this.token.safeMint(this.signers.admin.address, {
        value: ethers.utils.parseUnits("0.03", "ether"),
        gasLimit: 250000,
      });
      await myFirstMint.wait();
      const mySecondMint = await this.token.safeMint(this.addr1.address, {
        value: ethers.utils.parseUnits("0.03", "ether"),
        gasLimit: 250000,
      });
      await mySecondMint.wait();
      const myThirdMint = await this.token.safeMint(this.addr2.address, {
        value: ethers.utils.parseUnits("0.03", "ether"),
        gasLimit: 250000,
      });
      await myThirdMint.wait();
  
      const myFourthMint = await this.token.safeMint(this.addr3.address, {
        value: ethers.utils.parseUnits("0.03", "ether"),
        gasLimit: 250000,
      });
      await myFourthMint.wait();
  
      await this.token
        .connect(this.signers.admin)
        .delegate(this.signers.admin.address);
      await this.token.connect(this.addr1).delegate(this.addr1.address);
      await this.token.connect(this.addr2).delegate(this.addr2.address);
  
      // error somehow as soon as i run this bit:
      await this.token.connect(this.addr3).delegate(this.addr3.address);
      // const functionToCall = "store";
      // const args = [77];
      const functionToCall = "setAdmin";
      const args = [this.signers.admin.address];
      const encodedFunctionCall = this.box.interface.encodeFunctionData(
        functionToCall,
        args
      );
  
      // submit proposal
      const txn = await this.governor
        .connect(this.signers.admin)
        .propose(
          [this.box.address],
          [0],
          [encodedFunctionCall],
          "test 123 new proposal",
          {
            gasLimit: 250000,
            // value: 0.002,
          }
        );
  
      const proposalTxn = await txn.wait(1);
      this.proposalId = proposalTxn.events[0].args.proposalId;
      const proposalIdInput = this.proposalId.toString();
  
      const proposalBudget = 20000000; // gwei == 0.02 ether
      // 20000000; // 0.02 ether
      await this.governor
        .connect(this.signers.admin) // 0.02 ether
        .setProposalBudget(proposalIdInput, proposalBudget, {
          gasLimit: 250000,
          // value: 0.002,
        });
  
      if (developmentChains.includes(network.name)) {
        await moveBlocks(VOTING_DELAY + 1);
      }
  
      const voteTxn = await this.governor
        .connect(this.signers.admin)
        .castVoteAllIn(proposalIdInput, 1, {
          gasLimit: 250000,
          value: ethers.utils.parseUnits("0.09", "ether"),
        });
  
      const voteTxn1 = await this.governor
        .connect(this.addr1)
        .castVoteAllIn(proposalIdInput, 1, {
          gasLimit: 250000,
          value: ethers.utils.parseUnits("0.09", "ether"),
        });
  
      const voteTxn2 = await this.governor
        .connect(this.addr2)
        .castVoteAllIn(proposalIdInput, 1, {
          gasLimit: 250000,
          value: ethers.utils.parseUnits("0.09", "ether"),
        });
  
      const voteTxn3 = await this.governor
        .connect(this.addr3)
        .castVoteAllIn(proposalIdInput, 1, {
          gasLimit: 250000,
          value: ethers.utils.parseUnits("0.09", "ether"),
        });
  
      // _______________ Election Results _______________
      const votingResults = await this.governor.proposalVotes(
        this.proposalId.toString()
      );
      console.log(votingResults);
      if (developmentChains.includes(network.name)) {
        await moveBlocks(VOTING_DELAY + 1);
      }
      await moveBlocks(this.governor.votingPeriod() + 1);
   
      await moveBlocks(100);
      
      await moveBlocks(100);
  
  
      const descriptionHash = ethers.utils.id("test 123 new proposal");
  
      // queue transaction via TIMELOCK?
      console.log("Queueing...");
      const blockTimestamp = await this.provider.getBlock("latest");
      const queueTimelockTx = await this.timelock
        .connect(this.signers.admin)
        .queueTransaction(
          this.box.address,
          0,
          descriptionHash,
          encodedFunctionCall,
          blockTimestamp.timestamp + 3 * 1000 * 60 * 60 * 24,
          { gasLimit: 1 * 10 ** 6 }
        );
      await queueTimelockTx.wait(1);
  
      const queueTx = await this.governor.connect(this.signers.admin).queue(
        [this.box.address],
        [0],
        [encodedFunctionCall],
        descriptionHash,
        { gasLimit: 1 * 10 ** 6 }
        // { value: ethers.utils.parseUnits("0.03", "ether") }
      );
      await queueTx.wait(1);
  
      if (developmentChains.includes(network.name)) {
        await moveBlocks(1);
      }
  
      // _______________ EXECUTE PROPOSAL _______________
      if (developmentChains.includes(network.name)) {
        await moveTime(MIN_DELAY + 1);
        await moveBlocks(1);
      }
      console.log("Executing...");
    //   console.log("Proposal State: ", await this.governor.state(proposalIdInput));

      // EXECUTE VIA TIMELOCK?
      const executeTx = await this.governor
        .connect(this.signers.admin)
        .execute(
          [this.box.address],
          [0],
          [encodedFunctionCall],
          descriptionHash,
          {
            gasLimit: 3 * 10 ** 6,
            value: ethers.utils.parseUnits("0.03", "ether"),
          }
        );
      await executeTx.wait(1);
  
    //   console.log(
    //     `Box value: ${await this.box.isAdmin(this.signers.admin.address)}`
    //   );
  
      const newContract = await this.governorHelper.getChildAddress(
        proposalIdInput
      );
      const childBalance = await this.provider.getBalance(newContract);
  

  
  // _________________ SIGNER ______________________________
  const timelockDelay = 2;

  const newTokenFactory: ProjectNftToken__factory = await ethers.getContractFactory("ProjectNftToken");
  const signerAddress = await newTokenFactory.signer.getAddress();
  const signer = await ethers.getSigner(signerAddress);

  const governorExpectedAddress = await getExpectedContractAddress(signer);

  const newToken: ProjectNftToken = <ProjectNftToken>await newTokenFactory.deploy(governorExpectedAddress, this.governor.address);
  await newToken.deployed();

//   const governorHelperExpectedAddress = await getExpectedContractAddress(signer);

  const projectTimelockFactory: ProjectTimelock__factory = await ethers.getContractFactory("ProjectTimelock");
  const projectTimelock: ProjectTimelock = <ProjectTimelock>await projectTimelockFactory.deploy(governorExpectedAddress, timelockDelay);
  await projectTimelock.deployed();

  const localGovernor: ProjectGovernor__factory = await ethers.getContractFactory("ProjectGovernor");
  const localGov: ProjectGovernor= <ProjectGovernor> await localGovernor.connect(this.signers.admin).deploy(newToken.address, projectTimelock.address, this.governor.address, proposalIdInput);
  await localGov.deployed();

  // ___________ deploy the Box and transfer ownership to timlock: ___________
  console.log("----------------------------------------------------");
  console.log("Deploying Box and transfering ownership to timelock...");
        // ____________ NEW PROJECT TOKEN INTERACTIONS _________________________
    const newBox = new ethers.Contract(
        newContract,
        newBoxAbi.abi,
        signer,
        );

    await newBox.deployed();

    await this.governor.connect(this.signers.admin).transferBoxOwnership(newBox.address, projectTimelock.address);

      // ______________________________________________________

  
     console.log("ownership of box transferred")
    // set whitelist
    const localAddresses = [this.addr2.address, this.signers.admin.address];

      await newToken
        .connect(this.signers.admin)
        .setWhitelist(localAddresses, {
          gasLimit: 250000,
        });
  
    console.log("whitelist set ")

      // white list mint: automatically minting to the caller's wallet
      const myFineProjMint = await newToken
        .connect(this.signers.admin)
        .mintWhitelist({
          value: ethers.utils.parseUnits("0.03", "ether"),
          gasLimit: 250000,
        });
  
      myFineProjMint.wait(1);
  
      // transfer whitelist nft to someone else
      const myTokenId = await newToken.tokenOfOwnerByIndex(
        this.signers.admin.address, 0
      );
    
      console.log("new nft: ", newToken.address);
      console.log("new gov: ", localGov.address);
      console.log("expected new gov addr", governorExpectedAddress);
      console.log("project timelock: ", projectTimelock.address);

  
      const testA = await newToken.safeMint(this.signers.admin.address, {
        value: ethers.utils.parseUnits("0.03", "ether"),
        gasLimit: 250000,
      });
      await testA.wait();
      const testB = await newToken.safeMint(this.signers.admin.address, {
        value: ethers.utils.parseUnits("0.03", "ether"),
        gasLimit: 250000,
      });
      const testC = await newToken.safeMint(this.signers.admin.address, {
        value: ethers.utils.parseUnits("0.03", "ether"),
        gasLimit: 250000,
      });
      await testC.wait();
      const testD = await newToken.safeMint(this.addr1.address, {
        value: ethers.utils.parseUnits("0.03", "ether"),
        gasLimit: 250000,
      });
      await testD.wait();
    
  
    const tokenId = await newToken.tokenOfOwnerByIndex(
        this.addr1.address, 0
      );

    const uri = await newToken.tokenURI(tokenId);
    console.log("the token ID  is : ", uri);

  
      await newToken
        .connect(this.signers.admin)
        .delegate(this.signers.admin.address);
      await newToken.connect(this.addr1).delegate(this.addr1.address);


      // ___________________ START PROPOSAL ___________________________
      const functionToCall1 = "setAdmin";
      const args1 = [this.signers.admin.address];
      const encodedFunctionCall1= newBox.interface.encodeFunctionData(
        functionToCall1,
        args1
      );
  
      // submit proposal
    const projectProposalNo= await localGov
    .connect(this.signers.admin)
    .propose(
        [newBox.address],
        [0],
        [encodedFunctionCall1],
        "test 123",
        {
        gasLimit: 250000,
        // value: 0.002,
        }
    );
    const projectProp = await projectProposalNo.wait(1);
    const receipt = projectProp.logs;

    const Web3 = require('web3');
    const web3 = new Web3();
    const typesArray = [
          { name: "proposalId", type: "uint256"},
          {
            name: "proposer",
            type: "address"
          },
          {
            name: "targets",
            type: "address[]"
          },{
            name: "values",
            type: "uint256[]"
          },
          {
            name: "signatures",
            type: "string[]"
          },
          {
            name: "calldatas",
            type: "bytes[]"
          },];

    const data = receipt[0].data;    
    const decodedParameters = web3.eth.abi.decodeParameters(typesArray, data);
    // console.log(JSON.stringify(decodedParameters, null, 4));
    const projectProposalId = decodedParameters.proposalId;
     // _______________ VOTE PROPOSAL _______________
    if (developmentChains.includes(network.name)) {
    await moveBlocks(VOTING_DELAY + 1);
    }

    const voteTxnB = await localGov
    .connect(this.addr1)
    .castVoteSimple(projectProposalId, 1, {
        gasLimit: 250000,
        value: ethers.utils.parseUnits("0.09", "ether"),
    });
    // console.log("1st vote done");
    
    const voteTxnA = await localGov
        .connect(this.signers.admin)
        .castVoteQuadratic(projectProposalId, 1, 3, {
          gasLimit: 250000,
          value: ethers.utils.parseUnits("0.10", "ether"),
        });
        // console.log("votes done");
      // _______________ Election Results _______________
      const votingResults1 = await localGov.proposalVotes(
        projectProposalId
      );
    //   console.log(votingResults1);
      if (developmentChains.includes(network.name)) {
        await moveBlocks(VOTING_DELAY + 1);
      }
    //   await moveBlocks(localGov.votingPeriod() + 1);
   
      await moveBlocks(100);
      
      await moveBlocks(100);

    const descriptionHash1 = ethers.utils.id("test 123");
   // _______________ QUEUE PROPOSAL _______________
      const queueTx1 = await localGov.connect(this.signers.admin).queue(
        [newBox.address],
        [0],
        [encodedFunctionCall1],
        descriptionHash1,
        { gasLimit: 1 * 10 ** 6 }
        // { value: ethers.utils.parseUnits("0.03", "ether") }
      );
      await queueTx1.wait(1);
  
      if (developmentChains.includes(network.name)) {
        await moveBlocks(1);
      }
  
      // _______________ EXECUTE PROPOSAL _______________
      if (developmentChains.includes(network.name)) {
        await moveTime(MIN_DELAY + 1);
        await moveBlocks(1);
      }
      console.log("Executing...");
      // EXECUTE VIA TIMELOCK?
      const executeTx1 = await localGov
        .connect(this.signers.admin)
        .execute(
          [newBox.address],
          [0],
          [encodedFunctionCall1],
          descriptionHash1,
          {
            gasLimit: 3 * 10 ** 6,
            value: ethers.utils.parseUnits("0.03", "ether"),
          }
        );
      await executeTx1.wait(1);
      await moveBlocks(1);
      await moveBlocks(20);
      const proposalState = await localGov.state(projectProposalId); 
      // end proposal 1
  // ___________________ START PROPOSAL 2 ___________________________

  // submit proposal
const projectProposalNo2= await localGov
.connect(this.signers.admin)
.propose(
    [newBox.address],
    [0],
    [encodedFunctionCall1],
    "test 1234",
    {
    gasLimit: 250000,
    // value: 0.002,
    }
);
const projectProp2 = await projectProposalNo2.wait(1);
const receipt2 = projectProp2.logs;


const data2 = receipt2[0].data;    
const decodedParameters2 = web3.eth.abi.decodeParameters(typesArray, data2);
console.log(JSON.stringify(decodedParameters2, null, 4));
const projectProposalId2 = decodedParameters2.proposalId;
 // _______________ VOTE PROPOSAL _______________
if (developmentChains.includes(network.name)) {
await moveBlocks(VOTING_DELAY + 1);
}

const voteTxnB2 = await localGov
.connect(this.addr1)
.castVoteSimple(projectProposalId2, 1, {
    gasLimit: 250000,
    value: ethers.utils.parseUnits("0.09", "ether"),
});
console.log("1st vote done");

const voteTxnA2 = await localGov
    .connect(this.signers.admin)
    .castVoteQuadratic(projectProposalId2, 1, 3, {
      gasLimit: 250000,
      value: ethers.utils.parseUnits("0.10", "ether"),
    });
  // _______________ Election Results _______________
  const votingResults12 = await localGov.proposalVotes(
    projectProposalId2
  );
  if (developmentChains.includes(network.name)) {
    await moveBlocks(VOTING_DELAY + 1);
  }
//   await moveBlocks(localGov.votingPeriod() + 1);

  await moveBlocks(100);
  
  await moveBlocks(100);

const descriptionHash12 = ethers.utils.id("test 1234");
// _______________ QUEUE PROPOSAL _______________
  const queueTx12 = await localGov.connect(this.signers.admin).queue(
    [newBox.address],
    [0],
    [encodedFunctionCall1],
    descriptionHash12,
    { gasLimit: 1 * 10 ** 6 }
    // { value: ethers.utils.parseUnits("0.03", "ether") }
  );
  await queueTx1.wait(1);

  if (developmentChains.includes(network.name)) {
    await moveBlocks(1);
  }

  // _______________ EXECUTE PROPOSAL _______________
  if (developmentChains.includes(network.name)) {
    await moveTime(MIN_DELAY + 1);
    await moveBlocks(1);
  }
  console.log("Executing...");
  // EXECUTE VIA TIMELOCK?
  const executeTx12 = await localGov
    .connect(this.signers.admin)
    .execute(
      [newBox.address],
      [0],
      [encodedFunctionCall1],
      descriptionHash12,
      {
        gasLimit: 3 * 10 ** 6,
        value: ethers.utils.parseUnits("0.03", "ether"),
      }
    );
  await executeTx1.wait(1);
  await moveBlocks(1);
  await moveBlocks(20);
  const proposalState2 = await localGov.state(projectProposalId2); 

      // end proposal 2
  // ___________________ START PROPOSAL  3 ___________________________

  // submit proposal
const projectProposalNo3= await localGov
.connect(this.signers.admin)
.propose(
    [newBox.address],
    [0],
    [encodedFunctionCall1],
    "test 12345",
    {
    gasLimit: 250000,
    // value: 0.002,
    }
);
const projectProp3 = await projectProposalNo3.wait(1);
const receipt3 = projectProp3.logs;
const data3 = receipt3[0].data;    
const decodedParameters3 = web3.eth.abi.decodeParameters(typesArray, data3);
// console.log(JSON.stringify(decodedParameters3, null, 4));
const projectProposalId3 = decodedParameters3.proposalId;
 // _______________ VOTE PROPOSAL _______________
if (developmentChains.includes(network.name)) {
await moveBlocks(VOTING_DELAY + 1);
}

const voteTxnB3 = await localGov
.connect(this.addr1)
.castVoteSimple(projectProposalId3, 1, {
    gasLimit: 250000,
    value: ethers.utils.parseUnits("0.09", "ether"),
});
console.log("1st vote done");

const voteTxnA3 = await localGov
    .connect(this.signers.admin)
    .castVoteQuadratic(projectProposalId3, 1, 3, {
      gasLimit: 250000,
      value: ethers.utils.parseUnits("0.10", "ether"),
    });
  // _______________ Election Results _______________
  const votingResults13 = await localGov.proposalVotes(
    projectProposalId
  );
  if (developmentChains.includes(network.name)) {
    await moveBlocks(VOTING_DELAY + 1);
  }
//   await moveBlocks(localGov.votingPeriod() + 1);

  await moveBlocks(100);
  
  await moveBlocks(100);

const descriptionHash13 = ethers.utils.id("test 12345");
// _______________ QUEUE PROPOSAL _______________
  const queueTx13 = await localGov.connect(this.signers.admin).queue(
    [newBox.address],
    [0],
    [encodedFunctionCall1],
    descriptionHash13,
    { gasLimit: 1 * 10 ** 6 }
    // { value: ethers.utils.parseUnits("0.03", "ether") }
  );
  await queueTx13.wait(1);

  if (developmentChains.includes(network.name)) {
    await moveBlocks(1);
  }

  // _______________ EXECUTE PROPOSAL _______________
  if (developmentChains.includes(network.name)) {
    await moveTime(MIN_DELAY + 1);
    await moveBlocks(1);
  }
  console.log("Executing...");
  // EXECUTE VIA TIMELOCK?
  const executeTx13 = await localGov
    .connect(this.signers.admin)
    .execute(
      [newBox.address],
      [0],
      [encodedFunctionCall1],
      descriptionHash13,
      {
        gasLimit: 3 * 10 ** 6,
        value: ethers.utils.parseUnits("0.03", "ether"),
      }
    );
  await executeTx13.wait(1);
  await moveBlocks(1);
  await moveBlocks(20);
  const proposalState3 = await localGov.state(projectProposalId3); 

      // end proposal 3

      // TOKEN ID after 3 votes: 
    const tokenId3 = await newToken.tokenOfOwnerByIndex(this.addr1.address, 0);

    const uri3 = await newToken.tokenURI(tokenId3);
    console.log("the token ID after 3 proposal votes is: ", uri3);

   
    });
  }
  