// staking
// deposit(MyToken) / withdraw(MyToken)

// MyToken : token balance management
// - the balance of TinyBank address
// TinyBank : deposit / withdraw vault 예금 출금
// -users token management
// -user --> deposit --> TinyBank --> transfer(user --> TinyBank)

// Reward
// - reward token : MyToken
// - reward resources : 1 MT/block minting
// - reward strategy : staked[user]/totalStaked distribution

// - signer0 block 0 staking
// - signer1 block 5 staking
// - 0-- 1-- 2-- 3-- 4-- 5--
//   |                   |
// - signer0 10MT        signer1 10MT

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./MultiManagedAccess.sol";

interface IMyToken {
    function transfer(uint256 amount, address to) external;

    function transferFrom(address from, address to, uint256 amount) external;

    function mint(uint256 amount, address owner) external;
}

contract TinyBank is MultiManagedAccess {
    event Staked(address, uint256);
    event Withdraw(uint256 amount, address to);

    IMyToken public stakingToken;

    mapping(address => uint256) public lastClaimedBlock;

    uint256 defaultRewardPerBlock = 1 * 10 ** 18;
    uint256 rewardPerBlock;

    mapping(address => uint256) public staked;
    uint256 public totalStaked;

    constructor(
        address[] memory _managers,
        uint _manager_numbers,
        IMyToken _stakingToken
    ) MultiManagedAccess(msg.sender, _managers, _manager_numbers) {
        stakingToken = _stakingToken;
        rewardPerBlock = defaultRewardPerBlock;
    }

    // who, when?
    modifier updateReward(address to) {
        if (staked[to] > 0) {
            uint256 blocks = block.number - lastClaimedBlock[to];
            uint256 reward = (blocks * rewardPerBlock * staked[to]) /
                totalStaked;
            stakingToken.mint(reward, to);
        }
        lastClaimedBlock[to] = block.number;
        _; // caller's code
    }

    function setRewardPerBlock(uint256 _amount) external onlyAllConfirmed {
        bool isManager = false;
        for (uint i = 0; i < MANAGER_NUMBERS; i++) {
            if (managers[i] == msg.sender) {
                isManager = true;
                break;
            }
        }
        require(isManager, "You are not a manager");

        rewardPerBlock = _amount;
    }

    function stake(uint256 _amount) external updateReward(msg.sender) {
        require(_amount >= 0, "cannot stake 0 amount");

        stakingToken.transferFrom(msg.sender, address(this), _amount);
        staked[msg.sender] += _amount;
        totalStaked += _amount;
        emit Staked(msg.sender, _amount);
    }

    function withdraw(uint256 _amount) external updateReward(msg.sender) {
        require(staked[msg.sender] >= _amount, "insufficient staked token");
        stakingToken.transfer(_amount, msg.sender);
        staked[msg.sender] -= _amount;
        totalStaked -= _amount;

        emit Withdraw(_amount, msg.sender);
    }
}
