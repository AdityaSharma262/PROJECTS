// SPDX-License-Identifier: MIT

pragma solidity ^0.8;

contract EventContract {
    struct Event{
        address organizer;
        string name ;
        uint date;
        uint price;
        uint ticketCount;
        uint ticketRemain;
    }
    mapping (uint=>Event)public events;
    mapping (address=>mapping (uint=>uint))public tickets;
    uint public nextId;
    function createEvent (string memory name ,uint date ,uint price ,uint ticketCount )external {
        require(date>block.timestamp,"you can organize event for future dates");
        require (ticketCount > 0, "there is no tickets");
        events[nextId]= Event(msg.sender,name,date, price,ticketCount,ticketCount);
        nextId++;
    }
        function buyTicket (uint id ,uint quantity)external payable {
            require(events[id].date!=0,"event does not exist");
            require(events[id].date>block.timestamp,"event has already occured");
            Event storage _event = events [id];
            require(msg.value ==(_event.price*quantity),"ether is not enough ");
            require(_event.ticketRemain>=quantity,"not enough tickets");
            _event.ticketRemain-=quantity;
            tickets[msg.sender][id]+=quantity;

        
    }
}