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
import { providers } from "ethers";
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
    MyNftToken,
    MyNftToken__factory,
    ProjectNftToken,
    ProjectNftToken__factory,
    ProjectGovernor, 
    ProjectGovernor__factory
  } from "../../typechain";

export function testVotingOnSubDAO(): void {
    it("Launched Vote on SubDAO and Locals and nonlocals voted on it", async function () {
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
      console.log("Proposal State: ", await this.governor.state(proposalIdInput));

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
  
      console.log(
        `Box value: ${await this.box.isAdmin(this.signers.admin.address)}`
      );
  
      const newContract = await this.governorHelper.getChildAddress(
        proposalIdInput
      );
      const childBalance = await this.provider.getBalance(newContract);
  
      console.log(
        "Child contract balance: ",
        parseInt(childBalance),
        ethers.utils.formatEther(await proposalBudget)
        //   ethers.utils.formatEther(newContract.balance)
      );
  
  
      const expectedProjGovAddress = await getExpectedContractAddress(this.signers.admin);

      const newTokenFactory: ProjectNftToken__factory = await ethers.getContractFactory("ProjectNftToken");
      const newTokenContract: ProjectNftToken = <ProjectNftToken> await newTokenFactory.connect(this.signers.admin).deploy(expectedProjGovAddress, this.governor.address);
      await newTokenContract.deployed();
  
      // ____________ NEW PROJECT TOKEN INTERACTIONS _________________________
      const newBoxContract = new ethers.Contract(
        newContract,
        newBoxAbi.abi,
        this.provider
      );
  
      // set whitelist
      const localAddresses = [this.addr2.address, this.signers.admin.address];
  
      await newTokenContract
        .connect(this.signers.admin)
        .setWhitelist(localAddresses, {
          gasLimit: 250000,
        });
  
    // deploy local GOv
      const localGovernor: ProjectGovernor__factory = await ethers.getContractFactory("ProjectGovernor");
      const localGov: ProjectGovernor= <ProjectGovernor> await localGovernor.connect(this.signers.admin).deploy(newTokenContract.address, this.timelock.address, this.governor.address, proposalIdInput);
      await localGov.deployed();

      // white list mint: automatically minting to the caller's wallet
      const myFineProjMint = await newTokenContract
        .connect(this.signers.admin)
        .mintWhitelist({
          value: ethers.utils.parseUnits("0.03", "ether"),
          gasLimit: 250000,
        });
  
      myFineProjMint.wait(1);
  
      // transfer whitelist nft to someone else
      const myTokenId = await newTokenContract.tokenOfOwnerByIndex(
        this.signers.admin.address, 0
      );
    
    //   console.log("Local users nft transfer blocked.")
    //   await newTokenContract.connect(this.signers.admin).pauseLocalsOnly();
      

      console.log("new nft: ", newTokenContract.address);
      console.log("new gov: ", localGov.address);
      console.log("expected new gov addr", expectedProjGovAddress);
    //   console.log("proposal Id: ", proposalIdInput);

      console.log("timelock: ", this.timelock.address);
      console.log("nft DAO: ", this.token.address);
      console.log("gov DAO: ", this.governor.address);
      console.log("helper gov DAO: ", this.governorHelper.address);


    // delegate votes before proposal is started

    // propose with your minimum votes

    // vote on the proposal once active
    await expect(0).to.equal(1);
  
    });
  }
  