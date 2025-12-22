// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Bank {
    event Deposited(address indexed from, uint256 value);
    event Withdrawn(address indexed to, uint256 value);

    mapping(address => uint256) public balances;

    function deposit() public payable {
        require(msg.value > 0, "Amount should be greater than zero");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) public {
        require(amount <= balances[msg.sender], "Insufficient balance");
        require(address(this).balance >= amount, "Contract has insufficient funds"); // ✅ Ensure contract has ETH

        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount); // ✅ Send ETH back to user

        emit Withdrawn(msg.sender, amount);
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
