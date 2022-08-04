import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import { getExpectedContractAddress } from "../../tasks/utils";

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
import { getInitialNftBalance, mintNft, submitProposalFailsBecauseNoNFTs, submitProposalPassesBecauseNfts } from "./Governor.behavior";
import { NetworkUserConfig } from "hardhat/types";
const hre = require("hardhat");

describe("Unit tests", function () {
  before(async function () {


    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];

    this.addr1 = signers[1];
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

  describe("Governor", function () {
    beforeEach(async function () {
      const greeting: string = "Hello, world!";
      console.log(greeting)
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

//     const newBalance = ethers.utils.parseEther("1000000000000000000");
//     const newBalanceHex = newBalance.toHexString().replace("0x0", "0x");
//     console.log(newBalanceHex)

    // let topup = await hre.network.provider.send("hardhat_setBalance", [
    // this.signers.admin.address,
    // newBalanceHex,
    // ]);
    // let balance = await hre.network.provider.getBalance(this.signers.admin.address);
    // console.log(balance.toString()); // 0
    //   console.log(this.signers.admin);

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

    getInitialNftBalance();

    mintNft();

    submitProposalFailsBecauseNoNFTs();

    submitProposalPassesBecauseNfts();
  });
});
