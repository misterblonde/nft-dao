import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";

  import { getExpectedContractAddress } from "../../tasks/utils";

import type { Timelock } from "../../src/types/contracts/Timelock";

import type { MyNftToken } from "../../src/types/contracts/MyNftToken";
import type { MyGovernor } from "../../src/types/contracts/MyGovernor";
import { Signers } from "../types";
import { getInitialNftBalance } from "./Governor.behavior";

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
  });

  describe("Governor", function () {
    beforeEach(async function () {
      const greeting: string = "Hello, world!";
      console.log(greeting)
      const governorArtifact: Artifact = await artifacts.readArtifact("MyGovernor");
      const timelockArtifact: Artifact = await artifacts.readArtifact("Timelock");

      const tokenArtifact: Artifact = await artifacts.readArtifact("MyNftToken");
      this.token = <MyNftToken>await waffle.deployContract(this.signers.admin, tokenArtifact);
      console.log("nft deployed")
      const governorExpectedAddress = await getExpectedContractAddress(this.signers.admin);
      this.timelock = <Timelock>await waffle.deployContract(this.signers.admin, timelockArtifact,[governorExpectedAddress, 2]);
 
      this.governor = <MyGovernor>await waffle.deployContract(this.signers.admin, governorArtifact,[this.token.address, this.timelock.address]);
    });

    getInitialNftBalance();

  });
});
