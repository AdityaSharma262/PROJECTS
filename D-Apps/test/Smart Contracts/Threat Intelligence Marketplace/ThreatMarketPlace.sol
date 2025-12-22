// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract threatMarketplace{

    struct ThreatReport{
        uint256 id;
        address seller;
        string Title;
        string ipfshash;
        uint256 price;
        bool sold;
    }

    mapping(uint => ThreatReport) public threatReports;
    mapping(uint => address) public buyers;

    
    uint public reportCount = 0;
    event ThreatReported(uint256 id, address seller, string Title, string ipfshash, uint256 price, bool sold);  
    event ReportPurchased(uint256 id, address buyer, address seller, uint256 price);


    function SubmitReport(string memory _Title, string memory _hash, uint256 _price) public {
        require(_price > 0, "Price must be greater than zero");
        require(bytes(_Title).length > 0, "Title cannot be empty");
        reportCount++;
        threatReports[reportCount] = ThreatReport(reportCount, msg.sender, _Title, _hash, _price, false);
        emit ThreatReported(reportCount, msg.sender, _Title, _hash, _price, false);
    }

    function BuyReport(uint256 _id)public payable {
        ThreatReport storage Report = threatReports[_id];
        require(_id > 0 && _id<= reportCount, "Report does not exist");
        require(msg.value == Report.price,"Insufficient balance");
        require (!Report.sold, "Report already sold");
        require (msg.sender != Report.seller, "You are the seller");
        require(buyers[_id] == address(0), "Already purchased");

        

        threatReports[_id].sold = true;
        (bool success, ) = payable(threatReports[_id].seller).call{value: msg.value}("");
        require(success, "Transfer failed");
        buyers[_id] = msg.sender;
        emit ReportPurchased(_id, msg.sender, threatReports[_id].seller, msg.value);
    }

    function getUnsoldReports()public view returns(ThreatReport[] memory){

        uint256 unSoldCount = 0;
        for(uint256 i = 1; i<=reportCount; i++){
            if(!threatReports[i].sold){
                unSoldCount++;
            }
        }
        ThreatReport[] memory items = new ThreatReport[](unSoldCount);

        uint256 currentIndex = 0;
        for(uint256 i = 1; i<=reportCount; i++){
            if(!threatReports[i].sold){
                items[currentIndex] = threatReports[i];
                currentIndex++;
            }
        }
        return items;

    }


    function getMyReports() public view returns(ThreatReport[] memory){
        uint256 myReportCount = 0;
        for(uint256 i=1; i<= reportCount; i++){
            if(threatReports[i].seller == msg.sender){
                myReportCount++;
            }
        }
        ThreatReport[] memory items = new ThreatReport[](myReportCount);
        uint256 currentIndex = 0;
        for(uint256 i = 1; i<=reportCount; i++){
            if(threatReports[i].seller == msg.sender){
                items[currentIndex] = threatReports[i];
                currentIndex++;
            }
        }
        return items;
    }

    function getPurchasedReports() public view returns(ThreatReport[] memory){
        uint256 purchasedCount = 0;
        for(uint256 i =1; i<= reportCount; i++){
            if(threatReports[i].sold && threatReports[i].seller != msg.sender){
                purchasedCount++;
            }
        }
        ThreatReport[] memory items = new ThreatReport[](purchasedCount);
        uint256 currentIndex = 0;
        for(uint256 i = 1; i<=reportCount; i++){
            if(buyers[i] == msg.sender){
                items[currentIndex] = threatReports[i];
                currentIndex++;
            }
        }
        return items;
    }

    function getReportByID(uint256 id) public view returns(ThreatReport memory){
        require(id > 0 && id <= reportCount, "Report does not exist");
        return threatReports[id];

    }
}
    