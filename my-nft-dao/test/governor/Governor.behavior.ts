import {
  developmentChains,
  VOTING_DELAY,
  proposalsFile,
  FUNC,
  PROPOSAL_DESCRIPTION,
  NEW_STORE_VALUE,
} from "../../helper-hardhat-config";
import { moveBlocks } from "../../tasks/move-blocks";
import { expect, assert } from "chai";
import { ethers } from "ethers";
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

export function submitProposalPassesBecauseNfts(): void {
  it("not enough nfts to propose", async function () {
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
      "life's a piece of shit, when you look at it.",
      { gasLimit: 250000 }
    );
    if (developmentChains.includes(network.name)) {
      await moveBlocks(VOTING_DELAY + 1);
    }
    const proposalTxn = await txn.wait(1);
    const proposalId = proposalTxn.events[0].args.proposalId;
    console.log(proposalTxn.events[0].event);

    expect(proposalTxn.events[0].event).to.equal("ProposalCreated");
  });
}

// export function getInitialVotes(): void {
//   it("initial number of votes is zero", async function () {
//     let latestBlock = await hre.ethers.provider.getBlock("latest");
//     // let oldbalance = (
//     //   await this.governor.getVotes(this.signers.admin.address, latestBlock);
//     // ).toNumber();
//     // console.log(latestBlock);
//     expect(
//       await this.governor.getVotes(this.signers.admin.address, latestBlock)
//     ).to.equal(0);

//     let votes = await this.governor.getVotes(
//       this.signers.admin.address,
//       latestBlock
//     );
//     await votes.wait();
//     console.log("Waiting for voting transaction to go through");

//     await this.governor.getVotes(this.signers.admin.address, latestBlock);
//   });
// }
