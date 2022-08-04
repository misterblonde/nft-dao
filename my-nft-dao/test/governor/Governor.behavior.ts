import { expect, assert } from "chai";
import { ethers } from "ethers";

// import chai from "chai";
// import { solidity } from "ethereum-waffle";

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

    // await this.token.increaseAllowance(
    //   this.token.address,
    //   hre.ethers.utils.parseEther("0.03")
    // );// 100n ** 18n
    // await hre.helpers.setBalance(this.signers.admin.address, 40000000000000000);
    console.log(await this.provider.getBalance(this.signers.admin.address));
    //We'll mint enough NFTs to be able to pass a proposal!
    const myFirstMint = await this.token.safeMint(this.signers.admin.address, {
      value: ethers.utils.parseUnits("0.03", "ether"),
      gasLimit: 250000,
    });
    await myFirstMint.wait();

    // await this.token.safeMint(this.signers.admin.address);
    // await this.token.safeMint(this.signers.admin.address);

    console.log(this.signers.admin.getBalance());
    // await this.token.safeMint(this.signers.admin.address);

    // await this.token.safeMint(this.signers.admin.address, {
    //   gasLimit: 500000,
    // });

    expect(await this.token.balanceOf(this.signers.admin.address)).to.equal(1);

    console.log(await this.token.balanceOf(this.signers.admin.address));
    await this.token.balanceOf(this.signers.admin.address);
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

export function submitProposalFails(): void {
  it("not enough nfts to propose", async function () {
    const functionToCall = "store";
    const args = [77];
    const encodedFunctionCall = this.box.interface.encodeFunctionData(
      functionToCall,
      args
    );
    const myFirstMint = await this.token.safeMint(this.signers.admin.address, {
      gasLimit: 450000,
      //   gasPrice: gwei,
    });
    await myFirstMint.wait();
    await expect(
      this.governor.propose(
        [this.box.address],
        [0],
        [encodedFunctionCall],
        "life's a piece of shit, when you look at it.",
        { gasLimit: 250000, value: ethers.utils.parseUnits("0.03", "ether") }
      )
    ).to.be.revertedWith("Governor: proposer votes below proposal threshold");
  });
}
