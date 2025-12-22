// SPDX-License-Identifier: MIT
pragma solidity ^0.8;
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract WeatherContract{
    address public owner;
    AggregatorV3Interface internal weatherOracle;
    mapping (address=> uint)insuredAmount;

    modifier onlyOwner(){
        if(msg.sender != owner){
        revert("Only the owner can perform this action"); 
        _; }
    }
    constructor (address oracleAddress){
        owner = msg.sender;
        weatherOracle  = AggregatorV3Interface(oracleAddress);
    
    }
    function getTemperature() public view returns (int) {
        (, int temperature, , , ) = weatherOracle.latestRoundData();
        return temperature; 
    }
    function buyInsurence()public payable{
        require(msg.value>=0 ether,"must send ETH to buy insurence");
        insuredAmount[msg.sender] += msg.value;
    }


    function clainPayout()public{
        int temperature = getTemperature();

        if (temperature <35){
            revert("NOT ELLIGIBLE FOR PAYOUT");
        }
        uint256 payout = insuredAmount[msg.sender];
        require(payout >0,"NO insurence has been purchased");

        insuredAmount[msg.sender] = 0;
        payable(msg.sender).transfer(payout*2);
    }


}