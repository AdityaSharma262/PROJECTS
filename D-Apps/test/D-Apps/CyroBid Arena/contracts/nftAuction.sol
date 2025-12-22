// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NftAuction{

    struct Auction{
        address seller;
        uint256 minBid;
        uint256 highestBid;
        address highestBidder;
        uint256 endTime;
        bool ended;
        address[] biddersList;
    mapping (address=>uint256)bidder;
    }
     
    mapping(address=> mapping(uint256=> Auction))public auctions;
    //address = nft contract address
    // uint256 = tokenId
    event AuctionCreated(address indexed seller, address indexed nftAddress, uint256 indexed tokenId, uint256 minBid, uint256 endTime);


    function createAuction(uint256 minimumBid,uint duration,uint256 tokenId,address nftAddress)external{
        IERC721 nft = IERC721(nftAddress);
        require(nft.ownerOf(tokenId) == msg.sender, "You don't own this NFT");
        require(nft.getApproved(tokenId) == address(this),"Contract is not approved");
        require(auctions[nftAddress][tokenId].seller == address(0) || auctions[nftAddress][tokenId].ended, "Auction already exists");
        
        Auction storage auction = auctions[nftAddress][tokenId];
        auction.seller = msg.sender;
        auction.minBid = minimumBid;
        auction.endTime = block.timestamp + duration;
        auction.ended = false;
        auction.highestBid = 0;
        auction.highestBidder = address(0);
        

        emit AuctionCreated(msg.sender, nftAddress, tokenId, minimumBid, block.timestamp + duration);
    }

    function bid(address nftAddress, uint256 tokenId)external payable {
        Auction storage auction = auctions[nftAddress][tokenId];

        require(block.timestamp < auction.endTime,"Auction Ended...!");
        require(msg.value > auction.minBid && msg.value > auction.highestBid,"Your are not the Highest Bidder");
        require(auction.bidder[msg.sender]== 0,"You can only Bid Once");
        require(!auction.ended, "Auction Ended...!");
        require(auction.seller != msg.sender,"Seller can not Bid");

        auction.highestBid = msg.value;
        auction.highestBidder = msg.sender;
        auction.bidder[msg.sender] = msg.value;

        auction.bidder[msg.sender] == 0;
        auction.biddersList.push(msg.sender);

    }

    function endAuction(address nftAddress, uint256 tokenId)external payable{
        IERC721 nft = IERC721(nftAddress);
        Auction storage auction = auctions[nftAddress][tokenId];
        require(auction.seller == msg.sender,"You have to be seller in order to end Auction");
        require(block.timestamp > auction.endTime,"Auction not ended yet");
        require(!auction.ended,"Auction already ended");
        require(auction.highestBidder != address(0), "No bid placed");
        auction.ended = true;

        nft.safeTransferFrom(auction.seller, auction.highestBidder, tokenId);
        
        payable(auction.seller).transfer(auction.highestBid);

        for(uint i=0;i < auction.biddersList.length;i++){
            address bidder = auction.biddersList[i];
            if (bidder != auction.highestBidder){
                uint256 amount = auction.bidder[bidder];
                if(amount > 0){
                payable(bidder).transfer(amount);
                }
            }
        }

    }


    function getAuction(address nftAddress, uint256 tokenId) external view returns ( address seller,
    uint256 minBid,
    uint256 highestBid,
    address highestBidder,
    uint256 endTime,
    bool ended,
    uint256 bidderCount){
        Auction storage auction = auctions[nftAddress][tokenId];

        seller = auction.seller;
        minBid = auction.minBid;
        highestBid = auction.highestBid;
        highestBidder = auction.highestBidder;
        endTime = auction.endTime;
        ended = auction.ended;
        bidderCount = auction.biddersList.length;

    }


}