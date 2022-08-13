// contracts/Box.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/access/Ownable.sol";

contract BoxLocal is Ownable {
    address public governor;
    address public governorHelper;

    uint256 private value;

    mapping(address => bool) public adminMembers;

    event Log(uint256 gas);

    // Emitted when the stored value changes
    event ValueChanged(uint256 newValue);

    constructor(address myGovernor, address myGovernorHelper) public payable {
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


    // Fallback function must be external.
    fallback() external payable {
        emit Log(gasleft());
    }
}


