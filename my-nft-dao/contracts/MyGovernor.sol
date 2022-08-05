// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockCompound.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { MyNftToken } from "./MyNftToken.sol";

contract MyGovernor is Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes, GovernorTimelockCompound {

    MyNftToken public tokenContract;
    address public owner;


    constructor(IVotes _token, ICompoundTimelock _timelock)
        Governor("MyGovernor")
        GovernorSettings(
            1, /* 1 block voting delay*/
            20,  /* how long it is active default 9 */
            2
        )
        GovernorVotes(_token)
        GovernorTimelockCompound(_timelock)
    {tokenContract = MyNftToken(address(_token));
    owner = msg.sender;
     }

    modifier membersOnly() {
         require(tokenContract.balanceOf(msg.sender) >= proposalThreshold(), "You don't own enough Genesis NFTs to propose.");
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
        // ProposalCore storage proposal = _proposals[proposalId];
        uint256 nVotes = _getVotes(msg.sender, proposalSnapshot(proposalId),"");
        uint256 cost = (nVotes * nVotes);
        if (cost > 1000){
            cost = 1000;
        }
        require(msg.value >= cost, "Quadratic voting: You need more ether to cover your vote weight.");
        // return cost;
    }

    // function _countVote(
    //     uint256 proposalId,
    //     address account,
    //     uint8 support,
    //     uint256 weight,
    //     bytes memory // params
    // ) internal override(Governor, GovernorCountingSimple) {
    //     return super._countVote(proposalId, account, support, weight, "");
    // }

    function quorum(uint256 blockNumber) public pure override returns (uint256) {
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

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(Governor, IGovernor) returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
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

    

    function castVote(uint256 proposalId, uint8 support) public virtual override(IGovernor, Governor) returns (uint256) {
        // require that token holder can only vote:
        require(tokenContract.balanceOf(msg.sender) >= 1, "You must be a token holder to vote.");


        // quadraticVoting(proposalId);
        address voter = _msgSender();
        uint256 weight = _getVotes(msg.sender, proposalSnapshot(proposalId),"");
        _countVote(proposalId, voter, support, weight, "");
        return  super._castVote(proposalId, voter, support, "", "");
    }

    function castVoteAllIn(uint256 proposalId, uint8 support) public payable virtual returns (uint256) {
         // ProposalCore storage proposal = _proposals[proposalId];
        uint256 nVotes = _getVotes(msg.sender, proposalSnapshot(proposalId),"");
        uint256 cost = (nVotes * nVotes);
        if (cost > 1000){
            cost = 1000;
        }
        require(msg.value >= cost, "Quadratic voting: You need more ether to cover your vote weight.");

        return castVote(proposalId, support);
    }

    function castVoteSimple(uint256 proposalId, uint8 support) public virtual  payable returns (uint256) {
        // require that token holder can only vote:
        require(tokenContract.balanceOf(msg.sender) >= 1, "You must be a token holder to vote.");
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
 

 
}
