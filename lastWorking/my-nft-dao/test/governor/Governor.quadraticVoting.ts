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
import { getExpectedContractAddress } from "../../tasks/utils";
import type { Box } from "../../typechain/contracts/Box";
import type { MyGovernor } from "../../typechain/contracts/MyGovernor";
import type { MyNftToken } from "../../typechain/contracts/MyNftToken";
import type { Timelock } from "../../typechain/contracts/Timelock";
// before it was this path;
// import type { Timelock } from "../../src/types/contracts/Timelock";
// import type { MyNftToken } from "../../src/types/contracts/MyNftToken";
// import type { MyGovernor } from "../../src/types/contracts/MyGovernor";
import { Signers } from "../types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
// import { setupInitialState } from "./Governor";
// import { setupInitialState } from "./Governor";
import { expect, assert } from "chai";
import { loadFixture } from "ethereum-waffle";
import { utils } from "ethers";
// import { ethers } from "ethers";
import * as fs from "fs";
import { network } from "hardhat";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";

const { solidity } = require("ethereum-waffle");
const chai = require("chai");
chai.use(solidity);
const hre = require("hardhat");
export function quadraticVotingWithCustomAmount(): void {
  it("Quadratic Voting with some subset of your tokens/votes", async function () {
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
    const myFirstBMint = await this.token.safeMint(this.signers.admin.address, {
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

    // // const blockNum = await this.provider.getBlockNumber("latest");
    // //delegate votes
    await this.token
      .connect(this.signers.admin)
      .delegate(this.signers.admin.address);
    await this.token.connect(this.addr1).delegate(this.addr1.address);
    await this.token.connect(this.addr2).delegate(this.addr2.address);

    // error somehow as soon as i run this bit:
    await this.token.connect(this.addr3).delegate(this.addr3.address);
    const functionToCall = "store";
    const args = [77];
    const encodedFunctionCall = this.box.interface.encodeFunctionData(
      functionToCall,
      args
    );

    console.log("Governor BALANCE IS: ", await this.governor.getBalance());

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
    await this.governor
      .connect(this.signers.admin) // 0.02 ether
      .setProposalBudget(proposalIdInput, 20000000, {
        gasLimit: 250000,
        // value: 0.002,
      });

    if (developmentChains.includes(network.name)) {
      await moveBlocks(VOTING_DELAY + 1);
    }

    const voteTxn = await this.governor
      .connect(this.signers.admin)
      .castVoteQuadratic(proposalIdInput, 0, 2, {
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

    const votingResults = await this.governor.proposalVotes(
      this.proposalId.toString()
    );
    console.log(votingResults);
    // await expect(votingResults.forVotes.toNumber()).to.equal(3);

    if (developmentChains.includes(network.name)) {
      console.log(
        "State (before blocks moved):",
        await this.governor.state(proposalIdInput)
      );
      await moveBlocks(this.governor.votingPeriod() + 1);
      console.log(
        "State (after voting period ended):",
        await this.governor.state(proposalIdInput)
      );
      await moveBlocks(100);
      console.log(
        "State (after voting period+1 ended):",
        await this.governor.state(proposalIdInput)
      );

      const votingResults = await this.governor.proposalVotes(
        this.proposalId.toString()
      );
      console.log(votingResults);
      await expect(votingResults.againstVotes).to.equal(2);
    }
  });
}
//   console.log(
//     "State (4) == succeeded: ",
//     await this.governor.state(proposalIdInput)
//   );
//   await moveBlocks(100);

//   console.log(
//     "State (4) == succeeded: ",
//     await this.governor.state(proposalIdInput)
//   );

//   const descriptionHash = ethers.utils.id("test 123 new proposal");

//   await this.governor.queue(
//     [box.address],
//     [0],
//     [transferCalldata],
//     descriptionHash
//   );

//   const args = [NEW_STORE_VALUE]
//   const functionToCall = FUNC
//   const box = await ethers.getContract("Box")
//   const encodedFunctionCall = box.interface.encodeFunctionData(functionToCall, args)
//   const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes( "test 123 new proposal"))
// could also use ethers.utils.id(PROPOSAL_DESCRIPTION)

//   const governor = await ethers.getContract("GovernorContract")
//   console.log("Queueing...");

//   const setPendingTimelockAdmin = await this.timelock
//     .connect(this.provider.getSigner(this.timelock.admin))
//     // .connect(this.signers.admin)
//     .setPendingAdmin(this.signers.admin.address, {
//       gasLimit: 1 * 10 ** 6,
//     });
//   console.log("Pending admin set");
//   const setTimelockAdmin = await this.timelock.acceptAdmin({
//     gasLimit: 1 * 10 ** 6,
//   });
//   console.log("Pending admin: ", this.timelock.pendingAdmin);
//   console.log("admin: ", this.timelock.admin);
//   console.log("New admin set");
//   const queueTx = await this.governor.connect(this.signers.admin).queue(
//     [this.box.address],
//     [0],
//     [encodedFunctionCall],
//     descriptionHash,
//     { gasLimit: 1 * 10 ** 6 }
//     // { value: ethers.utils.parseUnits("0.03", "ether") }
//   );
//   await queueTx.wait(1);
//   console.log(
//     "State (before blocks moved):",
//     await this.governor.state(proposalIdInput)
//   );

//   if (developmentChains.includes(network.name)) {
//     // await moveTime(MIN_DELAY + 1);
//     console.log(
//       "State (before blocks moved):",
//       await this.governor.state(proposalIdInput)
//     );
//     await moveBlocks(1);
//   }

//   const balanceOld = await this.provider.getBalance(this.governor.address);
//   console.log(
//     "Prior to execute Balance: ",
//     ethers.utils.formatEther(balanceOld)
//   );
//   console.log(
//     "Governor BALANCE IS: ",
//     ethers.utils.formatEther(await this.governor.getBalance())
//   );

//   // await web3.utils.fromWei(parseInt(balanceOld)));

//   if (developmentChains.includes(network.name)) {
//     await moveTime(MIN_DELAY + 1);
//     await moveBlocks(1);
//   }

//   console.log("Executing...");
//   console.log(
//     "Proposal State: ",
//     await this.governor.state(proposalIdInput)
//   );
//   // this will fail on a testnet because you need to wait for the MIN_DELAY!
//   const executeTx = await this.governor
//     .connect(this.signers.admin)
//     .execute(
//       [this.box.address],
//       [0],
//       [encodedFunctionCall],
//       descriptionHash,
//       {
//         gasLimit: 3 * 10 ** 6,
//         value: ethers.utils.parseUnits("0.03", "ether"),
//       }
//     );
//   //   await executeTx.wait(1);

//   await executeTx.wait(1);

//   console.log(`Box value: ${await this.box.retrieve()}`);
//   //   console.log(`Box value: ${await box.retrieve()}`)

//   const balanceNew = await this.provider.getBalance(this.governor.address);
//   console.log(
//     "Governor BALANCE IS: ",
//     ethers.utils.formatEther(await this.governor.getBalance())
//   );

//   console.log(
//     "After execution balance: ",
//     ethers.utils.formatEther(balanceNew)
//   );

// }
// }
