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
    console.log(this.proposalID);

    console.log("Proposal Transaction Result: ", proposalTxn);
    this.proposalId = proposalTxn.events[0].args.proposalId;
    console.log("Proposal ID: ", this.proposalId);
    console.log(proposalTxn.events[0].event);

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
    //   .call({ from: this.signers.admin.address });

    if (developmentChains.includes(network.name)) {
      await moveBlocks(VOTING_DELAY + 1);
    }
    const proposalTxn = await txn.wait(1);
    console.log(this.proposalID);

    console.log("Proposal Transaction Result: ", proposalTxn);
    this.proposalId = proposalTxn.events[0].args.proposalId;
    console.log("Proposal ID: ", this.proposalId);
    console.log(proposalTxn.events[0].event);

    const proposalState = await this.governor.state(this.proposalId);
    console.log("Proposal State: ", proposalState);
    // store proposals ID in file?
    let proposals = JSON.parse(fs.readFileSync(proposalsFile, "utf8"));
    proposals[network.config.chainId!.toString()].push(
      this.proposalId.toString()
    );
    fs.writeFileSync(proposalsFile, JSON.stringify(proposals));

    // const test = this.proposalId.toString();
    const voteTxn = await this.governor.castVoteSimple(
      this.proposalId.toString(),
      1,
      {
        gasLimit: 250000,
      }
    );
    voteTxn.wait(1);
    console.log("vote Txn: ", voteTxn);
    // expect(voteTxn.events[0].event).to.equal("VoteCast");
    // save the proposalId
  });
}

export function successfullyCastVote(): void {
  it("proposal creator casts vote", async function () {
    submitProposalPassesBecauseDelegatedNfts();
    const proposals = JSON.parse(fs.readFileSync(proposalsFile, "utf8"));
    // You could swap this out for the ID you want to use too
    const proposalId = proposals[network.config.chainId!][0];

    const test = proposalId.toString();
    const txn = await this.governor.castVote(test, 1, {
      gasLimit: 250000,
    });
    const voteTxn = txn.wait(12);
    console.log(voteTxn.events);
    expect(voteTxn.events[0].event).to.equal("CastVote");

    const txn2 = await this.governor
      .connect(this.addr1)
      .this.governor.castVoteSimple(test, 1, {
        gasLimit: 250000,
      });
    //! signer twice the same?
    const voteTxn2 = txn2.wait(12);
    expect(voteTxn2.events[0].event).to.equal("CastVote");
  });
}
