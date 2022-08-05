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
// import { ethers } from "ethers";
import * as fs from "fs";
import { network } from "hardhat";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";

const { solidity } = require("ethereum-waffle");
const chai = require("chai");
chai.use(solidity);
const hre = require("hardhat");

// async function setupInitialState() {
//           this.signers = {} as Signers;

//           const signers: SignerWithAddress[] = await ethers.getSigners();
//           this.signers.admin = signers[0];

//           this.addr1 = signers[1];
//           const hre = require("hardhat");

//           await hre.network.provider.send("hardhat_setBalance", [
//               this.signers.admin.address,
//               "0xFFFFFFFFFFFFEEEEEEEEEEEE", //"0x537B950", //AA87BEE538000", // 4096 wei
//             ]);
//           const governorArtifact: Artifact = await artifacts.readArtifact("MyGovernor");
//           const timelockArtifact: Artifact = await artifacts.readArtifact("Timelock");

//           const tokenArtifact: Artifact = await artifacts.readArtifact("MyNftToken");
//           this.token = <MyNftToken>await waffle.deployContract(this.signers.admin, tokenArtifact);

//           const governorExpectedAddress = await getExpectedContractAddress(this.signers.admin);
//           this.timelock = <Timelock>await waffle.deployContract(this.signers.admin, timelockArtifact,[governorExpectedAddress, 2]);

//           this.governor = <MyGovernor>await waffle.deployContract(this.signers.admin, governorArtifact,[this.token.address, this.timelock.address]);

//           const boxArtifact: Artifact = await artifacts.readArtifact("Box");
//           this.box = <Box>await waffle.deployContract(this.signers.admin, boxArtifact);
//           await this.token.deployed();
//           await hre.network.provider.request({ method: 'hardhat_setBalance', params: [this.signers.admin.address, ethers.utils.parseEther('10').toHexString()] });

//         this.provider = ethers.provider;
//         let lance = ethers.BigNumber.from("1000000000000000000");
//         const newBalance = ethers.utils.parseUnits("1000000000000000000000000", 'ether')

//     // this is necessary because hex quantities with leading zeros are not valid at the JSON-RPC layer
//         const newBalanceHex = newBalance.toHexString().replace("0x0", "0x");

//         const balance = await this.provider.getBalance(this.signers.admin.address);
//         await this.provider.send("hardhat_setBalance", [
//             this.signers.admin.address,
//           "0xFFFFFFFFFFFFFFFFFFEEEEEEEEEEEEA0F", ]);
//         console.log("Balance is: ", await this.provider.getBalance(this.signers.admin.address));
//   // mint 3 NFTS
//   const myFirstMint = await this.token.safeMint(this.signers.admin.address, {
//     value: ethers.utils.parseUnits("0.03", "ether"),
//     gasLimit: 250000,
//   });
//   await myFirstMint.wait();
//   const mySecondMint = await this.token.safeMint(this.signers.admin.address, {
//     value: ethers.utils.parseUnits("0.03", "ether"),
//     gasLimit: 250000,
//   });
//   await mySecondMint.wait();
//   const myThirdMint = await this.token.safeMint(this.signers.admin.address, {
//     value: ethers.utils.parseUnits("0.03", "ether"),
//     gasLimit: 250000,
//   });
//   await myThirdMint.wait();
//   console.log(
//     "NFTs owned: ",
//     await this.token.balanceOf(this.signers.admin.address)
//   );

//   const blockNum = await this.provider.getBlockNumber("latest");
//   //delegate votes
//   await this.token.delegate(this.signers.admin.address);
//   const functionToCall = "store";
//   const args = [77];
//   const encodedFunctionCall = this.box.interface.encodeFunctionData(
//     functionToCall,
//     args
//   );

//   // submit proposal
//   const txn = await this.governor.propose(
//     [this.box.address],
//     [0],
//     [encodedFunctionCall],
//     "test",
//     {
//       gasLimit: 250000,
//     }
//   );

//   if (developmentChains.includes(network.name)) {
//     await moveBlocks(VOTING_DELAY + 1);
//   }
//   const proposalTxn = await txn.wait(1);

//   this.proposalId = proposalTxn.events[0].args.proposalId;

//   const proposalState = await this.governor.state(this.proposalId);
//   let proposals = JSON.parse(fs.readFileSync(proposalsFile, "utf8"));
//   proposals[network.config.chainId!.toString()].push(
//     this.proposalId.toString()
//   );
//   fs.writeFileSync(proposalsFile, JSON.stringify(proposals));
// }
//

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
    // const voted = await voteTxn.wait(1);
    // const voteTxn2 = await this.governor.castVoteSimple(proposalIdInput, 1, {
    //     gasLimit: 250000,
    //   });
    //   const voted2 = await voteTxn2.wait(1);
    console.log("First vote done.");
    console.log(
      "Has it voted? ",
      await this.governor.hasVoted(proposalIdInput, this.addr2.address)
    );
    // const votingResults = await this.governor.proposalVotes(proposalIdInput);
    // console.log("Proposal Votes: ", votingResults);

    expect(
      this.governor.connect(this.addr2).castVoteSimple(proposalIdInput, 1, {
        gasLimit: 250000,
        // value: ethers.utils.parseUnits("0.02", "ether"),
      })
    ).to.be.revertedWith("GovernorVotingSimple: vote already cast");
  });
}

export function voteWithAllVotes(): void {
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

    // submit proposal
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

    //_______________________________________________________
    // const proposals = JSON.parse(fs.readFileSync(proposalsFile, "utf8"));
    // const proposalId = proposals[network.config.chainId!][0];

    const proposalIdInput = this.proposalId.toString();

    // mint 3 NFTS
    const someoneElseMints = await this.token.safeMint(this.addr1.address, {
      value: ethers.utils.parseUnits("0.03", "ether"),
      gasLimit: 250000,
    });

    this.token.connect(this.addr1).delegate(this.addr1.address);

    //! vote is cast without pre-delegation BUG
    // const voteTxn = await this.governor
    //   .connect(this.addr1)
    //   .castVoteAllIn(proposalIdInput, 1, {
    //     gasLimit: 250000,
    //   });

    // const voteTxn = await this.governor
    //   .connect(this.addr1)
    //   .castVoteAllIn(proposalIdInput, 1, {
    //     gasLimit: 250000,
    //   });
    // if (developmentChains.includes(network.name)) {
    //   await moveBlocks(VOTING_DELAY + 1);
    // }
    // const voted2 = await voteTxn.wait(1);
    // console.log("Addr1 voted: ", voted2);

    // const votingResults = await this.governor.proposalVotes(proposalIdInput);
    // console.log("Proposal Votes: ", votingResults);
    // await expect(txn).to.equal(4); // number of votes weight = 4?
  });
}
