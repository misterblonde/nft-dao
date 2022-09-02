import {
  developmentChains,
  VOTING_DELAY,
  proposalsFile,
  FUNC,
  PROPOSAL_DESCRIPTION,
  NEW_STORE_VALUE,
} from "../../helper-hardhat-config";
import { VOTING_PERIOD } from "../../helper-hardhat-config";
import { moveBlocks } from "../../tasks/move-blocks";
import { expect, assert } from "chai";
import { ethers } from "ethers";
import * as fs from "fs";
import { network } from "hardhat";

const { solidity } = require("ethereum-waffle");
const chai = require("chai");
chai.use(solidity);
const hre = require("hardhat");

export function getInitialNftBalance(): void {
  it("initially no NFTs have been minted", async function () {
    expect(
      (await this.token.balanceOf(this.signers.admin.address)).toNumber()
    ).to.equal(0);

    console.log(
      (await this.token.balanceOf(this.signers.admin.address)).toNumber()
    );
    (await this.token.balanceOf(this.signers.admin.address)).toNumber();
  });
}

export function mintNft(): void {
  it("mint first nft", async function () {
    let oldbalance = await this.token.balanceOf(this.signers.admin.address);

    console.log(await this.provider.getBalance(this.signers.admin.address));
    //We'll mint enough NFTs to be able to pass a proposal!
    const myFirstMint = await this.token.safeMint(this.signers.admin.address, {
      value: ethers.utils.parseUnits("0.03", "ether"),
      gasLimit: 250000,
    });
    await myFirstMint.wait();

    console.log(this.signers.admin.getBalance());
    expect(await this.token.balanceOf(this.signers.admin.address)).to.equal(1);

    console.log(await this.token.balanceOf(this.signers.admin.address));
    await this.token.balanceOf(this.signers.admin.address);
  });
}

export function submitProposalFailsBecauseNoNFTs(): void {
  it("not enough nfts to propose", async function () {
    const functionToCall = "store";
    const args = [77];
    const encodedFunctionCall = this.box.interface.encodeFunctionData(
      functionToCall,
      args
    );

    await expect(
      this.governor.propose(
        [this.box.address],
        [0],
        [encodedFunctionCall],
        "life's a piece of shit, when you look at it.",
        { gasLimit: 250000 }
      )
    ).to.be.revertedWith("Governor: proposer votes below proposal threshold");
  });
}

export function submitProposalPassesBecauseDelegatedNfts(): void {
  it("enough nfts to propose", async function () {
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
    console.log("Block number: ", blockNum);
    // there are two get votes: (1 arg inside token, 2 args inside gov)
    console.log(
      "Votes Delegated to Gov: ",
      await this.token.getVotes(this.signers.admin.address) //, blockNum)
    );
    //delegate votes
    await this.token.delegate(this.signers.admin.address);
    const functionToCall = "store";
    const args = [77];
    const encodedFunctionCall = this.box.interface.encodeFunctionData(
      functionToCall,
      args
    );
    const txn = await this.governor.propose(
      [this.box.address],
      [0],
      [encodedFunctionCall],
      "test",
      {
        gasLimit: 250000,
      }
    );

    if (developmentChains.includes(network.name)) {
      await moveBlocks(VOTING_DELAY + 1);
    }
    const proposalTxn = await txn.wait(1);

    this.proposalId = proposalTxn.events[0].args.proposalId;

    const proposalState = await this.governor.state(this.proposalId);
    console.log("Proposal State: ", proposalState);
    // store proposals ID in file?
    let proposals = JSON.parse(fs.readFileSync(proposalsFile, "utf8"));
    proposals[network.config.chainId!.toString()].push(
      this.proposalId.toString()
    );
    fs.writeFileSync(proposalsFile, JSON.stringify(proposals));

    expect(proposalTxn.events[0].event).to.equal("ProposalCreated");
    // save the proposalId
  });
}

export function voteOnSubmittedProposal(): void {
  it("vote cast (simple and all) on proposal", async function () {
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
    await this.token.delegate(this.signers.admin.address);
    const functionToCall = "store";
    const args = [77];
    const encodedFunctionCall = this.box.interface.encodeFunctionData(
      functionToCall,
      args
    );
    const txn = await this.governor.propose(
      [this.box.address],
      [0],
      [encodedFunctionCall],
      "test",
      {
        gasLimit: 250000,
      }
    );

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
    const voteTxn = await this.governor.castVoteSimple(
      this.proposalId.toString(),
      1,
      {
        gasLimit: 250000,
      }
    );
    const voted = await voteTxn.wait(1);

    console.log(
      "Proposal snapshot: ",
      await this.governor.proposalSnapshot(this.proposalId)
    );
    const votingResults = await this.governor.proposalVotes(
      this.proposalId.toString()
    );
    console.log("PROPOSAL RESULTS: ", votingResults);
    expect(voted.events[0].event).to.equal("VoteCast");
  });
}

export function voteFailsBecauseNonTokenHolder(): void {
  it("A non-token holder tries to vote", async function () {
    const proposals = JSON.parse(fs.readFileSync(proposalsFile, "utf8"));
    const proposalId = proposals[network.config.chainId!][0];

    const proposalIdInput = proposalId.toString();

    await expect(
      this.governor.connect(this.addr1).castVoteSimple(proposalIdInput, 1, {
        gasLimit: 250000,
      })
    ).to.be.revertedWith("You must be a token holder to vote.");
  });
}
