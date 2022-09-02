// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockCompound.sol";

// interface IBox {
//     function setAdmin(address account) public daoOnly onlyOwner; 
//     function removeAdmin(address account) public daoOnly onlyOwner;
//         modifier daoOnly() {
//          require((msg.sender == governor) || (msg.sender == governorHelper), "Only DAO can update.");
//         _;
//     }
// }

interface IERC721 {
     function balanceOf(address account) external view returns (uint256);
}

interface IMyGovernorHelper {
    function newProject(uint256 proposalId, bool fundsToContract) external payable returns(address newContract);
    function getChildAddress(uint256 proposalId) external view returns(address);
    function transferBoxOwnership(address boxAddress, address newTimelock) external;
}

contract MyGovernor is Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes, GovernorTimelockCompound {

    address public tokenAddress;
    ICompoundTimelock public timelockAddress; 
    address public owner;
    address public helper;

    struct ProposerCore {
        address name;
        uint256 budget;
    }

    struct ProjectCore {
        address projectAddress;
        address creator; 
    }

    mapping(uint256 => ProjectCore) internal _projects;
    mapping(uint256 => ProposerCore) internal _proposers;

    constructor(IVotes _token, ICompoundTimelock _timelock, IMyGovernorHelper _helper)
        Governor("MyGovernor")
        GovernorSettings(
            1, /* 1 block voting delay*/
            20,  /* how long it is active default 9 */
            2
        )
        GovernorVotes(_token)
        GovernorTimelockCompound(_timelock)
    { 
        tokenAddress = address(_token);
        helper = address(_helper);
        timelockAddress = _timelock; 
        owner = msg.sender;
     }

    modifier membersOnly() {
         require(IERC721(tokenAddress).balanceOf(msg.sender) >= 1, "You must be a token holder to vote.");
        _;
    }

    modifier superMembersOnly() {
         require(IERC721(tokenAddress).balanceOf(msg.sender) >= proposalThreshold(), "Governor: proposer votes below proposal threshold");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        // Underscore is a special character only used inside
        // a function modifier and it tells Solidity to
        // execute the rest of the code.
        _;
    }

    function transferBoxOwnership(address whichBox, address newOwner) public superMembersOnly{
        IMyGovernorHelper(helper).transferBoxOwnership(whichBox, newOwner);
    }

    function withdrawETH(address recipient, uint256 amount) internal {
        (bool succeed, bytes memory data) = recipient.call{value: amount}("");
        require(succeed, "Failed to withdraw Ether");
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

    function quorum(uint256 blockNumber) public pure override returns (uint256){
        return 3;
    }

    // The following functions are overrides required by Solidity.
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

    function submitProposal(address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description, 
        uint256 budgetGwei) public superMembersOnly {

            propose(targets, values, calldatas, description);

            uint256 proposalId = hashProposal(targets, values, calldatas, keccak256(bytes(description)));

            setProposalBudget(proposalId, budgetGwei);
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

        // amount withdrawn as budget is converted from Gwei to Wei.
    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash) public payable virtual override(Governor, IGovernor) returns(uint256) {
        uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);
        require(_proposers[proposalId].budget < (getBalance() + msg.value), "Governor: budget requested exceeds funds available.");

        // address payable mysubcontract = payable(address(helper));
        // mysubcontract.send(msg.value/4);

        address childNft = IMyGovernorHelper(helper).newProject(proposalId, true);
        
        super.execute(targets, values, calldatas, descriptionHash);

        return proposalId; 
    }


    function getChildBoxAddress(uint256 proposalId) public view returns (address){
        return IMyGovernorHelper(helper).getChildAddress(proposalId);
        // return address(IMyGovernorHelper(helper)._children[proposalId]);
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

    function cancel(                                                            
        address[] memory targets,                                               
        uint256[] memory values,                                                
        bytes[] memory calldatas,                                               
        bytes32 descriptionHash                                                 
    ) public returns (uint256) {                                                
        return super._cancel(targets, values, calldatas, descriptionHash);      
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

    function transferFunds(address payable _receiver, uint256 amount) external payable {
        require((msg.sender == owner) || (msg.sender == helper), "Not owner");
    _receiver.transfer(amount);
    }
    
    // function castVote(uint256 proposalId, uint8 support) public virtual override(IGovernor, Governor) membersOnly returns (uint256) {
    //     address voter = _msgSender();
    //     return  super._castVote(proposalId, voter, support, "", "");
    // }

    function castVoteQuadratic(uint256 proposalId, uint8 support, uint256 nTokens) public virtual  payable membersOnly returns (uint256) {
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
        return  _castVoteAllIn(proposalId, voter, support, "", "");
    }


    function castVoteAllIn(uint256 proposalId, uint8 support) public virtual  payable membersOnly returns (uint256) {
        uint256 nVotes = _getVotes(msg.sender, proposalSnapshot(proposalId),"");
        uint256 quadcost = (nVotes * nVotes);
        uint256 fee;
        uint256 multiplier = 10000000000000000; // 0.01 ether == 16 euro
        if (nVotes == 1){
            fee = 0;
        } else {
            fee = (quadcost*multiplier);
        }        
        require(msg.value >= fee, "You need more ether to vote with all NFTs: cost = (nVotes)^2 * 0.01 ether");

        address voter = _msgSender();
        return  _castVoteAllIn(proposalId, voter, support, "", "");
    }

    function castVoteSimple(uint256 proposalId, uint8 support) public virtual  payable membersOnly returns (uint256) {
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

    function _castVoteAllIn(
            uint256 proposalId,
            address account,
            uint8 support,
            string memory reason,
            bytes memory params
        ) internal virtual returns (uint256) {
        require(state(proposalId) == ProposalState.Active, "Governor: vote not currently active");
        uint256 weight = _getVotes(account, proposalSnapshot(proposalId), params);
        _countVote(proposalId, account, support, weight, params);

        if (params.length == 0) {
            emit VoteCast(account, proposalId, support, weight, reason);
        } else {
            emit VoteCastWithParams(account, proposalId, support, weight, reason, params);
        }
        return weight;
    }
 
}