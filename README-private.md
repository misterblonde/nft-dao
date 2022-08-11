
TO DO:
- what happens to cancelled/failed projects -> delete from struct and proposers
  from struct
- someone needs to be able to set the token URI on the contract before creation
  or change it afterwards? - make sure minting only starts after that


literature search into DAOs regarding
- infrastructure crowdfunding (see anandha recommendations)
- into how funds are handled upon approval -> not like kickstarter: anyone just
  runs away with it.  


challenges DAO development
- challenges: overflow and underflow with ether/gwei/wei values in solidity
- not being able to use floats
- security of functionality, make some functions protected by making them owner
  only
- "Trying to deploy a contract whose code is too large" maximum file size limit reached -> could not deploy to the ethereum blockchain. This was
  reached when I tried to have a subgovernor contract called by the Governor
upon positive result of a proposal.


General DAO -> Project-based DAO Governance

- having a governor which generates child DAOs is too complex, the code size
  maximum limit would be reached. Hence instead I needed to create a governor
helper contract, which is only called when a successful proposal is executed. It
has two main tasks: 
- deploy the new child-project-based NFT contract
- transfer the budget approved by the proposal vote to the new NFT contract. 
- ideally I wanted this helper to also deploy a new governor contract, but this
  was again beyond the file size limit. Thus, I focused on deploying the NFT
contract so that the funds can be securely transferred without any
intermediaries. 
- At this point the governor would be deployed later on and linked to the NFT
  contract -> new project-based DAO. 
- Now at proposal Submission I could have it that the proposer can provide the
  number of NFTs to be created, the minting fee, and the relevant ipfs storage
links.  


SOLIDITY/HARDHAT TS LEARNING: 
- maximum code size limit: 24 kB or 3,000 lines of code per contract
- fallback functions needed for some contracts
- gas price and msg.value (minting fee etc.) all needs to be set correctly on
  the localhost as if on a testnet.
- integer can only be used, no ether float values to describe costs and gas fees
- all the tests in the hardhat test suite are independet of each other, start
  from scratch and only run Before or BeforeEach functionality beforehand. If
more is requested as an initial setup, so-called fixtures are needed to start
from the same status quo for a subset of the tests. The fixtures however do not
work together with the before() beforeAll() ??



- Possible solution: 
	- only dao owner/committee can deploy new child dao contract in which it can
	  decide the rules of the new budget and the nfts, even swap out the nft
contract with another one if needed -> dynamic nfts etc. 


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

// WEBSITE

LEARNING
- even read only functions need await due to their delay and even though they do
  not count as transactions. 
- transaction tracking from etherscan API
- 

// PART I _____________________________________________
// yarn hardhat test 

- runs tests inside test/unit/*.ts file
- currently 2 tests both passing


// local testing PART II ______________________________

// yarn hardhat node (only can be one node per computer)

// yarn hardhat run scripts/propose.ts --network localhost

- works up to the point of proposals.json, which is empty/not found
