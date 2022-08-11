// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockCompound.sol";
// import "@openzeppelin/contracts/utils/math/SafeMath.sol";
// import "@openzeppelin/contracts/utils/Strings.sol";
// import { MyNftToken } from "./MyNftToken.sol";
// import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
// import { ProjectGovernor } from "./ProjectGovernor.sol";
// import { ProjectNftToken } from "./ProjectNftToken.sol";
// import { MyGovernorHelper } from "./MyGovernorHelper.sol";

interface IERC721 {
     function balanceOf(address account) external view returns (uint256);
}

interface IMyGovernorHelper {
    function newProject(uint256 proposalId, ICompoundTimelock _timelock) external payable returns(address newContract);
}

contract MyGovernor is Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes, GovernorTimelockCompound {

    address public tokenAddress;
    ICompoundTimelock public timelockAddress; 
    address public owner;
    address helper;

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
        // tokenContract = MyNftToken(address(_token));
        tokenAddress = address(_token);
        helper = address(_helper);
        timelockAddress = _timelock; 
        owner = msg.sender;
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
        bytes32 descriptionHash) public payable superMembersOnly virtual override(Governor, IGovernor) returns(uint256) {
        uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);
        withdrawETH(_proposers[proposalId].name, _proposers[proposalId].budget*10**9);

        // MyGovernorHelper helper = MyGovernorHelper(address(this));
        address hello = IMyGovernorHelper(helper).newProject(proposalId, timelockAddress);
        
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
        return proposalId; 
    }

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockCompound) {
        // address self = address(this);
        // uint256 balance = self.balance;
        // require(_proposers[proposalId].budget < getBalance(), "The amount of budget requested by the proposal is lower than the funds inside the contract.");
        // uint256 someEtherInWei = 10000000000000000; 
        // withdrawETH(_proposers[proposalId].name, someEtherInWei);
        // withdrawETH(_proposers[proposalId].name,_proposers[proposalId].budget);

        // deploy a new contract
        // newProject(proposalId);
        // execute(targets, values, calldatas,descriptionHash);
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

    function transferFunds(address payable _receiver, uint256 amount) external payable {
        require((msg.sender == owner) || (msg.sender == helper), "Not owner");
    _receiver.transfer(amount);
    }
    
    function castVote(uint256 proposalId, uint8 support) public virtual override(IGovernor, Governor) membersOnly returns (uint256) {
        // require that token holder can only vote:
        address voter = _msgSender();
        return  super._castVote(proposalId, voter, support, "", "");
    }

    function castVoteAllIn(uint256 proposalId, uint8 support) public virtual  payable membersOnly returns (uint256) {
        // require that token holder can only vote:
        uint256 nVotes = _getVotes(msg.sender, proposalSnapshot(proposalId),"");
        uint256 quadcost = (nVotes * nVotes);
        uint256 fee;
        uint256 multiplier = 10000000000000000; // 0.01 ether == 16 euro
        if (nVotes == 1){
            fee = 0;
        } else {
            fee = (quadcost*multiplier);
        }
        // string calldata mystring = Strings.toString(fee);
        // string memory errorMessage = string.concat("Quadratic voting: You need ", Strings.toString(fee));
        // string memory myMsg = string.concat(errorMessage, " wei to cover your vote weight.");
        
        require(msg.value >= fee, "You need more ether to vote with all NFTs. (cost = (nVotes)^2 * 0.01 ether)");

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
