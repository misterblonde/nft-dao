import { VOTING_PERIOD } from "../../helper-hardhat-config";
import {
  developmentChains,
  VOTING_DELAY,
  proposalsFile,
  FUNC,
  PROPOSAL_DESCRIPTION,
  NEW_STORE_VALUE,
} from "../../helper-hardhat-config";
import { moveBlocks } from "../../tasks/move-blocks";
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

export function voteFailsBecauseAlreadyVoted(): void {
  it("Vote Should Fail Because Already Voted", async function () {
    // const test = await loadFixture(setupInitialState);

    // mint 3 NFTS
    const myFirstMint = await this.token
      .connect(this.addr2)
      .safeMint(this.addr2.address, {
        value: ethers.utils.parseUnits("0.03", "ether"),
        gasLimit: 250000,
      });
    await myFirstMint.wait();
    const mySecondMint = await this.token
      .connect(this.addr2)
      .safeMint(this.addr2.address, {
        value: ethers.utils.parseUnits("0.03", "ether"),
        gasLimit: 250000,
      });
    await mySecondMint.wait();
    const myThirdMint = await this.token
      .connect(this.addr2)
      .safeMint(this.addr2.address, {
        value: ethers.utils.parseUnits("0.03", "ether"),
        gasLimit: 250000,
      });
    await myThirdMint.wait();
    console.log("NFTs owned: ", await this.token.balanceOf(this.addr2.address));

    const blockNum = await this.provider.getBlockNumber("latest");
    //delegate votes
    await this.token.connect(this.addr2).delegate(this.addr2.address);
    const functionToCall = "store";
    const args = [77];
    const encodedFunctionCall = this.box.interface.encodeFunctionData(
      functionToCall,
      args
    );

    // submit proposal
    const txn = await this.governor
      .connect(this.addr2)
      .propose([this.box.address], [0], [encodedFunctionCall], "test", {
        gasLimit: 250000,
      });

    if (developmentChains.includes(network.name)) {
      await moveBlocks(VOTING_DELAY + 1);
    }
    const proposalTxn = await txn.wait(1);

    this.proposalId = proposalTxn.events[0].args.proposalId;

    const proposalState = await this.governor.state(this.proposalId);
    let proposals = JSON.parse(fs.readFileSync(proposalsFile, "utf8"));
    proposals[network.config.chainId!.toString()].push(
      this.proposalId.toString()
    );
    fs.writeFileSync(proposalsFile, JSON.stringify(proposals));

    // cast one vote on proposal
    const proposalIdInput = this.proposalId.toString();

    console.log(
      "Has it voted? ",
      await this.governor.hasVoted(proposalIdInput, this.addr2.address)
    );

    const voteTxn = await this.governor
      .connect(this.addr2)
      .castVoteSimple(proposalIdInput, 1, {
        gasLimit: 250000,
        value: ethers.utils.parseUnits("0.02", "ether"),
        //   signer: this.addr2.address,
      });

    console.log("First vote done.");
    console.log(
      "Has it voted? ",
      await this.governor.hasVoted(proposalIdInput, this.addr2.address)
    );

    expect(
      this.governor.connect(this.addr2).castVoteSimple(proposalIdInput, 1, {
        gasLimit: 250000,
        // value: ethers.utils.parseUnits("0.02", "ether"),
      })
    ).to.be.revertedWith("GovernorVotingSimple: vote already cast");
  });
}

// ________ ALL IN VOTES TESTK _____________________________________________
export function canOnlyVoteIfHeDelegatedTokenBeforeVoteStarted(): void {
  it("Vote With All Your Votes", async function () {
    // mint 3 NFTS
    const myFirstMint = await this.token.safeMint(this.signers.admin.address, {
      value: ethers.utils.parseUnits("0.03", "ether"),
      gasLimit: 250000,
    });
    await myFirstMint.wait();
    const mySecondMint = await this.token.safeMint(this.signers.admin.address, {
      value: ethers.utils.parseUnits("0.03", "ether"),
      gasLimit: 250000,
    });
    await mySecondMint.wait();
    const myThirdMint = await this.token.safeMint(this.signers.admin.address, {
      value: ethers.utils.parseUnits("0.03", "ether"),
      gasLimit: 250000,
    });
    await myThirdMint.wait();
    console.log(
      "NFTs owned: ",
      await this.token.balanceOf(this.signers.admin.address)
    );

    const blockNum = await this.provider.getBlockNumber("latest");
    //delegate votes
    await this.token
      .connect(this.signers.admin)
      .delegate(this.signers.admin.address);
    const functionToCall = "store";
    const args = [77];
    const encodedFunctionCall = this.box.interface.encodeFunctionData(
      functionToCall,
      args
    );

    // another user mints a token
    const someoneElseMints = await this.token.safeMint(this.addr1.address, {
      value: ethers.utils.parseUnits("0.03", "ether"),
      gasLimit: 250000,
    });

    // submit proposal
    const txn = await this.governor.propose(
      [this.box.address],
      [0],
      [encodedFunctionCall],
      "test 123 new proposal",
      {
        gasLimit: 250000,
      }
    );

    if (developmentChains.includes(network.name)) {
      await moveBlocks(VOTING_DELAY + 1);
    }
    const proposalTxn = await txn.wait(1);
    this.proposalId = proposalTxn.events[0].args.proposalId;
    const proposalIdInput = this.proposalId.toString();

    // other user delegates tokens to itself
    this.token.connect(this.addr1).delegate(this.addr1.address);
    // addr1 has no votes, because when proposal was created addr1 had not minted anything yet, nor delegated the token to itself.
    let blocknumber = await this.governor.proposalSnapshot(proposalIdInput);

    console.log(
      "addr1 has this many votes: ",
      await this.governor.getVotes(this.addr1.address, blocknumber)
    );

    console.log(
      "Has it voted? ",
      await this.governor.hasVoted(proposalIdInput, this.addr1.address)
    );

    const voteTxn = await this.governor
      .connect(this.addr1)
      .castVoteAllIn(proposalIdInput, 1, {
        gasLimit: 250000,
      });

    console.log(
      "Has it voted? ",
      await this.governor.hasVoted(proposalIdInput, this.addr1.address)
    );

    const voted = await voteTxn.wait(1);
    // no one should have voted by now because addr1 vote doesn't count
    const votingResults = await this.governor.proposalVotes(
      this.proposalId.toString()
    );
    await expect(votingResults.forVotes.toNumber()).to.equal(0);
  });
}

export function votingWithAllNftsWorks(): void {
  it("Vote With All Your Votes", async function () {
    // mint 3 NFTS
    // mint 3 NFTS
    const myFirstMint = await this.token.safeMint(this.signers.admin.address, {
      value: ethers.utils.parseUnits("0.03", "ether"),
      gasLimit: 250000,
    });
    await myFirstMint.wait();
    const mySecondMint = await this.token.safeMint(this.signers.admin.address, {
      value: ethers.utils.parseUnits("0.03", "ether"),
      gasLimit: 250000,
    });
    await mySecondMint.wait();
    const myThirdMint = await this.token.safeMint(this.signers.admin.address, {
      value: ethers.utils.parseUnits("0.03", "ether"),
      gasLimit: 250000,
    });
    await myThirdMint.wait();
    console.log(
      "NFTs owned: ",
      await this.token.balanceOf(this.signers.admin.address)
    );

    // const blockNum = await this.provider.getBlockNumber("latest");
    //delegate votes
    await this.token
      .connect(this.signers.admin)
      .delegate(this.signers.admin.address);
    const functionToCall = "store";
    const args = [77];
    const encodedFunctionCall = this.box.interface.encodeFunctionData(
      functionToCall,
      args
    );

    // submit proposal
    const txn = await this.governor.propose(
      [this.box.address],
      [0],
      [encodedFunctionCall],
      "test 123 new proposal",
      {
        gasLimit: 250000,
        // value: 0.002,
      }
    );

    if (developmentChains.includes(network.name)) {
      await moveBlocks(VOTING_DELAY + 1);
    }
    const proposalTxn = await txn.wait(1);

    this.proposalId = proposalTxn.events[0].args.proposalId;
    const proposalIdInput = this.proposalId.toString();

    const voteTxn = await this.governor
      .connect(this.signers.admin)
      .castVoteAllIn(proposalIdInput, 1, {
        gasLimit: 250000,
        value: ethers.utils.parseUnits("0.09", "ether"),
      });

    const votingResults = await this.governor.proposalVotes(
      this.proposalId.toString()
    );
    console.log(votingResults);
    await expect(votingResults.forVotes.toNumber()).to.equal(3);
  });
}
