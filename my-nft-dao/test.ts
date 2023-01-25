import { keccak256 } from "ethers/lib/utils";
import { task } from "hardhat/config";

// from '../../typechain' import {MyGovernor,
//     MyGovernor__factory,
//     MyNftToken,
//     MyNftToken__factory,
//     Timelock,
//     Timelock__factory,}
import {
  Box,
  Box__factory,
  MyGovernor,
  MyGovernor__factory,
  MyNftToken,
  MyNftToken__factory,
  Timelock,
  Timelock__factory,
} from "../../typechain";
import { getExpectedContractAddress } from "../utils";

const timelockFactory: Timelock__factory = await ethers.getContractFactory("Timelock");


const timelock: Timelock = <Timelock>await timelockFactory.deploy(governorExpectedAddress, timelockDelay);
await timelock.deployed();
