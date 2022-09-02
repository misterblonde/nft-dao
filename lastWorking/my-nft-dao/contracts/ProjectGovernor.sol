// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockCompound.sol";

// import "@openzeppelin/contracts/governance/utils/Votes.sol";

// compute average 

interface IERC721 {
     function balanceOf(address account) external view returns (uint256);
}

interface IMyGovernor{
    function getProposerName(uint256 proposalId) external view returns (address);
    function getProposerBudget(uint256 proposalId) external view returns (uint256);
    function transferFunds(address payable _receiver, uint256 amount) external  payable;
}

interface IBoxLocal {
    function closeBox() external;
}

interface IProjectNftToken {
    function closeCollection() external;
}

contract ProjectGovernor is Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes, GovernorTimelockCompound {
    address public tokenAddress;
    address public myGlobalGov;
    address public owner;

    uint256 public initialBudget; 
    address public initialProposer; 

    struct ProposerCore {
        address name;
        uint256 budget;
    }
    mapping(uint256 => ProposerCore) private _proposers;
    mapping(address => uint256) private _loyalty;
    uint256[3] public hotProposals;
    uint256 public latestProposal;
    uint8 public hotPtr = 0; 

    constructor(IVotes _token, ICompoundTimelock _timelock, IMyGovernor _governor, uint256 proposalId)
        Governor("MyGovernor")
        GovernorSettings(
            1, /* 1 block voting delay*/
            26,  /* how long it is active default 9 */
            2
        )
        GovernorVotes(_token)
        GovernorTimelockCompound(_timelock)
        { 
        // check box contract members: - safety needed
        //require(msg.sender ==, "only admin members can deploy the sub-DAO governance contract") // make requirement that deploy is subdao admin by box
        tokenAddress = address(_token);
        owner =  msg.sender;
        myGlobalGov = address(_governor);
        // keep if created automatically as nft is created:
        initialBudget = IMyGovernor(_governor).getProposerBudget(proposalId);
        initialProposer = IMyGovernor(_governor).getProposerName(proposalId);
        }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        // Underscore is a function modifier and tells Solidity to
        // execute the rest of the code.
        _;
    }

    modifier superMembersOnly() {
         require(IERC721(tokenAddress).balanceOf(msg.sender) >= proposalThreshold(), "Governor: proposer votes below proposal threshold");
        _;
    }

    function withdrawETH(address recipient, uint256 amount) internal {
        (bool succeed, bytes memory data) = recipient.call{value: amount}("");
        require(succeed, "Failed to withdraw Ether");
    }

    modifier membersOnly() {
        (bool success, bytes memory balanceUser) = tokenAddress.call(abi.encode("balanceOf(address)", msg.sender));
        uint256 decoded = abi.decode(balanceUser, (uint256));
        require(decoded >= 1, "You need at least one project NFT to take part in DAO Governance");
        _;
    }

    function getProposerName(uint256 proposalId) external view returns (address){
        return _proposers[proposalId].name;
    }

    function getProposerBudget(uint256 proposalId) external view returns (uint256){
        return _proposers[proposalId].budget;
    }
    

    function quadraticVoting(uint256 proposalId) public payable {
        uint256 nVotes = _getVotes(msg.sender, proposalSnapshot(proposalId),"");
        uint256 cost = (nVotes * nVotes);
        if (cost > 1000){
            cost = 1000;
        }
        require(msg.value >= cost, "Quadratic voting: You need more ether to cover your vote weight.");
    }

    function quorum(uint256 blockNumber) public pure override returns (uint256) {
        return 3;
    }

    function votingDelay() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockCompound)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function setProposalBudget(uint256 proposalId, uint256 budget) public {
            require(msg.sender == _proposers[proposalId].name, "Governor: only the proposer can set the budget of the proposal.");
            require(state(proposalId) == ProposalState.Pending, "Governor: cannot change budget. Proposal vote already started.");
            ProposerCore storage proposer = _proposers[proposalId];
            proposer.budget = budget;
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(Governor, IGovernor) superMembersOnly returns (uint256) {
        uint256 proposalId = hashProposal(targets, values, calldatas, keccak256(bytes(description)));
        ProposerCore storage proposer = _proposers[proposalId];
        proposer.name = msg.sender;
        return super.propose(targets, values, calldatas, description);
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    function getBalance() public view returns (uint256){
        return address(this).balance;
    }

    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash) public payable superMembersOnly virtual override(Governor, IGovernor) returns(uint256) {
        uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);

        // add to hotProposals
        if (hotPtr < 2){
            hotProposals[hotPtr] = proposalId;
            hotPtr++;
        } else {
            hotProposals[hotPtr] = proposalId;
            hotPtr = 0; 
        }

        require(_proposers[proposalId].budget < (getBalance() + msg.value), "Governor: budget requested exceeds funds available.");

        address payable receiver = payable(_proposers[proposalId].name);
        //!TODO transfer funds from token contract to proposer
        receiver.send(_proposers[proposalId].budget*10**9); // budget in wei
        super.execute(targets, values, calldatas, descriptionHash);
        return proposalId; 
    }

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockCompound) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockCompound) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor() internal view override(Governor, GovernorTimelockCompound) returns (address) {
        return super._executor();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(Governor, GovernorTimelockCompound)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function isLoyal(address account) public returns(bool){
        uint threshold = 3; 
        uint voted = 0; 
         for (uint i=0; i<3; i++) {
            bool hasVoted =  hasVoted(hotProposals[i], account);
            uint hasVotedInt = hasVoted ? uint(1) : uint(0);
            voted += hasVotedInt;
         }

        if (_loyalty[account] >= threshold){
            return true;
        } 
        return false; 
    }

    function castVoteQuadratic(uint256 proposalId, uint8 support, uint256 nTokens) public virtual  payable returns (uint256) {
        uint256 nVotes = _getVotes(msg.sender, proposalSnapshot(proposalId),"");
        require(nTokens <= nVotes, "You cannot use more tokens than you own");
        uint256 quadcost = (nTokens * nTokens);
        uint256 fee;
        uint256 multiplier = 10000000000000000; // 0.01 ether == 16 euro
        if (nVotes == 1){
            fee = 0;
        } else {
            fee = (quadcost*multiplier);
        }        
        require(msg.value >= fee, "You need more ether to vote with all NFTs: cost = (nVotes)^2 * 0.01 ether");

        address voter = _msgSender();
        return  _castVoteQuadratic(proposalId, voter, support, nVotes, "", "");
    }


    // function castVoteAllIn(uint256 proposalId, uint8 support) public virtual  payable membersOnly returns (uint256) {
    //     uint256 nVotes = _getVotes(msg.sender, proposalSnapshot(proposalId),"");
    //     uint256 quadcost = (nVotes * nVotes);
    //     uint256 fee;
    //     uint256 multiplier = 10000000000000000; // 0.01 ether == 16 euro
    //     if (nVotes == 1){
    //         fee = 0;
    //     } else {
    //         fee = (quadcost*multiplier);
    //     }        
    //     require(msg.value >= fee, "You need more ether to vote with all NFTs: cost = (nVotes)^2 * 0.01 ether");

    //     _loyalty[msg.sender] += 1;
    //     address voter = _msgSender();
    //     return  _castVoteAllIn(proposalId, voter, support, "", "");
    // }

    function castVoteSimple(uint256 proposalId, uint8 support) public virtual  payable returns (uint256) {
        _loyalty[msg.sender] += 1;
        address voter = _msgSender();
        return  _castVoteSimple(proposalId, voter, support, "", "");
    }

// not sure how to authenticate locals
    function castLocalVote(uint256 proposalId, uint8 support) public virtual membersOnly returns (uint256) {
        // uint256 maxNumVoters = _getTotalSupply();
        address voter = _msgSender();
        return  _castVoteSimple(proposalId, voter, support, "", "");
    }

// override this function so either every vote counts as 1 or according to weight, if not 1 use quadratic voting fee
   function _castVoteSimple(
        uint256 proposalId,
        address account,
        uint8 support,
        string memory reason,
        bytes memory params
    ) internal virtual returns (uint256) {
        require(state(proposalId) == ProposalState.Active, "Governor: vote not currently active");

        uint256 weight = 1;
        _countVote(proposalId, account, support, weight, params);

        if (params.length == 0) {
            emit VoteCast(account, proposalId, support, weight, reason);
        } else {
            emit VoteCastWithParams(account, proposalId, support, weight, reason, params);
        }
        return weight;
    }

    // function _castVoteAllIn(
    //         uint256 proposalId,
    //         address account,
    //         uint8 support,
    //         string memory reason,
    //         bytes memory params
    //     ) internal virtual returns (uint256) {
    //     require(state(proposalId) == ProposalState.Active, "Governor: vote not currently active");
    //     uint256 weight = _getVotes(account, proposalSnapshot(proposalId), params);
    //     _countVote(proposalId, account, support, weight, params);

    //     if (params.length == 0) {
    //         emit VoteCast(account, proposalId, support, weight, reason);
    //     } else {
    //         emit VoteCastWithParams(account, proposalId, support, weight, reason, params);
    //     }
    //     return weight;
    // }

    function _castVoteQuadratic(
            uint256 proposalId,
            address account,
            uint8 support,
            uint256 nVotes,
            string memory reason,
            bytes memory params
        ) internal virtual returns (uint256) {
        require(state(proposalId) == ProposalState.Active, "Governor: vote not currently active");
        uint256 weight = nVotes; 
        _countVote(proposalId, account, support, weight, params);

        if (params.length == 0) {
            emit VoteCast(account, proposalId, support, weight, reason);
        } else {
            emit VoteCastWithParams(account, proposalId, support, weight, reason, params);
        }
        return weight;
    }

    function closeSubDAO() internal onlyOwner returns (uint256) {

        // no active proposals left 
        require((state(latestProposal) == (ProposalState.Canceled) || state(latestProposal) == ProposalState.Defeated || state(latestProposal) == ProposalState.Expired || state(latestProposal) == ProposalState.Executed), "Proj Gov: cannot close Sub DAO active proposals remain.");

        // transfer funds back to main DAO from NFT contract, from BoxLocal
        IProjectNftToken(tokenAddress).closeCollection();


        // transfer funds back to main DAO from NFT contract, from BoxLocal
        IBoxLocal(tokenAddress).closeBox();

        // send all funds from this account
        payable(myGlobalGov).transfer(address(this).balance);
    
    }


}