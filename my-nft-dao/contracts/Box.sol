// contracts/Box.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Box is Ownable {
  uint256 private value;

  // Emitted when the stored value changes
  event ValueChanged(uint256 newValue);

  // Stores a new value in the contract
  function store(uint256 newValue) public onlyOwner {
    value = newValue;
    emit ValueChanged(newValue);
  }

  // Reads the last stored value
  function retrieve() public view returns (uint256) {
    return value;
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
}
