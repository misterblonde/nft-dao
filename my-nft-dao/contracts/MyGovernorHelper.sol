// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockCompound.sol";
// import { MyNftToken } from "./MyNftToken.sol";
// import { MyGovernor } from "./MyGovernor.sol";
import { ProjectGovernor } from "./ProjectGovernor.sol";
import { ProjectNftToken } from "./ProjectNftToken.sol";


interface IMyGovernor{
    function getProposerName(uint256 proposalId) external view returns (address);
    function getProposerBudget(uint256 proposalId) external view returns (uint256);
    function transferFunds(address payable _receiver, uint256 amount) external  payable;
    // function withdrawETH(address recipient, uint256 amount) internal;
}


contract MyGovernorHelper {
//contract MyGovernor is Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes, GovernorTimelockCompound {
    address myGovernor;

    constructor(address myGovernor){
        myGovernor = myGovernor;
    }

    
    function newProject(uint256 proposalId, ICompoundTimelock _timelock) public payable returns(address newContract){
        // require()
        ProjectNftToken newTokenContract = new ProjectNftToken(); 

        ProjectGovernor projectGov = new ProjectGovernor(newTokenContract, _timelock, proposalId, IMyGovernor(myGovernor).getProposerName(proposalId), IMyGovernor(myGovernor).getProposerBudget(proposalId));

        // transfer budget to other contract
        address payable receiver = payable(address(projectGov)); // cast goes her
        IMyGovernor(myGovernor).transferFunds(receiver, IMyGovernor(myGovernor).getProposerBudget(proposalId));

        newTokenContract.transferOwnership(address(_timelock));
   
    // keep record of all offspring and who created it
    // ProposerCore storage proposer = _proposers[proposalId];
    // proposer.name = msg.sender;
    // proposer.budget = values[0];

    // ProposerCore memory proposer = ProposerCore(msg.value, block.timestamp);
    // balanceReceived[msg.sender].payments[balanceReceived[msg.sender].numPayments] = payment;
    // balanceReceived[msg.sender].numPayments++;


    // ProposerCore storage project = _projects[proposalId];
    // project.projectAddress = address(p);
    // project.creator = msg.sender;
    return address(projectGov);
}

    // function withdrawETH(address recipient, uint256 amount) internal {
    //     (bool succeed, bytes memory data) = recipient.call{value: amount}("");
    //     require(succeed, "Failed to withdraw Ether");
    // }

}