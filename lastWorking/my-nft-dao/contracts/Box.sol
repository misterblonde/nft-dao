// contracts/Box.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Box is Ownable {
    address public governor;
    address public governorHelper;

    uint256 private value;

    mapping(address => bool) public adminMembers;

    // Emitted when the stored value changes
    event ValueChanged(uint256 newValue);

    constructor(address myGovernor, address myGovernorHelper){
        governor = myGovernor;
        governorHelper = myGovernorHelper;
    }

    modifier daoOnly() {
         require((msg.sender == governor) || (msg.sender == governorHelper), "Only DAO can update.");
        _;
    }
    // Stores a new value in the contract
    function store(uint256 newValue) public daoOnly onlyOwner {
        value = newValue;
        emit ValueChanged(newValue);
    }

  // Reads the last stored value
    function retrieve() public view returns (uint256) {
        return value;
    }

    function isAdmin(address account) public view returns (bool) {
        return adminMembers[account];
    }
//daoOnly onlyOwner
    function setAdmin(address account) public {
        adminMembers[account] = true;
    }


//daoOnly onlyOwner
    function removeAdmin(address account) public  {
        adminMembers[account] = false;
    }
}



//   function newProject(uint256 proposalId) internal returns(address newContract){
//         ProjectNftToken newTokenContract = new ProjectNftToken(); 
//         ProjectGovernor p = new ProjectGovernor(newTokenContract, timelockAddress, proposalId, _proposers[proposalId].name, _proposers[proposalId].budget);
//         // transfer budget to other contract
//         address payable receiver = payable(address(p)); // cast goes her
//         transferFunds(receiver, _proposers[proposalId].budget);
//         // keep record of all offspring and who created it
//         // ProposerCore storage proposer = _proposers[proposalId];
//         // proposer.name = msg.sender;
//         // proposer.budget = values[0];

//         // ProposerCore memory proposer = ProposerCore(msg.value, block.timestamp);
//         // balanceReceived[msg.sender].payments[balanceReceived[msg.sender].numPayments] = payment;
//         // balanceReceived[msg.sender].numPayments++;


//         // ProposerCore storage project = _projects[proposalId];
//         // project.projectAddress = address(p);
//         // project.creator = msg.sender;
//         return address(p);
//     }

