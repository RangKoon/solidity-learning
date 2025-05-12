// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

abstract contract ManagedAccess {
    address public owner;
    address public manager;

    constructor(address _owner, address _manager) {
        owner = _owner;
        manager = _manager;
    }

    modifier onlyOwner() virtual {
        require(msg.sender == owner, "You are not authorized");
        _;
    }

    modifier onlyManager() virtual {
        require(
            msg.sender == manager,
            "You are not authorized to manage this contract"
        );
        _;
    }
}
