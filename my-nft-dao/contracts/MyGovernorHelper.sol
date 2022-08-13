// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/governance/extensions/GovernorTimelockCompound.sol";
import { ProjectGovernor } from "./ProjectGovernor.sol";
import "./ProjectNftToken.sol";

interface IMyGovernor{
    function getProposerName(uint256 proposalId) external view returns (address);
    function getProposerBudget(uint256 proposalId) external view returns (uint256);
    function transferFunds(address payable _receiver, uint256 amount) external  payable;
}


contract MyGovernorHelper {
    address public myGovernor;
    event Log(uint256 gas);

    mapping(uint256 => ProjectNftToken) public _children;

    constructor(address myGovernorX) public payable {
        myGovernor = myGovernorX;
    }

    function newProject(uint256 proposalId, ICompoundTimelock _timelock, bool fundsToContract) external payable returns(address newContract){
            require(msg.sender == myGovernor, "Gov Helper: Only Governor can set up sub DAOs.");
            // require(msg.value >= 5000000000000000, "not enough ether supplied to fulfill transaction" );
           
            // require( msg.value == 5000000000000000) ideally set minimum value required?

            // /.send(msg.value/2);
            // create child nft contract and store address
            _children[proposalId] = new ProjectNftToken();

            // ProjectNftToken newProj =  _children[proposalId];

            // proposer becomes admin person on new nft contract
            _children[proposalId].setAdminMember(IMyGovernor(myGovernor).getProposerName(proposalId)); 

            // ProjectGovernor projectGov = new ProjectGovernor(_children[proposalId], _timelock, proposalId, IMyGovernor(myGovernor).getProposerName(proposalId), IMyGovernor(myGovernor).getProposerBudget(proposalId));

            // transfer budget to child contract
            address payable receiver = payable(address(_children[proposalId])); // cast goes her
            if (fundsToContract){
                IMyGovernor(myGovernor).transferFunds(receiver, IMyGovernor(myGovernor).getProposerBudget(proposalId)*10**9);
            } else {
                // transferring money to proposer:
                address payable receiver = payable(IMyGovernor(myGovernor).getProposerName(proposalId)); 
                IMyGovernor(myGovernor).transferFunds(receiver, IMyGovernor(myGovernor).getProposerBudget(proposalId*10**9));
            }
         
        // keep record of all offspring and who created it
        // ProposerCore storage proposer = _proposers[proposalId];
        // proposer.name = msg.sender;
        // proposer.budget = values[0];
        return address(_children[proposalId]);
    }

    function getBalance() public view returns (uint256){
        return address(this).balance;
    }
    
    function getTokenAddress(uint256 proposalId) public view returns(address) {
        return address(_children[proposalId]);
    }

    function setProposerTokenSpecial(uint256 proposalId) public {
        require(msg.sender == IMyGovernor(myGovernor).getProposerName(proposalId), "Only initial proposer can request special token sub DAO rights.");
        _children[proposalId].setInitialProposer(msg.sender);
    }


    // Fallback function must be declared as external.
    fallback() external payable {
        emit Log(gasleft());
    }

}