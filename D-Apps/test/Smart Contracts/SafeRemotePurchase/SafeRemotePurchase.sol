// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

contract Purchase{
    uint public value;
    address payable public buyer;
    address payable public seller;

    enum State{Created, Locked, Release, Inactive}
    State public state;

    modifier condition(bool condition_){
        require(condition_);
        _;
    }

    error OnlyBuyer();
    error OnlySeller();
    error InvalidState();
    error ValueNotEven();

    modifier onlyBuyer(){
        if(msg.sender != buyer)
        revert OnlyBuyer();
        _;
    }
    modifier onlySeller(){
        if(msg.sender != seller)
        revert OnlySeller();
        _;
    }
    modifier instate(State state_){
        if (state != state_)
        revert InvalidState();
        _;
    }

    event Aborted();
    event PurchaseConfirmed();
    event ItemRecieved();
    event sellerRefunded();

    constructor() payable{
        seller = payable(msg.sender);
        value = msg.value/2;
        if((2*value) != msg.value){
            revert ValueNotEven();
        }
    }

    function abort()external onlySeller instate(State.Created){
        emit Aborted();
        state = State.Inactive;
        
        seller.transfer(address(this).balance);
    }

    function confirmPurchase()external instate(State.Created) payable condition(msg.value == (2*value)){
        emit PurchaseConfirmed();
        state = State.Locked;
        buyer = payable(msg.sender);
    } 

    function confirmRecieved()external onlyBuyer instate(State.Locked){
        emit ItemRecieved();
        state = State.Release;

        buyer.transfer(value);
    }

    function refundSeller()external instate(State.Release) onlySeller{
        emit sellerRefunded();
        state = State.Inactive;

    seller.transfer(3*value);
    }

}