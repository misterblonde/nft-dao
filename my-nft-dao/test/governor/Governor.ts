import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import { getExpectedContractAddress } from "../../tasks/utils";
import { moveBlocks } from "../../tasks/move-blocks";
import { network } from "hardhat";
import * as fs from "fs";
import type { Timelock } from "../../typechain/contracts/Timelock";
import type { MyGovernor } from "../../typechain/contracts/MyGovernor";
import type { MyNftToken} from "../../typechain/contracts/MyNftToken";
import type { Box } from "../../typechain/contracts/Box";
import {
    developmentChains,
    VOTING_DELAY,
    proposalsFile,
    FUNC,
    PROPOSAL_DESCRIPTION,
    NEW_STORE_VALUE,
  } from "../../helper-hardhat-config"

// before it was this path;
// import type { Timelock } from "../../src/types/contracts/Timelock";
// import type { MyNftToken } from "../../src/types/contracts/MyNftToken";
// import type { MyGovernor } from "../../src/types/contracts/MyGovernor";

import { Signers } from "../types";
import { getInitialNftBalance, mintNft, submitProposalFailsBecauseNoNFTs, submitProposalPassesBecauseDelegatedNfts, voteFailsBecauseNonTokenHolder, voteOnSubmittedProposal } from "./Governor.behavior";
import { canOnlyVoteIfHeDelegatedTokenBeforeVoteStarted, voteFailsBecauseAlreadyVoted, votingWithAllNftsWorks } from "./Governor.voting";
import { NetworkUserConfig } from "hardhat/types";
const hre = require("hardhat");

describe("Unit tests", function () {

  before(async function () {


    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];

    this.addr1 = signers[1];
    this.addr2 = signers[2];
    const hre = require("hardhat");

    // const wallet =  wallet.connect(ethers.provider);
    // send ETH to the new wallet so it can perform a tx
    // await this.signers.addr.sendTransaction({to: wallet.address, value: ethers.utils.parseEther("1")});

    await hre.network.provider.send("hardhat_setBalance", [
        this.signers.admin.address,
        "0xFFFFFFFFFFFFEEEEEEEEEEEE", //"0x537B950", //AA87BEE538000", // 4096 wei
      ]);

    // await hre.network.provider.request({ method: 'hardhat_setBalance', params: [this.signers.admin.address, ethers.utils.parseEther('10.0').toHexString()] })
  });

  async function setupInitialState(this: any): Promise<void> {
            this.signers = {} as Signers;
    
            const signers: SignerWithAddress[] = await ethers.getSigners();
            this.signers.admin = signers[0];
        
            this.addr1 = signers[1];
            const hre = require("hardhat");
        
            await hre.network.provider.send("hardhat_setBalance", [
                this.signers.admin.address,
                "0xFFFFFFFFFFFFEEEEEEEEEEEE", //"0x537B950", //AA87BEE538000", // 4096 wei
              ]);
            const governorArtifact: Artifact = await artifacts.readArtifact("MyGovernor");
            const timelockArtifact: Artifact = await artifacts.readArtifact("Timelock");
      
            const tokenArtifact: Artifact = await artifacts.readArtifact("MyNftToken");
            this.token = <MyNftToken>await waffle.deployContract(this.signers.admin, tokenArtifact);
         
            const governorExpectedAddress = await getExpectedContractAddress(this.signers.admin);
            this.timelock = <Timelock>await waffle.deployContract(this.signers.admin, timelockArtifact,[governorExpectedAddress, 2]);
       
            this.governor = <MyGovernor>await waffle.deployContract(this.signers.admin, governorArtifact,[this.token.address, this.timelock.address]);
      
            const boxArtifact: Artifact = await artifacts.readArtifact("Box");
            this.box = <Box>await waffle.deployContract(this.signers.admin, boxArtifact);
            await this.token.deployed();
            await hre.network.provider.request({ method: 'hardhat_setBalance', params: [this.signers.admin.address, ethers.utils.parseEther('10').toHexString()] });
      
          this.provider = ethers.provider; 
          let lance = ethers.BigNumber.from("1000000000000000000");
          const newBalance = ethers.utils.parseUnits("1000000000000000000000000", 'ether')
      
      // this is necessary because hex quantities with leading zeros are not valid at the JSON-RPC layer
          const newBalanceHex = newBalance.toHexString().replace("0x0", "0x");
      
          const balance = await this.provider.getBalance(this.signers.admin.address);
          await this.provider.send("hardhat_setBalance", [
              this.signers.admin.address,
            "0xFFFFFFFFFFFFFFFFFFEEEEEEEEEEEEA0F", ]);
          console.log("Balance is: ", await this.provider.getBalance(this.signers.admin.address));
            // mint 3 NFTS
            const myFirstMint = await this.token.safeMint(
              this.signers.admin.address,
              {
                value: ethers.utils.parseUnits("0.03", "ether"),
                gasLimit: 250000,
              }
            );
            await myFirstMint.wait();
            const mySecondMint = await this.token.safeMint(
              this.signers.admin.address,
              {
                value: ethers.utils.parseUnits("0.03", "ether"),
                gasLimit: 250000,
              }
            );
            await mySecondMint.wait();
            const myThirdMint = await this.token.safeMint(
              this.signers.admin.address,
              {
                value: ethers.utils.parseUnits("0.03", "ether"),
                gasLimit: 250000,
              }
            );
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
            let proposals = JSON.parse(fs.readFileSync(proposalsFile, "utf8"));
            proposals[network.config.chainId!.toString()].push(
              this.proposalId.toString()
            );
            fs.writeFileSync(proposalsFile, JSON.stringify(proposals));
          };
    

  describe("Governor", function () {
    beforeEach(async function () {
      const governorArtifact: Artifact = await artifacts.readArtifact("MyGovernor");
      const timelockArtifact: Artifact = await artifacts.readArtifact("Timelock");

      const tokenArtifact: Artifact = await artifacts.readArtifact("MyNftToken");
      this.token = <MyNftToken>await waffle.deployContract(this.signers.admin, tokenArtifact);
   
      const governorExpectedAddress = await getExpectedContractAddress(this.signers.admin);
      this.timelock = <Timelock>await waffle.deployContract(this.signers.admin, timelockArtifact,[governorExpectedAddress, 2]);
 
      this.governor = <MyGovernor>await waffle.deployContract(this.signers.admin, governorArtifact,[this.token.address, this.timelock.address]);

      const boxArtifact: Artifact = await artifacts.readArtifact("Box");
      this.box = <Box>await waffle.deployContract(this.signers.admin, boxArtifact);
      await this.token.deployed();
      await hre.network.provider.request({ method: 'hardhat_setBalance', params: [this.signers.admin.address, ethers.utils.parseEther('10').toHexString()] });

    this.provider = ethers.provider; 
    let lance = ethers.BigNumber.from("1000000000000000000");
    const newBalance = ethers.utils.parseUnits("1000000000000000000000000", 'ether')

// this is necessary because hex quantities with leading zeros are not valid at the JSON-RPC layer
    const newBalanceHex = newBalance.toHexString().replace("0x0", "0x");

    const balance = await this.provider.getBalance(this.signers.admin.address);
    await this.provider.send("hardhat_setBalance", [
        this.signers.admin.address,
      "0xFFFFFFFFFFFFFFFFFFEEEEEEEEEEEEA0F", ]);
    console.log("Balance is: ", await this.provider.getBalance(this.signers.admin.address));

    });

    async function setupInitialState(this: any){
//         this.signers = {} as Signers;

//         const signers: SignerWithAddress[] = await ethers.getSigners();
//         this.signers.admin = signers[0];
    
//         this.addr1 = signers[1];
//         const hre = require("hardhat");
    
//         await hre.network.provider.send("hardhat_setBalance", [
//             this.signers.admin.address,
//             "0xFFFFFFFFFFFFEEEEEEEEEEEE", //"0x537B950", //AA87BEE538000", // 4096 wei
//           ]);
//         const governorArtifact: Artifact = await artifacts.readArtifact("MyGovernor");
//         const timelockArtifact: Artifact = await artifacts.readArtifact("Timelock");
  
//         const tokenArtifact: Artifact = await artifacts.readArtifact("MyNftToken");
//         this.token = <MyNftToken>await waffle.deployContract(this.signers.admin, tokenArtifact);
     
//         const governorExpectedAddress = await getExpectedContractAddress(this.signers.admin);
//         this.timelock = <Timelock>await waffle.deployContract(this.signers.admin, timelockArtifact,[governorExpectedAddress, 2]);
   
//         this.governor = <MyGovernor>await waffle.deployContract(this.signers.admin, governorArtifact,[this.token.address, this.timelock.address]);
  
//         const boxArtifact: Artifact = await artifacts.readArtifact("Box");
//         this.box = <Box>await waffle.deployContract(this.signers.admin, boxArtifact);
//         await this.token.deployed();
//         await hre.network.provider.request({ method: 'hardhat_setBalance', params: [this.signers.admin.address, ethers.utils.parseEther('10').toHexString()] });
  
//       this.provider = ethers.provider; 
//       let lance = ethers.BigNumber.from("1000000000000000000");
//       const newBalance = ethers.utils.parseUnits("1000000000000000000000000", 'ether')
  
//   // this is necessary because hex quantities with leading zeros are not valid at the JSON-RPC layer
//       const newBalanceHex = newBalance.toHexString().replace("0x0", "0x");
  
//       const balance = await this.provider.getBalance(this.signers.admin.address);
//       await this.provider.send("hardhat_setBalance", [
//           this.signers.admin.address,
//         "0xFFFFFFFFFFFFFFFFFFEEEEEEEEEEEEA0F", ]);
//       console.log("Balance is: ", await this.provider.getBalance(this.signers.admin.address));
        // mint 3 NFTS
        const myFirstMint = await this.token.safeMint(
          this.signers.admin.address,
          {
            value: ethers.utils.parseUnits("0.03", "ether"),
            gasLimit: 250000,
          }
        );
        await myFirstMint.wait();
        const mySecondMint = await this.token.safeMint(
          this.signers.admin.address,
          {
            value: ethers.utils.parseUnits("0.03", "ether"),
            gasLimit: 250000,
          }
        );
        await mySecondMint.wait();
        const myThirdMint = await this.token.safeMint(
          this.signers.admin.address,
          {
            value: ethers.utils.parseUnits("0.03", "ether"),
            gasLimit: 250000,
          }
        );
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
        let proposals = JSON.parse(fs.readFileSync(proposalsFile, "utf8"));
        proposals[network.config.chainId!.toString()].push(
          this.proposalId.toString()
        );
        fs.writeFileSync(proposalsFile, JSON.stringify(proposals));
      };


    getInitialNftBalance();

    // mint
    mintNft();

    // propose
    submitProposalFailsBecauseNoNFTs();

    submitProposalPassesBecauseDelegatedNfts();

    // vote
    voteOnSubmittedProposal(); // single vote weight=1
     
    voteFailsBecauseNonTokenHolder();

    voteFailsBecauseAlreadyVoted();

    canOnlyVoteIfHeDelegatedTokenBeforeVoteStarted();

    votingWithAllNftsWorks();
    // analyse results


    // queue/execute
  });
});
