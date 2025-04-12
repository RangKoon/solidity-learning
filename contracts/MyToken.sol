// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MyToken {
    string public name;
    string public symbol;
    uint8 public decimals; // 1 ETH --> 1*10^18 wei,  1 wei --> 1*10^-18

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    constructor(string memory _name, string memory _symbol, uint8 _decimal) {
        name = _name;
        symbol = _symbol;
        decimals = _decimal;
        _mint(1 * 10 ** uint(decimals), msg.sender); // 1 MT
    }

    function mint(uint256 amount) internal {
        totalSupply += amount;
    }

    function _mint(uint256 amount, address owner) internal {
        totalSupply += amount;
        balanceOf[owner] += amount;
    }

    // function totalSupply() external view returns (uint256) {
    //     return totlaSupply;
    // }

    // function balanceOf(address owner) external view returns (uint256) {
    //     return balanceOf(owner);
    // }

    // function name() external view returns (string memory) {
    //     return name;
    // }
}
