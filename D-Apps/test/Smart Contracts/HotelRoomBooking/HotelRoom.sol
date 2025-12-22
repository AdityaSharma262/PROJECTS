// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

contract HotelRoom{
        address payable public owner;
        enum status{ vacant,occupied}
        status currentstatus;


    constructor() {
        owner= payable (msg.sender);
        currentstatus= status.vacant;
}
    modifier statuss{
        require(currentstatus == status.vacant,"room is occupied");
        _;
    }
    modifier cost( uint amount){
        require(msg.value==amount ,'the value must be greater than 2 ether');
        _;
    }

    event occupy(address occupant , uint value);

    function BookRoom() public payable statuss cost(2 ether) {
        
        owner.transfer(msg.value);
        currentstatus= status.occupied;
        emit occupy(msg.sender, msg.value);
    }







}