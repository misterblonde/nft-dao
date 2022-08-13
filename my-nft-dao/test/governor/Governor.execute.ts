import newTokenAbi from "../../artifacts/contracts/ProjectNftToken.sol/ProjectNftToken.json";
import { VOTING_PERIOD } from "../../helper-hardhat-config";
import {
  developmentChains,
  VOTING_DELAY,
  proposalsFile,
  FUNC,
  PROPOSAL_DESCRIPTION,
  NEW_STORE_VALUE,
  MIN_DELAY,
} from "../../helper-hardhat-config";
import { moveBlocks } from "../../tasks/move-blocks";
import { moveTime } from "../../tasks/move-time";
import { ProjectNftToken } from "../../typechain/contracts";
import { expect, assert } from "chai";
import { providers } from "ethers";
import { network } from "hardhat";
import { artifacts, ethers, waffle } from "hardhat";

export function transferBudgetToNewContract(): void {
  it("Proposal approved and budget sent to new token child contract", async function () {
    // const test = await loadFixture(setupInitialState);
    // mint 3 NFTS
    const myFirstMint = await this.token.safeMint(this.signers.admin.address, {
      value: ethers.utils.parseUnits("0.03", "ether"),
      gasLimit: 250000,
    });
    await myFirstMint.wait();
    const myFirstAMint = await this.token.safeMint(this.signers.admin.address, {
      value: ethers.utils.parseUnits("0.03", "ether"),
      gasLimit: 250000,
    });
    await myFirstMint.wait();
    const mySecondMint = await this.token.safeMint(this.addr1.address, {
      value: ethers.utils.parseUnits("0.03", "ether"),
      gasLimit: 250000,
    });
    await mySecondMint.wait();
    const myThirdMint = await this.token.safeMint(this.addr2.address, {
      value: ethers.utils.parseUnits("0.03", "ether"),
      gasLimit: 250000,
    });
    await myThirdMint.wait();

    const myFourthMint = await this.token.safeMint(this.addr3.address, {
      value: ethers.utils.parseUnits("0.03", "ether"),
      gasLimit: 250000,
    });
    await myFourthMint.wait();

    await this.token
      .connect(this.signers.admin)
      .delegate(this.signers.admin.address);
    await this.token.connect(this.addr1).delegate(this.addr1.address);
    await this.token.connect(this.addr2).delegate(this.addr2.address);

    // error somehow as soon as i run this bit:
    await this.token.connect(this.addr3).delegate(this.addr3.address);
    const functionToCall = "store";
    const args = [77];
    const encodedFunctionCall = this.box.interface.encodeFunctionData(
      functionToCall,
      args
    );

    console.log("Governor balance: ", await this.governor.getBalance());
    // submit proposal
    const txn = await this.governor
      .connect(this.signers.admin)
      .propose(
        [this.box.address],
        [0],
        [encodedFunctionCall],
        "test 123 new proposal",
        {
          gasLimit: 250000,
          // value: 0.002,
        }
      );

    const proposalTxn = await txn.wait(1);
    this.proposalId = proposalTxn.events[0].args.proposalId;
    const proposalIdInput = this.proposalId.toString();

    const proposalBudget = 20000000; // 0.02 ether
    await this.governor
      .connect(this.signers.admin) // 0.02 ether
      .setProposalBudget(proposalIdInput, proposalBudget, {
        gasLimit: 250000,
        // value: 0.002,
      });

    if (developmentChains.includes(network.name)) {
      await moveBlocks(VOTING_DELAY + 1);
    }

    const voteTxn = await this.governor
      .connect(this.signers.admin)
      .castVoteAllIn(proposalIdInput, 1, {
        gasLimit: 250000,
        value: ethers.utils.parseUnits("0.09", "ether"),
      });

    const voteTxn1 = await this.governor
      .connect(this.addr1)
      .castVoteAllIn(proposalIdInput, 1, {
        gasLimit: 250000,
        value: ethers.utils.parseUnits("0.09", "ether"),
      });

    const voteTxn2 = await this.governor
      .connect(this.addr2)
      .castVoteAllIn(proposalIdInput, 1, {
        gasLimit: 250000,
        value: ethers.utils.parseUnits("0.09", "ether"),
      });

    const voteTxn3 = await this.governor
      .connect(this.addr3)
      .castVoteAllIn(proposalIdInput, 1, {
        gasLimit: 250000,
        value: ethers.utils.parseUnits("0.09", "ether"),
      });

    // _______________ Election Results _______________
    const votingResults = await this.governor.proposalVotes(
      this.proposalId.toString()
    );
    console.log(votingResults);
    if (developmentChains.includes(network.name)) {
      await moveBlocks(VOTING_DELAY + 1);
    }
    console.log(
      "State (before blocks moved):",
      await this.governor.state(proposalIdInput)
    );
    await moveBlocks(this.governor.votingPeriod() + 1);
    console.log(
      "State (after voting period ended):",
      await this.governor.state(proposalIdInput)
    );
    await moveBlocks(100);
    console.log(
      "State (after voting period+1 ended):",
      await this.governor.state(proposalIdInput)
    );

    console.log(
      "State (4) == succeeded: ",
      await this.governor.state(proposalIdInput)
    );
    await moveBlocks(100);

    console.log(
      "State (4) == succeeded: ",
      await this.governor.state(proposalIdInput)
    );
    const descriptionHash = ethers.utils.id("test 123 new proposal");

    console.log("Queueing...");
    const queueTx = await this.governor.connect(this.signers.admin).queue(
      [this.box.address],
      [0],
      [encodedFunctionCall],
      descriptionHash,
      { gasLimit: 1 * 10 ** 6 }
      // { value: ethers.utils.parseUnits("0.03", "ether") }
    );
    await queueTx.wait(1);
    console.log(
      "State (before blocks moved):",
      await this.governor.state(proposalIdInput)
    );

    if (developmentChains.includes(network.name)) {
      console.log(
        "State (before blocks moved):",
        await this.governor.state(proposalIdInput)
      );
      await moveBlocks(1);
    }
    // _______________ Balance prior to execution _______________
    const balanceOld = await this.provider.getBalance(this.governor.address);
    console.log("Governor balance: ", ethers.utils.formatEther(balanceOld));

    const helperBalanceOld = await this.provider.getBalance(
      this.governorHelper.address
    );
    console.log(
      "Governor Helper balance: ",
      ethers.utils.formatEther(helperBalanceOld)
    );

    // _______________ EXECUTE PROPOSAL _______________
    if (developmentChains.includes(network.name)) {
      await moveTime(MIN_DELAY + 1);
      await moveBlocks(1);
    }
    console.log("Executing...");
    console.log("Proposal State: ", await this.governor.state(proposalIdInput));
    // // this will fail on a testnet because you need to wait for the MIN_DELAY!
    const executeTx = await this.governor
      .connect(this.signers.admin)
      .execute(
        [this.box.address],
        [0],
        [encodedFunctionCall],
        descriptionHash,
        {
          gasLimit: 3 * 10 ** 6,
          value: ethers.utils.parseUnits("0.03", "ether"),
        }
      );
    await executeTx.wait(1);

    console.log(`Box value: ${await this.box.retrieve()}`);

    // _______________ Balances after execution _______________
    console.log(
      "Governor balance: ",
      ethers.utils.formatEther(await this.governor.getBalance())
    );

    console.log(
      "Governor Helper balance: ",
      ethers.utils.formatEther(await this.governorHelper.getBalance())
    );

    const newContract = await this.governorHelper.getTokenAddress(
      proposalIdInput
    );
    console.log(newContract);
    const nftchildBalance = await this.provider.getBalance(newContract);
    console.log(
      "new contract balance is: ",
      ethers.utils.formatEther(await this.provider.getBalance(newContract))
    );
    //!!TODO try web3 wei to ether conversion without overflow
    console.log("New Project Token balance: ", nftchildBalance);
    console.log(
      "Nft child balance: ",
      ethers.utils.formatEther(nftchildBalance),
      ethers.utils.formatEther(await (proposalBudget * 10 ** 9))
      //   ethers.utils.formatEther(newContract.balance)
    );

    // const balance = parseInt(nftchildBalance);
    // console.log(Number(balance));
    // console.log(balance[1]);
    // console.log(parseInt(nftchildBalance).toString());
    await expect(ethers.utils.formatEther(nftchildBalance)).to.equal(
      ethers.utils.formatEther((await proposalBudget) * 10 ** 9)
    );
  });
}

// ____________________________________________________________________

export function userMintsProjectNft(): void {
  it("New Member mints a Project NFT", async function () {
    // const test = await loadFixture(setupInitialState);
    // mint 3 NFTS
    const myFirstMint = await this.token.safeMint(this.signers.admin.address, {
      value: ethers.utils.parseUnits("0.03", "ether"),
      gasLimit: 250000,
    });
    await myFirstMint.wait();
    const myFirstAMint = await this.token.safeMint(this.signers.admin.address, {
      value: ethers.utils.parseUnits("0.03", "ether"),
      gasLimit: 250000,
    });
    await myFirstMint.wait();
    const mySecondMint = await this.token.safeMint(this.addr1.address, {
      value: ethers.utils.parseUnits("0.03", "ether"),
      gasLimit: 250000,
    });
    await mySecondMint.wait();
    const myThirdMint = await this.token.safeMint(this.addr2.address, {
      value: ethers.utils.parseUnits("0.03", "ether"),
      gasLimit: 250000,
    });
    await myThirdMint.wait();

    const myFourthMint = await this.token.safeMint(this.addr3.address, {
      value: ethers.utils.parseUnits("0.03", "ether"),
      gasLimit: 250000,
    });
    await myFourthMint.wait();

    await this.token
      .connect(this.signers.admin)
      .delegate(this.signers.admin.address);
    await this.token.connect(this.addr1).delegate(this.addr1.address);
    await this.token.connect(this.addr2).delegate(this.addr2.address);

    // error somehow as soon as i run this bit:
    await this.token.connect(this.addr3).delegate(this.addr3.address);
    const functionToCall = "store";
    const args = [77];
    const encodedFunctionCall = this.box.interface.encodeFunctionData(
      functionToCall,
      args
    );

    console.log("Governor balance: ", await this.governor.getBalance());
    // submit proposal
    const txn = await this.governor
      .connect(this.signers.admin)
      .propose(
        [this.box.address],
        [0],
        [encodedFunctionCall],
        "test 123 new proposal",
        {
          gasLimit: 250000,
          // value: 0.002,
        }
      );

    const proposalTxn = await txn.wait(1);
    this.proposalId = proposalTxn.events[0].args.proposalId;
    const proposalIdInput = this.proposalId.toString();

    const proposalBudget = 20000000; // gwei == 0.02 ether
    // 20000000; // 0.02 ether
    await this.governor
      .connect(this.signers.admin) // 0.02 ether
      .setProposalBudget(proposalIdInput, proposalBudget, {
        gasLimit: 250000,
        // value: 0.002,
      });

    if (developmentChains.includes(network.name)) {
      await moveBlocks(VOTING_DELAY + 1);
    }

    const voteTxn = await this.governor
      .connect(this.signers.admin)
      .castVoteAllIn(proposalIdInput, 1, {
        gasLimit: 250000,
        value: ethers.utils.parseUnits("0.09", "ether"),
      });

    const voteTxn1 = await this.governor
      .connect(this.addr1)
      .castVoteAllIn(proposalIdInput, 1, {
        gasLimit: 250000,
        value: ethers.utils.parseUnits("0.09", "ether"),
      });

    const voteTxn2 = await this.governor
      .connect(this.addr2)
      .castVoteAllIn(proposalIdInput, 1, {
        gasLimit: 250000,
        value: ethers.utils.parseUnits("0.09", "ether"),
      });

    const voteTxn3 = await this.governor
      .connect(this.addr3)
      .castVoteAllIn(proposalIdInput, 1, {
        gasLimit: 250000,
        value: ethers.utils.parseUnits("0.09", "ether"),
      });

    // _______________ Election Results _______________
    const votingResults = await this.governor.proposalVotes(
      this.proposalId.toString()
    );
    console.log(votingResults);
    if (developmentChains.includes(network.name)) {
      await moveBlocks(VOTING_DELAY + 1);
    }
    console.log(
      "State (before blocks moved):",
      await this.governor.state(proposalIdInput)
    );
    await moveBlocks(this.governor.votingPeriod() + 1);
    console.log(
      "State (after voting period ended):",
      await this.governor.state(proposalIdInput)
    );
    await moveBlocks(100);
    console.log(
      "State (after voting period+1 ended):",
      await this.governor.state(proposalIdInput)
    );

    console.log(
      "State (4) == succeeded: ",
      await this.governor.state(proposalIdInput)
    );
    await moveBlocks(100);

    console.log(
      "State (4) == succeeded: ",
      await this.governor.state(proposalIdInput)
    );
    const descriptionHash = ethers.utils.id("test 123 new proposal");

    console.log("Queueing...");
    const queueTx = await this.governor.connect(this.signers.admin).queue(
      [this.box.address],
      [0],
      [encodedFunctionCall],
      descriptionHash,
      { gasLimit: 1 * 10 ** 6 }
      // { value: ethers.utils.parseUnits("0.03", "ether") }
    );
    await queueTx.wait(1);
    console.log(
      "State (before blocks moved):",
      await this.governor.state(proposalIdInput)
    );

    if (developmentChains.includes(network.name)) {
      console.log(
        "State (before blocks moved):",
        await this.governor.state(proposalIdInput)
      );
      await moveBlocks(1);
    }
    // _______________ Balance prior to execution _______________
    const balanceOld = await this.provider.getBalance(this.governor.address);
    console.log("Governor balance: ", ethers.utils.formatEther(balanceOld));

    const helperBalanceOld = await this.provider.getBalance(
      this.governorHelper.address
    );
    console.log(
      "Governor Helper balance: ",
      ethers.utils.formatEther(helperBalanceOld)
    );

    // _______________ EXECUTE PROPOSAL _______________
    if (developmentChains.includes(network.name)) {
      await moveTime(MIN_DELAY + 1);
      await moveBlocks(1);
    }
    console.log("Executing...");
    console.log("Proposal State: ", await this.governor.state(proposalIdInput));
    // // this will fail on a testnet because you need to wait for the MIN_DELAY!
    const executeTx = await this.governor
      .connect(this.signers.admin)
      .execute(
        [this.box.address],
        [0],
        [encodedFunctionCall],
        descriptionHash,
        {
          gasLimit: 3 * 10 ** 6,
          value: ethers.utils.parseUnits("0.03", "ether"),
        }
      );
    await executeTx.wait(1);

    console.log(`Box value: ${await this.box.retrieve()}`);

    // _______________ Balances after execution _______________
    console.log(
      "Governor balance: ",
      ethers.utils.formatEther(await this.governor.getBalance())
    );

    console.log(
      "Governor Helper balance: ",
      ethers.utils.formatEther(await this.governorHelper.getBalance())
    );

    const newContract = await this.governorHelper.getTokenAddress(
      proposalIdInput
    );
    console.log(newContract);
    const nftchildBalance = await this.provider.getBalance(newContract);

    console.log(nftchildBalance.toString());
    console.log(
      "Nft child balance: ",
      parseInt(nftchildBalance),
      ethers.utils.formatEther(await proposalBudget)
      //   ethers.utils.formatEther(newContract.balance)
    );

    const newTokenContract = new ethers.Contract(
      newContract,
      newTokenAbi.abi,
      this.provider
    );

    const oldBalance = (
      await newTokenContract.balanceOf(this.signers.admin.address)
    ).toNumber();

    console.log(
      "User new Nft balance: ",
      (await newTokenContract.balanceOf(this.signers.admin.address)).toNumber()
    );

    const myFirstProjMint = await newTokenContract
      .connect(this.signers.admin)
      .safeMint(this.signers.admin.address, {
        value: ethers.utils.parseUnits("0.03", "ether"),
        gasLimit: 250000,
      });
    console.log(
      "User new Nft balance: ",
      (await newTokenContract.balanceOf(this.signers.admin.address)).toNumber()
    );

    const newBalance = (
      await newTokenContract.balanceOf(this.signers.admin.address)
    ).toNumber();

    // const balance = parseInt(nftchildBalance);
    // console.log(Number(balance));
    // console.log(balance[1]);
    // console.log(parseInt(nftchildBalance).toString());
    // await expect(oldBalance).to.equal(0);
    await expect(newBalance).to.equal(1);
  });
}
