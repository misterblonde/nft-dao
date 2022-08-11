

challenges DAO development
- challenges: overflow and underflow with ether/gwei/wei values in solidity
- not being able to use floats
- security of functionality, make some functions protected by making them owner
  only
- "Trying to deploy a contract whose code is too large" maximum file size limit reached -> could not deploy to the ethereum blockchain. This was
  reached when I tried to have a subgovernor contract called by the Governor
upon positive result of a proposal.
-  


hardhat localhost challenges
- adding the signer wallets and giving them enough ether to pay for all the
  minting
- minting fee + gas fee prediction



// bug fixed via TDD: 

- all IN voting did not add to the total vote count, whilst the vote simple
  voting did add to the total count
- fixed that anyone needs to be a token holder to be allowed to vote,
  openzeppelin is that anyone can vote. 
- added quadratic voting limit to voteAllIn functionality


- TEST:  Vote Should Fail Because Already Voted
	- catches error if VoteSimple is used twice by the same address. 
	- need to also catch it if it uses: VoteSimple- VoteAllIn
			VoteAllIn - VoteAllIn, and VoteAllIn - VoteSimple

- TEST: VOTE ALL IN (not working yet)
//! vote is cast without pre-delegation BUG

// _____________________ To Do ________________________

- test the voting options are working fine; 
	- all in vote quadratic ?
	- weight 1 vote (working fine)
- make funds transferred to winner/automatic
- glitter dynamic NFT mode - interactions with dao measure social score
- delegation testing - how long does it last for?
- sybil attack prevention (LATER)



// PART I _____________________________________________
// yarn hardhat test 

- runs tests inside test/unit/*.ts file
- currently 2 tests both passing


// local testing PART II ______________________________

// yarn hardhat node (only can be one node per computer)

// yarn hardhat run scripts/propose.ts --network localhost

- works up to the point of proposals.json, which is empty/not found
