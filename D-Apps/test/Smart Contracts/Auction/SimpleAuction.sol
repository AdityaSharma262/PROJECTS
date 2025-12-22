// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

contract SimpleAuction{
    address payable public beneficiary;
    uint public AuctionEndTime;

    address public HighestBidder;
    uint public highestBid;

    mapping(address => uint) pendingReturns;
    bool ended;

    event HighestBidderIncreased(address bidder, uint amount);
    event AuctionEnded(address winner , uint amount);

    error AuctionAlreadyEnded();
    error BidNotHighEnough(uint highestBid);
    error AuctionNotYetEnded();
    error AuctionEndAlreadyCalled();

    constructor(address payable beneficiaryAddress , uint biddingTime){
        beneficiary = beneficiaryAddress;
        AuctionEndTime = block.timestamp + biddingTime;
    }


    function Bid() payable external {

        if (block.timestamp > AuctionEndTime)
            revert AuctionNotYetEnded();
        
        if (msg.value < highestBid)
        revert BidNotHighEnough(highestBid);
        
        if (highestBid != 0)
        pendingReturns[HighestBidder] += highestBid; 
            
            HighestBidder = msg.sender;
            highestBid = msg.value ;
            emit HighestBidderIncreased(msg.sender,msg.value);
        }

        function withdrawal() external  returns(bool){
            uint amount = pendingReturns[msg.sender];
            if (amount > 0 ){
                pendingReturns[msg.sender] = 0;

                if (!payable(msg.sender).send (amount)){
                    pendingReturns[msg.sender] = amount;
                    return false;
                }
            }return true; 
        }
        function auctionEnd()external {
            if (block.timestamp <AuctionEndTime)
            revert AuctionNotYetEnded();
            if(ended)
            revert AuctionEndAlreadyCalled();
            ended = true;
            emit AuctionEnded(HighestBidder , highestBid);

            beneficiary.transfer(highestBid);
        }
    
    }

