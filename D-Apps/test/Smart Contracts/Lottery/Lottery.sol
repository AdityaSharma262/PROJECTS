// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

contract lottery{

    address public manager;
    address payable[] public participants;

    constructor() {
        manager  = msg.sender;
    }
    receive() external payable
    {
        require(msg.value==1 ether);
        participants.push(payable (msg.sender));

    }
    function getBalance()public view returns(uint256){
        require(msg.sender==manager);
        return address(this).balance;
    }
    function random() public view returns (uint256){
        return uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, participants)));
    }
    function Winner() public
    {
        require(msg.sender==manager);
        require(participants.length >=3);
        uint r = random();
        address payable winner;
        uint index= r % participants.length;
        winner = participants[index];
        winner.transfer(getBalance());
        participants = new address payable[](0);//to reset our array

    }    
}