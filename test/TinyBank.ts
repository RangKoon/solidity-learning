import hre from "hardhat";
import { expect } from "chai";
import { DECIMALS, MINTING_AMOUNT } from "./constant";
import { MyToken, TinyBank } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
describe("TinyBank", () => {
  let signers: HardhatEthersSigner[];
  let myTokenC: MyToken;
  let tinyBankC: TinyBank;
  let managers: HardhatEthersSigner[];
  const MANAGER_NUM = 3;
  beforeEach(async () => {
    signers = await hre.ethers.getSigners();
    myTokenC = await hre.ethers.deployContract("MyToken", [
      "MyToken",
      "MT",
      DECIMALS,
      MINTING_AMOUNT,
    ]);

    const manager0 = signers[0];
    const manager1 = signers[1];
    const manager2 = signers[2];
    managers = [manager0, manager1, manager2];

    const managerAddresses = [
      manager0.address,
      manager1.address,
      manager2.address,
    ];

    tinyBankC = await hre.ethers.deployContract("TinyBank", [
      managerAddresses,
      MANAGER_NUM,
      await myTokenC.getAddress(),
    ]);
    await myTokenC.setManager(tinyBankC.getAddress());
  });

  describe("Initialized state check", () => {
    it("sould return totlaStaked 0", async () => {
      expect(await tinyBankC.totalStaked()).equal(0);
    });
    it("should return staked 0 amount of signer0", async () => {
      const signer0 = signers[0];
      expect(await tinyBankC.staked(signer0.address)).equal(0);
    });
  });

  describe("Staking", async () => {
    it("should return staked amount", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);
      expect(await tinyBankC.staked(signer0.address)).equal(stakingAmount);
      expect(await myTokenC.balanceOf(tinyBankC)).equal(
        await tinyBankC.totalStaked()
      );
      expect(await tinyBankC.totalStaked()).equal(stakingAmount);
    });
  });
  describe("Withdraw", () => {
    it("should return 0 staked after withdrawing total token", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);
      await tinyBankC.withdraw(stakingAmount);
      expect(await tinyBankC.staked(signer0.address)).equal(0);
    });
  });

  describe("reward", () => {
    it("should reward 1MT evety blocks", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      await myTokenC.approve(tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);

      const BLOCKS = 5n;
      const transferAmount = hre.ethers.parseUnits("1", DECIMALS);

      for (var i = 0; i < BLOCKS; i++) {
        await myTokenC.transfer(transferAmount, signer0.address);
      }

      await tinyBankC.withdraw(stakingAmount);
      expect(await myTokenC.balanceOf(signer0.address)).equal(
        hre.ethers.parseUnits((BLOCKS + MINTING_AMOUNT + 1n).toString())
      );
    });

    it("should revert when changing rewardPerBlock by hacker", async () => {
      const hacker = signers[3];
      const rewardToChange = hre.ethers.parseUnits("10000", DECIMALS);
      await expect(
        tinyBankC.connect(hacker).setRewardPerBlock(rewardToChange)
      ).to.be.revertedWith("Not all confirmed yet");
    });
  });
  describe("MultiManager", () => {
    it("Should all manager confirmed", async () => {
      const rewardToChange = hre.ethers.parseUnits("10", DECIMALS);

      await tinyBankC.connect(managers[0]).confirm();
      await tinyBankC.connect(managers[1]).confirm();
      await tinyBankC.connect(managers[2]).confirm();

      await expect(
        tinyBankC.connect(managers[0]).setRewardPerBlock(rewardToChange)
      ).to.be.not.reverted;
    });

    it("should revert setReward when not all managers have confirmed", async () => {
      const rewardToChange = hre.ethers.parseUnits("10", DECIMALS);

      await tinyBankC.connect(managers[0]).confirm();
      await tinyBankC.connect(managers[1]).confirm();

      await expect(
        tinyBankC.connect(managers[2]).setRewardPerBlock(rewardToChange)
      ).to.be.revertedWith("Not all confirmed yet");
    });

    it("should revert when non-manager tries to confirm", async () => {
      const hacker = signers[9];

      await expect(tinyBankC.connect(hacker).confirm()).to.be.revertedWith(
        "You are not a manager"
      );
    });
  });
});
