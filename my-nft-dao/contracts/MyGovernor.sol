// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockCompound.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import { MyNftToken } from "./MyNftToken.sol";
import { ProjectGovernor } from "./ProjectGovernor.sol";
import { ProjectNftToken } from "./ProjectNftToken.sol";

interface IERC20 {
    function transfer(address _to, uint256 _amount) external returns (bool);
}

contract MyGovernor is Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes, GovernorTimelockCompound {

    MyNftToken public tokenContract;
    ICompoundTimelock timelockAddress; 
    address public owner;

    struct ProposerCore {
        address name;
        uint256 budget;
    }

    struct ProjectCore {
        address projectAddress;
        address creator; 
    }

    mapping(uint256 => ProjectCore) private _projects;
    mapping(uint256 => ProposerCore) private _proposers;

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
    timelockAddress = _timelock; 
    owner = msg.sender;
     }


    // function withdrawMoney() private payable {
    //     address payable to = payable(msg.sender);
    //     to.transfer(getBalance());
    // }

    function withdrawETH(address recipient, uint256 amount) internal {
        (bool succeed, bytes memory data) = recipient.call{value: amount}("");
        require(succeed, "Failed to withdraw Ether");
    }

    //  function withdrawToken(address _tokenContract, uint256 _amount) external {
    //     IERC20 tokenContract = IERC20(_tokenContract);
        
    //     // transfer the token from address of this contract
    //     // to address of the user (executing the withdrawToken() function)
    //     this.transfer(msg.sender, _amount);
    // }

    modifier membersOnly() {
         require(tokenContract.balanceOf(msg.sender) >= proposalThreshold(), "You don't own enough Genesis NFTs to propose.");
        _;
    }

    // modifier onlyTimelock() {
    //      require(msg.sender == address(timelockAddress), "Only Timelock is permitted to execute this.");
    //     _;
    // }

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

        uint256 proposalId = hashProposal(targets, values, calldatas, keccak256(bytes(description)));
        ProposerCore storage proposer = _proposers[proposalId];
        proposer.name = msg.sender;
        // proposer.budget = values[0];
        return super.propose(targets, values, calldatas, description);
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    function getBalance() public view returns (uint256){

        return address(this).balance;
    }

    //!TOdO currently hard-coded amount, needs to be input parameter, budget stored inside contract
    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash) public payable membersOnly virtual override(Governor, IGovernor) returns(uint256) {
        uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);
        uint256 someEtherInWei = 10000000000000000; // 0.01 ether
        withdrawETH(_proposers[proposalId].name,someEtherInWei);
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
        uint256 someEtherInWei = 10000000000000000; 
        withdrawETH(_proposers[proposalId].name, someEtherInWei);
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

    function transferFunds(address payable _receiver, uint256 amount) public payable onlyOwner {
    _receiver.transfer(amount);
    }
    
    // function newProject(uint256 proposalId) internal returns(address newContract){

    //     ProjectNftToken newTokenContract = new ProjectNftToken(); 
    //     ProjectGovernor p = new ProjectGovernor(newTokenContract, timelockAddress, proposalId, _proposers[proposalId].name, _proposers[proposalId].budget);
    //     // transfer budget to other contract
    //     address payable receiver = payable(address(p)); // cast goes her
    //     transferFunds(receiver, _proposers[proposalId].budget);
    //     // keep record of all offspring and who created it
    //     // ProposerCore storage proposer = _proposers[proposalId];
    //     // proposer.name = msg.sender;
    //     // proposer.budget = values[0];

    //     // ProposerCore memory proposer = ProposerCore(msg.value, block.timestamp);
    //     // balanceReceived[msg.sender].payments[balanceReceived[msg.sender].numPayments] = payment;
    //     // balanceReceived[msg.sender].numPayments++;


    //     // ProposerCore storage project = _projects[proposalId];
    //     // project.projectAddress = address(p);
    //     // project.creator = msg.sender;
    //     return address(p);
    // }

    function castVote(uint256 proposalId, uint8 support) public virtual override(IGovernor, Governor) returns (uint256) {
        // require that token holder can only vote:
        require(tokenContract.balanceOf(msg.sender) >= 1, "You must be a token holder to vote.");


        // quadraticVoting(proposalId);
        address voter = _msgSender();
        return  super._castVote(proposalId, voter, support, "", "");
    }

    function castVoteAllIn(uint256 proposalId, uint8 support) public virtual  payable returns (uint256) {
        // require that token holder can only vote:
        require(tokenContract.balanceOf(msg.sender) >= 1, "You must be a token holder to vote.");

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
        
        require(msg.value >= fee, "You need to supply more ether to vote with all your tokens. Cost is (nVotes)^2 * 0.01 ether");

        address voter = _msgSender();
        return  _castVoteAllIn(proposalId, voter, support, "", "");
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


    function _castVoteAllIn(
            uint256 proposalId,
            address account,
            uint8 support,
            string memory reason,
            bytes memory params
        ) internal virtual returns (uint256) {

        // ProposalCore storage proposal = _proposals[proposalId];
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
