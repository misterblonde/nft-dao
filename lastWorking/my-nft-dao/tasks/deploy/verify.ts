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
  MyGovernorHelper,
  MyGovernorHelper__factory,
  MyNftToken,
  MyNftToken__factory,
  Timelock,
  Timelock__factory,
} from "../../typechain";
import { getExpectedContractAddress } from "../utils";

task("verify:Dao").setAction(async function (_, { ethers, run }) {
  const timelockDelay = 2;
  const token.address = '0x03c6845f936416A1065b25d9ce0e879cc35d255f'; 
  const governor.address = '0x60943C176d9Ae9dC209F7117B46Bb5E4f6FEb242';
  const box.address = '0xf87097f251996175e12A3345944Df81aC2B6f0a9';
  const timelock.address = '0xccBC3344E2E4fe871E581e37b3dbC7aCa26d02Fc';
  const governorHelper.address = '0x60943C176d9Ae9dC209F7117B46Bb5E4f6FEb242'; 


  function delay(milliseconds: number) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  console.log("Starting, will sleep for 5 secs now");
  delay(5000).then(() => console.log("Normal code execution continues now"));
  //   require(, 'Need to wait 5 minutes');
  await run("verify:verify", {
    address: token.address,
  });

  await run("verify:verify", {
    address: timelock.address,
    constructorArguments: [governor.address, timelockDelay],
  });

  await run("verify:verify", {
    address: governor.address,
    constructorArguments: [token.address, timelock.address],
  });

  await run("verify:verify", {
    address: box.address,
    constructorArguments: [],
  });
});
